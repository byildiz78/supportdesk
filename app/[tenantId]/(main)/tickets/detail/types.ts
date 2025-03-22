export interface Attachment {
  id: string;
  name: string;
  originalFilename: string;
  size: number;
  mimeType: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Comment {
  id: string;
  ticketId: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  attachments?: Attachment[];
}

export interface Tag {
  id: string;
  name: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category_id: string | null;
  subcategory_id: string | null;
  company_id: string | null;
  company_name: string | null;
  contact_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  // Contact bilgileri
  contact_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_position: string | null;
  assigned_to: string | null;
  assignedTo: string | null; // Added for API compatibility
  assigned_user_name: string | null; // Added to display the assigned user's name
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  due_date: string | null;
  comments: Comment[];
  attachments: Attachment[];
  tags?: Tag[]; // Added for ticket tags
  source?: string | null;
  group_id?: string | null;
  parent_company_id?: string | null;
  sla_breach?: boolean | null;
  resolution_time?: number | null;
  updated_by?: string | null;
  isUpdate?: boolean;
  [key: string]: any;
}

export interface Company {
  id: string;
  name: string;
  [key: string]: any;
}

export interface Contact {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  companyId?: string;
  companyName?: string;
  company_id?: string;
  company_name?: string;
  // Ek alanlar
  [key: string]: any;
}
