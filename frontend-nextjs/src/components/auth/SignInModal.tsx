'use client'

import { useState } from 'react';
import { Modal, Button, Form, Input, Tabs, Space, Divider } from 'antd';
import { LuMail, LuLock, LuUser } from 'react-icons/lu';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SignInModal = ({ isOpen, onClose }: SignInModalProps) => {
    const [activeTab, setActiveTab] = useState('signin');
    const [signInLoading, setSignInLoading] = useState(false);
    const [signUpLoading, setSignUpLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { user, signIn } = useAuth();
    const router = useRouter();

    // Helper function to handle successful authentication
    const handleSuccessfulAuth = () => {
        onClose();

        // Use a short timeout to allow auth state to update
        setTimeout(() => {
            // If we can get the user ID, use it, otherwise redirect to home
            if (user && user.id) {
                router.push(`/profiles/${user.id}`);
            } else {
                // Fallback to home page if no user ID available
                router.push('/');
            }
        }, 500);
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        try {
            await signIn("google");
            onClose();
        } catch (error) {
            // Error is handled in the hook
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleEmailSignIn = async (values: { email: string; password: string }) => {
        setSignInLoading(true);
        try {
            const reuslt = await signIn("password", {
                email: values.email,
                password: values.password,
                flow: "signIn"
            });
            handleSuccessfulAuth();
        } catch (error) {
            // Error is handled in the hook
        } finally {
            setSignInLoading(false);
        }
    };

    const handleEmailSignUp = async (values: { email: string; password: string; name: string }) => {
        setSignUpLoading(true);
        try {
            await signIn("password", {
                email: values.email,
                password: values.password,
                flow: "signUp",
                name: values.name
            });
            handleSuccessfulAuth();
        } catch (error) {
            // Error is handled in the hook
        } finally {
            setSignUpLoading(false);
        }
    };

    const signInForm = (
        <Form onFinish={handleEmailSignIn} layout="vertical">
            <Form.Item
                name="email"
                label="Email"
                rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Invalid email format' }
                ]}
            >
                <Input
                    prefix={<LuMail />}
                    placeholder="Your email"
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please enter your password' }]}
            >
                <Input.Password
                    prefix={<LuLock />}
                    placeholder="Your password"
                    size="large"
                />
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={signInLoading}
                    block
                    size="large"
                >
                    Sign In
                </Button>
            </Form.Item>
        </Form>
    );

    const signUpForm = (
        <Form onFinish={handleEmailSignUp} layout="vertical">
            <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please enter your name' }]}
            >
                <Input
                    prefix={<LuUser />}
                    placeholder="Your name"
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="email"
                label="Email"
                rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Invalid email format' }
                ]}
            >
                <Input
                    prefix={<LuMail />}
                    placeholder="Your email"
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="password"
                label="Password"
                rules={[
                    { required: true, message: 'Please enter your password' },
                    { min: 6, message: 'Password must be at least 6 characters' }
                ]}
            >
                <Input.Password
                    prefix={<LuLock />}
                    placeholder="Your password"
                    size="large"
                />
            </Form.Item>

            <Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={signUpLoading}
                    block
                    size="large"
                >
                    Sign Up
                </Button>
            </Form.Item>
        </Form>
    );

    const tabItems = [
        {
            key: 'signin',
            label: 'Sign In',
            children: signInForm,
        },
        {
            key: 'signup',
            label: 'Sign Up',
            children: signUpForm,
        },
    ];

    return (
        <Modal
            title="Sign In / Sign Up"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={400}
            centered
        >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <Button
                    icon={<FcGoogle />}
                    onClick={handleGoogleSignIn}
                    loading={googleLoading}
                    block
                    size="large"
                >
                    Sign in with Google
                </Button>

                <Divider>or</Divider>

                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    items={tabItems}
                    centered
                />
            </Space>
        </Modal>
    );
};

export default SignInModal;