'use client'

import React from 'react'
import { ExpenseSummary } from '@/interfaces/expense.interface'

interface BudgetOverviewProps {
    summary: ExpenseSummary;
}

const BudgetOverview: React.FC<BudgetOverviewProps> = ({ summary }) => {
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    return (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
            <div className="flex items-baseline justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Budget</p>
                    <p className="text-4xl font-bold text-gray-900">
                        {formatCurrency(summary.total, summary.currency)}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 mb-1">Currency</p>
                    <p className="text-2xl font-semibold text-purple-600">{summary.currency}</p>
                </div>
            </div>

            {summary.total > 0 && (
                <p className="text-sm text-gray-500 mt-4">
                    💡 This is the total estimated budget for this trip
                </p>
            )}
        </div>
    )
}

export default BudgetOverview