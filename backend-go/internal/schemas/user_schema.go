package schemas

// UpdateUserRequest represents the request body for updating a user profile
type UpdateUserRequest struct {
	Name     *string        `json:"name,omitempty" binding:"omitempty,min=2,max=100"`
	Bio      *string        `json:"bio,omitempty" binding:"omitempty,max=500"`
	PhotoURL *string        `json:"photoUrl,omitempty" binding:"omitempty,url"`
	Settings *UserSettings  `json:"settings,omitempty"`
}

// UserSettings represents user preferences in requests
type UserSettings struct {
	Language      *string `json:"language,omitempty" binding:"omitempty,oneof=en th"`
	Notifications *bool   `json:"notifications,omitempty"`
}
