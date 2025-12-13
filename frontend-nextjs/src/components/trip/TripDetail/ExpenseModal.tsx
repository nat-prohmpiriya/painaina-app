'use client'

import { Button, Input, Modal, Select, Checkbox, Avatar, InputNumber, DatePicker, Form } from "antd"
import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { useTripContext } from '@/contexts/TripContext'
import type { TripExpense, ExpenseCategory } from '@/interfaces/expense.interface'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import dayjs from 'dayjs'
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenseQueries'
import {
    LuUtensilsCrossed,
    LuCar,
    LuBed,
    LuShoppingBag,
    LuMapPin,
    LuDollarSign
} from "react-icons/lu"

export interface ExpenseModalRef {
    open: (expense?: TripExpense | null) => void
    close: () => void
}

interface ExpenseModalProps {
    onSuccess?: () => void
    entryId?: string
    onExpenseUpdated?: () => void
}

const ExpenseModal = forwardRef<ExpenseModalRef, ExpenseModalProps>((props, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [form] = Form.useForm()
    const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | null>(null)
    const [splitWith, setSplitWith] = useState<string[]>([])
    const [currentExpense, setCurrentExpense] = useState<TripExpense | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { showSuccess, showError } = useToastMessage()
    const { tripData, members: tripMembers } = useTripContext()
    const createExpense = useCreateExpense()
    const updateExpense = useUpdateExpense()

    useImperativeHandle(ref, () => ({
        open: (expense?: TripExpense | null) => {
            setCurrentExpense(expense || null)
            setIsOpen(true)
        },
        close: () => setIsOpen(false)
    }))

    useEffect(() => {
        if (isOpen && currentExpense) {
            // Edit mode - populate form
            form.setFieldsValue({
                amount: currentExpense.amount,
                currency: currentExpense.currency,
                description: currentExpense.description,
                date: dayjs(currentExpense.date),
                paidBy: currentExpense.paidBy
            })
            setSelectedCategory(currentExpense.category)
            setSplitWith(currentExpense.splitWith || currentExpense.splitWith || [])
        } else if (isOpen) {
            // Add mode - reset form
            form.resetFields()
            form.setFieldsValue({
                currency: 'THB',
                date: dayjs(),
                paidBy: tripData?.ownerId || ''
            })
            setSelectedCategory(null)
            setSplitWith([])
        }
    }, [isOpen, currentExpense, form])

    const handleClose = () => {
        setIsOpen(false)
        setCurrentExpense(null)
        setSelectedCategory(null)
        setSplitWith([])
        form.resetFields()
    }

    const categories = [
        { value: 'food' as ExpenseCategory, icon: <LuUtensilsCrossed size={20} className="text-gray-500 mt-3" />, label: 'Food & Dining' },
        { value: 'transportation' as ExpenseCategory, icon: <LuCar size={20} className="text-gray-500 mt-3" />, label: 'Transportation' },
        { value: 'accommodation' as ExpenseCategory, icon: <LuBed size={20} className="text-gray-500 mt-3" />, label: 'Accommodation' },
        { value: 'activities' as ExpenseCategory, icon: <LuMapPin size={20} className="text-gray-500 mt-3" />, label: 'Activities' },
        { value: 'shopping' as ExpenseCategory, icon: <LuShoppingBag size={20} className="text-gray-500 mt-3" />, label: 'Shopping' },
        { value: 'other' as ExpenseCategory, icon: <LuDollarSign size={20} className="text-gray-500 mt-3" />, label: 'Others' },
    ]

    const handleSubmit = async (values: any) => {
        if (!tripData) {
            showError('Trip data not found')
            return
        }

        if (!selectedCategory) {
            showError('Please select a category')
            return
        }

        if (splitWith.length === 0) {
            showError('Please select who to split this expense with')
            return
        }

        setIsSubmitting(true)
        try {
            const splitAmount = values.amount / splitWith.length
            const splitDetails = splitWith.map(userId => ({
                userId: userId,
                amount: splitAmount,
                percentage: 100 / splitWith.length,
                paid: false,
            }))

            const expenseData = {
                tripId: tripData.id,
                amount: values.amount,
                currency: values.currency,
                category: selectedCategory,
                description: values.description || '',
                paidBy: tripMembers.find(m => m.role === 'owner')?.userId || tripData.ownerId,
                splitWith: splitWith,
                date: values.date.toISOString(),
                splitType: 'equal' as const,
                splitDetails: splitDetails,
            }

            if (currentExpense) {
                const tripId = currentExpense.tripId || tripData?.id;
                if (!tripId) {
                    showError('Trip ID is missing');
                    return;
                }

                await updateExpense.mutateAsync({
                    tripId,
                    expenseId: currentExpense.id,
                    data: expenseData,
                })
                showSuccess('Expense updated successfully!')
            } else {
                await createExpense.mutateAsync({
                    ...expenseData,
                    entryId: props.entryId
                })
                showSuccess('Expense added successfully!')
            }

            handleClose()
            props.onSuccess?.()
            props.onExpenseUpdated?.()
        } catch (error) {
            console.error('Error saving expense:', error)
            showError('Failed to save expense')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleMemberToggle = (userId: string, checked: boolean) => {
        if (checked) {
            setSplitWith(prev => [...prev, userId])
        } else {
            setSplitWith(prev => prev.filter(id => id !== userId))
        }
    }
    return (
        <Modal
            title={
                <h2 className="text-xl font-semibold mb-4">
                    {currentExpense ? 'Edit Expense' : 'Add Expense'}
                </h2>
            }
            open={isOpen}
            onCancel={handleClose}
            style={{ top: 10 }}
            footer={[
                <Button key="cancel" onClick={handleClose} disabled={isSubmitting}>
                    Cancel
                </Button>,
                <Button
                    key="save"
                    type="primary"
                    onClick={() => form.submit()}
                    loading={isSubmitting}
                >
                    {currentExpense ? 'Update' : 'Save'}
                </Button>
            ]}
            destroyOnHidden
        >
            <Form
                form={form}
                onFinish={handleSubmit}
                layout="vertical"
                className="mt-4"
            >
                {/* Amount Input */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="col-span-2">
                        <Form.Item
                            name="amount"
                            rules={[
                                { required: true, message: 'Please enter amount' },
                                { type: 'number', min: 0.01, message: 'Amount must be greater than 0' }
                            ]}
                        >
                            <InputNumber
                                size="large"
                                placeholder="Expense Amount"
                                style={{ width: '100%' }}
                                precision={2}
                            />
                        </Form.Item>
                    </div>
                    <div className="col-span-1">
                        <Form.Item
                            name="currency"
                            rules={[{ required: true, message: 'Please select currency' }]}
                        >
                            <Select size="large" placeholder="Currency">
                                <Select.Option value="THB">THB (฿)</Select.Option>
                                <Select.Option value="USD">USD ($)</Select.Option>
                                <Select.Option value="EUR">EUR (€)</Select.Option>
                                <Select.Option value="JPY">JPY (¥)</Select.Option>
                            </Select>
                        </Form.Item>
                    </div>
                </div>

                {/* Category Selection */}
                <div className="grid grid-cols-3 gap-2 my-6">
                    {categories.map((category) => (
                        <div
                            key={category.value}
                            className={`flex flex-col justify-center items-center p-3 rounded-lg cursor-pointer transition duration-300 ${selectedCategory === category.value
                                ? 'bg-blue-100 border-2 border-blue-500'
                                : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            onClick={() => setSelectedCategory(category.value)}
                        >
                            <div className="">{category.icon}</div>
                            <span className="text-xs font-semibold text-gray-500 my-2 text-center">
                                {category.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Date Selection */}
                <div className="mb-4">
                    <Form.Item
                        name="date"
                        rules={[{ required: true, message: 'Please select date' }]}
                    >
                        <DatePicker
                            size="large"
                            className="w-full"
                            format="DD/MM/YYYY"
                            placeholder="Select date"
                        />
                    </Form.Item>
                </div>

                {/* Description */}
                <div className="mb-4">
                    <Form.Item
                        name="description"
                        rules={[{ required: true, message: 'Please enter description' }]}
                    >
                        <Input.TextArea
                            size="large"
                            placeholder="Expense Description"
                            rows={2}
                            className="w-full"
                        />
                    </Form.Item>
                </div>

                {/* Split Section */}
                <div className="p-3 border rounded-lg flex flex-col gap-2 overflow-y-auto max-h-48 [&::-webkit-scrollbar]:hidden scrollbar-width-none">
                    <span className="font-semibold text-sm mb-2">Split with:</span>
                    {tripMembers.map(member => (
                        <Checkbox
                            key={member.userId}
                            className="mt-2 flex items-center"
                            checked={splitWith.includes(member.userId)}
                            onChange={(e) => handleMemberToggle(member.userId, e.target.checked)}
                        >
                            <Avatar src={member.user.photoUrl} shape='circle'>
                                {member?.user?.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <span className="ml-2">{member?.user?.name} ({member?.role})</span>
                        </Checkbox>
                    ))}
                    {splitWith.length > 0 && (
                        <div className="text-sm text-gray-600 mt-2">
                            Selected: {splitWith.length} member{splitWith.length > 1 ? 's' : ''}
                        </div>
                    )}
                </div>
            </Form>
        </Modal>
    )
})

ExpenseModal.displayName = 'ExpenseModal'

export default ExpenseModal
