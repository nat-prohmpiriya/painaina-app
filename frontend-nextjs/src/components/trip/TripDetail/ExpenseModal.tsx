'use client'

import React, { useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { useTripContext } from '@/contexts/TripContext'
import type { TripExpense, ExpenseCategory } from '@/interfaces/expense.interface'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { format } from 'date-fns'
import { useCreateExpense, useUpdateExpense } from '@/hooks/useExpenseQueries'
import {
    LuUtensilsCrossed,
    LuCar,
    LuBed,
    LuShoppingBag,
    LuMapPin,
    LuDollarSign,
    LuCalendar
} from "react-icons/lu"
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
import { cn } from '@/lib/utils'

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
    const [formData, setFormData] = useState({
        amount: '',
        currency: 'THB',
        description: ''
    })
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
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
            setFormData({
                amount: currentExpense.amount.toString(),
                currency: currentExpense.currency,
                description: currentExpense.description
            })
            setSelectedDate(new Date(currentExpense.date))
            setSelectedCategory(currentExpense.category)
            setSplitWith(currentExpense.splitWith || currentExpense.splitWith || [])
        } else if (isOpen) {
            // Add mode - reset form
            setFormData({
                amount: '',
                currency: 'THB',
                description: ''
            })
            setSelectedDate(new Date())
            setSelectedCategory(null)
            setSplitWith([])
        }
    }, [isOpen, currentExpense])

    const handleClose = () => {
        setIsOpen(false)
        setCurrentExpense(null)
        setSelectedCategory(null)
        setSplitWith([])
        setFormData({
            amount: '',
            currency: 'THB',
            description: ''
        })
        setSelectedDate(new Date())
    }

    const categories = [
        { value: 'food' as ExpenseCategory, icon: LuUtensilsCrossed, label: 'Food & Dining' },
        { value: 'transportation' as ExpenseCategory, icon: LuCar, label: 'Transportation' },
        { value: 'accommodation' as ExpenseCategory, icon: LuBed, label: 'Accommodation' },
        { value: 'activities' as ExpenseCategory, icon: LuMapPin, label: 'Activities' },
        { value: 'shopping' as ExpenseCategory, icon: LuShoppingBag, label: 'Shopping' },
        { value: 'other' as ExpenseCategory, icon: LuDollarSign, label: 'Others' },
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

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
                percentage: 100 / splitWith.length,
                paid: false,
            }))

            const expenseData = {
                tripId: tripData.id,
                amount: amount,
                currency: formData.currency,
                category: selectedCategory,
                description: formData.description || '',
                paidBy: tripMembers.find(m => m.role === 'owner')?.userId || tripData.ownerId,
                splitWith: splitWith,
                date: selectedDate.toISOString(),
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
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {currentExpense ? 'Edit Expense' : 'Add Expense'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Amount Input */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-2">
                            <Label htmlFor="amount">
                                Expense Amount <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="col-span-1 space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select
                                value={formData.currency}
                                onValueChange={(value) => setFormData({ ...formData, currency: value })}
                            >
                                <SelectTrigger id="currency">
                                    <SelectValue />
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

                    {/* Category Selection */}
                    <div className="space-y-2">
                        <Label>Category <span className="text-red-500">*</span></Label>
                        <div className="grid grid-cols-3 gap-2">
                            {categories.map((category) => {
                                const Icon = category.icon
                                return (
                                    <div
                                        key={category.value}
                                        className={cn(
                                            "flex flex-col justify-center items-center p-3 rounded-lg cursor-pointer transition duration-300",
                                            selectedCategory === category.value
                                                ? 'bg-blue-100 border-2 border-blue-500'
                                                : 'bg-gray-100 hover:bg-gray-200'
                                        )}
                                        onClick={() => setSelectedCategory(category.value)}
                                    >
                                        <Icon size={20} className="text-gray-500 mt-3" />
                                        <span className="text-xs font-semibold text-gray-500 my-2 text-center">
                                            {category.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-2">
                        <Label>Date <span className="text-red-500">*</span></Label>
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

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Expense Description <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="What was this expense for?"
                            rows={2}
                            required
                        />
                    </div>

                    {/* Split Section */}
                    <div className="space-y-2">
                        <Label>Split with <span className="text-red-500">*</span></Label>
                        <div className="p-3 border rounded-lg space-y-2 max-h-48 overflow-y-auto">
                            {tripMembers.map(member => (
                                <div key={member.userId} className="flex items-center space-x-3">
                                    <Checkbox
                                        id={`member-${member.userId}`}
                                        checked={splitWith.includes(member.userId)}
                                        onCheckedChange={(checked) => handleMemberToggle(member.userId, checked === true)}
                                    />
                                    <label
                                        htmlFor={`member-${member.userId}`}
                                        className="flex items-center gap-2 cursor-pointer flex-1"
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.user.photoUrl} />
                                            <AvatarFallback>
                                                {member?.user?.name?.charAt(0).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>{member?.user?.name} ({member?.role})</span>
                                    </label>
                                </div>
                            ))}
                            {splitWith.length > 0 && (
                                <div className="text-sm text-gray-600 mt-2 pt-2 border-t">
                                    Selected: {splitWith.length} member{splitWith.length > 1 ? 's' : ''}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="rounded-full px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="rounded-full px-6"
                        >
                            {isSubmitting ? 'Saving...' : (currentExpense ? 'Update' : 'Save')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
})

ExpenseModal.displayName = 'ExpenseModal'

export default ExpenseModal
