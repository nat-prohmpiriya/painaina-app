package main

import (
	"encoding/csv"
	"encoding/json"
	"log"
	"os"
	"strconv"
	"strings"
)

type Place struct {
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

func main() {
	log.Println("Loading country names...")
	countryNames := loadCountryNames()

	places := []Place{}

	// 1. Load Cities
	log.Println("Processing cities...")
	cities := loadCities(countryNames)
	places = append(places, cities...)
	log.Printf("✓ Loaded %d cities", len(cities))

	// 2. Load States/Provinces
	log.Println("Processing states/provinces...")
	states := loadStates(countryNames)
	places = append(places, states...)
	log.Printf("✓ Loaded %d states/provinces", len(states))

	// 3. Load Countries
	log.Println("Processing countries...")
	countries := loadCountries()
	places = append(places, countries...)
	log.Printf("✓ Loaded %d countries", len(countries))

	log.Printf("Total places: %d", len(places))

	// Create data directory if not exists
	if err := os.MkdirAll("../internal/data", 0755); err != nil {
		log.Fatal(err)
	}

	// Save to JSON
	output, err := json.MarshalIndent(places, "", "  ")
	if err != nil {
		log.Fatal(err)
	}

	err = os.WriteFile("../internal/data/cities.json", output, 0644)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("✓ Generated ../internal/data/cities.json with %d places", len(places))

	// Print file size
	stat, _ := os.Stat("../internal/data/cities.json")
	log.Printf("✓ File size: %.2f MB", float64(stat.Size())/1024/1024)
}

func loadCities(countryNames map[string]string) []Place {
	file, err := os.Open("cities15000.txt")
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.Comma = '\t'
	reader.LazyQuotes = true
	reader.FieldsPerRecord = -1

	records, err := reader.ReadAll()
	if err != nil {
		log.Fatal(err)
	}

	cities := []Place{}

	for _, record := range records {
		if len(record) < 18 {
			continue
		}

		geonameID := record[0]
		name := record[1]
		alternateNamesRaw := record[3]
		lat, err := strconv.ParseFloat(record[4], 64)
		if err != nil {
			continue
		}
		lng, err := strconv.ParseFloat(record[5], 64)
		if err != nil {
			continue
		}
		countryCode := record[8]
		population, err := strconv.Atoi(record[14])
		if err != nil {
			population = 0
		}

		// Filter: only cities with population > 50,000
		if population < 50000 {
			continue
		}

		// Get country name
		countryName, exists := countryNames[countryCode]
		if !exists {
			countryName = countryCode
		}

		// Filter alternate names (TH/EN/ZH only)
		alternateNames := filterAlternateNames(alternateNamesRaw)

		city := Place{
			ID:             countryCode + "-" + geonameID,
			Type:           "city",
			Name:           name,
			AlternateNames: alternateNames,
			Country:        countryName,
			CountryCode:    countryCode,
			Coordinates: Coordinates{
				Lat: lat,
				Lng: lng,
			},
			Population: population,
		}

		cities = append(cities, city)
	}

	return cities
}

func loadStates(countryNames map[string]string) []Place {
	file, err := os.Open("admin1CodesASCII.txt")
	if err != nil {
		log.Printf("Warning: Could not load admin1CodesASCII.txt: %v", err)
		return []Place{}
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.Comma = '\t'
	reader.LazyQuotes = true
	reader.FieldsPerRecord = -1

	records, err := reader.ReadAll()
	if err != nil {
		log.Printf("Warning: Could not parse admin1CodesASCII.txt: %v", err)
		return []Place{}
	}

	states := []Place{}

	for _, record := range records {
		if len(record) < 4 {
			continue
		}

		code := record[0]           // e.g., "US.CA"
		name := record[1]            // e.g., "California"
		// geonameID := record[3]    // e.g., "5332921" (not used currently)

		// Extract country code from "US.CA" -> "US"
		parts := strings.Split(code, ".")
		if len(parts) != 2 {
			continue
		}
		countryCode := parts[0]

		// Get country name
		countryName, exists := countryNames[countryCode]
		if !exists {
			countryName = countryCode
		}

		state := Place{
			ID:             code,
			Type:           "state",
			Name:           name,
			AlternateNames: []string{}, // Admin1 file doesn't have alternate names
			Country:        countryName,
			CountryCode:    countryCode,
			Coordinates: Coordinates{
				Lat: 0, // Admin1 file doesn't have coordinates
				Lng: 0,
			},
			Population: 0, // Admin1 file doesn't have population
		}

		states = append(states, state)
	}

	return states
}

func loadCountries() []Place {
	file, err := os.Open("countryInfo.txt")
	if err != nil {
		log.Printf("Warning: Could not load countryInfo.txt: %v", err)
		return []Place{}
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.Comma = '\t'
	reader.Comment = '#'
	reader.LazyQuotes = true
	reader.FieldsPerRecord = -1

	records, err := reader.ReadAll()
	if err != nil {
		log.Printf("Warning: Could not parse countryInfo.txt: %v", err)
		return []Place{}
	}

	countries := []Place{}

	for _, record := range records {
		if len(record) < 8 {
			continue
		}

		// Skip comments
		if strings.HasPrefix(record[0], "#") {
			continue
		}

		countryCode := record[0]     // e.g., "TH"
		countryName := record[4]     // e.g., "Thailand"
		capital := record[5]         // e.g., "Bangkok"
		population, _ := strconv.Atoi(record[7])

		country := Place{
			ID:             countryCode,
			Type:           "country",
			Name:           countryName,
			AlternateNames: []string{}, // countryInfo.txt doesn't have alternate names
			Country:        countryName,
			CountryCode:    countryCode,
			Coordinates: Coordinates{
				Lat: 0, // countryInfo.txt doesn't have country-level coordinates
				Lng: 0,
			},
			Population: population,
		}

		// Store capital for reference (not used in current schema)
		_ = capital

		countries = append(countries, country)
	}

	return countries
}

func loadCountryNames() map[string]string {
	file, err := os.Open("countryInfo.txt")
	if err != nil {
		log.Printf("Warning: Could not load countryInfo.txt: %v", err)
		return map[string]string{}
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.Comma = '\t'
	reader.Comment = '#'
	reader.LazyQuotes = true
	reader.FieldsPerRecord = -1

	records, err := reader.ReadAll()
	if err != nil {
		log.Printf("Warning: Could not parse countryInfo.txt: %v", err)
		return map[string]string{}
	}

	countryNames := make(map[string]string)
	for _, record := range records {
		if len(record) < 5 {
			continue
		}
		// Skip comments
		if strings.HasPrefix(record[0], "#") {
			continue
		}
		countryCode := record[0]
		countryName := record[4]
		countryNames[countryCode] = countryName
	}

	log.Printf("Loaded %d country names", len(countryNames))
	return countryNames
}

// detectLanguage detects language using Unicode ranges
func detectLanguage(text string) string {
	hasThai := false
	hasChinese := false
	hasLatin := false
	hasOther := false

	for _, r := range text {
		// Thai (U+0E00 to U+0E7F)
		if r >= 0x0E00 && r <= 0x0E7F {
			hasThai = true
		} else if r >= 0x4E00 && r <= 0x9FFF {
			// Chinese (U+4E00 to U+9FFF - CJK Unified Ideographs)
			hasChinese = true
		} else if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') {
			// Latin alphabet
			hasLatin = true
		} else if r >= 0x0370 && r <= 0x03FF {
			// Greek
			hasOther = true
		} else if r >= 0x0530 && r <= 0x058F {
			// Armenian
			hasOther = true
		} else if r >= 0x0590 && r <= 0x05FF {
			// Hebrew
			hasOther = true
		} else if r >= 0x0600 && r <= 0x06FF {
			// Arabic
			hasOther = true
		} else if r >= 0x0400 && r <= 0x04FF {
			// Cyrillic
			hasOther = true
		} else if r >= 0x0980 && r <= 0x09FF {
			// Bengali
			hasOther = true
		} else if r >= 0x0A00 && r <= 0x0A7F {
			// Gurmukhi (Punjabi)
			hasOther = true
		} else if r >= 0x0B80 && r <= 0x0BFF {
			// Tamil
			hasOther = true
		} else if r >= 0x0C80 && r <= 0x0CFF {
			// Kannada
			hasOther = true
		} else if r >= 0x0D00 && r <= 0x0D7F {
			// Malayalam
			hasOther = true
		} else if r >= 0x0D80 && r <= 0x0DFF {
			// Sinhala
			hasOther = true
		} else if r >= 0x0E80 && r <= 0x0EFF {
			// Lao
			hasOther = true
		} else if r >= 0x0F00 && r <= 0x0FFF {
			// Tibetan
			hasOther = true
		} else if r >= 0x1000 && r <= 0x109F {
			// Myanmar (Burmese)
			hasOther = true
		} else if r >= 0x10A0 && r <= 0x10FF {
			// Georgian
			hasOther = true
		} else if r >= 0x1200 && r <= 0x137F {
			// Ethiopian
			hasOther = true
		} else if r >= 0xAC00 && r <= 0xD7AF {
			// Korean Hangul
			hasOther = true
		} else if r >= 0x0900 && r <= 0x097F {
			// Hindi/Devanagari
			hasOther = true
		} else if r >= 0x3040 && r <= 0x309F {
			// Japanese Hiragana
			hasOther = true
		} else if r >= 0x30A0 && r <= 0x30FF {
			// Japanese Katakana
			hasOther = true
		}
	}

	// Prioritize detection
	if hasOther {
		return "other"
	}
	if hasThai {
		return "th"
	}
	if hasChinese {
		return "zh"
	}
	if hasLatin {
		return "en"
	}

	return "en" // Default
}

// filterAlternateNames keeps only Thai, Chinese, and romanized names
func filterAlternateNames(alternateNames string) []string {
	if alternateNames == "" {
		return []string{}
	}

	names := strings.Split(alternateNames, ",")
	var filtered []string
	seen := make(map[string]bool) // Deduplicate

	for _, name := range names {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}

		// Skip if already seen
		if seen[name] {
			continue
		}

		lang := detectLanguage(name)

		// Keep Thai, Chinese, and English/Latin scripts
		if lang == "th" || lang == "zh" || lang == "en" {
			// Additional filter: skip very long names (likely descriptions)
			if len(name) < 50 {
				filtered = append(filtered, name)
				seen[name] = true
			}
		}
	}

	return filtered
}
