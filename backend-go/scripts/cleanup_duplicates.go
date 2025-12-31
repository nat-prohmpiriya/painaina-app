// Script to find and remove duplicate documents before creating unique indexes
// Usage: go run scripts/cleanup_duplicates.go -env=dev|prod [-dry-run]
package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type DuplicateResult struct {
	ID    interface{}   `bson:"_id"`
	Count int           `bson:"count"`
	IDs   []primitive.ObjectID `bson:"ids"`
}

func main() {
	env := flag.String("env", "", "Environment: dev or prod")
	dryRun := flag.Bool("dry-run", false, "Only show duplicates without deleting")
	flag.Parse()

	if *env == "" {
		log.Fatal("Please specify environment: -env=local, -env=dev, or -env=prod")
	}

	// Load environment file
	var envFile string
	if *env == "local" {
		envFile = ".env"
	} else {
		envFile = fmt.Sprintf(".env.%s", *env)
	}

	if err := godotenv.Load(envFile); err != nil {
		log.Fatalf("Failed to load %s: %v", envFile, err)
	}

	mongoURI := os.Getenv("MONGODB_URI")
	mongoDatabase := os.Getenv("MONGODB_DATABASE")

	if mongoURI == "" || mongoDatabase == "" {
		log.Fatal("MONGODB_URI and MONGODB_DATABASE must be set")
	}

	log.Printf("=== Cleanup Duplicates for %s ===", *env)
	log.Printf("Database: %s", mongoDatabase)
	if *dryRun {
		log.Println("MODE: DRY RUN (no changes will be made)")
	} else {
		log.Println("MODE: LIVE (duplicates will be deleted)")
	}
	log.Println("")

	// Connect to MongoDB
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		log.Fatalf("Failed to connect to MongoDB: %v", err)
	}
	defer client.Disconnect(ctx)

	db := client.Database(mongoDatabase)

	// Cleanup duplicates
	totalDeleted := 0

	// 1. Users - clerk_id duplicates
	deleted := cleanupDuplicates(ctx, db, "users", "clerk_id", *dryRun)
	totalDeleted += deleted

	// 2. Places - google_place_id duplicates
	deleted = cleanupDuplicates(ctx, db, "places", "google_place_id", *dryRun)
	totalDeleted += deleted

	// 3. Checkins - user_id + city_id duplicates (compound)
	deleted = cleanupCompoundDuplicates(ctx, db, "checkins", []string{"user_id", "city_id"}, *dryRun)
	totalDeleted += deleted

	log.Println("")
	log.Printf("=== Summary ===")
	if *dryRun {
		log.Printf("Total documents that would be deleted: %d", totalDeleted)
		log.Println("Run without -dry-run to actually delete")
	} else {
		log.Printf("Total documents deleted: %d", totalDeleted)
	}
}

