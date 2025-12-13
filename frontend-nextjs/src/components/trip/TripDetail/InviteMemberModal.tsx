'use client'

import { LuUserPlus } from "react-icons/lu";
import { useState } from "react";
import { userService } from "@/services/user.service";
import { tripService } from "@/services/trip.service";
import { useTripContext } from "@/contexts/TripContext";
import type { User } from "@/interfaces";
import { useUser } from "@clerk/nextjs";
import { useToastMessage } from "@/contexts/ToastMessageContext";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'

const InviteMemberModal = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedRole, setSelectedRole] = useState<"admin" | "editor" | "viewer">("viewer");
    const [isSearching, setIsSearching] = useState(false);
    const [isInviting, setIsInviting] = useState(false);

    const { tripData, members, refetch } = useTripContext();
    const { user: currentUser } = useUser();
    const { showSuccess, showError } = useToastMessage();

    const handleSearch = async (value: string) => {
        setSearchValue(value);

        if (!value || value.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setIsSearching(true);
            const results = await userService.searchUsers(value);
            setSearchResults(results);
        } catch (error) {
            console.error("Search failed:", error);
            showError("Failed to search users");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectUser = (user: User) => {
        setSelectedUser(user);
        setSearchValue(user.name);
        setSearchResults([]);
    };

    const handleInvite = async () => {
        if (!selectedUser || !tripData) {
            showError("Please select a user to invite");
            return;
        }

        // Validate: can't invite yourself
        if (selectedUser.id === currentUser?.id) {
            showError("You cannot invite yourself");
            return;
        }

        // Validate: user already a member
        const isAlreadyMember = members.some(m => m.userId === selectedUser.id);
        if (isAlreadyMember) {
            showError("This user is already a member of this trip");
            return;
        }

        try {
            setIsInviting(true);
            await tripService.inviteMember(tripData.id, {
                userId: selectedUser.id,
                role: selectedRole,
            });

            showSuccess(`Invited ${selectedUser.name} as ${selectedRole}`);

            // Reset form
            setSelectedUser(null);
            setSearchValue("");
            setSearchResults([]);
            setSelectedRole("viewer");
            setIsModalOpen(false);

            // Refetch trip data to update members list
            refetch();
        } catch (error: any) {
            console.error("Invite failed:", error);
            showError(error.message || "Failed to invite member");
        } finally {
            setIsInviting(false);
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setSelectedUser(null);
        setSearchValue("");
        setSearchResults([]);
        setSelectedRole("viewer");
    };

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full ml-1"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <LuUserPlus className="font-bold" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Add Member</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCancel()}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold">
                            Invite Tripmates
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Search User */}
                        <div className="space-y-2">
                            <Label className="font-semibold">Search User</Label>
                            <div className="relative">
                                <Input
                                    value={searchValue}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search by name or email (min 2 characters)"
                                />
                                {isSearching && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Spinner size="sm" />
                                    </div>
                                )}
                            </div>

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="border rounded-lg max-h-60 overflow-y-auto">
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center gap-3"
                                            onClick={() => handleSelectUser(user)}
                                        >
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={user.photoUrl} />
                                                <AvatarFallback>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="font-semibold">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {searchValue.length >= 2 && !isSearching && searchResults.length === 0 && (
                                <p className="text-sm text-gray-500 text-center py-2">
                                    No users found
                                </p>
                            )}

                            {searchValue.length > 0 && searchValue.length < 2 && (
                                <p className="text-sm text-gray-500 text-center py-2">
                                    Type at least 2 characters to search
                                </p>
                            )}
                        </div>

                        {/* Selected User Display */}
                        {selectedUser && (
                            <div className="border rounded-lg p-3 bg-gray-50">
                                <p className="text-xs text-gray-500 mb-2">Selected User</p>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={selectedUser.photoUrl} />
                                        <AvatarFallback>
                                            {selectedUser.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-semibold">{selectedUser.name}</div>
                                        <div className="text-sm text-gray-500">{selectedUser.email}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Role Selection */}
                        <div className="space-y-2">
                            <Label className="font-semibold">Role</Label>
                            <Select
                                value={selectedRole}
                                onValueChange={(value: "admin" | "editor" | "viewer") => setSelectedRole(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viewer">Viewer - Can view trip details</SelectItem>
                                    <SelectItem value="editor">Editor - Can edit trip and itinerary</SelectItem>
                                    <SelectItem value="admin">Admin - Full access including member management</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={handleCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleInvite}
                            disabled={!selectedUser || isInviting}
                        >
                            {isInviting ? 'Inviting...' : 'Invite'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default InviteMemberModal
