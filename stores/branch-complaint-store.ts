import { BranchComplaintComment } from '@/app/[tenantId]/(main)/branchcomplaint/branch-complaint-types';
import { create } from 'zustand';

interface BranchComplaint {
  id: number;
  Title: string;
  Description: string;
  BranchID: string;
  BranchName: string;
  Source: string;
  Status: string;
  Priority: string;
  CustomerName: string;
  CustomerContact: string;
  Assigned_to_id: string;
  Assigned_to_Name: string;
  Observers: string;
  Observers_id: string;
  CreatedUserName: string;
  Created_by_id: string;
  Username: string;
  Category?: string;
  Attachments?: string[];
  Created_at: string; // API ile uyumlu field adı
}

interface BranchComplaintState {
  complaints: BranchComplaint[];
  timeline: BranchComplaintComment[];
  addBranchComplaint: (complaint: BranchComplaint) => void;
  updateBranchComplaint: (complaint: BranchComplaint) => void;
  setBranchComplaints: (complaints: BranchComplaint[]) => void;
  addBranchTimelineItem: (item: BranchComplaintComment) => void;
  setBranchTimeline: (timeline: BranchComplaintComment[]) => void;
}

export const useBranchComplaintStore = create<BranchComplaintState>((set) => ({
  complaints: [],
  timeline: [],
  addBranchComplaint: (complaint) =>
    set((state) => ({
      complaints: [complaint, ...state.complaints],
    })),
  updateBranchComplaint: (complaint) =>
    set((state) => ({
      complaints: [
        complaint,
        ...state.complaints.filter((c) => c.id !== complaint.id),
      ],
    })),
  setBranchComplaints: (complaints) => set({ complaints }),
  addBranchTimelineItem: (item) =>
    set((state) => ({
      timeline: [item, ...state.timeline],
    })),
    setBranchTimeline: (timeline) => set({ timeline }),
}));
