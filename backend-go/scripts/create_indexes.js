// MongoDB Index Creation Script
// Run this script with: mongosh <database_name> < scripts/create_indexes.js
// Or: mongosh "mongodb://localhost:27017/tripapp" < scripts/create_indexes.js

print("======================================");
print("Creating MongoDB Indexes for TripApp");
print("======================================\n");

// ========================================
// 1. USERS COLLECTION
// ========================================
print("Creating indexes for 'users' collection...");

try {
  db.users.createIndex({ "clerk_id": 1 }, { unique: true, name: "idx_clerk_id" });
  print("✓ Created unique index on clerk_id");
} catch (e) {
  print("✗ Error creating clerk_id index:", e.message);
}

try {
  db.users.createIndex({ "email": 1 }, { unique: true, name: "idx_email" });
  print("✓ Created unique index on email");
} catch (e) {
  print("✗ Error creating email index:", e.message);
}

// ========================================
// 2. TRIPS COLLECTION
// ========================================
print("\nCreating indexes for 'trips' collection...");

try {
  db.trips.createIndex({ "owner_id": 1 }, { name: "idx_owner_id" });
  print("✓ Created index on owner_id");
} catch (e) {
  print("✗ Error creating owner_id index:", e.message);
}

try {
  db.trips.createIndex({ "status": 1 }, { name: "idx_status" });
  print("✓ Created index on status");
} catch (e) {
  print("✗ Error creating status index:", e.message);
}

try {
  db.trips.createIndex({ "type": 1 }, { name: "idx_type" });
  print("✓ Created index on type");
} catch (e) {
  print("✗ Error creating type index:", e.message);
}

try {
  db.trips.createIndex({ "tags": 1 }, { name: "idx_tags" });
  print("✓ Created index on tags");
} catch (e) {
  print("✗ Error creating tags index:", e.message);
}

try {
  db.trips.createIndex({ "created_at": -1 }, { name: "idx_created_at" });
  print("✓ Created index on created_at (descending)");
} catch (e) {
  print("✗ Error creating created_at index:", e.message);
}

try {
  db.trips.createIndex({ "status": 1, "type": 1 }, { name: "idx_status_type" });
  print("✓ Created compound index on status+type");
} catch (e) {
  print("✗ Error creating status+type index:", e.message);
}

// ========================================
// 3. EXPENSES COLLECTION (NEW)
// ========================================
print("\nCreating indexes for 'expenses' collection...");

try {
  db.expenses.createIndex({ "trip_id": 1 }, { name: "idx_trip_id" });
  print("✓ Created index on trip_id");
} catch (e) {
  print("✗ Error creating trip_id index:", e.message);
}

try {
  db.expenses.createIndex({ "paid_by": 1 }, { name: "idx_paid_by" });
  print("✓ Created index on paid_by");
} catch (e) {
  print("✗ Error creating paid_by index:", e.message);
}

try {
  db.expenses.createIndex({ "split_with": 1 }, { name: "idx_split_with" });
  print("✓ Created index on split_with (array)");
} catch (e) {
  print("✗ Error creating split_with index:", e.message);
}

try {
  db.expenses.createIndex({ "date": -1 }, { name: "idx_date" });
  print("✓ Created index on date (descending)");
} catch (e) {
  print("✗ Error creating date index:", e.message);
}

try {
  db.expenses.createIndex({ "trip_id": 1, "category": 1 }, { name: "idx_trip_category" });
  print("✓ Created compound index on trip_id+category");
} catch (e) {
  print("✗ Error creating trip_id+category index:", e.message);
}

try {
  db.expenses.createIndex({ "trip_id": 1, "date": -1 }, { name: "idx_trip_date" });
  print("✓ Created compound index on trip_id+date");
} catch (e) {
  print("✗ Error creating trip_id+date index:", e.message);
}

try {
  db.expenses.createIndex({ "status": 1 }, { name: "idx_status" });
  print("✓ Created index on status");
} catch (e) {
  print("✗ Error creating status index:", e.message);
}

// ========================================
// 4. ITINERARIES COLLECTION (NEW)
// ========================================
print("\nCreating indexes for 'itineraries' collection...");

try {
  db.itineraries.createIndex({ "trip_id": 1 }, { name: "idx_trip_id" });
  print("✓ Created index on trip_id");
} catch (e) {
  print("✗ Error creating trip_id index:", e.message);
}

try {
  db.itineraries.createIndex({ "trip_id": 1, "order": 1 }, { name: "idx_trip_order" });
  print("✓ Created compound index on trip_id+order");
} catch (e) {
  print("✗ Error creating trip_id+order index:", e.message);
}

try {
  db.itineraries.createIndex({ "trip_id": 1, "day_number": 1 }, { name: "idx_trip_day" });
  print("✓ Created compound index on trip_id+day_number");
} catch (e) {
  print("✗ Error creating trip_id+day_number index:", e.message);
}

