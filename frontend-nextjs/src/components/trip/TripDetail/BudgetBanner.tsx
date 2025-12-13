'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { LuDollarSign } from 'react-icons/lu'
import ExpenseModal, { ExpenseModalRef } from './ExpenseModal'
import { useRef, useMemo } from 'react'
import SetBudgetModal from './SetBuddgetModal'
import { useTripContext } from '@/contexts/TripContext'

const BudgetBanner = () => {
    const expenseModalRef = useRef<ExpenseModalRef>(null)
    const { tripData, expenses } = useTripContext()

    // Calculate budget metrics
    const budgetMetrics = useMemo(() => {
        const budgetAmount = tripData?.budget?.amount || 0
        const budgetCurrency = tripData?.budget?.currency || 'THB'
        const totalUsed = expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0
        const remaining = Math.max(0, budgetAmount - totalUsed)
        const percentUsed = budgetAmount > 0 ? Math.min(100, (totalUsed / budgetAmount) * 100) : 0

        return {
            amount: budgetAmount,
            currency: budgetCurrency,
            used: totalUsed,
            remaining,
            percentUsed: Math.round(percentUsed)
        }
    }, [tripData?.budget?.amount, tripData?.budget?.currency, expenses])

    const formatCurrency = (amount: number, currency: string) => {
        const currencySymbols = {
            'THB': '฿',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'SGD': 'S$'
        }

        const symbol = currencySymbols[currency as keyof typeof currencySymbols] || currency
        return `${symbol} ${amount.toLocaleString()}`
    }

    const hasBudget = budgetMetrics.amount > 0

    return (
        <div className='mt-8'>
            <div className='flex items-center justify-between mb-4'>
                <h2 className='text-2xl font-semibold'>Budget Overview</h2>
                <Button
                    variant='destructive'
                    className="rounded-full font-bold"
                    onClick={() => expenseModalRef.current?.open()}
                >
                    <LuDollarSign className='mr-2' />
                    Add Expense
                </Button>
            </div>
            <div className='bg-gray-100 rounded-lg shadow-md p-4 grid grid-cols-6 gap-4'>
                <div className='col-span-4'>
                    <h3 className='text-3xl font-bold text-green-600'>
                        {formatCurrency(budgetMetrics.amount, budgetMetrics.currency)}
                    </h3>
                    <div className='text-xs text-right mt-1 mb-2'>
                        <span className='text-gray-500'>Budget Used</span>{' '}
                        <span className='font-semibold text-red-600'>
                            {formatCurrency(budgetMetrics.used, budgetMetrics.currency)}
                        </span>{' '}
                        /{' '}
                        <span className='font-semibold'>
                            {formatCurrency(budgetMetrics.amount, budgetMetrics.currency)}
                        </span>
                    </div>
                    <Progress
                        value={budgetMetrics.percentUsed}
                        className={budgetMetrics.percentUsed >= 90 ? '[&>div]:bg-red-500' : ''}
                    />
                    <div className='gap-2 flex mt-2'>
                        <SetBudgetModal mode="update" />
                    </div>
                </div>
                <div className='col-span-2 flex flex-col justify-center items-end'>
                    <div className='text-right'>
                        <div className='text-sm text-gray-500 mb-1'>Remaining</div>
                        <div className='text-2xl font-bold text-blue-600'>
                            {formatCurrency(budgetMetrics.remaining, budgetMetrics.currency)}
                        </div>
                    </div>
                </div>
            </div>
            <ExpenseModal ref={expenseModalRef} />
        </div>
    )
}

export default BudgetBanner