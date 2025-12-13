'use client'

import React from 'react'
import { ExpenseCategory } from '@/interfaces/expense.interface'
import { LuBed, LuCar, LuUtensils, LuTicket, LuShoppingBag, LuPackage } from 'react-icons/lu'

interface CategoryBreakdownProps {
    summary: {
        total: number;
        currency: string;
        byCategory: Record<ExpenseCategory, number>;
    };
}

const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ summary }) => {
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const categories = [
        { key: 'accommodation', label: 'Accommodation', color: 'bg-gray-600', icon: <LuBed className="w-4 h-4" /> },
        { key: 'transportation', label: 'Transportation', color: 'bg-gray-600', icon: <LuCar className="w-4 h-4" /> },
        { key: 'food', label: 'Food & Dining', color: 'bg-gray-600', icon: <LuUtensils className="w-4 h-4" /> },
        { key: 'activities', label: 'Activities', color: 'bg-gray-600', icon: <LuTicket className="w-4 h-4" /> },
        { key: 'shopping', label: 'Shopping', color: 'bg-gray-600', icon: <LuShoppingBag className="w-4 h-4" /> },
        { key: 'other', label: 'Other', color: 'bg-gray-600', icon: <LuPackage className="w-4 h-4" /> },
    ]

    const getPercentage = (amount: number) => {
        if (summary.total === 0) return 0
        return (amount / summary.total) * 100
    }

    return (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>

            <div className="space-y-4">
                {categories.map(category => {
                    const amount = summary.byCategory[category.key as keyof typeof summary.byCategory] || 0
                    const percentage = getPercentage(amount)

                    if (amount === 0) return null

                    return (
                        <div key={category.key} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">{category.icon}</span>
                                    <span className="text-sm font-medium text-gray-700">
                                        {category.label}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-gray-900">
                                        {formatCurrency(amount, summary.currency)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {percentage.toFixed(1)}%
                                    </p>
                                </div>
                            </div>

                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`${category.color} h-full rounded-full transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>

            {summary.total === 0 && (
                <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No expenses recorded yet</p>
                </div>
            )}
        </div>
    )
}

export default CategoryBreakdown
