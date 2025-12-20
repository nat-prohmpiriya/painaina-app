'use client'

import React from 'react'
import CreateEntry from './CreateEntry'
import PlaceEntry from './PlaceEntry'
import NoteEntry from './NoteEntry'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import TodoListEntry from './TodoListEntry'
import { LuChevronRight, LuPencilLine, LuEllipsisVertical } from "react-icons/lu";
import { isPlaceEntry, isNoteEntry, isTodoListEntry } from '@/interfaces/itinerary.interface'
import { useTripContext } from '@/contexts/TripContext'
import type { ItineraryWithEntries } from '@/interfaces/trip.interface'

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
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
    restrictToParentElement,
} from '@dnd-kit/modifiers'

interface ItineraryItemProps {
    day: ItineraryWithEntries
    isGuidePage?: boolean
}

const ItineraryItem = ({ day, isGuidePage = false }: ItineraryItemProps) => {
    const [isCollapsed, setIsCollapsed] = React.useState(false)
    const [dayTitle, setDayTitle] = React.useState(day.title)
    const [optimisticEntries, setOptimisticEntries] = React.useState<typeof day.entries | null>(null)
    const { updateEntry, reorderEntries, insertDayAfter, deleteDay } = useTripContext()

    // Use optimistic entries if available, otherwise use actual entries
    const displayEntries = optimisticEntries || day.entries

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDayTitle(e.target.value)
    }

    const handleTitleBlur = async () => {
        if (dayTitle.trim() !== day.title && dayTitle.trim()) {
            // Note: We need to add updateDay function to context for this
            // For now, keeping the local state
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (!over || active.id === over.id) {
            return
        }

        if (day.entries) {
            const oldIndex = day.entries.findIndex(entry => entry.id === active.id)
            const newIndex = day.entries.findIndex(entry => entry.id === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                // Optimistic update: immediately show new order
                const newEntries = arrayMove(day.entries, oldIndex, newIndex)
                setOptimisticEntries(newEntries)

                try {
                    await reorderEntries(newEntries.map(e => e.id))
                    // Don't clear optimistic state immediately - wait for context to update
                } catch (error) {
                    console.error('Failed to reorder entries:', error)
                    // Revert optimistic update on error
                    setOptimisticEntries(null)
                }
            }
        }
    }

    // Clear optimistic entries when day.entries changes (context updated)
    React.useEffect(() => {
        if (optimisticEntries) {
            setOptimisticEntries(null)
        }
    }, [day.entries])

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        })
    }

    const handleInsertDayAfter = async () => {
        await insertDayAfter(day.id)
    }

    const handleDeleteDay = async () => {
        await deleteDay(day.id)
    }

    return (
        <div className='space-y-4 p-4'>
            <div className='border-b pb-2 flex items-center justify-between'>
                <div className='flex items-center gap-4'>
                    <LuChevronRight
                        className={`inline ${!isCollapsed ? 'rotate-90' : ''} transition-transform duration-300 cursor-pointer font-bold text-2xl`}
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    />
                    {
                        !isGuidePage
                            ? (<h3 className='text-xl font-semibold'>{formatDate(day.date)}</h3>)
                            : (
                                <div className='flex items-center gap-2'>
                                    <LuPencilLine className='text-lg' />
                                    <input
                                        className="p-1 !border-0 !outline-none focus:!outline-none text-lg font-semibold w-full"
                                        placeholder="Day title"
                                        value={dayTitle}
                                        onChange={handleTitleChange}
                                        onBlur={handleTitleBlur}
                                    />
                                </div>
                            )
                    }
                </div>
                <div className='flex items-center gap-2 justify-end'>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon' className='rounded-full'>
                                <LuEllipsisVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={handleInsertDayAfter}>
                                <span className='font-semibold'>Insert Day After</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDeleteDay}>
                                <span className='font-semibold'>Delete Itinerary</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div
                className={`transition-all duration-500 ease-in-out space-y-4 ${isCollapsed
                    ? 'max-h-0 opacity-0 overflow-hidden'
                    : 'opacity-100 overflow-visible'
                    }`}
            >
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                >
                    <SortableContext
                        items={displayEntries?.map(e => e.id) || []}
                        strategy={verticalListSortingStrategy}
                    >
                        {displayEntries?.map((entry) => {
                            if (isPlaceEntry(entry)) {
                                return <PlaceEntry key={entry.id} entry={entry} />
                            } else if (isNoteEntry(entry)) {
                                return <NoteEntry key={entry.id} entry={entry} />
                            } else if (isTodoListEntry(entry)) {
                                return <TodoListEntry key={entry.id} entry={entry} />
                            }
                            return null
                        })}
                    </SortableContext>
                </DndContext>
                <CreateEntry dayId={day.id} />
            </div>
        </div>
    )
}

export default ItineraryItem