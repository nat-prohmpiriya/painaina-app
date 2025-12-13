'use client'

import React, { useState } from 'react'
import { Upload, Button } from 'antd'
import { LuUpload, LuImage, LuX } from 'react-icons/lu'
import type { UploadFile, UploadProps } from 'antd/es/upload/interface'
import { useToastMessage } from '@/contexts/ToastMessageContext'

interface UploadCoverProps {
    currentPhotoUrl?: string
    onPhotoSelect: (photoUrl: string) => void
    isUpdating: boolean
}

const UploadCover = ({ currentPhotoUrl, onPhotoSelect, isUpdating }: UploadCoverProps) => {
    const [fileList, setFileList] = useState<UploadFile[]>([])
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

    const handleUpload: UploadProps['customRequest'] = async (options) => {
        const { file, onSuccess, onError } = options
        
        try {
            // Convert file to base64
            const base64 = await getBase64(file as File)
            setPreviewUrl(base64)
            onSuccess?.('ok')
        } catch (error) {
            console.error('Upload error:', error)
            onError?.(error as Error)
        }
    }

    const handleChange: UploadProps['onChange'] = (info) => {
        setFileList(info.fileList.slice(-1)) // Keep only the latest file
        
        if (info.file.status === 'error') {
            showError('Upload failed')
        }
    }

    const beforeUpload = (file: File) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp'
        if (!isJpgOrPng) {
            showError('You can only upload JPG, PNG, or WebP files!')
            return false
        }
        
        const isLt10M = file.size / 1024 / 1024 < 10
        if (!isLt10M) {
            showError('Image must be smaller than 10MB!')
            return false
        }
        
        return true
    }

    const handleUsePhoto = () => {
        if (previewUrl) {
            onPhotoSelect(previewUrl)
        }
    }

    const handleRemovePreview = () => {
        setPreviewUrl(null)
        setFileList([])
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
                            type="text"
                            icon={<LuX />}
                            onClick={handleRemovePreview}
                            size="small"
                        />
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
            <Upload.Dragger
                fileList={fileList}
                customRequest={handleUpload}
                onChange={handleChange}
                beforeUpload={beforeUpload}
                accept="image/*"
                showUploadList={false}
                disabled={isUpdating}
            >
                <div className="py-8">
                    <LuUpload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-base mb-2">Click or drag file to upload</p>
                    <p className="text-sm text-gray-500">Support JPG, PNG, WebP up to 10MB</p>
                </div>
            </Upload.Dragger>

            {/* URL Input Alternative */}
            <div className="text-center text-gray-500">
                <p className="text-sm">or paste image URL:</p>
                <div className="mt-2">
                    <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        onClick={handleRemovePreview}
                        disabled={isUpdating}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        icon={<LuImage />}
                        loading={isUpdating}
                        onClick={handleUsePhoto}
                    >
                        Update Cover Photo
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