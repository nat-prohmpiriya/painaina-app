'use client'

import { useState, useRef, useCallback, useEffect } from "react"
import { imgUrl } from "@/lib/imgUrl"
import { Avatar, DatePicker, Menu, Dropdown, Tooltip, Input } from "antd"
import { useTripContext } from "@/contexts/TripContext"
import InviteMemberModal from "./InviteMemberModal"
import ChangeCoverModal from "./ChangeCoverModal"
import DeleteTripModal from "./DeleteTripModal"
import { LuEllipsisVertical, LuUser } from "react-icons/lu"
import { canDeleteTrip } from '@/lib/permissions'
import { useAuth } from '@/hooks/useAuth'
import dayjs from "dayjs"
import { usePathname } from 'next/navigation'
import GuideViewButton from "./GuideViewButton"
import LevelSelector from "./LevelSelector"
import TagsSelector from "./TagsSelector"

const { RangePicker } = DatePicker
const { TextArea } = Input

const TripBanner = () => {
    const { tripData, members, updateTrip } = useTripContext()
    const { user } = useAuth()
    const [title, setTitle] = useState(tripData?.title || "")
    const [description, setDescription] = useState(tripData?.description || "")
    const titleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const descriptionTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
    const [isSaving, setIsSaving] = useState({ title: false, description: false })
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    // check path is guide page by nextjs usePathname
    const pathname = usePathname()
    const isGuidePage = pathname.includes('/guides/')
    const isTripPage = pathname.includes('/trips/')

    // Sync local state with tripData when it changes
    useEffect(() => {
        setTitle(tripData?.title || "")
        setDescription(tripData?.description || "")
    }, [tripData?.title, tripData?.description])

    if (!tripData) return null

    // Get user's role in this trip
    const userMember = members?.find(
        member => member.userId === user?.id
    )
    const userRole = userMember?.role as 'admin' | 'editor' | 'viewer' | undefined
    const canDelete = canDeleteTrip(userRole)

    // Optimistic update for title
    const handleTitleChange = useCallback((value: string) => {
        // Immediate UI update (optimistic)
        setTitle(value)

        // Clear existing timeout
        if (titleTimeoutRef.current) {
            clearTimeout(titleTimeoutRef.current)
        }

        // Background sync with visual feedback
        titleTimeoutRef.current = setTimeout(async () => {
            if (value.trim() !== tripData.title && value.trim()) {
                setIsSaving(prev => ({ ...prev, title: true }))
                try {
                    await updateTrip(tripData.id, { title: value.trim() })
                } catch (error) {
                    console.error('Failed to update title:', error)
                    setTitle(tripData.title || "") // Revert on error
                } finally {
                    setIsSaving(prev => ({ ...prev, title: false }))
                }
            }
        }, 2000) // 2 seconds
    }, [tripData.id, tripData.title, updateTrip])

    // Optimistic update for description
    const handleDescriptionChange = useCallback((value: string) => {
        // Immediate UI update (optimistic)
        setDescription(value)

        // Clear existing timeout
        if (descriptionTimeoutRef.current) {
            clearTimeout(descriptionTimeoutRef.current)
        }

        // Background sync with visual feedback
        descriptionTimeoutRef.current = setTimeout(async () => {
            if (value.trim() !== tripData.description) {
                setIsSaving(prev => ({ ...prev, description: true }))
                try {
                    await updateTrip(tripData.id, { description: value.trim() })
                } catch (error) {
                    console.error('Failed to update description:', error)
                    setDescription(tripData.description || "") // Revert on error
                } finally {
                    setIsSaving(prev => ({ ...prev, description: false }))
                }
            }
        }, 2000) // 2 seconds
    }, [tripData.id, tripData.description, updateTrip])

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (titleTimeoutRef.current) clearTimeout(titleTimeoutRef.current)
            if (descriptionTimeoutRef.current) clearTimeout(descriptionTimeoutRef.current)
        }
    }, [])

    const dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null = tripData.startDate && tripData.endDate ? [
        dayjs(tripData.startDate),
        dayjs(tripData.endDate)
    ] : null

    return (
        <div>
            <div
                className="h-84 bg-gray-300 p-4"
                style={{ backgroundImage: `url(${tripData.coverPhoto})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
                <div className="flex justify-end p-2 gap-4">
                    {isGuidePage && <GuideViewButton />}
                    <ChangeCoverModal
                        tripId={tripData.id}
                        currentPhotoUrl={tripData.coverPhoto}
                        onPhotoUpdated={(newPhotoUrl) => {
                            // Optional: Update local state or refetch data
                            console.log('Cover photo updated:', newPhotoUrl)
                        }}
                    />
                    <div className="bg-black/40 h-10 w-10 flex justify-center items-center rounded-full p-2 cursor-pointer hover:bg-black/70 transition">
                        <Dropdown menu={{
                            items: [
                                ...(canDelete ? [{
                                    key: '1',
                                    label: 'Delete Trip',
                                    onClick: () => setIsDeleteModalOpen(true),
                                    danger: true,
                                }] : []),
                                {
                                    key: '2',
                                    label: 'Convert to Guides',
                                    onClick: () => console.log('Create Guides clicked'),
                                },
                            ]
                        }}>
                            <LuEllipsisVertical className="text-white text-lg" />
                        </Dropdown>
                    </div>
                </div>
            </div>

            <div className="px-4 py-2 bg-white shadow-md h-56 -mt-12 w-11/12 mx-auto rounded-lg flex flex-col justify-between">
                <div className="relative">
                    <Input
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="w-full text-3xl font-bold border-0 outline-none focus:outline-none hover:bg-gray-50 focus:bg-white transition-colors"
                        placeholder="Trip Title"
                        variant="borderless"
                    />
                    {isSaving.title && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                            Saving...
                        </div>
                    )}
                </div>

                <div className="relative">
                    <TextArea
                        value={description}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        className="w-full border-0 outline-none focus:outline-none hover:bg-gray-50 focus:bg-white transition-colors resize-none"
                        rows={5}
                        placeholder="Trip Description"
                        variant="borderless"
                    />
                    {isSaving.description && (
                        <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                            Saving...
                        </div>
                    )}
                </div>

                <div className={`grid ${isGuidePage ? 'grid-cols-7' : 'grid-cols-5'} gap-4`}>
                    <div className={`col-span-${isGuidePage ? '4' : '2'}`}>
                        {isTripPage && <RangePicker value={dateRange} style={{ width: '100%', borderRadius: '18px' }} />}
                        {isGuidePage && <TagsSelector tags={tripData.tags || []} />}
                    </div>

                    <div className={`col-span-${isGuidePage ? '2' : '1'}`}>
                        {isGuidePage && <LevelSelector level={tripData.level} />}
                    </div>

                    <div className={`col-span-${isGuidePage ? '1' : '2'} flex items-center justify-end`}>
                        <Avatar.Group size="large" className="">
                            {members && members.length > 0
                                ? (members.map((member) => (
                                    <Tooltip key={member.userId} title={`${member.user?.name || 'Unknown'} (${member.role})`}>
                                        <Avatar
                                            src={member.user?.photoUrl}
                                            icon={<LuUser />}
                                            alt={member.user?.name || 'Member'}
                                        >
                                            {!member.user?.photoUrl && (member.user?.name ? member.user.name.charAt(0).toUpperCase() : 'M')}
                                        </Avatar>
                                    </Tooltip>
                                )))
                                : (<Avatar icon={<LuUser />}>U</Avatar>)
                            }
                        </Avatar.Group>
                        {isTripPage && <InviteMemberModal />}
                    </div>
                </div>
            </div>
            <DeleteTripModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
        </div>
    )
}

export default TripBanner