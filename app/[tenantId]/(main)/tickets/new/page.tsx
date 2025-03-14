"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Save } from "lucide-react"
import { useTicketStore } from "@/stores/ticket-store"
import { FileAttachment } from "@/types/tickets"

// Import form components
import TicketInfoForm from "../components/TicketInfoForm"
import ParentCompanyForm from "../components/ParentCompanyForm"
import CompanyForm from "../components/CompanyForm"
import ContactForm from "../components/ContactForm"
import AssignmentForm from "../components/AssignmentForm"

export default function NewTicketPage() {
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [ticketData, setTicketData] = useState({
    // Ticket info
    title: "",
    description: "",
    category: "",
    subcategory: "",
    group: "",
    priority: "medium",
    
    // Parent company info
    parentCompanyId: "",
    parentCompanyName: "",
    
    // Company info
    companyId: "",
    companyName: "",
    
    // Contact info
    contactId: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactPosition: "",
    
    // Assignment info
    source: "web",
    assignedTo: "",
    dueDate: null as string | null,
    slaBreach: false,
    
    // Tags
    tags: [] as string[]
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      // Convert files to FileAttachment format
      const attachments: FileAttachment[] = files.map(file => ({
        id: Math.random().toString(36).substring(7),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        uploadedAt: new Date().toISOString(),
        uploadedBy: "current_user"
      }))

      // Create ticket object with attachments
      const newTicket = {
        id: Math.random().toString(36).substring(7),
        title: ticketData.title,
        description: ticketData.description,
        status: "open",
        priority: ticketData.priority,
        source: ticketData.source,
        category: ticketData.category,
        subcategory: ticketData.subcategory,
        group: ticketData.group,
        
        // Company and contact references
        parentCompanyId: ticketData.parentCompanyId,
        parentCompanyName: ticketData.parentCompanyName,
        companyId: ticketData.companyId,
        companyName: ticketData.companyName,
        contactId: ticketData.contactId,
        contactName: ticketData.contactName,
        contactEmail: ticketData.contactEmail,
        contactPhone: ticketData.contactPhone,
        contactPosition: ticketData.contactPosition,
        
        // Assignment info
        assignedTo: ticketData.assignedTo,
        dueDate: ticketData.dueDate,
        slaBreach: ticketData.slaBreach,
        
        createdBy: "current_user",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attachments,
        comments: [],
        tags: ticketData.tags
      }

      // Add ticket to store
      useTicketStore.getState().addTicket(newTicket)
      
      // Reset form or redirect to ticket list
      alert("Talep başarıyla oluşturuldu!")
      
    } catch (error) {
      console.error('Error submitting form:', error)
      setError(error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <ScrollArea className="flex-1 px-4 overflow-y-auto">
        <div className="space-y-6 pb-24">
          {/* Ticket Information Form */}
          <TicketInfoForm 
            title={ticketData.title}
            description={ticketData.description}
            category={ticketData.category}
            subcategory={ticketData.subcategory}
            group={ticketData.group}
            priority={ticketData.priority}
            files={files}
            onTitleChange={(value) => setTicketData(prev => ({ ...prev, title: value }))}
            onDescriptionChange={(value) => setTicketData(prev => ({ ...prev, description: value }))}
            onCategoryChange={(value) => setTicketData(prev => ({ ...prev, category: value }))}
            onSubcategoryChange={(value) => setTicketData(prev => ({ ...prev, subcategory: value }))}
            onGroupChange={(value) => setTicketData(prev => ({ ...prev, group: value }))}
            onPriorityChange={(value) => setTicketData(prev => ({ ...prev, priority: value }))}
            onFileChange={handleFileChange}
            onFileRemove={removeFile}
          />

          {/* Parent Company Form */}
          <ParentCompanyForm 
            parentCompanyId={ticketData.parentCompanyId}
            parentCompanyName={ticketData.parentCompanyName}
            onParentCompanyIdChange={(value) => setTicketData(prev => ({ 
              ...prev, 
              parentCompanyId: value,
              // Reset company and contact when parent company changes
              companyId: "",
              companyName: "",
              contactId: "",
              contactName: "",
              contactEmail: "",
              contactPhone: "",
              contactPosition: ""
            }))}
            onParentCompanyNameChange={(value) => setTicketData(prev => ({ ...prev, parentCompanyName: value }))}
          />

          {/* Company Form */}
          <CompanyForm 
            parentCompanyId={ticketData.parentCompanyId}
            companyId={ticketData.companyId}
            companyName={ticketData.companyName}
            onCompanyIdChange={(value) => setTicketData(prev => ({ 
              ...prev, 
              companyId: value,
              // Reset contact when company changes
              contactId: "",
              contactName: "",
              contactEmail: "",
              contactPhone: "",
              contactPosition: ""
            }))}
            onCompanyNameChange={(value) => setTicketData(prev => ({ ...prev, companyName: value }))}
          />

          {/* Contact Form */}
          <ContactForm 
            companyId={ticketData.companyId}
            contactId={ticketData.contactId}
            contactName={ticketData.contactName}
            contactEmail={ticketData.contactEmail}
            contactPhone={ticketData.contactPhone}
            contactPosition={ticketData.contactPosition}
            onContactIdChange={(value) => setTicketData(prev => ({ ...prev, contactId: value }))}
            onContactNameChange={(value) => setTicketData(prev => ({ ...prev, contactName: value }))}
            onContactEmailChange={(value) => setTicketData(prev => ({ ...prev, contactEmail: value }))}
            onContactPhoneChange={(value) => setTicketData(prev => ({ ...prev, contactPhone: value }))}
            onContactPositionChange={(value) => setTicketData(prev => ({ ...prev, contactPosition: value }))}
          />

          {/* Assignment Form */}
          <AssignmentForm 
            assignedTo={ticketData.assignedTo}
            source={ticketData.source}
            dueDate={ticketData.dueDate}
            slaBreach={ticketData.slaBreach}
            onAssignedToChange={(value) => setTicketData(prev => ({ ...prev, assignedTo: value }))}
            onSourceChange={(value) => setTicketData(prev => ({ ...prev, source: value }))}
            onDueDateChange={(value) => setTicketData(prev => ({ ...prev, dueDate: value }))}
            onSlaBreachChange={(value) => setTicketData(prev => ({ ...prev, slaBreach: value }))}
          />
        </div>
      </ScrollArea>

      {/* Save Button */}
      <div className="sticky bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t mt-auto">
        <div className="flex justify-end max-w-full mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Kaydediliyor..." : "Talebi Oluştur"}
          </Button>
        </div>
      </div>
    </div>
  )
}