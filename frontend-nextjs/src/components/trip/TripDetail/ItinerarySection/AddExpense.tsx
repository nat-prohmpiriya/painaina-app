'use client'

import { Button } from "antd";
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
                icon={<LuCircleDollarSign />}
                shape="round"
                size="small"
                type={hasExpenses ? "default" : "primary"}
                className={hasExpenses ? "bg-green-50 border-green-200 text-green-700" : ""}
                onClick={handleOpenModal}
            >
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