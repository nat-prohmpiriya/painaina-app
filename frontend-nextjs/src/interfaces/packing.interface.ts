export type PackingCategory =
  | "clothing"
  | "toiletries"
  | "electronics"
  | "documents"
  | "medicine"
  | "accessories"
  | "food"
  | "other";

export interface PackingItem {
  id: string;
  name: string;
  category: PackingCategory;
  quantity: number;
  packed: boolean;
  assignedTo?: string;
  notes?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface PackingList {
  id: string;
  tripId: string;
  items: PackingItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PackingStats {
  totalItems: number;
  packedItems: number;
  byCategory: Record<PackingCategory, number>;
  packedByCategory: Record<PackingCategory, number>;
}

export interface PackingTemplateItem {
  name: string;
  category: PackingCategory;
  quantity: number;
}

export interface PackingTemplate {
  id: string;
  name: string;
  nameTh: string;
  tripType: string[];
  items: PackingTemplateItem[];
}

export interface CreatePackingItemRequest {
  name: string;
  category: PackingCategory;
  quantity: number;
  notes?: string;
  assignedTo?: string;
}

export interface UpdatePackingItemRequest {
  name?: string;
  category?: PackingCategory;
  quantity?: number;
  packed?: boolean;
  notes?: string;
  assignedTo?: string;
}

export interface ReorderPackingItemsRequest {
  itemIds: string[];
}

export interface ApplyPackingTemplateRequest {
  templateId: string;
}

// Category configuration for UI
export const PACKING_CATEGORY_CONFIG: Record<
  PackingCategory,
  { icon: string; color: string; labelTh: string; labelEn: string }
> = {
  clothing: {
    icon: "👕",
    color: "#3b82f6",
    labelTh: "เสื้อผ้า",
    labelEn: "Clothing",
  },
  toiletries: {
    icon: "🧴",
    color: "#10b981",
    labelTh: "ของใช้ส่วนตัว",
    labelEn: "Toiletries",
  },
  electronics: {
    icon: "🔌",
    color: "#f59e0b",
    labelTh: "อุปกรณ์",
    labelEn: "Electronics",
  },
  documents: {
    icon: "📄",
    color: "#ef4444",
    labelTh: "เอกสาร",
    labelEn: "Documents",
  },
  medicine: {
    icon: "💊",
    color: "#ec4899",
    labelTh: "ยา/สุขภาพ",
    labelEn: "Medicine",
  },
  accessories: {
    icon: "👜",
    color: "#8b5cf6",
    labelTh: "อุปกรณ์เสริม",
    labelEn: "Accessories",
  },
  food: {
    icon: "🍿",
    color: "#f97316",
    labelTh: "อาหาร/ขนม",
    labelEn: "Food",
  },
  other: {
    icon: "📦",
    color: "#6b7280",
    labelTh: "อื่นๆ",
    labelEn: "Other",
  },
};
