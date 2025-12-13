package unsplash

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
)

const (
	baseURL = "https://api.unsplash.com"
)

// Client wraps Unsplash API client
type Client struct {
	AccessKey  string
	SecretKey  string
	httpClient *http.Client
}

// Photo represents an Unsplash photo
type Photo struct {
	ID          string      `json:"id"`
	CreatedAt   string      `json:"created_at"`
	Width       int         `json:"width"`
	Height      int         `json:"height"`
	Color       string      `json:"color"`
	BlurHash    string      `json:"blur_hash"`
	Downloads   int         `json:"downloads"`
	Likes       int         `json:"likes"`
	Description *string     `json:"description"`
	AltText     *string     `json:"alt_description"`
	URLs        PhotoURLs   `json:"urls"`
	Links       PhotoLinks  `json:"links"`
	User        User        `json:"user"`
}

// PhotoURLs represents different sizes of photo URLs
type PhotoURLs struct {
	Raw     string `json:"raw"`
	Full    string `json:"full"`
	Regular string `json:"regular"`
	Small   string `json:"small"`
	Thumb   string `json:"thumb"`
}

// PhotoLinks represents photo links
type PhotoLinks struct {
	Self             string `json:"self"`
	HTML             string `json:"html"`
	Download         string `json:"download"`
	DownloadLocation string `json:"download_location"`
}

// User represents an Unsplash user
type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	Links    UserLinks `json:"links"`
}

// UserLinks represents user links
type UserLinks struct {
	Self      string `json:"self"`
	HTML      string `json:"html"`
	Photos    string `json:"photos"`
	Portfolio string `json:"portfolio"`
}

// SearchPhotosResponse represents search response
type SearchPhotosResponse struct {
	Total      int     `json:"total"`
	TotalPages int     `json:"total_pages"`
	Results    []Photo `json:"results"`
}

// NewClient creates a new Unsplash client
func NewClient(accessKey, secretKey string) (*Client, error) {
	if accessKey == "" {
		return nil, fmt.Errorf("Unsplash access key is required")
	}

	return &Client{
		AccessKey:  accessKey,
		SecretKey:  secretKey,
		httpClient: &http.Client{},
	}, nil
}

// SearchPhotos searches for photos on Unsplash
func (c *Client) SearchPhotos(ctx context.Context, query string, page, perPage int) (*SearchPhotosResponse, error) {
	if query == "" {
		return nil, fmt.Errorf("search query is required")
	}

	if perPage == 0 {
		perPage = 10
	}
	if page == 0 {
		page = 1
	}

	params := url.Values{}
	params.Add("query", query)
	params.Add("page", fmt.Sprintf("%d", page))
	params.Add("per_page", fmt.Sprintf("%d", perPage))

	endpoint := fmt.Sprintf("%s/search/photos?%s", baseURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Client-ID "+c.AccessKey)
	req.Header.Set("Accept-Version", "v1")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call Unsplash API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Unsplash API error (status %d): %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result SearchPhotosResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &result, nil
}

// GetRandomPhoto gets a random photo from Unsplash
func (c *Client) GetRandomPhoto(ctx context.Context, query string, count int) ([]Photo, error) {
	if count == 0 {
		count = 1
	}

	params := url.Values{}
	if query != "" {
		params.Add("query", query)
	}
	params.Add("count", fmt.Sprintf("%d", count))

	endpoint := fmt.Sprintf("%s/photos/random?%s", baseURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Client-ID "+c.AccessKey)
	req.Header.Set("Accept-Version", "v1")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call Unsplash API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Unsplash API error (status %d): %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// If count is 1, API returns single object, otherwise array
	if count == 1 {
		var photo Photo
		if err := json.Unmarshal(body, &photo); err != nil {
			return nil, fmt.Errorf("failed to parse response: %w", err)
		}
		return []Photo{photo}, nil
	}

	var photos []Photo
	if err := json.Unmarshal(body, &photos); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return photos, nil
}

// GetPhoto gets a specific photo by ID
func (c *Client) GetPhoto(ctx context.Context, photoID string) (*Photo, error) {
	if photoID == "" {
		return nil, fmt.Errorf("photo ID is required")
	}

	endpoint := fmt.Sprintf("%s/photos/%s", baseURL, photoID)

	req, err := http.NewRequestWithContext(ctx, "GET", endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Client-ID "+c.AccessKey)
	req.Header.Set("Accept-Version", "v1")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call Unsplash API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Unsplash API error (status %d): %s", resp.StatusCode, string(body))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var photo Photo
	if err := json.Unmarshal(body, &photo); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &photo, nil
}

// TriggerDownload triggers a download event (required by Unsplash API guidelines)
func (c *Client) TriggerDownload(ctx context.Context, downloadLocation string) error {
	if downloadLocation == "" {
		return fmt.Errorf("download location is required")
	}

	req, err := http.NewRequestWithContext(ctx, "GET", downloadLocation, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Client-ID "+c.AccessKey)
	req.Header.Set("Accept-Version", "v1")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call Unsplash API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Unsplash API error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}
