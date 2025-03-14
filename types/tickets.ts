export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    source: 'email' | 'phone' | 'web' | 'chat';
    category: string;
    subcategory?: string;
    group?: string;
    assignedTo?: string;
    assignedToName?: string;
    parentCompanyId?: string;
    parentCompanyName?: string;
    companyId?: string;
    companyName?: string;
    contactId?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactPosition?: string;
    dueDate?: string;
    resolutionTime?: number; // in minutes
    slaBreach?: boolean;
    tags?: string[];
    attachments?: FileAttachment[];
    comments?: TicketComment[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface ParentCompany {
    id: string;
    name: string;
    taxId?: string;
    taxOffice?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    industry?: string;
    companyType?: string;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Company {
    id: string;
    parentCompanyId?: string;
    parentCompanyName?: string;
    name: string;
    taxId?: string;
    taxOffice?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    industry?: string;
    companyType?: string;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Contact {
    id: string;
    companyId: string;
    companyName?: string;
    firstName: string;
    lastName: string;
    position?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    notes?: string;
    isPrimary: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface FileAttachment {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    uploadedAt: string;
    uploadedBy: string;
}

export interface TicketComment {
    id: string;
    ticketId: string;
    content: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
    isInternal: boolean;
    attachments?: FileAttachment[];
}

export interface TicketFilter {
    status?: string[];
    priority?: string[];
    category?: string[];
    subcategory?: string[];
    group?: string[];
    assignedTo?: string[];
    parentCompanyId?: string[];
    companyId?: string[];
    contactId?: string[];
    dateRange?: {
        from: string;
        to: string;
    };
    slaBreach?: boolean;
}