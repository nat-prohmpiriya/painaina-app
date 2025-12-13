import apiClient from "./api-client";
import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
  ExpenseSummary,
  ExpenseCategory,
} from "@/interfaces";

export class ExpenseService {
  async getExpensesByTrip(
    tripId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Expense[]> {
    return apiClient.get<Expense[]>(`/trips/${tripId}/expenses`, { limit, offset });
  }

  async getExpense(tripId: string, expenseId: string): Promise<Expense> {
    return apiClient.get<Expense>(`/trips/${tripId}/expenses/${expenseId}`);
  }

  async getTotalExpenses(tripId: string): Promise<ExpenseSummary> {
    return apiClient.get<ExpenseSummary>(`/trips/${tripId}/expenses/total`);
  }

  async getExpensesByCategory(
    tripId: string,
    category: ExpenseCategory
  ): Promise<Expense[]> {
    return apiClient.get<Expense[]>(`/trips/${tripId}/expenses/category`, { category });
  }

  async createExpense(tripId: string, data: CreateExpenseRequest): Promise<Expense> {
    return apiClient.post<Expense>(`/trips/${tripId}/expenses`, data);
  }

  async updateExpense(
    tripId: string,
    expenseId: string,
    data: UpdateExpenseRequest
  ): Promise<Expense> {
    return apiClient.patch<Expense>(`/trips/${tripId}/expenses/${expenseId}`, data);
  }

  async deleteExpense(tripId: string, expenseId: string): Promise<{ message: string }> {
    return apiClient.delete(`/trips/${tripId}/expenses/${expenseId}`);
  }

  async settleExpense(tripId: string, expenseId: string): Promise<Expense> {
    return apiClient.post<Expense>(`/trips/${tripId}/expenses/${expenseId}/settle`);
  }
}

export const expenseService = new ExpenseService();
