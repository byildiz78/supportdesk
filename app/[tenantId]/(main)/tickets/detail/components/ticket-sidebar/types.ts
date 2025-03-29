// Common types for Ticket Sidebar components

export interface Ticket {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    assigned_to?: string;
    company_id?: string;
    category_id?: string;
    subcategory_id?: string;
    group_id?: string;
    contact_id?: string;
    contact_name?: string;
    contact_position?: string;
    contact_email?: string;
    contact_phone?: string;
    created_at: string;
    updated_at: string;
    due_date?: string;
    tags?: string[];
    // Add other ticket properties as needed
}

export interface ContactInfo {
    name: string;
    position: string;
    email: string;
    phone: string;
}

export interface Company {
    id: string;
    name: string;
}

export interface Contact {
    id: string;
    name?: string;
    firstName?: string;
    first_name?: string;
    lastName?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    position?: string;
    company_id?: string;
}

export interface User {
    id: string;
    name: string;
    email?: string;
}

export interface Category {
    id: string;
    name: string;
    subcategories: Subcategory[];
}

export interface Subcategory {
    id: string;
    name: string;
    category_id: string;
}

export interface Group {
    id: string;
    name: string;
}

export interface Tag {
    id: string;
    name: string;
    isNew?: boolean;
}

export interface SelectOption {
    value: string;
    label: string;
}

// Base props that most components will need
export interface BaseTicketComponentProps {
    isLoading?: boolean;
    isDisabled?: boolean;
}

// Component-specific props
export interface CompanySelectorProps extends BaseTicketComponentProps {
    companies: Company[];
    filteredCompanies?: Company[];
    companySearch: string;
    selectedCompanyId?: string;
    handleCompanyChange: (companyId?: string) => void;
    handleCompanyInputChange: (inputValue: string) => void;
    selectClassNames: any;
    selectStyles: any;
    selectTheme: any;
    menuPortalTarget: HTMLElement | null;
}

export interface ContactInformationProps extends BaseTicketComponentProps {
    contactInfo: ContactInfo;
    isEditingContact: boolean;
    setIsEditingContact: (value: boolean) => void;
    handleContactInfoChange: (field: string, value: string) => void;
    loadingContactInfo: boolean;
}

export interface AssignedUserSelectorProps extends BaseTicketComponentProps {
    ticket: Ticket;
    users: User[];
    handleAssignedToChange: (userId?: string) => void;
    refetchUsers: any;
    selectClassNames: any;
    selectStyles: any;
    selectTheme: any;
    menuPortalTarget: HTMLElement | null;
}

export interface TicketStatusSectionProps extends BaseTicketComponentProps {
    ticket: Ticket;
    handleStatusChange: (status?: string) => void;
    handlePriorityChange: (priority?: string) => void;
    selectClassNames: any;
    selectStyles: any;
    selectTheme: any;
    menuPortalTarget: HTMLElement | null;
}

export interface TicketCategorySelectorProps extends BaseTicketComponentProps {
    ticket: Ticket;
    categories: Category[];
    groups: Group[];
    handleCategoryChange: (categoryId?: string) => void;
    handleSubcategoryChange: (subcategoryId?: string) => void;
    handleGroupChange: (groupId?: string) => void;
    selectClassNames: any;
    selectStyles: any;
    selectTheme: any;
    menuPortalTarget: HTMLElement | null;
}

export interface TicketTagsSectionProps extends BaseTicketComponentProps {
    ticket: Ticket;
    tags: Tag[];
    handleAddTag: (tagName: string) => void;
    handleRemoveTag: (tagId: string) => void;
}

export interface TicketDatesInfoProps {
    ticket: Ticket;
}

export interface TicketActionsProps {
    ticket: Ticket;
    isSaving: boolean;
    isResolvingTicket: boolean;
    hasChanges: boolean;
    handleSave: () => void;
    handleResolveClick: () => void;
    isDisabled: boolean;
}

export interface ResolveTicketModalProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    resolutionDetails: string;
    setResolutionDetails: (details: string) => void;
    resolutionTags: Tag[];
    newTag: string;
    setNewTag: (tag: string) => void;
    handleAddResolutionTag: () => void;
    handleRemoveResolutionTag: (tag: Tag) => void;
    handleResolveTicket: () => void;
    isResolvingTicket: boolean;
    ticket: Ticket;
}
