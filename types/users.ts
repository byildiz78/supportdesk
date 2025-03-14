export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'agent';
    department: string;
    status: 'active' | 'inactive';
    lastLogin: string;
    createdAt: string;
    profileImageUrl?: string;
    createdBy?: string;
    updatedAt?: string;
    updatedBy?: string;
    flowID?: string;
    isDeleted?: boolean;
}

export interface UserFilter {
    role?: string[];
    department?: string[];
    status?: string[];
    searchTerm?: string;
}
