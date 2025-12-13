export type UserRole = "user" | "admin";

export interface UserSettings {
  language?: string;
  timezone?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
  };
  privacy?: {
    showEmail?: boolean;
    showProfile?: boolean;
  };
}

export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  photoUrl?: string;
  bio?: string;
  role: UserRole;
  settings?: UserSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateUserRequest {
  name?: string;
  bio?: string;
  photoUrl?: string;
  settings?: UserSettings;
}

export interface CreateUserRequest {
  clerkId: string;
  email: string;
  name: string;
  photoUrl?: string;
}
