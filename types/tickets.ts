export interface Ticket {
    id: string;
    ticketno: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    source: string | null;
    
    // Fields from database schema
    category_id: string | null;
    category_name: string | null;
    subcategory_id: string | null;
    subcategory_name: string | null;
    group_id: string | null;
    group_name: string | null;
    assigned_to: string | null;
    assigned_to_name?: string | null; // Atanan kullanıcının adı
    assignedTo?: string | null; // camelCase version for API compatibility
    assignedUserName?: string | null; // Added for displaying assigned user name
    customer_name: string | null;
    customer_email: string | null;
    customer_phone: string | null;
    company_name: string | null;
    company_id: string | null;
    contact_id: string | null;
    contact_name: string | null;
    contact_first_name: string | null;
    contact_last_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    contact_position: string | null;
    due_date: string | null;
    resolution_time: number | null;
    parent_company_id: string | null;
    sla_breach: boolean | null;
    callcount?: number | null; // Aranma sayısı
    
    // CamelCase versions for frontend compatibility
    categoryId?: string | null;
    subcategoryId?: string | null;
    subcategoryName?: string | null;
    groupId?: string | null;
    groupName?: string | null;
    customerName?: string | null;
    customerEmail?: string | null;
    customerPhone?: string | null;
    companyName?: string | null;
    companyId?: string | null;
    contactId?: string | null;
    contactName?: string | null;
    contactPosition?: string | null;
    dueDate?: string | null;
    resolutionTime?: number | null;
    parentCompanyId?: string | null;
    slaBreach?: boolean | null;
    
    // Additional fields
    tags?: string[];
    attachments?: FileAttachment[];
    comments?: TicketComment[];
    created_at: string;
    created_by: string | null;
    created_by_name?: string | null; // Oluşturan kullanıcının adı
    updated_at: string | null;
    updated_by: string | null;
    is_deleted: boolean;
    
    // CamelCase versions for created/updated fields
    createdAt?: string;
    createdBy?: string | null;
    updatedAt?: string | null;
    updatedBy?: string | null;
}

export interface ParentCompany {
    id: string;
    name: string;
    tax_id?: string;
    tax_office?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    industry?: string;
    company_type?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Company {
    id: string;
    parent_company_id?: string;
    parent_company_name?: string;
    name: string;
    tax_id?: string;
    tax_office?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    industry?: string;
    company_type?: string;
    notes?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Contact {
    id: string;
    company_id: string;
    company_name?: string;
    first_name: string;
    last_name: string;
    position?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    notes?: string;
    is_primary: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface FileAttachment {
    id: string;
    name: string;
    originalFilename?: string;
    size: number;
    type?: string;
    mimeType?: string;
    url: string;
    uploaded_at?: string;
    uploaded_by?: string;
    uploadedAt?: string;
    uploadedBy?: string;
}

export interface TicketComment {
    id: string;
    ticket_id: string;
    content: string;
    created_by: string;
    created_by_name: string;
    created_at: string;
    is_internal: boolean;
    attachments?: FileAttachment[];
    
    // Email-specific fields
    email_id?: string;
    thread_id?: string;
    sender?: string;
    sender_email?: string;
    to_recipients?: string[];
    cc_recipients?: string[];
    html_content?: string;
    in_reply_to_email_id?: string;
}

export interface TicketFilter {
    status?: string[];
    priority?: string[];
    category?: string[];
    subcategory?: string[];
    group?: string[];
    assigned_to?: string[];
    parent_company_id?: string[];
    company_id?: string[];
    contact_id?: string[];
    date_range?: {
        from: string;
        to: string;
    };
    sla_breach?: boolean;
}
