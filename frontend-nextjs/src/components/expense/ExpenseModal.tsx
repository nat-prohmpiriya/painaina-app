'use client'

import React, { useState, useEffect } from 'react'
import { 
    Modal, 
    Form, 
    Input, 
    InputNumber, 
    Select, 
    DatePicker, 
    Button, 
    Divider,
    Avatar,
    Checkbox,
    Space
} from 'antd'
import { LuDollarSign, LuCalendar, LuTag, LuFileText } from 'react-icons/lu'
import { useTripContext } from '@/contexts/TripContext'
import type { TripExpense, ExpenseCategory, SplitType, CreateExpenseData, UpdateExpenseData } from '@/interfaces/expense.interface'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import dayjs from 'dayjs'
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenseQueries'

const { TextArea } = Input
const { Option } = Select

interface ExpenseModalProps {
    open: boolean
    onClose: () => void
    expense?: TripExpense | null
    onSuccess?: () => void
}

const categoryOptions: { value: ExpenseCategory; label: string; color: string }[] = [
    { value: 'accommodation', label: 'Accommodation', color: '#1890ff' },
    { value: 'transportation', label: 'Transportation', color: '#52c41a' },
    { value: 'food', label: 'Food & Drink', color: '#faad14' },
    { value: 'activities', label: 'Activities', color: '#eb2f96' },
    { value: 'shopping', label: 'Shopping', color: '#722ed1' },
    { value: 'other', label: 'Other', color: '#8c8c8c' },
]

