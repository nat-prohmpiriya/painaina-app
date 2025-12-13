'use client'

import React from 'react'
import { TbPhoto } from 'react-icons/tb'
import { Modal, Tabs, Tooltip } from 'antd'
import { useState } from 'react'
import { useToastMessage } from '@/contexts/ToastMessageContext'
import UnsplashGallery from './UnsplashGallery'
import UploadCover from './UploadCover'
import { useUpdateTrip } from '@/hooks/useTripQueries'

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

    const tabs = [
        {
            key: 'upload',
            label: <span className='text-sm font-bold'>Upload</span>,
            children: (
                <UploadCover 
                    currentPhotoUrl={currentPhotoUrl}
                    onPhotoSelect={handlePhotoSelect}
                    isUpdating={isUpdating}
                />
            )
        },
        {
            key: 'gallery',
            label: <span className='text-sm font-bold'>Unsplash Gallery</span>,
            children: (
                <UnsplashGallery 
                    onPhotoSelect={handlePhotoSelect}
                    isUpdating={isUpdating}
                />
            )
        }
    ]
    return (
        <>
            <div className="bg-black/40 h-10 w-10 flex justify-center items-center rounded-full p-2 cursor-pointer hover:bg-black/70 transition">
                <Tooltip title="Change Cover Photo">
                    <TbPhoto className="text-white text-lg" onClick={() => setIsModalOpen(true)} />
                </Tooltip>
            </div >
            <Modal
                style={{ top: 20, }}
                title={
                    <div className="flex items-center justify-center">
                        <span className="font-bold text-2xl">Change Cover Photo</span>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={650}
            >
                <Tabs items={tabs} defaultActiveKey="upload" />
            </Modal>

        </>

    )
}

export default ChangeCoverModal