func cleanupDuplicates(ctx context.Context, db *mongo.Database, collection, field string, dryRun bool) int {
	log.Printf("--- Checking %s.%s for duplicates ---", collection, field)

	coll := db.Collection(collection)

	// Find duplicates using aggregation
	pipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: "$" + field},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
			{Key: "ids", Value: bson.D{{Key: "$push", Value: "$_id"}}},
			{Key: "created_dates", Value: bson.D{{Key: "$push", Value: "$created_at"}}},
		}}},
		{{Key: "$match", Value: bson.D{
			{Key: "count", Value: bson.D{{Key: "$gt", Value: 1}}},
		}}},
	}

	cursor, err := coll.Aggregate(ctx, pipeline)
	if err != nil {
		log.Printf("Error finding duplicates: %v", err)
		return 0
	}
	defer cursor.Close(ctx)

	var results []struct {
		ID           interface{}          `bson:"_id"`
		Count        int                  `bson:"count"`
		IDs          []primitive.ObjectID `bson:"ids"`
		CreatedDates []time.Time          `bson:"created_dates"`
	}

	if err := cursor.All(ctx, &results); err != nil {
		log.Printf("Error decoding results: %v", err)
		return 0
	}

	if len(results) == 0 {
		log.Printf("No duplicates found in %s.%s", collection, field)
		return 0
	}

	totalDeleted := 0
	for _, dup := range results {
		log.Printf("Found %d duplicates for %s=%v", dup.Count, field, dup.ID)

		// Keep the first one (oldest), delete the rest
		idsToDelete := dup.IDs[1:]
		log.Printf("  Keeping: %s", dup.IDs[0].Hex())
		for _, id := range idsToDelete {
			log.Printf("  %s: %s", actionText(dryRun), id.Hex())
		}

		if !dryRun {
			result, err := coll.DeleteMany(ctx, bson.M{
				"_id": bson.M{"$in": idsToDelete},
			})
			if err != nil {
				log.Printf("Error deleting duplicates: %v", err)
				continue
			}
			totalDeleted += int(result.DeletedCount)
		} else {
			totalDeleted += len(idsToDelete)
		}
	}

	log.Printf("Total duplicates %s in %s: %d", actionPastText(dryRun), collection, totalDeleted)
	return totalDeleted
}

func cleanupCompoundDuplicates(ctx context.Context, db *mongo.Database, collection string, fields []string, dryRun bool) int {
	log.Printf("--- Checking %s.%v for duplicates ---", collection, fields)

	coll := db.Collection(collection)

	// Build compound group key
	groupKey := bson.D{}
	for _, f := range fields {
		groupKey = append(groupKey, bson.E{Key: f, Value: "$" + f})
	}

	pipeline := mongo.Pipeline{
		{{Key: "$group", Value: bson.D{
			{Key: "_id", Value: groupKey},
			{Key: "count", Value: bson.D{{Key: "$sum", Value: 1}}},
			{Key: "ids", Value: bson.D{{Key: "$push", Value: "$_id"}}},
		}}},
		{{Key: "$match", Value: bson.D{
			{Key: "count", Value: bson.D{{Key: "$gt", Value: 1}}},
		}}},
	}

	cursor, err := coll.Aggregate(ctx, pipeline)
	if err != nil {
		log.Printf("Error finding duplicates: %v", err)
		return 0
	}
	defer cursor.Close(ctx)

	var results []struct {
		ID    interface{}          `bson:"_id"`
		Count int                  `bson:"count"`
		IDs   []primitive.ObjectID `bson:"ids"`
	}

	if err := cursor.All(ctx, &results); err != nil {
		log.Printf("Error decoding results: %v", err)
		return 0
	}

	if len(results) == 0 {
		log.Printf("No duplicates found in %s.%v", collection, fields)
		return 0
	}

	totalDeleted := 0
	for _, dup := range results {
		log.Printf("Found %d duplicates for %v=%v", dup.Count, fields, dup.ID)

		// Keep the first one, delete the rest
		idsToDelete := dup.IDs[1:]
		log.Printf("  Keeping: %s", dup.IDs[0].Hex())
		for _, id := range idsToDelete {
			log.Printf("  %s: %s", actionText(dryRun), id.Hex())
		}

		if !dryRun {
			result, err := coll.DeleteMany(ctx, bson.M{
				"_id": bson.M{"$in": idsToDelete},
			})
			if err != nil {
				log.Printf("Error deleting duplicates: %v", err)
				continue
			}
			totalDeleted += int(result.DeletedCount)
		} else {
			totalDeleted += len(idsToDelete)
		}
	}

	log.Printf("Total duplicates %s in %s: %d", actionPastText(dryRun), collection, totalDeleted)
	return totalDeleted
}

func actionText(dryRun bool) string {
	if dryRun {
		return "Would delete"
	}
	return "Deleting"
}

func actionPastText(dryRun bool) string {
	if dryRun {
		return "to delete"
	}
	return "deleted"
}
