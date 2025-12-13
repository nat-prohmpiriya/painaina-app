'use client'

import React from 'react'

interface BudgetOverviewProps {
    summary: {
        total: number;
        currency: string;
    };
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
            </div>
        </div>
    )
}

export default BudgetOverview
