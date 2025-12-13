'use client'

import React from 'react'
import { TbPhoto } from 'react-icons/tb'
import { useState } from 'react'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import UnsplashGallery from './UnsplashGallery'
import UploadCover from './UploadCover'
import { useUpdateTrip } from '@/hooks/useTripQueries'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ChangeCoverModalProps {
    tripId: string
    currentPhotoUrl?: string
    onPhotoUpdated?: (newPhotoUrl: string) => void
}

const ChangeCoverModal = ({ tripId, currentPhotoUrl, onPhotoUpdated }: ChangeCoverModalProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const { showSuccess, showError } = useToastMessage()

    const updateTrip = useUpdateTrip()

    const handlePhotoSelect = async (photoUrl: string) => {
        try {
            setIsUpdating(true)
            await updateTrip.mutateAsync({
                tripId,
                data: { coverPhoto: photoUrl }
            })

            showSuccess('Cover photo updated successfully!')
            onPhotoUpdated?.(photoUrl)
            setIsModalOpen(false)
        } catch (error) {
            console.error('Error updating cover photo:', error)
            showError('Failed to update cover photo')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div
                            className="bg-black/40 h-10 w-10 flex justify-center items-center rounded-full p-2 cursor-pointer hover:bg-black/70 transition"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <TbPhoto className="text-white text-lg" />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Change Cover Photo</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold">
                            Change Cover Photo
                        </DialogTitle>
                    </DialogHeader>

                    <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload" className="text-sm font-bold">
                                Upload
                            </TabsTrigger>
                            <TabsTrigger value="gallery" className="text-sm font-bold">
                                Unsplash Gallery
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload">
                            <UploadCover
                                currentPhotoUrl={currentPhotoUrl}
                                onPhotoSelect={handlePhotoSelect}
                                isUpdating={isUpdating}
                            />
                        </TabsContent>
                        <TabsContent value="gallery">
                            <UnsplashGallery
                                onPhotoSelect={handlePhotoSelect}
                                isUpdating={isUpdating}
                            />
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ChangeCoverModal
