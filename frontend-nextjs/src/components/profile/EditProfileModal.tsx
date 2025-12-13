'use client'

import { useState, useEffect } from "react"
import { Button, Modal, Form, Input, Upload } from "antd"
import { LuCamera, LuPenLine } from "react-icons/lu"
import { useToastMessage } from '@/contexts/ToastMessageContext'
import { useAuth } from '@/hooks/useAuth'
import { userService, fileService } from '@/services'
import type { UploadFile } from "antd/es/upload/interface"

const EditProfileModal = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [form] = Form.useForm()
    const [fileList, setFileList] = useState<UploadFile[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const { showSuccess, showError } = useToastMessage()

    const { user: currentUser } = useAuth()

    // Cleanup object URLs on component unmount
    useEffect(() => {
        return () => {
            fileList.forEach(file => {
                if (file.url && file.url.startsWith('blob:')) {
                    URL.revokeObjectURL(file.url)
                }
            })
        }
    }, [fileList])

    const getInitials = (name?: string) => {
        if (!name) return "U"
        return name.charAt(0).toUpperCase()
    }

    const handleSubmit = async (values: { name: string }) => {
        setIsUploading(true)
        try {
            let imageUrl = currentUser?.photoUrl

            // Upload new image if selected
            if (fileList.length > 0 && fileList[0].originFileObj) {
                const file = fileList[0].originFileObj

                // Upload file to backend
                const uploadResponse = await fileService.uploadFile(file)
                imageUrl = uploadResponse.url
            }

            await userService.updateMe({
                name: values.name,
                photoUrl: imageUrl
            })

            showSuccess('Profile updated successfully!')

            // Close modal and reset form
            setIsOpen(false)
            form.resetFields()
            setFileList([])
        } catch (error) {
            showError('Failed to update profile')
            console.error('Update profile error:', error)
        } finally {
            setIsUploading(false)
        }
    }

    const handleUploadChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
        const file = newFileList[newFileList.length - 1]
        if (file) {
            // Create preview URL for immediate display
            file.url = file.url || URL.createObjectURL(file.originFileObj!)
        }
        setFileList(newFileList.slice(-1))
    }

    const openModal = () => {
        setIsOpen(true)
        form.setFieldsValue({
            name: currentUser?.name || '',
            email: currentUser?.email || ''
        })
        if (currentUser?.photoUrl) {
            setFileList([{
                uid: '-1',
                name: 'current-avatar',
                status: 'done',
                url: currentUser.photoUrl
            }])
        }
    }

    return (
        <>
            <Button
                shape="round"
                icon={<LuPenLine />}
                type="primary"
                block
                onClick={openModal}
            >
                <span className="font-semibold">Edit Profile</span>
            </Button>

            <Modal
                title="Edit Profile"
                open={isOpen}
                onCancel={() => {
                    setIsOpen(false)
                    form.resetFields()
                    setFileList([])
                }}
                footer={null}
                width={480}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    className="mt-6"
                >
                    <div className="flex flex-col items-center mb-6 relative">
                        {(fileList[0]?.url || fileList[0]?.thumbUrl || currentUser?.photoUrl) ? (
                            <img
                                className="rounded-full h-64 w-64 object-cover"
                                src={fileList[0]?.url || fileList[0]?.thumbUrl || currentUser?.photoUrl}
                                alt="Profile"
                            />
                        ) : (
                            <div className="rounded-full h-64 w-64 bg-blue-500 flex items-center justify-center text-white text-6xl">
                                {getInitials(currentUser?.name)}
                            </div>
                        )}
                        <Upload
                            accept="image/*"
                            fileList={fileList}
                            onChange={handleUploadChange}
                            beforeUpload={() => false}
                            showUploadList={false}
                            className="absolute bottom-0 right-30"
                        >
                            <Button
                                size="large"
                                shape="circle"
                                icon={<LuCamera className="text-xl" />}
                            />
                        </Upload>

                    </div>

                    <Form.Item
                        label={<span className="font-semibold">Name</span>}
                        name="name"
                        rules={[
                            { required: true, message: 'Please enter your name' },
                            { min: 2, message: 'Name must be at least 2 characters' }
                        ]}
                    >
                        <Input placeholder="Enter your name" />
                    </Form.Item>
                    <Form.Item
                        label={<span className="font-semibold">Email</span>}
                        name="email"
                        rules={[
                            { required: true, message: 'Please enter your email' },
                            { type: 'email', message: 'Please enter a valid email' }
                        ]}
                    >
                        <Input disabled placeholder="Enter your email" />
                    </Form.Item>

                    <div className="flex gap-2 justify-end mt-6">
                        <Button
                            onClick={() => {
                                setIsOpen(false)
                                form.resetFields()
                                setFileList([])
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={isUploading}>
                            Save Changes
                        </Button>
                    </div>
                </Form>
            </Modal>
        </>
    )
}

export default EditProfileModal