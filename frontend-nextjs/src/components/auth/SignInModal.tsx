'use client'

import { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Please enter your password'),
});

const signUpSchema = z.object({
  name: z.string().min(1, 'Please enter your name'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignInModal = ({ isOpen, onClose }: SignInModalProps) => {
    const [activeTab, setActiveTab] = useState('signin');
    const [signInLoading, setSignInLoading] = useState(false);
    const [signUpLoading, setSignUpLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const { user, signIn } = useAuth();
    const router = useRouter();

    const signInForm = useForm<SignInFormValues>({
      resolver: zodResolver(signInSchema),
    });

    const signUpForm = useForm<SignUpFormValues>({
      resolver: zodResolver(signUpSchema),
    });

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

    const handleEmailSignIn = async (values: SignInFormValues) => {
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

    const handleEmailSignUp = async (values: SignUpFormValues) => {
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Sign In / Sign Up</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    <Button
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading}
                        size="lg"
                    >
                        {googleLoading ? (
                            <span className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                                Signing in...
                            </span>
                        ) : (
                            <>
                                <FcGoogle className="h-5 w-5" />
                                Sign in with Google
                            </>
                        )}
                    </Button>

                    <div className="relative">
                        <Separator />
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                            or
                        </span>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="signin">Sign In</TabsTrigger>
                            <TabsTrigger value="signup">Sign Up</TabsTrigger>
                        </TabsList>

                        <TabsContent value="signin">
                            <Form {...signInForm}>
                                <form onSubmit={signInForm.handleSubmit(handleEmailSignIn)} className="space-y-4">
                                    <FormField
                                        control={signInForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            {...field}
                                                            type="email"
                                                            placeholder="Your email"
                                                            className="pl-9"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={signInForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            {...field}
                                                            type="password"
                                                            placeholder="Your password"
                                                            className="pl-9"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        disabled={signInLoading}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {signInLoading ? 'Signing In...' : 'Sign In'}
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>

                        <TabsContent value="signup">
                            <Form {...signUpForm}>
                                <form onSubmit={signUpForm.handleSubmit(handleEmailSignUp)} className="space-y-4">
                                    <FormField
                                        control={signUpForm.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Name</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            {...field}
                                                            placeholder="Your name"
                                                            className="pl-9"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={signUpForm.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            {...field}
                                                            type="email"
                                                            placeholder="Your email"
                                                            className="pl-9"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={signUpForm.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                                        <Input
                                                            {...field}
                                                            type="password"
                                                            placeholder="Your password"
                                                            className="pl-9"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button
                                        type="submit"
                                        disabled={signUpLoading}
                                        className="w-full"
                                        size="lg"
                                    >
                                        {signUpLoading ? 'Signing Up...' : 'Sign Up'}
                                    </Button>
                                </form>
                            </Form>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SignInModal;
