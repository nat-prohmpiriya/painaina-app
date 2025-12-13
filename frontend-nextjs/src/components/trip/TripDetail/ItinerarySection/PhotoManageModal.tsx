'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { LuCamera, LuTrash2, LuStar, LuUpload } from 'react-icons/lu'
import { useState, useMemo, useEffect } from 'react'
import { imgUrl } from '@/lib/imgUrl'
import Image from 'next/image'
// EntryPhoto type
type EntryPhoto = {
    storage_id: string;
    url?: string;
}
import { usePhotoUrls } from './PhotoUrlContext'
import { useToastMessage } from '@/contexts/ToastMessageContext'

interface PhotoManageModalProps {
    open: boolean
    onClose: () => void
    entryId: string
    photos?: EntryPhoto[]
    googlePlacePhoto?: string
    entryTitle: string
}

const PhotoManageModal = ({
    open,
    onClose,
    entryId,
    photos = [],
    googlePlacePhoto,
    entryTitle
}: PhotoManageModalProps) => {
    const [uploading, setUploading] = useState(false)
    // TODO: Replace with fileService when backend API is ready
    // const generateUploadUrl = useMutation(api.itinerary.generatePhotoUploadUrl)
    // const uploadEntryPhoto = useMutation(api.itinerary.uploadEntryPhoto)
    // const deleteEntryPhoto = useMutation(api.itinerary.deleteEntryPhoto)
    // const setCoverPhoto = useMutation(api.itinerary.setCoverPhoto)
    const { showSuccess, showError } = useToastMessage()

    // Use PhotoUrlContext for uploaded photos
    const { photoUrls, loadPhotoUrl } = usePhotoUrls()

    // Load uploaded photo URLs when component opens or photos change
    useEffect(() => {
        if (open && photos.length > 0) {
            photos.forEach(photo => {
                loadPhotoUrl(photo.storage_id)
            })
        }
    }, [open, photos, loadPhotoUrl])

    // Combine all photos for display
    const allPhotos = useMemo(() => {
        const photoList: Array<{
            id: string
            url: string | undefined
            type: 'google' | 'uploaded'
            storage_id?: string
            name?: string
        }> = []

        // Add Google Place photo
        if (googlePlacePhoto && googlePlacePhoto !== imgUrl) {
            photoList.push({
                id: 'google-place',
                url: googlePlacePhoto,
                type: 'google'
            })
        }

        // Add uploaded photos
        photos.forEach(photo => {
            const url = photoUrls[photo.storage_id]
            if (url) {
                photoList.push({
                    id: photo.storage_id,
                    url,
                    type: 'uploaded',
                    storage_id: photo.storage_id,
                    name: photo.name
                })
            }
        })

        return photoList // Photos are already filtered by checking url existence
    }, [googlePlacePhoto, photos, photoUrls, imgUrl])

    // Upload handler
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        // TODO: Implement file upload with fileService
        showError('Photo upload feature is temporarily disabled')
    }

    const handleDeletePhoto = async (photoId: string, storageId?: string) => {
        // TODO: Implement photo deletion with backend API
        showError('Photo deletion feature is temporarily disabled')
    }

    const handleSetCoverPhoto = async (photoId: string, storageId?: string) => {
        // TODO: Implement set cover photo with backend API
        showError('Set cover photo feature is temporarily disabled')
    }

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{`Manage Photos - ${entryTitle}`}</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors text-center cursor-pointer">
                        <label htmlFor="photo-upload" className="cursor-pointer">
                            <div className="text-center">
                                <LuUpload className="text-4xl text-gray-400 mb-3 mx-auto" />
                                <p className="text-lg font-medium text-gray-600 mb-2">Upload New Photos</p>
                                <p className="text-gray-500">Click or drag photos here to upload</p>
                                {uploading && (
                                    <div className="mt-3">
                                        <Button disabled>Uploading...</Button>
                                    </div>
                                )}
                            </div>
                        </label>
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>

                {/* Photos Grid */}
                {allPhotos.length > 0 ? (
                    <div>
                        <h3 className="text-lg font-semibold mb-4">All Photos ({allPhotos.length})</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {allPhotos.map((photo, index) => (
                                <div key={photo.id}>
                                    <div className="relative group h-48 rounded-lg overflow-hidden">
                                        <Image
                                            src={photo.url || imgUrl}
                                            alt={photo.name || `Photo ${index + 1}`}
                                            fill
                                            className="object-cover rounded-lg"
                                            onError={(e) => {
                                                console.error('Image load error:', photo.url, e);
                                            }}
                                        />

                                        {/* Photo actions overlay */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
                                            <div className="flex gap-2">
                                                {/* Set as cover button */}
                                                {index !== 0 && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSetCoverPhoto(photo.id, photo.storage_id)}
                                                    >
                                                        <LuStar className="mr-1" />
                                                        Cover
                                                    </Button>
                                                )}

                                                {/* Delete button - only for uploaded photos */}
                                                {photo.type === 'uploaded' && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                            >
                                                                <LuTrash2 className="mr-1" />
                                                                Delete
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Are you sure you want to delete this photo?
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeletePhoto(photo.id, photo.storage_id)}>
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                        </div>

                                        {/* Photo type indicator */}
                                        <div className="absolute top-2 left-2">
                                            {photo.type === 'google' ? (
                                                <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                                                    Google
                                                </div>
                                            ) : (
                                                <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                                                    Uploaded
                                                </div>
                                            )}
                                        </div>

                                        {/* Cover photo indicator */}
                                        {index === 0 && (
                                            <div className="absolute top-2 right-2">
                                                <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                                                    <LuStar className="text-xs" />
                                                    Cover
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <LuCamera className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No photos yet</p>
                        <p className="text-gray-400">Upload some photos to get started</p>
                    </div>
                )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default PhotoManageModal