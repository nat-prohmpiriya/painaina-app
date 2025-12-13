export type ExpenseCategory =
  | "accommodation"
  | "transportation"
  | "food"
  | "activities"
  | "shopping"
  | "other";

export type ExpenseSplitType = "equal" | "percentage" | "exact";

export type ExpenseStatus = "pending" | "settled";

export interface ExpenseSplitDetail {
  userId: string;
  amount: number;
  percentage?: number;
  paid: boolean;
}

export interface Expense {
  id: string;
  tripId: string;
  entryId?: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  paidBy: string;
  splitType: ExpenseSplitType;
  splitWith: string[];
  splitDetails?: ExpenseSplitDetail[];
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  tripId: string;
  description: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  entryId?: string;
  splitType: ExpenseSplitType;
  splitWith: string[];
  splitDetails: ExpenseSplitDetail[];
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  currency?: string;
  category?: ExpenseCategory;
  date?: string;
  entryId?: string;
  splitType?: ExpenseSplitType;
  splitWith?: string[];
  splitDetails?: ExpenseSplitDetail[];
  status?: ExpenseStatus;
}

export interface ExpenseSummary {
  total: number;
  currency: string;
  byCategory: Record<ExpenseCategory, number>;
  byUser: Record<string, {
    paid: number;
    owed: number;
    balance: number;
  }>;
}

// Type aliases for backward compatibility
export type TripExpense = Expense;
export type CreateExpenseData = CreateExpenseRequest;
export type UpdateExpenseData = UpdateExpenseRequest;
export type SplitType = ExpenseSplitType;
