export interface MainCompany {
    id: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    flowId: string;
    notes: string;
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
    updatedBy?: string;
}

export interface Company {
    id: string;
    name: string;
    mainCompanyId: string;
    mainCompanyName: string;
    address: string;
    phone: string;
    email: string;
    flowId: string;
    notes: string;
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
    updatedBy?: string;
}

export interface Contact {
    id: string;
    name: string;
    title: string;
    phone: string;
    email: string;
    flowId: string;
    notes: string;
    createdAt: string;
    createdBy: string;
    updatedAt?: string;
    updatedBy?: string;
}