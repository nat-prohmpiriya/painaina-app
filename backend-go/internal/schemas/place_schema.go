package schemas

type AutocompleteRequest struct {
	Input string `form:"input" binding:"required,min=1"`
	Types string `form:"types"` // Optional: (cities), establishment, etc.
}

type SearchPlacesRequest struct {
	Query string `form:"query" binding:"required,min=1"`
}

type CreatePlaceRequest struct {
	GooglePlaceID string   `json:"googlePlaceId" binding:"required"`
	Name          string   `json:"name" binding:"required"`
	Address       string   `json:"address" binding:"required"`
	Latitude      float64  `json:"latitude" binding:"required,min=-90,max=90"`
	Longitude     float64  `json:"longitude" binding:"required,min=-180,max=180"`
	Phone         *string  `json:"phone,omitempty"`
	Website       *string  `json:"website,omitempty"`
	Categories    []string `json:"categories,omitempty"`
}

type UpdatePlaceRequest struct {
	Name       *string  `json:"name,omitempty"`
	Address    *string  `json:"address,omitempty"`
	Latitude   *float64 `json:"latitude,omitempty" binding:"omitempty,min=-90,max=90"`
	Longitude  *float64 `json:"longitude,omitempty" binding:"omitempty,min=-180,max=180"`
	Phone      *string  `json:"phone,omitempty"`
	Website    *string  `json:"website,omitempty"`
	Categories []string `json:"categories,omitempty"`
}

type ListPlacesRequest struct {
	Limit  int `form:"limit" binding:"omitempty,min=1,max=100"`
	Offset int `form:"offset" binding:"omitempty,min=0"`
}
