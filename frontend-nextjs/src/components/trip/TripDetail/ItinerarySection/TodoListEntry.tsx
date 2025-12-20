'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { LuGripVertical } from "react-icons/lu";
import { FiTrash2 } from "react-icons/fi";
import { TodoListEntry as TodoListEntryType } from '@/interfaces/itinerary.interface'
import { useTripContext } from '@/contexts/TripContext'
import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import TodoItem from './TodoItem'
import { CSS } from '@dnd-kit/utilities'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
    restrictToVerticalAxis,
} from '@dnd-kit/modifiers'
import { useTranslations } from 'next-intl'

interface TodoListEntryProps {
    entry: TodoListEntryType
}

const TodoListEntry = ({ entry }: TodoListEntryProps) => {
    const { updateEntry, deleteEntry, addTodo, updateTodoStatus, updateTodoTitle, deleteTodo, reorderTodos } = useTripContext()
    const [newTodoText, setNewTodoText] = useState('')
    const [localEntry, setLocalEntry] = useState({
        title: entry.title,
        description: entry.description || ''
    })
    const [optimisticTodos, setOptimisticTodos] = useState<typeof entry.todos | null>(null)
    const [isSaving, setIsSaving] = useState({ title: false, description: false })
    const titleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const descriptionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const t = useTranslations('tripDetail.itinerary')

    // Use optimistic todos if available, otherwise use actual todos
    const displayTodos = optimisticTodos || entry.todos

    // Entry-level sortable
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: entry.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    // Todo drag and drop sensors
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        // Optimistic update - immediate UI feedback
        setLocalEntry(prev => ({ ...prev, title: value }))

        if (titleTimeoutRef.current) {
            clearTimeout(titleTimeoutRef.current)
        }

        titleTimeoutRef.current = setTimeout(async () => {
            if (value !== entry.title) {
                setIsSaving(prev => ({ ...prev, title: true }))
                try {
                    await updateEntry(entry.id, { title: value })
                } catch (error) {
                    console.error('Failed to update title:', error)
                    setLocalEntry(prev => ({ ...prev, title: entry.title }))
                } finally {
                    setIsSaving(prev => ({ ...prev, title: false }))
                }
            }
        }, 2000) // 2 seconds
    }

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value
        // Optimistic update - immediate UI feedback
        setLocalEntry(prev => ({ ...prev, description: value }))

        if (descriptionTimeoutRef.current) {
            clearTimeout(descriptionTimeoutRef.current)
        }

        descriptionTimeoutRef.current = setTimeout(async () => {
            if (value !== entry.description) {
                setIsSaving(prev => ({ ...prev, description: true }))
                try {
                    await updateEntry(entry.id, { description: value })
                } catch (error) {
                    console.error('Failed to update description:', error)
                    setLocalEntry(prev => ({ ...prev, description: entry.description || '' }))
                } finally {
                    setIsSaving(prev => ({ ...prev, description: false }))
                }
            }
        }, 2000) // 2 seconds
    }

    const handleDelete = () => {
        deleteEntry(entry.id)
    }

    const handleAddTodo = () => {
        if (newTodoText.trim()) {
            const order = entry.todos?.length || 0
            addTodo(entry.id, newTodoText.trim(), order)
            setNewTodoText('')
        }
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddTodo()
        }
    }
    const handleTodoDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (!over || active.id === over.id) {
            return
        }

        if (entry.todos) {
            const oldIndex = entry.todos.findIndex(todo => todo.id === active.id)
            const newIndex = entry.todos.findIndex(todo => todo.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                // Optimistic update: immediately show new order
                const newTodos = arrayMove(entry.todos, oldIndex, newIndex)
                setOptimisticTodos(newTodos)

                try {
                    await reorderTodos(entry.id, newTodos.map(t => t.id))
                    // Don't clear optimistic state immediately - wait for context to update
                } catch (error) {
                    console.error('Failed to reorder todos:', error)
                    // Revert optimistic update on error
                    setOptimisticTodos(null)
                }
            }
        }
    }

    // Sync local state when entry changes from external updates
    useEffect(() => {
        setLocalEntry({
            title: entry.title,
            description: entry.description || ''
        })
    }, [entry.title, entry.description])

    // Clear optimistic todos when entry.todos changes (context updated)
    useEffect(() => {
        if (optimisticTodos) {
            setOptimisticTodos(null)
        }
    }, [entry.todos])

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
            if (descriptionTimeoutRef.current) clearTimeout(descriptionTimeoutRef.current)
        }
    }, [])

    // Content Section Component (reusable for both layouts)
    const ContentSection = () => (
        <div className="bg-gray-100 p-2 rounded-lg flex flex-col gap-2">
            <div className="relative">
                <input
                    className="p-1 !border-0 !outline-none focus:!outline-none text-lg font-semibold w-full bg-transparent"
                    placeholder="Todo List name"
                    value={localEntry.title}
                    onChange={handleTitleChange}
                />
                {isSaving.title && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        Saving...
                    </div>
                )}
            </div>

            {/* Existing todos */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleTodoDragEnd}
                modifiers={[restrictToVerticalAxis]}
            >
                <SortableContext
                    items={displayTodos?.map(t => t.id) || []}
                    strategy={verticalListSortingStrategy}
                >
                    {displayTodos?.map((todo) => (
                        <TodoItem
                            key={todo.id}
                            todo={todo}
                            entryId={entry.id}
                            onStatusChange={updateTodoStatus}
                            onTitleChange={updateTodoTitle}
                            onDelete={deleteTodo}
                        />
                    ))}
                </SortableContext>
            </DndContext>

            {/* Add new todo */}
            <div className="flex items-center gap-2 w-full">
                <div className="flex items-center gap-2 flex-1">
                    <Checkbox disabled className="text-lg" />
                    <input
                        className="!border-0 !outline-none focus:!outline-none p-1 w-full bg-transparent"
                        placeholder="Add new todo item..."
                        value={newTodoText}
                        onChange={(e) => setNewTodoText(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                </div>
            </div>
            <div className="border-t">
                <Button
                    className="mt-1"
                    variant="ghost"
                    size="sm"
                    onClick={handleAddTodo}
                >
                    <span className="text-xs font-semibold">{t('addTodo')}</span>
                </Button>
            </div>
        </div>
    )

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`transition-opacity group ${isDragging ? 'opacity-50' : ''}`}
        >
            {/* Mobile Layout */}
            <div className="lg:hidden p-2">
                <div className="flex gap-2">
                    {/* Drag handle + Delete - always visible on mobile */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                        <Button
                            {...attributes}
                            {...listeners}
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-full"
                        >
                            <LuGripVertical className="text-lg cursor-grab active:cursor-grabbing text-gray-400" />
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleDelete}
                            className="h-8 w-8 p-0 rounded-full text-red-500 hover:bg-red-50 hover:text-red-500"
                        >
                            <FiTrash2 className="text-base" />
                        </Button>
                    </div>
                    {/* Content */}
                    <div className="flex-1">
                        <ContentSection />
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-17 gap-2 p-2">
                <div className="col-span-2 flex items-start justify-start">
                    <Button
                        {...attributes}
                        {...listeners}
                        size="lg"
                        variant="ghost"
                        className="h-10 w-10 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <LuGripVertical className="text-lg cursor-grab active:cursor-grabbing" />
                    </Button>
                    <div className="h-10 w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Checkbox className="scale-120" />
                    </div>
                </div>
                <div className="col-span-14">
                    <ContentSection />
                </div>
                <div className="col-span-1">
                    <Button
                        size="lg"
                        variant="ghost"
                        onClick={handleDelete}
                        className="h-10 w-10 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50 hover:text-red-500"
                    >
                        <FiTrash2 className="text-lg" />
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default TodoListEntry