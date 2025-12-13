'use client'

import { LuUserPlus } from "react-icons/lu";
import { Button, Tooltip, Modal, AutoComplete, Select, Avatar, Space, Typography, Spin } from "antd"
import { useState } from "react";
import { userService } from "@/services/user.service";
import { tripService } from "@/services/trip.service";
import { useTripContext } from "@/contexts/TripContext";
import type { User } from "@/interfaces";
import { useUser } from "@clerk/nextjs";
import { useToastMessage } from "@/contexts/ToastMessageContext";

const { Text } = Typography;

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

    const handleSelect = (value: string) => {
        const user = searchResults.find(u => u.id === value);
        if (user) {
            setSelectedUser(user);
            setSearchValue(user.name);
        }
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

    const options = searchResults.map(user => ({
        value: user.id,
        label: (
            <Space>
                <Avatar src={user.photoUrl} size="small">
                    {user.name.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                    <Text strong>{user.name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {user.email}
                    </Text>
                </div>
            </Space>
        ),
    }));

    return (
        <>
            <Tooltip title="Add Member">
                <Button
                    icon={<LuUserPlus className="ml-1 font-bold" />}
                    type="default"
                    shape="circle"
                    size="large"
                    className="ml-1"
                    onClick={() => setIsModalOpen(true)}
                />
            </Tooltip>
            <Modal
                title={
                    <div className="flex items-center justify-center">
                        <span className="font-bold text-2xl">Invite Tripmates</span>
                    </div>
                }
                open={isModalOpen}
                onCancel={handleCancel}
                footer={[
                    <Button key="cancel" onClick={handleCancel}>
                        Cancel
                    </Button>,
                    <Button
                        key="invite"
                        type="primary"
                        onClick={handleInvite}
                        loading={isInviting}
                        disabled={!selectedUser}
                    >
                        Invite
                    </Button>
                ]}
            >
                <div className="space-y-4 py-4">
                    {/* Search User */}
                    <div>
                        <Text strong>Search User</Text>
                        <Spin spinning={isSearching}>
                            <AutoComplete
                                className="w-full mt-2"
                                value={searchValue}
                                options={options}
                                onSearch={handleSearch}
                                onSelect={handleSelect}
                                placeholder="Search by name or email"
                                notFoundContent={
                                    searchValue.length >= 2 && !isSearching
                                        ? "No users found"
                                        : searchValue.length < 2
                                        ? "Type at least 2 characters to search"
                                        : null
                                }
                            />
                        </Spin>
                    </div>

                    {/* Selected User Display */}
                    {selectedUser && (
                        <div className="border rounded-lg p-3 bg-gray-50">
                            <Text type="secondary" className="text-xs">
                                Selected User
                            </Text>
                            <div className="flex items-center gap-3 mt-2">
                                <Avatar src={selectedUser.photoUrl}>
                                    {selectedUser.name.charAt(0).toUpperCase()}
                                </Avatar>
                                <div>
                                    <Text strong>{selectedUser.name}</Text>
                                    <br />
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {selectedUser.email}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Role Selection */}
                    <div>
                        <Text strong>Role</Text>
                        <Select
                            className="w-full mt-2"
                            value={selectedRole}
                            onChange={setSelectedRole}
                            options={[
                                { value: "viewer", label: "Viewer - Can view trip details" },
                                { value: "editor", label: "Editor - Can edit trip and itinerary" },
                                { value: "admin", label: "Admin - Full access including member management" },
                            ]}
                        />
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default InviteMemberModal