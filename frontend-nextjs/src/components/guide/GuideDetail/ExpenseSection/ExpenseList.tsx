'use client'

import React from 'react'
import { Expense, ExpenseCategory } from '@/interfaces/expense.interface'
import { format } from 'date-fns'
import { LuBed, LuCar, LuUtensils, LuTicket, LuShoppingBag, LuPackage } from 'react-icons/lu'

interface ExpenseListProps {
    expenses: Expense[];
    currency: string;
}

const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, currency }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const categoryConfig: Record<ExpenseCategory, { label: string; icon: React.ReactNode }> = {
        accommodation: { label: 'Accommodation', icon: <LuBed className="w-5 h-5" /> },
        transportation: { label: 'Transportation', icon: <LuCar className="w-5 h-5" /> },
        food: { label: 'Food & Dining', icon: <LuUtensils className="w-5 h-5" /> },
        activities: { label: 'Activities', icon: <LuTicket className="w-5 h-5" /> },
        shopping: { label: 'Shopping', icon: <LuShoppingBag className="w-5 h-5" /> },
        other: { label: 'Other', icon: <LuPackage className="w-5 h-5" /> },
    }

    // Group expenses by category
    const groupedExpenses = expenses.reduce((acc, expense) => {
        if (!acc[expense.category]) {
            acc[expense.category] = []
        }
        acc[expense.category].push(expense)
        return acc
    }, {} as Record<ExpenseCategory, Expense[]>)

    // Sort categories by total amount (highest first)
    const sortedCategories = Object.entries(groupedExpenses).sort(([, a], [, b]) => {
        const totalA = a.reduce((sum, exp) => sum + exp.amount, 0)
        const totalB = b.reduce((sum, exp) => sum + exp.amount, 0)
        return totalB - totalA
    })

    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Details</h3>

            <div className="space-y-6">
                {sortedCategories.map(([category, categoryExpenses]) => {
                    const config = categoryConfig[category as ExpenseCategory]
                    const categoryTotal = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0)

                    return (
                        <div key={category} className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">{config.icon}</span>
                                    <h4 className="font-semibold text-gray-900">
                                        {config.label}
                                    </h4>
                                </div>
                                <p className="text-sm font-bold text-gray-900">
                                    {formatCurrency(categoryTotal)}
                                </p>
                            </div>

                            <div className="space-y-2 pl-7">
                                {categoryExpenses.map(expense => (
                                    <div
                                        key={expense.id}
                                        className="flex items-start justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {expense.description}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {format(new Date(expense.date), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700 ml-4">
                                            {formatCurrency(expense.amount)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default ExpenseList
