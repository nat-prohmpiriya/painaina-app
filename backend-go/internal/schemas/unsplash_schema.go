package schemas

// SearchPhotosRequest represents request for searching photos
type SearchPhotosRequest struct {
	Query   string `form:"query" binding:"required,min=1"`
	Page    int    `form:"page" binding:"omitempty,min=1"`
	PerPage int    `form:"perPage" binding:"omitempty,min=1,max=30"`
}

// GetRandomPhotosRequest represents request for getting random photos
type GetRandomPhotosRequest struct {
	Query string `form:"query"`
	Count int    `form:"count" binding:"omitempty,min=1,max=30"`
}

// GetPhotoRequest represents request for getting a specific photo
type GetPhotoRequest struct {
	PhotoID string `uri:"photoId" binding:"required"`
}

// TriggerDownloadRequest represents request for triggering download event
type TriggerDownloadRequest struct {
	DownloadLocation string `json:"downloadLocation" binding:"required,url"`
}