const ExpenseModal = ({ open, onClose, expense, onSuccess }: ExpenseModalProps) => {
    const [form] = Form.useForm()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [splitWith, setSplitWith] = useState<string[]>([])
    const [splitType, setSplitType] = useState<SplitType>('equal')
    const { showSuccess, showError } = useToastMessage()
    const { tripData } = useTripContext()

    const createExpense = useCreateExpense()
    const updateExpense = useUpdateExpense()

    const isEditing = !!expense

    // Get trip members for split options
    const tripMembers = React.useMemo(() => {
        if (!tripData || !tripData.owner_id) return []
        const members = [
            { _id: tripData.owner_id || '', name: 'Owner', image: null }
        ]
        return members.filter(m => m.id) // Filter out empty IDs
    }, [tripData])

    useEffect(() => {
        if (open && expense) {
            // Pre-fill form for editing
            form.setFieldsValue({
                amount: expense.amount,
                currency: expense.currency,
                category: expense.category,
                description: expense.description,
                date: dayjs(expense.date),
                split_type: expense.split_type || expense.splitType || 'equal',
            })
            setSplitWith(expense.split_with || expense.splitWith || [])
            setSplitType(expense.split_type || expense.splitType || 'equal')
        } else if (open) {
            // Reset form for new expense
            form.resetFields()
            form.setFieldsValue({
                currency: 'THB',
                date: dayjs(),
                split_type: 'equal',
            })
            setSplitWith([])
            setSplitType('equal')
        }
    }, [open, expense, form])

    const handleSubmit = async (values: any) => {
        if (!tripData) {
            showError('Trip data not found')
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
                percentage: splitType === 'equal' ? 100 / splitWith.length : undefined,
                paid: false,
            }))

            const expenseData = {
                tripId: tripData.id,
                amount: values.amount,
                currency: values.currency,
                category: values.category,
                description: values.description,
                splitWith: splitWith,
                date: values.date.valueOf(),
                splitType: splitType,
                splitDetails: splitDetails,
            }

            if (isEditing && expense) {
                await updateExpense.mutateAsync({
                    tripId: tripData.id,
                    expenseId: expense.id,
                    data: expenseData,
                })
                showSuccess('Expense updated successfully!')
            } else {
                await createExpense.mutateAsync(expenseData)
                showSuccess('Expense added successfully!')
            }

            form.resetFields()
            setSplitWith([])
            setSplitType('equal')
            onClose()
            onSuccess?.()
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
            title={isEditing ? 'Edit Expense' : 'Add New Expense'}
            open={open}
            onCancel={onClose}
            footer={null}
            width={600}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className="mt-6"
            >
                {/* Amount & Currency */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <Form.Item
                            label={<span className="font-semibold">Amount</span>}
                            name="amount"
                            rules={[
                                { required: true, message: 'Please enter amount' },
                                { type: 'number', min: 0.01, message: 'Amount must be greater than 0' }
                            ]}
                        >
                            <InputNumber
                                prefix={<LuDollarSign className="text-gray-400" />}
                                placeholder="0.00"
                                size="large"
                                className="w-full"
                                precision={2}
                            />
                        </Form.Item>
                    </div>
                    <div className="col-span-1">
                        <Form.Item
                            label={<span className="font-semibold">Currency</span>}
                            name="currency"
                            rules={[{ required: true, message: 'Please select currency' }]}
                        >
                            <Select size="large" placeholder="Currency">
                                <Option value="THB">THB (฿)</Option>
                                <Option value="USD">USD ($)</Option>
                                <Option value="EUR">EUR (€)</Option>
                                <Option value="JPY">JPY (¥)</Option>
                            </Select>
                        </Form.Item>
                    </div>
                </div>

                {/* Category & Date */}
                <div className="grid grid-cols-2 gap-4">
                    <Form.Item
                        label={<span className="font-semibold">Category</span>}
                        name="category"
                        rules={[{ required: true, message: 'Please select category' }]}
                    >
                        <Select
                            placeholder="Select category"
                            size="large"
                            suffixIcon={<LuTag className="text-gray-400" />}
                        >
                            {categoryOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
                                        <div 
                                            className="w-3 h-3 rounded-full" 
                                            style={{ backgroundColor: option.color }}
                                        />
                                        {option.label}
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label={<span className="font-semibold">Date</span>}
                        name="date"
                        rules={[{ required: true, message: 'Please select date' }]}
                    >
                        <DatePicker
                            size="large"
                            className="w-full"
                            suffixIcon={<LuCalendar className="text-gray-400" />}
                            format="DD/MM/YYYY"
                        />
                    </Form.Item>
                </div>

                {/* Description */}
                <Form.Item
                    label={<span className="font-semibold">Description</span>}
                    name="description"
                    rules={[
                        { required: true, message: 'Please enter description' },
                        { min: 3, message: 'Description must be at least 3 characters' }
                    ]}
                >
                    <TextArea
                        placeholder="What was this expense for?"
                        rows={3}
                        showCount
                        maxLength={200}
                    />
                </Form.Item>

                <Divider>Split Settings</Divider>

                {/* Split Type */}
                <Form.Item
                    label={<span className="font-semibold">Split Type</span>}
                    name="split_type"
                >
                    <Select
                        value={splitType}
                        onChange={setSplitType}
                        size="large"
                        className="w-full"
                    >
                        <Option value="equal">Split Equally</Option>
                        <Option value="percentage">Split by Percentage</Option>
                        <Option value="exact">Exact Amounts</Option>
                    </Select>
                </Form.Item>

                {/* Split With Members */}
                <div className="space-y-3">
                    <span className="font-semibold">Split with:</span>
                    <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-lg">
                        {tripMembers.map(member => (
                            <div key={member.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar size={32} src={member.image}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <span>{member.name}</span>
                                </div>
                                <Checkbox
                                    checked={splitWith.includes(member.id)}
                                    onChange={(e) => handleMemberToggle(member.id, e.target.checked)}
                                />
                            </div>
                        ))}
                    </div>
                    {splitWith.length > 0 && (
                        <div className="text-sm text-gray-600">
                            Selected: {splitWith.length} member{splitWith.length > 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 justify-end mt-8">
                    <Button
                        shape="round"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        shape="round"
                        type="primary"
                        htmlType="submit"
                        loading={isSubmitting}
                    >
                        {isEditing ? 'Update Expense' : 'Add Expense'}
                    </Button>
                </div>
            </Form>
        </Modal>
    )
}

export default ExpenseModal