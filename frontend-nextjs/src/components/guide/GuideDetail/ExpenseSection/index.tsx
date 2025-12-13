'use client'

import React from 'react'
import { Empty } from '@/components/ui/empty'
import { Wallet } from 'lucide-react'
import BudgetOverview from './BudgetOverview'
import CategoryBreakdown from './CategoryBreakdown'
import ExpenseList from './ExpenseList'
import { Expense, ExpenseCategory } from '@/interfaces/expense.interface'
import { useTranslations } from 'next-intl'

interface ExpenseSectionProps {
    expenses?: Expense[];
}

interface SimpleSummary {
    total: number;
    currency: string;
    byCategory: Record<ExpenseCategory, number>;
}

const ExpenseSection: React.FC<ExpenseSectionProps> = ({ expenses = [] }) => {
    const t = useTranslations('guideDetail.budget')

    // Calculate summary
    const summary: SimpleSummary = React.useMemo(() => {
        if (!expenses || expenses.length === 0) {
            return {
                total: 0,
                currency: 'THB',
                byCategory: {
                    accommodation: 0,
                    transportation: 0,
                    food: 0,
                    activities: 0,
                    shopping: 0,
                    other: 0,
                },
            }
        }

        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0)
        const currency = expenses[0]?.currency || 'THB'

        const byCategory = expenses.reduce((acc, exp) => {
            acc[exp.category] = (acc[exp.category] || 0) + exp.amount
            return acc
        }, {} as Record<ExpenseCategory, number>)

        // Fill missing categories with 0
        const categories: ExpenseCategory[] = ['accommodation', 'transportation', 'food', 'activities', 'shopping', 'other']
        categories.forEach(cat => {
            if (!(cat in byCategory)) {
                byCategory[cat] = 0
            }
        })

        return {
            total,
            currency,
            byCategory,
        }
    }, [expenses])

    if (expenses.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
                </div>
                <Empty description={t('noExpenses')} />
            </div>
        )
    }

    return (
        <div className="bg-gray-100 p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('title')}</h2>
            </div>

            <div className="space-y-6">
                <BudgetOverview summary={summary} />
                <CategoryBreakdown summary={summary} />
                <ExpenseList expenses={expenses} currency={summary.currency} />
            </div>
        </div>
    )
}

export default ExpenseSection