'use client'

import { Button } from '@/components/ui/button';
import { LuCircleDollarSign } from "react-icons/lu";
import { useRef } from "react";
import ExpenseModal, { ExpenseModalRef } from "../ExpenseModal";

interface AddExpenseProps {
    entryId: string
    hasExpenses?: boolean
    totalAmount?: number
    onExpenseUpdate?: () => void
}

const AddExpense = ({ entryId, hasExpenses, totalAmount, onExpenseUpdate }: AddExpenseProps) => {
    const expenseModalRef = useRef<ExpenseModalRef>(null);

    const handleOpenModal = () => {
        expenseModalRef.current?.open()
    };

    const handleExpenseUpdated = () => {
        if (onExpenseUpdate) {
            onExpenseUpdate()
        }
    };

    const displayText = hasExpenses && totalAmount 
        ? `฿${totalAmount.toLocaleString()}` 
        : 'Add Expense';

    return (
        <>
            <Button
                variant={hasExpenses ? "outline" : "default"}
                size="sm"
                className={`rounded-full h-7 px-2.5 ${hasExpenses ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-700" : ""}`}
                onClick={handleOpenModal}
            >
                <LuCircleDollarSign className="size-3.5" />
                <span className="font-bold text-xs">{displayText}</span>
            </Button>
            <ExpenseModal
                ref={expenseModalRef}
                entryId={entryId}
                onExpenseUpdated={handleExpenseUpdated}
            />
        </>
    )
}

export default AddExpense