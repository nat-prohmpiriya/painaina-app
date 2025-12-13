'use client'

import { Checkbox, CheckboxChangeEvent } from "antd"
import { LuGripVertical } from "react-icons/lu";
import { FiTrash2 } from "react-icons/fi";
import { Todo } from '@/interfaces/itinerary.interface'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useRef, useEffect } from 'react'

interface TodoItemProps {
    todo: Todo
    entryId: string
    onStatusChange: (entryId: string, todoId: string) => void
    onTitleChange: (entryId: string, todoId: string, title: string) => void
    onDelete: (entryId: string, todoId: string) => void
}

const TodoItem = ({ todo, entryId, onStatusChange, onTitleChange, onDelete }: TodoItemProps) => {
    const [localTodo, setLocalTodo] = useState({
        title: todo.title,
        completed: todo.completed
    })
    const [isSaving, setIsSaving] = useState({ title: false, status: false })
    const titleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: todo.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Optimistic update - immediate UI feedback
        setLocalTodo(prev => ({ ...prev, title: value }))
        
        if (titleTimeoutRef.current) {
            clearTimeout(titleTimeoutRef.current)
        }
        
        titleTimeoutRef.current = setTimeout(async () => {
            if (value !== todo.title) {
                setIsSaving(prev => ({ ...prev, title: true }))
                try {
                    await onTitleChange(entryId, todo.id, value)
                } catch (error) {
                    console.error('Failed to update todo title:', error)
                    setLocalTodo(prev => ({ ...prev, title: todo.title }))
                } finally {
                    setIsSaving(prev => ({ ...prev, title: false }))
                }
            }
        }, 2000) // 2 seconds
    }

    const handleStatusChange = async (e: CheckboxChangeEvent) => {
        const checked = e.target.checked
        // Optimistic update - immediate UI feedback
        setLocalTodo(prev => ({ ...prev, completed: checked }))
        
        setIsSaving(prev => ({ ...prev, status: true }))
        try {
            await onStatusChange(entryId, todo.id)
        } catch (error) {
            console.error('Failed to update todo status:', error)
            setLocalTodo(prev => ({ ...prev, completed: todo.completed }))
        } finally {
            setIsSaving(prev => ({ ...prev, status: false }))
        }
    }

    // Sync local state when todo changes from external updates
    useEffect(() => {
        setLocalTodo({
            title: todo.title,
            completed: todo.completed
        })
    }, [todo.title, todo.completed])

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
        }
    }, [])

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 w-full rounded p-1 group/todo transition-colors hover:bg-gray-50 ${isDragging ? 'opacity-50 bg-blue-50' : ''
                }`}
        >
            {/* Drag handle first for better UX */}
            <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing opacity-60 group-hover/todo:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded touch-none"
            >
                <LuGripVertical size={16} />
            </div>
            
            <div className="flex items-center gap-2 flex-1">
                <Checkbox
                    className="text-lg"
                    checked={localTodo.completed}
                    onChange={handleStatusChange}
                    style={{ scale: 1 }}
                    disabled={isSaving.status}
                />
                <div className="relative flex-1">
                    <input
                        className="!border-0 !outline-none focus:!outline-none w-full"
                        value={localTodo.title}
                        onChange={handleTitleChange}
                    />
                    {isSaving.title && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                            Saving...
                        </div>
                    )}
                </div>
            </div>
            
            <div
                className="cursor-pointer text-red-500 hover:bg-red-50 p-1 rounded opacity-0 group-hover/todo:opacity-100 transition-opacity"
                onClick={() => onDelete(entryId, todo.id)}
            >
                <FiTrash2 size={16} />
            </div>
        </div>
    )
}

export default TodoItem