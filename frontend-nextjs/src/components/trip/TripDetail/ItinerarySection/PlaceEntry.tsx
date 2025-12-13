'use client'

import { imgUrl } from "@/lib/imgUrl"
import { Button, Checkbox, Image } from "antd"
import { LuGripVertical, LuCamera, LuSettings } from "react-icons/lu";
import { FiTrash2 } from "react-icons/fi";
import { useRef, useState, useEffect, useMemo } from "react";
import dayjs from 'dayjs';
import AddTimePlace from "./AddTimePlace";
import AddExpense from "./AddExpense";
import { PlaceEntry as PlaceEntryType } from '@/interfaces/itinerary.interface'
import { useTripContext } from '@/contexts/TripContext'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { UploadProps } from 'antd'
import PhotoManageModal from './PhotoManageModal'
import { usePhotoUrls } from './PhotoUrlContext'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { useExpensesByEntry } from '@/hooks/useExpenseQueries'
import { useTranslations } from 'next-intl'

interface PlaceEntryProps {
    entry: PlaceEntryType
}

const PlaceEntry = ({ entry }: PlaceEntryProps) => {
    const { tripData, updateEntry, deleteEntry } = useTripContext()
    const [photoUrl, setPhotoUrl] = useState<string>(imgUrl)
    const [showManageModal, setShowManageModal] = useState(false)
    const { showSuccess, showError } = useToastMessage()
    const t = useTranslations('tripDetail.itinerary')

    // Query expenses for this entry using React Query
    const { data: expenses } = useExpensesByEntry(tripData?.id || '', entry.id)

    // Calculate total expenses
    const totalExpenses = expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0
    const hasExpenses = expenses && expenses.length > 0
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

    // Load Google Place photo when component mounts or photos changes
    useEffect(() => {
        // @ts-ignore - Check if place has photos array from backend
        if (entry.place?.photos && Array.isArray(entry.place.photos) && entry.place.photos.length > 0) {
            // @ts-ignore
            const firstPhoto = entry.place.photos[0]
            const photoRef = firstPhoto.photoReference
            if (photoRef) {
                const photoUrl = `${process.env.NEXT_PUBLIC_API_URL}/places/photo?photoReference=${photoRef}&maxWidth=400`
                setPhotoUrl(photoUrl)
            }
        }
        // Fallback: check old format (photoReference directly on place object)
        // @ts-ignore
        else if (entry.place?.photoReference || entry.place?.photo_reference) {
            // @ts-ignore
            const photoRef = entry.place?.photoReference || entry.place?.photo_reference
            const photoUrl = `${process.env.NEXT_PUBLIC_API_URL}/places/photo?photoReference=${photoRef}&maxWidth=400`
            setPhotoUrl(photoUrl)
        }
        // @ts-ignore
    }, [entry.place?.photos, entry.place?.photoReference, entry.place?.photo_reference])

    // Sync local state when entry changes from external updates
    useEffect(() => {
        setLocalEntry({
            title: entry.title,
            description: entry.description || ''
        })
    }, [entry.title, entry.description])

    // Use PhotoUrlContext for uploaded photos
    const { photoUrls, loadPhotoUrl } = usePhotoUrls()

    // Load uploaded photo URLs when component mounts or photos change
    useEffect(() => {
        if (entry.photos?.length) {
            entry.photos.forEach(photo => {
                loadPhotoUrl(photo)
            })
        }
    }, [entry.photos, loadPhotoUrl])

    // Combine Google Places photo with uploaded photos
    const allImages = useMemo(() => {
        const photos: string[] = []

        // Add Google Places photo if available
        if (photoUrl && photoUrl !== imgUrl) {
            photos.push(photoUrl)
        }

        // Add uploaded photos from context
        if (entry.photos?.length) {
            entry.photos.forEach(photo => {
                const url = photoUrls[photo]
                if (url) {
                    photos.push(url)
                }
            })
        }

        return photos.filter(Boolean)
    }, [photoUrl, imgUrl, entry.photos, photoUrls])

    // Upload configuration
    const uploadProps: UploadProps = {
        name: 'photo',
        multiple: true,
        accept: 'image/*',
        showUploadList: false,
        beforeUpload: async (file) => {
            // TODO: Implement file upload with fileService
            showError('Photo upload feature is temporarily disabled')
            return false
        },
    }

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
            if (descriptionTimeoutRef.current) clearTimeout(descriptionTimeoutRef.current)
        }
    }, [])

    // Content Section Component (reusable for both layouts)
    const ContentSection = () => (
        <div className="bg-gray-100 p-4 rounded-lg flex flex-col gap-2 min-h-48 max-h-48">
            <div className="relative">
                <input
                    className="!border-0 !outline-none focus:!outline-none text-lg font-semibold w-full bg-transparent"
                    placeholder="Place name"
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
                    className="h-full !border-0 !outline-none focus:!outline-none w-full resize-none bg-transparent"
                    placeholder={entry?.place?.editorialSummary?.overview || "Add description..."}
                    value={localEntry.description}
                    onChange={handleDescriptionChange}
                />
                {isSaving.description && (
                    <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                        Saving...
                    </div>
                )}
            </div>
        </div>
    )

    // Actions Section Component
    const ActionsSection = () => (
        <div className="flex gap-2 mt-2 flex-wrap">
            <AddTimePlace
                startTime={entry.startTime}
                endTime={entry.endTime}
                onTimeUpdate={(startTime, endTime) => {
                    updateEntry(entry.id, {
                        startTime: startTime || undefined,
                        endTime: endTime || undefined
                    });
                }}
            />
            <AddExpense
                entryId={entry.id}
                hasExpenses={hasExpenses}
                totalAmount={totalExpenses}
                onExpenseUpdate={() => {
                    console.log('Expense updated for entry:', entry.id)
                }}
            />
        </div>
    )

    // Image Section Component
    const ImageSection = ({ className = "" }: { className?: string }) => (
        <div className={className}>
            {allImages.length > 0 ? (
                <Image.PreviewGroup items={allImages}>
                    <div className="h-48 w-full rounded-lg relative">
                        <Image
                            src={allImages[0]}
                            alt={entry.place?.name || entry.title}
                            height={192}
                            width="100%"
                            className="rounded-lg object-cover"
                        />
                        {allImages.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-medium">
                                +{allImages.length - 1} more
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center mt-2">
                        <Button
                            shape="round"
                            type="text"
                            icon={<LuSettings />}
                            size="small"
                            onClick={() => setShowManageModal(true)}
                            className="text-gray-600 hover:text-blue-600"
                        >
                            Manage Photos
                        </Button>
                    </div>
                </Image.PreviewGroup>
            ) : (
                <div>
                    <div className="h-48 w-full rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <div className="text-center p-6">
                            <LuCamera className="text-3xl text-gray-400 mb-3 mx-auto" />
                            <p className="text-gray-500 font-medium">{t('noPhotos')}</p>
                            <p className="text-gray-400 text-sm mt-1">Click "Manage Photos" to add</p>
                        </div>
                    </div>
                    <div className="flex justify-center mt-2">
                        <Button
                            type="text"
                            icon={<LuSettings />}
                            size="small"
                            onClick={() => setShowManageModal(true)}
                            className="text-gray-600 hover:text-blue-600"
                        >
                            Manage Photos
                        </Button>
                    </div>
                </div>
            )}
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
                    <div className="flex-1 flex flex-col gap-3">
                        {/* Image first on mobile */}
                        <ImageSection />
                        {/* Content section */}
                        <ContentSection />
                        {/* Actions */}
                        <ActionsSection />
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-17 gap-2 p-2">
                {/* Drag handle */}
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
                {/* Content */}
                <div className="col-span-9">
                    <ContentSection />
                    <ActionsSection />
                </div>
                {/* Image */}
                <div className="col-span-5">
                    <ImageSection />
                </div>
                {/* Delete button */}
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

            {/* Photo Manage Modal */}
            <PhotoManageModal
                open={showManageModal}
                onClose={() => setShowManageModal(false)}
                entryId={entry.id}
                photos={entry.photos?.map(photoId => ({ storage_id: photoId }))}
                googlePlacePhoto={photoUrl}
                entryTitle={entry.title}
            />
        </div>
    )
}

export default PlaceEntry
