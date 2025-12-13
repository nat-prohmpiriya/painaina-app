'use client'

import { Avatar, Button, Dropdown } from "antd"
import ExpenseModal, { ExpenseModalRef } from "./ExpenseModal"
import { imgUrl } from "@/lib/imgUrl"
import {
    LuUtensilsCrossed,
    LuCar,
    LuBed,
    LuMapPin,
    LuShoppingBag,
    LuDollarSign,
    LuEllipsis,
    LuPencil,
    LuTrash
} from "react-icons/lu"
import React, { useRef } from "react"
import type { TripExpense } from "@/interfaces/expense.interface"
import type { MenuProps } from "antd"
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { useDeleteExpense } from '@/hooks/useExpenseQueries'

interface ExpenseCardProps {
    expense: TripExpense
    onSuccess?: () => void
}

const ExpenseCard = ({ expense, onSuccess }: ExpenseCardProps) => {
    const modalRef = useRef<ExpenseModalRef>(null)
    const { showSuccess, showError } = useToastMessage()
    const deleteExpense = useDeleteExpense()

    // Handle case where expense or expense.category is undefined
    if (!expense || !expense.category) {
        return null
    }

    const categoryIcons = {
        food: <LuUtensilsCrossed className="text-lg" />,
        transportation: <LuCar className="text-lg" />,
        accommodation: <LuBed className="text-lg" />,
        activities: <LuMapPin className="text-lg" />,
        shopping: <LuShoppingBag className="text-lg" />,
        other: <LuDollarSign className="text-lg" />
    }

    const categoryColors = {
        food: 'bg-orange-100 text-orange-600',
        transportation: 'bg-green-100 text-green-600',
        accommodation: 'bg-blue-100 text-blue-600',
        activities: 'bg-pink-100 text-pink-600',
        shopping: 'bg-purple-100 text-purple-600',
        other: 'bg-gray-100 text-gray-600'
    }

    const categoryLabels = {
        food: 'Food & Dining',
        transportation: 'Transportation',
        accommodation: 'Accommodation',
        activities: 'Activities',
        shopping: 'Shopping',
        other: 'Others'
    }

    const handleEdit = () => {
        modalRef.current?.open(expense)
    }

    const handleDelete = async () => {
        const tripId = expense.tripId;
        if (!tripId) {
            showError('Trip ID is missing');
            return;
        }

        try {
            await deleteExpense.mutateAsync({ tripId, expenseId: expense.id })
            showSuccess('Expense deleted successfully!')
            onSuccess?.()
        } catch (error) {
            console.error('Error deleting expense:', error)
            showError('Failed to delete expense')
        }
    }

    const formatDate = (date: string | number) => {
        return new Date(date).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const formatCurrency = (amount: number, currency: string) => {
        const symbols = {
            THB: '฿',
            USD: '$',
            EUR: '€',
            JPY: '¥'
        }
        return `${symbols[currency as keyof typeof symbols] || currency} ${amount.toLocaleString()}`
    }

    const dropdownItems: MenuProps['items'] = [
        {
            key: 'edit',
            label: 'Edit Expense',
            icon: <LuPencil />,
            onClick: (e) => {
                e.domEvent.stopPropagation()
                handleEdit()
            },
        },
        {
            key: 'delete',
            label: 'Delete Expense',
            icon: <LuTrash />,
            onClick: (e) => {
                e.domEvent.stopPropagation()
                handleDelete()
            },
            danger: true,
        },
    ]

    return (
        <>
            <div
                className='border shadow p-4 rounded-lg mt-4 h-32 flex justify-between items-start hover:shadow-md hover:cursor-pointer transition-shadow duration-200 cursor-pointer'
                onClick={handleEdit}
            >
                <div className='flex gap-4'>
                    <Button
                        size="large"
                        icon={categoryIcons[expense.category]}
                        shape='circle'
                        type='dashed'
                        className={`${categoryColors[expense.category]} border-0`}
                    />
                    <div className='flex flex-col gap-1'>
                        <h3 className='text-lg font-semibold'>{categoryLabels[expense.category]}</h3>
                        <p className='text-gray-500 line-clamp-1'>{expense.description}</p>
                        <p className='text-gray-500 text-sm'>{formatDate(expense.date)}</p>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${expense.status === 'settled'
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-yellow-100 text-yellow-600'
                                }`}>
                                {expense.status === 'settled' ? 'Settled' : 'Pending'}
                            </span>
                            {expense.splitWith?.length && expense.splitWith.length > 1 && (
                                <span className="text-xs text-gray-500">
                                    Split {expense.splitWith.length} ways
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className='flex flex-col justify-between items-end h-full'>
                    <div className="flex items-center gap-2">
                        <Dropdown
                            menu={{ items: dropdownItems }}
                            trigger={['click']}
                        >
                            <Button
                                size="small"
                                icon={<LuEllipsis />}
                                type="text"
                                className="hover:bg-gray-100"
                                onClick={(e) => e.stopPropagation()}
                            />
                        </Dropdown>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className='text-lg font-semibold mb-2'>
                            {formatCurrency(expense.amount, expense.currency)}
                        </span>
                        <Avatar
                            src={imgUrl}
                            shape='circle'
                            size={32}
                        >
                            U
                        </Avatar>
                    </div>
                </div>
            </div>
            <ExpenseModal ref={modalRef} onSuccess={onSuccess} />
        </>
    )
}

export default ExpenseCard