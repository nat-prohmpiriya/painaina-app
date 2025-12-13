'use client'

import { Button, Checkbox } from "antd"
import { LuGripVertical } from "react-icons/lu";
import { FiTrash2 } from "react-icons/fi";
import { NoteEntry as NoteEntryType } from '@/interfaces/itinerary.interface'
import { useTripContext } from '@/contexts/TripContext'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState, useRef, useEffect } from 'react'

interface NoteEntryProps {
    entry: NoteEntryType
}

const NoteEntry = ({ entry }: NoteEntryProps) => {
    const { updateEntry, deleteEntry } = useTripContext()
    const [localEntry, setLocalEntry] = useState({
        title: entry.title,
        description: entry.description || ''
    })
    const [isSaving, setIsSaving] = useState({ title: false, description: false })
    const titleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const descriptionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

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

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

    // Sync local state when entry changes from external updates
    useEffect(() => {
        setLocalEntry({
            title: entry.title,
            description: entry.description || ''
        })
    }, [entry.title, entry.description])

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
            if (descriptionTimeoutRef.current) clearTimeout(descriptionTimeoutRef.current)
        }
    }, [])
    // Content Section Component (reusable for both layouts)
    const ContentSection = () => (
        <div className="bg-gray-100 rounded-lg p-4 flex flex-col min-h-48">
            <div className="relative">
                <input
                    className="!border-0 !outline-none focus:!outline-none text-lg font-semibold w-full bg-transparent"
                    placeholder="Note title"
                    value={localEntry.title}
                    onChange={handleTitleChange}
                />
                {isSaving.title && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                        Saving...
                    </div>
                )}
            </div>
            <div className="relative flex-1">
                <textarea
                    className="min-h-32 !border-0 !outline-none focus:!outline-none w-full resize-none bg-transparent"
                    placeholder="Write your description here..."
                    value={localEntry.description}
                    onChange={handleNotesChange}
                />
                {isSaving.description && (
                    <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                        Saving...
                    </div>
                )}
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
                            size="small"
                            shape="circle"
                            icon={<LuGripVertical className="text-lg cursor-grab active:cursor-grabbing text-gray-400" />}
                            type="text"
                        />
                        <Button
                            size="small"
                            shape="circle"
                            icon={<FiTrash2 className="text-base" />}
                            type="text"
                            onClick={handleDelete}
                            className="text-red-500 hover:bg-red-50"
                        />
                    </div>
                    {/* Content */}
                    <div className="flex-1">
                        <ContentSection />
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-17 gap-2 p-2">
                <div className="col-span-2 flex items-start">
                    <Button
                        {...attributes}
                        {...listeners}
                        size="large"
                        shape="circle"
                        icon={<LuGripVertical className="text-lg cursor-grab active:cursor-grabbing" />}
                        type="text"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <Button size="large" shape="circle" type="text" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Checkbox style={{ scale: 1.3 }} />
                    </Button>
                </div>
                <div className="col-span-14">
                    <ContentSection />
                </div>
                <div className="col-span-1">
                    <Button
                        size="large"
                        shape="circle"
                        icon={<FiTrash2 className="text-lg" />}
                        type="text"
                        onClick={handleDelete}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-50"
                    />
                </div>
            </div>
        </div>
    )
}

export default NoteEntry