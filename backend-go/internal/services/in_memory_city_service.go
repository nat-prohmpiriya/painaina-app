package services

import (
	"context"
	"encoding/json"
	"strings"
	"sync"

	"backend-go/internal/data"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/trace"
)

type City struct {
	ID             string      `json:"id"`
	Type           string      `json:"type"` // "city", "state", "country"
	Name           string      `json:"name"`
	AlternateNames []string    `json:"alternateNames"`
	Country        string      `json:"country"`
	CountryCode    string      `json:"countryCode"`
	Coordinates    Coordinates `json:"coordinates"`
	Population     int         `json:"population"`
}

type Coordinates struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type InMemoryCityService struct {
	cities []City
	index  map[string][]int // lowercase prefix -> city indices
	mu     sync.RWMutex
	tracer trace.Tracer
}

func NewInMemoryCityService() (*InMemoryCityService, error) {
	// Load from embedded JSON
	var cities []City
	if err := json.Unmarshal(data.CitiesJSON, &cities); err != nil {
		return nil, err
	}

	// Build prefix index for fast autocomplete
	index := make(map[string][]int)
	for i, city := range cities {
		// Collect all searchable names (Name + AlternateNames)
		allNames := []string{city.Name}
		allNames = append(allNames, city.AlternateNames...)

		// Index each name
		for _, name := range allNames {
			lowerName := strings.ToLower(name)

			// Index all prefixes (for autocomplete)
			for j := 1; j <= len(lowerName) && j <= 20; j++ { // Limit to 20 chars
				prefix := lowerName[:j]
				index[prefix] = append(index[prefix], i)
			}
		}
	}

	return &InMemoryCityService{
		cities: cities,
		index:  index,
		tracer: otel.Tracer("in-memory-city-service"),
	}, nil
}

func (s *InMemoryCityService) Search(ctx context.Context, query string) []City {
	_, span := s.tracer.Start(ctx, "InMemoryCityService.Search")
	defer span.End()

	s.mu.RLock()
	defer s.mu.RUnlock()

	prefix := strings.ToLower(strings.TrimSpace(query))
	if prefix == "" {
		return []City{}
	}

	// Try exact prefix match first
	indices := s.index[prefix]
	if len(indices) > 0 {
		// Deduplicate indices (same city may match multiple alternate names)
		seenIndices := make(map[int]bool)
		results := make([]City, 0, 10)
		for _, idx := range indices {
			if len(results) >= 10 {
				break
			}
			if !seenIndices[idx] {
				seenIndices[idx] = true
				results = append(results, s.cities[idx])
			}
		}
		return results
	}

	// If no exact match, try fuzzy matching
	// Try multiple prefix lengths to get candidates
	if len(prefix) > 1 {
		candidateIndicesMap := make(map[int]bool)

		// Try removing 1-2 characters from the end
		for removeCount := 1; removeCount <= 2 && removeCount < len(prefix); removeCount++ {
			shorterPrefix := prefix[:len(prefix)-removeCount]
			for _, idx := range s.index[shorterPrefix] {
				candidateIndicesMap[idx] = true
			}
		}

		// Convert map to slice
		candidateIndices := make([]int, 0, len(candidateIndicesMap))
		for idx := range candidateIndicesMap {
			candidateIndices = append(candidateIndices, idx)
		}

		// Score each candidate
		type scoredCity struct {
			city       City
			distance   int
			population int
		}
		scored := make([]scoredCity, 0)

		for _, idx := range candidateIndices {
			cityName := strings.ToLower(s.cities[idx].Name)

			// Calculate distance for prefix only (not full name)
			cityPrefix := cityName
			if len(cityName) > len(prefix) {
				cityPrefix = cityName[:len(prefix)]
			}
			distance := levenshteinDistance(prefix, cityPrefix)

			// Allow max 2 typos
			if distance <= 2 {
				scored = append(scored, scoredCity{
					city:       s.cities[idx],
					distance:   distance,
					population: s.cities[idx].Population,
				})
			}
		}

		// Sort by distance first, then by population (larger cities first)
		for i := 0; i < len(scored)-1; i++ {
			for j := 0; j < len(scored)-i-1; j++ {
				// If same distance, prefer larger city
				if scored[j].distance > scored[j+1].distance ||
					(scored[j].distance == scored[j+1].distance && scored[j].population < scored[j+1].population) {
					scored[j], scored[j+1] = scored[j+1], scored[j]
				}
			}
		}

		// Return top 10
		results := make([]City, 0, 10)
		for i := 0; i < len(scored) && i < 10; i++ {
			results = append(results, scored[i].city)
		}
		return results
	}

	return []City{}
}

// levenshteinDistance calculates the Levenshtein distance between two strings
func levenshteinDistance(s1, s2 string) int {
	if len(s1) == 0 {
		return len(s2)
	}
	if len(s2) == 0 {
		return len(s1)
	}

	// Create matrix
	matrix := make([][]int, len(s1)+1)
	for i := range matrix {
		matrix[i] = make([]int, len(s2)+1)
	}

	// Initialize first row and column
	for i := 0; i <= len(s1); i++ {
		matrix[i][0] = i
	}
	for j := 0; j <= len(s2); j++ {
		matrix[0][j] = j
	}

	// Fill matrix
	for i := 1; i <= len(s1); i++ {
		for j := 1; j <= len(s2); j++ {
			cost := 1
			if s1[i-1] == s2[j-1] {
				cost = 0
			}

			matrix[i][j] = min(
				matrix[i-1][j]+1,      // deletion
				matrix[i][j-1]+1,      // insertion
				matrix[i-1][j-1]+cost, // substitution
			)
		}
	}

	return matrix[len(s1)][len(s2)]
}

func min(a, b, c int) int {
	if a < b {
		if a < c {
			return a
		}
		return c
	}
	if b < c {
		return b
	}
	return c
}

func (s *InMemoryCityService) GetByID(ctx context.Context, id string) (*City, error) {
	//nolint:staticcheck // context used for tracing only
	_, span := s.tracer.Start(ctx, "InMemoryCityService.GetByID")
	defer span.End()

	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, city := range s.cities {
		if city.ID == id {
			return &city, nil
		}
	}

	return nil, nil
}

func (s *InMemoryCityService) Count() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.cities)
}
