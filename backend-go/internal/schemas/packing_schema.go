package schemas

// CreatePackingItemRequest represents the request to create a packing item
type CreatePackingItemRequest struct {
	Name       string  `json:"name" binding:"required,min=1,max=200"`
	Category   string  `json:"category" binding:"required,oneof=clothing toiletries electronics documents medicine accessories food other"`
	Quantity   int     `json:"quantity" binding:"required,min=1,max=999"`
	Notes      *string `json:"notes,omitempty" binding:"omitempty,max=500"`
	AssignedTo *string `json:"assignedTo,omitempty"`
}

// UpdatePackingItemRequest represents the request to update a packing item
type UpdatePackingItemRequest struct {
	Name       *string `json:"name,omitempty" binding:"omitempty,min=1,max=200"`
	Category   *string `json:"category,omitempty" binding:"omitempty,oneof=clothing toiletries electronics documents medicine accessories food other"`
	Quantity   *int    `json:"quantity,omitempty" binding:"omitempty,min=1,max=999"`
	Packed     *bool   `json:"packed,omitempty"`
	Notes      *string `json:"notes,omitempty" binding:"omitempty,max=500"`
	AssignedTo *string `json:"assignedTo,omitempty"`
}

// ReorderPackingItemsRequest represents the request to reorder packing items
type ReorderPackingItemsRequest struct {
	ItemIDs []string `json:"itemIds" binding:"required,min=1"`
}

// ApplyPackingTemplateRequest represents the request to apply a packing template
type ApplyPackingTemplateRequest struct {
	TemplateID string `json:"templateId" binding:"required"`
}

// PackingTemplateItem represents an item in a packing template
type PackingTemplateItem struct {
	Name     string `json:"name"`
	Category string `json:"category"`
	Quantity int    `json:"quantity"`
}

// PackingTemplate represents a predefined packing template
type PackingTemplate struct {
	ID       string                `json:"id"`
	Name     string                `json:"name"`
	NameTH   string                `json:"nameTh"`
	TripType []string              `json:"tripType"`
	Items    []PackingTemplateItem `json:"items"`
}

// GetPackingTemplates returns all available packing templates
func GetPackingTemplates() []PackingTemplate {
	return []PackingTemplate{
		{
			ID:       "essential",
			Name:     "Essential Items",
			NameTH:   "ของจำเป็นพื้นฐาน",
			TripType: []string{"all"},
			Items: []PackingTemplateItem{
				{Name: "บัตรประชาชน", Category: "documents", Quantity: 1},
				{Name: "กระเป๋าสตางค์", Category: "accessories", Quantity: 1},
				{Name: "โทรศัพท์", Category: "electronics", Quantity: 1},
				{Name: "Charger", Category: "electronics", Quantity: 1},
				{Name: "Power bank", Category: "electronics", Quantity: 1},
				{Name: "ยาสามัญ", Category: "medicine", Quantity: 1},
				{Name: "แปรงสีฟัน", Category: "toiletries", Quantity: 1},
				{Name: "ยาสีฟัน", Category: "toiletries", Quantity: 1},
			},
		},
		{
			ID:       "beach",
			Name:     "Beach Trip",
			NameTH:   "ทริปทะเล",
			TripType: []string{"beach", "island"},
			Items: []PackingTemplateItem{
				{Name: "ชุดว่ายน้ำ", Category: "clothing", Quantity: 2},
				{Name: "ครีมกันแดด", Category: "toiletries", Quantity: 1},
				{Name: "แว่นกันแดด", Category: "accessories", Quantity: 1},
				{Name: "หมวก", Category: "accessories", Quantity: 1},
				{Name: "ผ้าเช็ดตัว", Category: "toiletries", Quantity: 2},
				{Name: "รองเท้าแตะ", Category: "clothing", Quantity: 1},
				{Name: "เสื้อยืด", Category: "clothing", Quantity: 3},
				{Name: "กางเกงขาสั้น", Category: "clothing", Quantity: 2},
				{Name: "ชุดชั้นใน", Category: "clothing", Quantity: 3},
				{Name: "กระเป๋ากันน้ำ", Category: "accessories", Quantity: 1},
			},
		},
		{
			ID:       "mountain",
			Name:     "Mountain/Hiking",
			NameTH:   "เดินป่า/ภูเขา",
			TripType: []string{"mountain", "hiking", "camping"},
			Items: []PackingTemplateItem{
				{Name: "รองเท้าเดินป่า", Category: "clothing", Quantity: 1},
				{Name: "เสื้อกันหนาว", Category: "clothing", Quantity: 2},
				{Name: "เสื้อแขนยาว", Category: "clothing", Quantity: 2},
				{Name: "กางเกงขายาว", Category: "clothing", Quantity: 2},
				{Name: "ถุงเท้า", Category: "clothing", Quantity: 3},
				{Name: "ไฟฉาย", Category: "electronics", Quantity: 1},
				{Name: "ยากันยุง", Category: "medicine", Quantity: 1},
				{Name: "ยาแก้แพ้", Category: "medicine", Quantity: 1},
				{Name: "หมวก", Category: "accessories", Quantity: 1},
				{Name: "ผ้าพันคอ", Category: "accessories", Quantity: 1},
				{Name: "ขนม/อาหารแห้ง", Category: "food", Quantity: 1},
				{Name: "ขวดน้ำ", Category: "accessories", Quantity: 1},
			},
		},
		{
			ID:       "international",
			Name:     "International Trip",
			NameTH:   "เที่ยวต่างประเทศ",
			TripType: []string{"international", "abroad"},
			Items: []PackingTemplateItem{
				{Name: "Passport", Category: "documents", Quantity: 1},
				{Name: "Visa (ถ้าต้องใช้)", Category: "documents", Quantity: 1},
				{Name: "ประกันการเดินทาง", Category: "documents", Quantity: 1},
				{Name: "สำเนาเอกสารสำคัญ", Category: "documents", Quantity: 1},
				{Name: "Adapter ปลั๊กไฟ", Category: "electronics", Quantity: 1},
				{Name: "ยาประจำตัว", Category: "medicine", Quantity: 1},
				{Name: "บัตรเครดิต/เดบิต", Category: "documents", Quantity: 1},
				{Name: "เงินสดสกุลท้องถิ่น", Category: "documents", Quantity: 1},
				{Name: "เสื้อผ้า", Category: "clothing", Quantity: 5},
				{Name: "ชุดชั้นใน", Category: "clothing", Quantity: 5},
			},
		},
		{
			ID:       "business",
			Name:     "Business Trip",
			NameTH:   "ทริปทำงาน",
			TripType: []string{"business", "work"},
			Items: []PackingTemplateItem{
				{Name: "ชุดทำงาน", Category: "clothing", Quantity: 2},
				{Name: "เสื้อเชิ้ต", Category: "clothing", Quantity: 3},
				{Name: "กางเกงสแล็ค", Category: "clothing", Quantity: 2},
				{Name: "รองเท้าหนัง", Category: "clothing", Quantity: 1},
				{Name: "Laptop", Category: "electronics", Quantity: 1},
				{Name: "Charger laptop", Category: "electronics", Quantity: 1},
				{Name: "นามบัตร", Category: "documents", Quantity: 1},
				{Name: "เอกสารประชุม", Category: "documents", Quantity: 1},
				{Name: "สมุดจด", Category: "accessories", Quantity: 1},
				{Name: "ปากกา", Category: "accessories", Quantity: 2},
			},
		},
	}
}