// ========================================
// 5. ITINERARY_ENTRIES COLLECTION (NEW)
// ========================================
print("\nCreating indexes for 'itinerary_entries' collection...");

try {
  db.itinerary_entries.createIndex({ "itinerary_id": 1 }, { name: "idx_itinerary_id" });
  print("✓ Created index on itinerary_id");
} catch (e) {
  print("✗ Error creating itinerary_id index:", e.message);
}

try {
  db.itinerary_entries.createIndex({ "itinerary_id": 1, "order": 1 }, { name: "idx_itinerary_order" });
  print("✓ Created compound index on itinerary_id+order");
} catch (e) {
  print("✗ Error creating itinerary_id+order index:", e.message);
}

try {
  db.itinerary_entries.createIndex({ "place_id": 1 }, { name: "idx_place_id" });
  print("✓ Created index on place_id");
} catch (e) {
  print("✗ Error creating place_id index:", e.message);
}

try {
  db.itinerary_entries.createIndex({ "type": 1 }, { name: "idx_type" });
  print("✓ Created index on type");
} catch (e) {
  print("✗ Error creating type index:", e.message);
}

// ========================================
// 6. PLACES COLLECTION
// ========================================
print("\nCreating indexes for 'places' collection...");

try {
  db.places.createIndex({ "trip_id": 1 }, { name: "idx_trip_id" });
  print("✓ Created index on trip_id");
} catch (e) {
  print("✗ Error creating trip_id index:", e.message);
}

try {
  db.places.createIndex({ "location": "2dsphere" }, { name: "idx_location_geo" });
  print("✓ Created geospatial index on location");
} catch (e) {
  print("✗ Error creating location geospatial index:", e.message);
}

// ========================================
// 7. COMMENTS COLLECTION
// ========================================
print("\nCreating indexes for 'comments' collection...");

try {
  db.comments.createIndex({ "target_id": 1, "target_type": 1 }, { name: "idx_target" });
  print("✓ Created compound index on target_id+target_type");
} catch (e) {
  print("✗ Error creating target index:", e.message);
}

try {
  db.comments.createIndex({ "user_id": 1 }, { name: "idx_user_id" });
  print("✓ Created index on user_id");
} catch (e) {
  print("✗ Error creating user_id index:", e.message);
}

try {
  db.comments.createIndex({ "parent_id": 1 }, { name: "idx_parent_id" });
  print("✓ Created index on parent_id");
} catch (e) {
  print("✗ Error creating parent_id index:", e.message);
}

try {
  db.comments.createIndex({ "created_at": -1 }, { name: "idx_created_at" });
  print("✓ Created index on created_at (descending)");
} catch (e) {
  print("✗ Error creating created_at index:", e.message);
}

// ========================================
// 8. INTERACTIONS COLLECTION
// ========================================
print("\nCreating indexes for 'interactions' collection...");

try {
  db.interactions.createIndex({ "user_id": 1, "target_id": 1, "action_type": 1 }, { 
    unique: true, 
    name: "idx_user_target_action" 
  });
  print("✓ Created unique compound index on user_id+target_id+action_type");
} catch (e) {
  print("✗ Error creating user_id+target_id+action_type index:", e.message);
}

try {
  db.interactions.createIndex({ "target_id": 1, "target_type": 1, "action_type": 1 }, { 
    name: "idx_target_action" 
  });
  print("✓ Created compound index on target_id+target_type+action_type");
} catch (e) {
  print("✗ Error creating target_id+target_type+action_type index:", e.message);
}

try {
  db.interactions.createIndex({ "user_id": 1, "action_type": 1 }, { name: "idx_user_action" });
  print("✓ Created compound index on user_id+action_type");
} catch (e) {
  print("✗ Error creating user_id+action_type index:", e.message);
}

// ========================================
// SUMMARY
// ========================================
print("\n======================================");
print("Index Creation Complete!");
print("======================================\n");

print("Listing all indexes created:\n");

print("users indexes:");
db.users.getIndexes().forEach(idx => print("  -", idx.name));

print("\ntrips indexes:");
db.trips.getIndexes().forEach(idx => print("  -", idx.name));

print("\nexpenses indexes:");
db.expenses.getIndexes().forEach(idx => print("  -", idx.name));

print("\nitineraries indexes:");
db.itineraries.getIndexes().forEach(idx => print("  -", idx.name));

print("\nitinerary_entries indexes:");
db.itinerary_entries.getIndexes().forEach(idx => print("  -", idx.name));

print("\nplaces indexes:");
db.places.getIndexes().forEach(idx => print("  -", idx.name));

print("\ncomments indexes:");
db.comments.getIndexes().forEach(idx => print("  -", idx.name));

print("\ninteractions indexes:");
db.interactions.getIndexes().forEach(idx => print("  -", idx.name));

print("\n✓ All indexes created successfully!");
