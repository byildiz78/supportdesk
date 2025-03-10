export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    source: 'email' | 'phone' | 'web' | 'chat';
    category: string;
    assignedTo?: string;
    assignedToName?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    companyName?: string;
    companyId?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    contactPosition?: string;
    tags?: string[];
    attachments?: FileAttachment[];
    comments?: TicketComment[];
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
    assignedTo?: string[];
    dateRange?: {
        start: string;
        end: string;
    };
    source?: string[];
    searchTerm?: string;
}