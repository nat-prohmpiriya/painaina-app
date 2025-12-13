'use client'

import { useState, useRef, useCallback, useEffect } from "react"
import { imgUrl } from "@/lib/imgUrl"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { DateRange } from "react-day-picker"

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

    const dateRange: DateRange | undefined = tripData.startDate && tripData.endDate ? {
        from: new Date(tripData.startDate),
        to: new Date(tripData.endDate)
    } : undefined

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
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="outline-none">
                                    <LuEllipsisVertical className="text-white text-lg" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {canDelete && (
                                    <DropdownMenuItem
                                        className="text-red-600 focus:text-red-600"
                                        onClick={() => setIsDeleteModalOpen(true)}
                                    >
                                        Delete Trip
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => console.log('Create Guides clicked')}>
                                    Convert to Guides
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <div className="px-4 py-2 bg-white shadow-md h-56 -mt-12 w-11/12 mx-auto rounded-lg flex flex-col justify-between">
                <div className="relative">
                    <Input
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className="w-full text-3xl font-bold border-0 shadow-none hover:bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors px-0"
                        placeholder="Trip Title"
                    />
                    {isSaving.title && (
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                            Saving...
                        </div>
                    )}
                </div>

                <div className="relative">
                    <Textarea
                        value={description}
                        onChange={(e) => handleDescriptionChange(e.target.value)}
                        className="w-full border-0 shadow-none hover:bg-gray-50 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors resize-none px-0"
                        rows={5}
                        placeholder="Trip Description"
                    />
                    {isSaving.description && (
                        <div className="absolute right-2 bottom-2 text-xs text-gray-500">
                            Saving...
                        </div>
                    )}
                </div>

                <div className={`grid ${isGuidePage ? 'grid-cols-7' : 'grid-cols-5'} gap-4`}>
                    <div className={`col-span-${isGuidePage ? '4' : '2'}`}>
                        {isTripPage && <DateRangePicker date={dateRange} onDateChange={() => {}} className="w-full" />}
                        {isGuidePage && <TagsSelector tags={tripData.tags || []} />}
                    </div>

                    <div className={`col-span-${isGuidePage ? '2' : '1'}`}>
                        {isGuidePage && <LevelSelector level={tripData.level} />}
                    </div>

                    <div className={`col-span-${isGuidePage ? '1' : '2'} flex items-center justify-end`}>
                        <TooltipProvider>
                            <div className="flex -space-x-2">
                                {members && members.length > 0
                                    ? (members.map((member) => (
                                        <Tooltip key={member.userId}>
                                            <TooltipTrigger asChild>
                                                <Avatar className="border-2 border-white">
                                                    <AvatarImage src={member.user?.photoUrl} alt={member.user?.name || 'Member'} />
                                                    <AvatarFallback>
                                                        {member.user?.name ? member.user.name.charAt(0).toUpperCase() : 'M'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{member.user?.name || 'Unknown'} ({member.role})</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )))
                                    : (
                                        <Avatar>
                                            <AvatarFallback><LuUser /></AvatarFallback>
                                        </Avatar>
                                    )
                                }
                            </div>
                        </TooltipProvider>
                        {isTripPage && <InviteMemberModal />}
                    </div>
                </div>
            </div>
            <DeleteTripModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
        </div>
    )
}

export default TripBanner