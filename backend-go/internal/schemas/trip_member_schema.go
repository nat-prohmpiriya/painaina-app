package schemas

type AddTripMemberRequest struct {
	UserID string `json:"userId" binding:"required"`
	Role   string `json:"role" binding:"required,oneof=owner editor viewer"`
}

type UpdateTripMemberRequest struct {
	Role string `json:"role" binding:"required,oneof=owner editor viewer"`
}
