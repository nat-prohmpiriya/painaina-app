'use client'

import React, { useState, useEffect } from 'react'
import { LuDollarSign, LuCalendar, LuTag } from 'react-icons/lu'
import { useTripContext } from '@/contexts/TripContext'
import type { TripExpense, ExpenseCategory, SplitType } from '@/interfaces/expense.interface'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { format } from 'date-fns'
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenseQueries'
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

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
    const [formData, setFormData] = useState({
        amount: '',
        currency: 'THB',
        category: '' as ExpenseCategory | '',
        description: ''
    })
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
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
        return members.filter(m => m._id) // Filter out empty IDs
    }, [tripData])

    useEffect(() => {
        if (open && expense) {
            // Pre-fill form for editing
            setFormData({
                amount: expense.amount.toString(),
                currency: expense.currency,
                category: expense.category,
                description: expense.description
            })
            setSelectedDate(new Date(expense.date))
            setSplitWith(expense.split_with || expense.splitWith || [])
            setSplitType(expense.split_type || expense.splitType || 'equal')
        } else if (open) {
            // Reset form for new expense
            setFormData({
                amount: '',
                currency: 'THB',
                category: '',
                description: ''
            })
            setSelectedDate(new Date())
            setSplitWith([])
            setSplitType('equal')
        }
    }, [open, expense])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!tripData) {
            showError('Trip data not found')
            return
        }

        if (!formData.category) {
            showError('Please select a category')
            return
        }

        if (splitWith.length === 0) {
            showError('Please select who to split this expense with')
            return
        }

        const amount = parseFloat(formData.amount)
        if (isNaN(amount) || amount <= 0) {
            showError('Please enter a valid amount')
            return
        }

        setIsSubmitting(true)
        try {
            const splitAmount = amount / splitWith.length
            const splitDetails = splitWith.map(userId => ({
                userId: userId,
                amount: splitAmount,
                percentage: splitType === 'equal' ? 100 / splitWith.length : undefined,
                paid: false,
            }))

            const expenseData = {
                tripId: tripData.id,
                amount: amount,
                currency: formData.currency,
                category: formData.category,
                description: formData.description,
                splitWith: splitWith,
                date: selectedDate.valueOf(),
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

            setFormData({
                amount: '',
                currency: 'THB',
                category: '',
                description: ''
            })
            setSplitWith([])
            setSplitType('equal')
            setSelectedDate(new Date())
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
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* Amount & Currency */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="amount" className="font-semibold">
                                Amount <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative">
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="pl-10"
                                    required
                                />
                                <LuDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </div>
                        <div className="col-span-1 space-y-2">
                            <Label htmlFor="currency" className="font-semibold">Currency</Label>
                            <Select
                                value={formData.currency}
                                onValueChange={(value) => setFormData({ ...formData, currency: value })}
                            >
                                <SelectTrigger id="currency">
                                    <SelectValue placeholder="Currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="THB">THB (฿)</SelectItem>
                                    <SelectItem value="USD">USD ($)</SelectItem>
                                    <SelectItem value="EUR">EUR (€)</SelectItem>
                                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Category & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category" className="font-semibold">
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value: ExpenseCategory) => setFormData({ ...formData, category: value })}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: option.color }}
                                                />
                                                {option.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold">
                                Date <span className="text-red-500">*</span>
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !selectedDate && "text-muted-foreground"
                                        )}
                                    >
                                        <LuCalendar className="mr-2 h-4 w-4" />
                                        {selectedDate ? format(selectedDate, "dd/MM/yyyy") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => date && setSelectedDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="font-semibold">
                            Description <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What was this expense for?"
                            rows={3}
                            maxLength={200}
                            required
                        />
                        <p className="text-xs text-gray-500 text-right">
                            {formData.description.length}/200
                        </p>
                    </div>

                    <Separator />

                    {/* Split Type */}
                    <div className="space-y-2">
                        <Label htmlFor="splitType" className="font-semibold">Split Type</Label>
                        <Select
                            value={splitType}
                            onValueChange={(value: SplitType) => setSplitType(value)}
                        >
                            <SelectTrigger id="splitType">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="equal">Split Equally</SelectItem>
                                <SelectItem value="percentage">Split by Percentage</SelectItem>
                                <SelectItem value="exact">Exact Amounts</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Split With Members */}
                    <div className="space-y-3">
                        <Label className="font-semibold">
                            Split with <span className="text-red-500">*</span>
                        </Label>
                        <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-gray-50 rounded-lg">
                            {tripMembers.map(member => (
                                <div key={member._id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.image || undefined} />
                                            <AvatarFallback>
                                                {member.name.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{member.name}</span>
                                    </div>
                                    <Checkbox
                                        checked={splitWith.includes(member._id)}
                                        onCheckedChange={(checked) => handleMemberToggle(member._id, checked === true)}
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
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Expense' : 'Add Expense')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default ExpenseModal
