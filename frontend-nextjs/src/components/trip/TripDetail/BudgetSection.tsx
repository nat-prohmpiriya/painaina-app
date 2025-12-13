'use client'

import BudgetBanner from "./BudgetBanner"
import ExpenseCard from "./ExpenseCard"
import { useTripContext } from '@/contexts/TripContext'
import { useTranslations } from 'next-intl'

const BudgetSection = () => {
    const { expenses } = useTripContext()
    const t = useTranslations('tripDetail.budget')

    return (
        <div className="w-8/10 mx-auto mb-24">
            <BudgetBanner />
            {expenses && expenses.length > 0 ? (
                expenses.map((expense: any) => (
                    <ExpenseCard key={expense.id} expense={expense} />
                ))
            ) : (
                <div className="text-center py-8 text-gray-500">
                    {t('noExpenses')}
                </div>
            )}
        </div>
    )
}

export default BudgetSection