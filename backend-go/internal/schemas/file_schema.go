package schemas

type UploadFileResponse struct {
	ID       string            `json:"id"`
	URL      string            `json:"url"`
	Type     string            `json:"type"`
	Size     int64             `json:"size"`
	Metadata map[string]string `json:"metadata,omitempty"`
}

type ListFilesRequest struct {
	OwnerID  string `form:"ownerId"`
	Type     string `form:"type" binding:"omitempty,oneof=photo video document"`
	Limit    int    `form:"limit" binding:"omitempty,min=1,max=100"`
	Offset   int    `form:"offset" binding:"omitempty,min=0"`
}
