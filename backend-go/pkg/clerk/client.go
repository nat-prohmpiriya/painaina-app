package clerk

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Client struct {
	secretKey string
	issuer    string
	jwksURL   string
	keys      map[string]*rsa.PublicKey
	keysMutex sync.RWMutex
}

type ClerkClaims struct {
	jwt.RegisteredClaims
	UserID    string `json:"sub"`
	Email     string `json:"email"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
	ImageURL  string `json:"image_url,omitempty"`
}

type UserInfo struct {
	ClerkID   string
	Email     string
	FirstName string
	LastName  string
	FullName  string
	ImageURL  string
}

type jwksResponse struct {
	Keys []jwk `json:"keys"`
}

type jwk struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Use string `json:"use"`
	N   string `json:"n"`
	E   string `json:"e"`
}

func NewClient(secretKey, issuer string) (*Client, error) {
	if secretKey == "" {
		return nil, fmt.Errorf("clerk secret key is required")
	}
	if issuer == "" {
		return nil, fmt.Errorf("clerk issuer is required")
	}

	// Construct JWKS URL from issuer
	jwksURL := fmt.Sprintf("%s/.well-known/jwks.json", issuer)

	client := &Client{
		secretKey: secretKey,
		issuer:    issuer,
		jwksURL:   jwksURL,
		keys:      make(map[string]*rsa.PublicKey),
	}

	// Fetch JWKS on initialization
	if err := client.fetchJWKS(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS: %w", err)
	}

	return client, nil
}

// fetchJWKS fetches and caches the public keys from Clerk's JWKS endpoint
func (c *Client) fetchJWKS(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, c.jwksURL, nil)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("JWKS endpoint returned status %d: %s", resp.StatusCode, string(body))
	}

	var jwks jwksResponse
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return fmt.Errorf("failed to decode JWKS: %w", err)
	}

	// Parse and cache RSA public keys
	c.keysMutex.Lock()
	defer c.keysMutex.Unlock()

	for _, key := range jwks.Keys {
		if key.Kty != "RSA" {
			continue
		}

		pubKey, err := c.parseRSAPublicKey(key)
		if err != nil {
			return fmt.Errorf("failed to parse RSA public key: %w", err)
		}

		c.keys[key.Kid] = pubKey
	}

	return nil
}

// parseRSAPublicKey converts JWK to RSA public key
func (c *Client) parseRSAPublicKey(key jwk) (*rsa.PublicKey, error) {
	// Decode base64url-encoded modulus
	nBytes, err := base64.RawURLEncoding.DecodeString(key.N)
	if err != nil {
		return nil, fmt.Errorf("failed to decode modulus: %w", err)
	}

	// Decode base64url-encoded exponent
	eBytes, err := base64.RawURLEncoding.DecodeString(key.E)
	if err != nil {
		return nil, fmt.Errorf("failed to decode exponent: %w", err)
	}

	// Convert bytes to big.Int
	n := new(big.Int).SetBytes(nBytes)

	// Convert exponent bytes to int
	var e int
	for _, b := range eBytes {
		e = e*256 + int(b)
	}

	return &rsa.PublicKey{
		N: n,
		E: e,
	}, nil
}

// getPublicKey retrieves the public key for the given kid
func (c *Client) getPublicKey(kid string) (*rsa.PublicKey, error) {
	c.keysMutex.RLock()
	key, exists := c.keys[kid]
	c.keysMutex.RUnlock()

	if exists {
		return key, nil
	}

	// Key not found, try fetching JWKS again
	if err := c.fetchJWKS(context.Background()); err != nil {
		return nil, fmt.Errorf("failed to refresh JWKS: %w", err)
	}

	c.keysMutex.RLock()
	key, exists = c.keys[kid]
	c.keysMutex.RUnlock()

	if !exists {
		return nil, fmt.Errorf("public key not found for kid: %s", kid)
	}

	return key, nil
}

// VerifyToken verifies the JWT token from Clerk and returns user information
func (c *Client) VerifyToken(ctx context.Context, tokenString string) (*UserInfo, error) {
	// Remove "Bearer " prefix if present
	tokenString = strings.TrimPrefix(tokenString, "Bearer ")
	tokenString = strings.TrimSpace(tokenString)

	// Parse and validate JWT token
	token, err := jwt.ParseWithClaims(tokenString, &ClerkClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Verify signing algorithm is RS256
		if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		// Get kid from token header
		kid, ok := token.Header["kid"].(string)
		if !ok {
			return nil, fmt.Errorf("kid not found in token header")
		}

		// Get public key for this kid
		return c.getPublicKey(kid)
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	// Extract claims
	claims, ok := token.Claims.(*ClerkClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Verify issuer
	if claims.Issuer != c.issuer {
		return nil, fmt.Errorf("invalid issuer: expected %s, got %s", c.issuer, claims.Issuer)
	}

	// Verify expiration
	if claims.ExpiresAt != nil && time.Now().After(claims.ExpiresAt.Time) {
		return nil, fmt.Errorf("token has expired")
	}

	// Build full name
	fullName := strings.TrimSpace(fmt.Sprintf("%s %s", claims.FirstName, claims.LastName))
	if fullName == "" {
		// Fallback to email username if no name is provided
		parts := strings.Split(claims.Email, "@")
		if len(parts) > 0 {
			fullName = parts[0]
		}
	}

	return &UserInfo{
		ClerkID:   claims.UserID,
		Email:     claims.Email,
		FirstName: claims.FirstName,
		LastName:  claims.LastName,
		FullName:  fullName,
		ImageURL:  claims.ImageURL,
	}, nil
}

// GetUser fetches user information from Clerk API
func (c *Client) GetUser(ctx context.Context, userID string) (*UserInfo, error) {
	url := fmt.Sprintf("https://api.clerk.com/v1/users/%s", userID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.secretKey))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("clerk API returned status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		ID              string `json:"id"`
		EmailAddresses  []struct {
			EmailAddress string `json:"email_address"`
		} `json:"email_addresses"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		ImageURL  string `json:"image_url"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Get primary email
	email := ""
	if len(result.EmailAddresses) > 0 {
		email = result.EmailAddresses[0].EmailAddress
	}

	// Build full name
	fullName := strings.TrimSpace(fmt.Sprintf("%s %s", result.FirstName, result.LastName))
	if fullName == "" && email != "" {
		parts := strings.Split(email, "@")
		if len(parts) > 0 {
			fullName = parts[0]
		}
	}

	return &UserInfo{
		ClerkID:   result.ID,
		Email:     email,
		FirstName: result.FirstName,
		LastName:  result.LastName,
		FullName:  fullName,
		ImageURL:  result.ImageURL,
	}, nil
}
