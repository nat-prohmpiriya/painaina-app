'use client'

import React, { useState } from 'react'
import { FileUpload } from '@/components/ui/file-upload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LuUpload, LuImage, LuX } from 'react-icons/lu'
import { useToastMessage } from '@/contexts/ToastMessageContext'

interface UploadCoverProps {
    currentPhotoUrl?: string
    onPhotoSelect: (photoUrl: string) => void
    isUpdating: boolean
}

const UploadCover = ({ currentPhotoUrl, onPhotoSelect, isUpdating }: UploadCoverProps) => {
    const [files, setFiles] = useState<File[]>([])
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const { showError } = useToastMessage()

    // Convert file to base64 for preview and upload
    const getBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = (error) => reject(error)
        })
    }

    const handleFilesChange = async (newFiles: File[]) => {
        if (newFiles.length === 0) return

        const file = newFiles[0]

        // Validate file type
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
        if (!isJpgOrPng) {
            showError('Invalid file type', 'You can only upload JPG, PNG, or WebP files!')
            return
        }

        // Validate file size
        const isLt10M = file.size / 1024 / 1024 < 10
        if (!isLt10M) {
            showError('File too large', 'Image must be smaller than 10MB!')
            return
        }

        try {
            const base64 = await getBase64(file)
            setPreviewUrl(base64)
            setFiles([file])
        } catch (error) {
            console.error('Upload error:', error)
            showError('Upload failed')
        }
    }

    const handleUsePhoto = () => {
        if (previewUrl) {
            onPhotoSelect(previewUrl)
        }
    }

    const handleRemovePreview = () => {
        setPreviewUrl(null)
        setFiles([])
    }

    return (
        <div className="space-y-4">
            {/* Current Photo */}
            {currentPhotoUrl && !previewUrl && (
                <div>
                    <p className="text-sm font-medium mb-2">Current Cover Photo:</p>
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                        <img
                            src={currentPhotoUrl}
                            alt="Current cover"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            )}

            {/* Preview */}
            {previewUrl && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">Preview:</p>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemovePreview}
                        >
                            <LuX />
                        </Button>
                    </div>
                    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                        <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            )}

            {/* Upload Area */}
            <FileUpload
                value={files}
                onChange={handleFilesChange}
                accept="image/*"
                maxFiles={1}
                disabled={isUpdating}
                showPreview={false}
            >
                <div className="py-8">
                    <LuUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-base mb-2">Click or drag file to upload</p>
                    <p className="text-sm text-gray-500">Support JPG, PNG, WebP up to 10MB</p>
                </div>
            </FileUpload>

            {/* URL Input Alternative */}
            <div className="text-center text-gray-500">
                <p className="text-sm">or paste image URL:</p>
                <div className="mt-2">
                    <Input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        onBlur={(e) => {
                            const url = e.target.value.trim()
                            if (url) {
                                setPreviewUrl(url)
                            }
                        }}
                        disabled={isUpdating}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            {previewUrl && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button
                        variant="outline"
                        onClick={handleRemovePreview}
                        disabled={isUpdating}
                    >
                        Cancel
                    </Button>
                    <Button
                        disabled={isUpdating}
                        onClick={handleUsePhoto}
                    >
                        <LuImage className="mr-2" />
                        {isUpdating ? 'Updating...' : 'Update Cover Photo'}
                    </Button>
                </div>
            )}

            {/* Help Text */}
            <div className="text-xs text-gray-500 space-y-1">
                <p>• Choose a high-quality landscape image for best results</p>
                <p>• Recommended size: 1200x600 pixels or larger</p>
                <p>• The image will be used as your trip's cover photo</p>
            </div>
        </div>
    )
}

export default UploadCover