'use client'

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FileUpload } from "@/components/ui/file-upload"
import { Camera, PenLine } from "lucide-react"
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { useAuth } from '@/hooks/useAuth'
import { userService, fileService } from '@/services'

interface FormValues {
    name: string
    email: string
}

const EditProfileModal = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const { showSuccess, showError } = useToastMessage()

    const { user: currentUser } = useAuth()

    const form = useForm<FormValues>({
        defaultValues: {
            name: '',
            email: '',
        },
    })

    // Cleanup preview URL on component unmount
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl)
            }
        }
    }, [previewUrl])

    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name.charAt(0).toUpperCase()
    }

    const handleSubmit = async (values: FormValues) => {
        setIsUploading(true)
        try {
            let imageUrl = currentUser?.photoUrl

            // Upload new image if selected
            if (selectedImage) {
                // Upload file to backend
                const uploadResponse = await fileService.uploadFile(selectedImage)
                imageUrl = uploadResponse.url
            }

            await userService.updateMe({
                name: values.name,
                photoUrl: imageUrl
            })

            showSuccess('Profile updated successfully!')

            // Close modal and reset form
            setIsOpen(false)
            form.reset()
            setSelectedImage(null)
            setPreviewUrl(null)
        } catch (error) {
            showError('Failed to update profile')
            console.error('Update profile error:', error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleImageChange = (file: File | null) => {
        // Clean up previous preview URL
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl)
        }

        setSelectedImage(file)
        if (file) {
            setPreviewUrl(URL.createObjectURL(file))
        } else {
            setPreviewUrl(null)
        }
    }

    const openModal = () => {
        setIsOpen(true)
        form.reset({
            name: currentUser?.name || '',
            email: currentUser?.email || ''
        })
        setPreviewUrl(currentUser?.photoUrl || null)
        setSelectedImage(null)
    }

    const closeModal = () => {
        setIsOpen(false)
        form.reset()
        setSelectedImage(null)
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(null)
    }

    const displayImageUrl = previewUrl || currentUser?.photoUrl

    return (
        <>
            <Button
                variant="default"
                className="w-full rounded-full"
                onClick={openModal}
            >
                <PenLine className="mr-2 h-4 w-4" />
                <span className="font-semibold">Edit Profile</span>
            </Button>

            <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                            <div className="flex flex-col items-center mb-6 relative">
                                {displayImageUrl ? (
                                    <img
                                        className="rounded-full h-64 w-64 object-cover"
                                        src={displayImageUrl}
                                        alt="Profile"
                                    />
                                ) : (
                                    <div className="rounded-full h-64 w-64 bg-blue-500 flex items-center justify-center text-white text-6xl">
                                        {getInitials(currentUser?.name)}
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-1/4">
                                    <FileUpload
                                        value={selectedImage ? [selectedImage] : []}
                                        onChange={(files) => handleImageChange(files[0] ?? null)}
                                        accept={{ "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"] }}
                                        showPreview={false}
                                        maxFiles={1}
                                        dropzoneClassName="border-0 p-0 bg-transparent hover:bg-transparent"
                                    >
                                        <Button
                                            type="button"
                                            size="lg"
                                            className="rounded-full h-12 w-12 p-0"
                                        >
                                            <Camera className="h-5 w-5" />
                                        </Button>
                                    </FileUpload>
                                </div>
                            </div>

                            <FormField
                                control={form.control}
                                name="name"
                                rules={{
                                    required: 'Please enter your name',
                                    minLength: {
                                        value: 2,
                                        message: 'Name must be at least 2 characters'
                                    }
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold">Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                rules={{
                                    required: 'Please enter your email',
                                    pattern: {
                                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                        message: 'Please enter a valid email'
                                    }
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold">Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter your email" disabled {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="rounded-full" disabled={isUploading}>
                                    {isUploading ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default EditProfileModal