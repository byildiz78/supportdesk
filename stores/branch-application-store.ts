import { create } from 'zustand'
import { BranchApplication, ApplicationStatus, ApplicationActivity } from '@/app/[tenantId]/(main)/branchapplication/branch-application-types'

interface BranchApplicationStore {
  applications: BranchApplication[]
  activities: Record<number, ApplicationActivity[]>
  setApplications: (applications: BranchApplication[]) => void
  addApplication: (application: BranchApplication) => void
  updateApplication: (id: number, application: Partial<BranchApplication>) => void
  addActivity: (applicationId: number, activity: Omit<ApplicationActivity, "id">) => void
  updateStatus: (applicationId: number, newStatus: ApplicationStatus, userId: number, userName: string) => void
}

export const useBranchApplicationStore = create<BranchApplicationStore>((set, get) => ({
  applications: [],
  activities: {},
  setApplications: (applications) => set({ applications }),
  addApplication: (application) => 
    set((state) => ({ 
      applications: [...state.applications, application] 
    })),
  updateApplication: (id, application) =>
    set((state) => ({
      applications: state.applications.map((item) =>
        item.id === id ? { ...item, ...application } : item
      ),
    })),
  addActivity: (applicationId, activity) =>
    set((state) => ({
      activities: {
        ...state.activities,
        [applicationId]: [
          ...(state.activities[applicationId] || []),
          { ...activity, id: Date.now() }
        ]
      }
    })),
  updateStatus: (applicationId, newStatus, userId, userName) => {
    const application = get().applications.find(app => app.id === applicationId);
    if (!application) return;

    const oldStatus = application.Status;

    // Update application status
    get().updateApplication(applicationId, { Status: newStatus });

    // Add status change activity
    get().addActivity(applicationId, {
      applicationId,
      type: "status_change",
      description: `Başvuru durumu değiştirildi: ${statusMap[oldStatus]} → ${statusMap[newStatus]}`,
      oldStatus,
      newStatus,
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date().toISOString()
    });
  }
}))