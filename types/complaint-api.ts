export interface ComplaintInput {
    title: string;
    description: string;
    branchId: string;
    source: string;
    status: string;
    priority: string;
    category: string;
    assignedToId: string;
    assignedToName: string;
    observers?: string;
    observers_id?: string;
    customerName?: string;
    customerContact?: string;
  }
  