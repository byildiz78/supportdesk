"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useCustomersStore } from "@/stores/customers-store"
import { Contact } from "@/types/customers"
import { User, Briefcase, Mail, Phone, Hash, FileText, Calendar } from "lucide-react"

interface ContactDetailPageProps {
    contactId: string;
}

export default function ContactDetailPage({ contactId }: ContactDetailPageProps) {
    const [contact, setContact] = useState<Contact | null>(null)
    const { contacts } = useCustomersStore()

    useEffect(() => {
        // In a real app, fetch from API. For now, find from store
        const found = contacts.find(c => c.id === contactId)
        setContact(found || null)
    }, [contactId, contacts])

    if (!contact) {
        return <div>Loading...</div>
    }

    return (
        <div className="flex flex-col space-y-6 p-4">
            {/* Kişi Bilgileri */}
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                            Kişi Bilgileri
                        </h3>
                        <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                            Temel kişi bilgileri
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label className="text-muted-foreground">Ad Soyad</Label>
                        <div className="mt-1 text-lg font-medium">{contact.name}</div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Ünvan</Label>
                        <div className="mt-1 flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-gray-500" />
                            <span className="text-lg font-medium">{contact.title}</span>
                        </div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Flow ID</Label>
                        <div className="mt-1 flex items-center gap-2">
                            <Hash className="h-4 w-4 text-gray-500" />
                            <span className="text-lg font-medium">{contact.flowId}</span>
                        </div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">E-posta</Label>
                        <div className="mt-1 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span className="text-lg font-medium">{contact.email}</span>
                        </div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Telefon</Label>
                        <div className="mt-1 flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-lg font-medium">{contact.phone}</span>
                        </div>
                    </div>
                    <div className="md:col-span-2">
                        <Label className="text-muted-foreground">Özel Notlar</Label>
                        <div className="mt-1 flex items-start gap-2">
                            <FileText className="h-4 w-4 text-gray-500 mt-1" />
                            <span className="text-lg">{contact.notes}</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Kayıt Bilgileri */}
            <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/50 dark:to-gray-800/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <Label className="text-muted-foreground">Oluşturulma Tarihi</Label>
                        <div className="mt-1 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{new Date(contact.createdAt).toLocaleString()}</span>
                        </div>
                    </div>
                    <div>
                        <Label className="text-muted-foreground">Oluşturan</Label>
                        <div className="mt-1 flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span>{contact.createdBy}</span>
                        </div>
                    </div>
                    {contact.updatedAt && (
                        <>
                            <div>
                                <Label className="text-muted-foreground">Son Güncelleme</Label>
                                <div className="mt-1 flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                    <span>{new Date(contact.updatedAt).toLocaleString()}</span>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Güncelleyen</Label>
                                <div className="mt-1 flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span>{contact.updatedBy}</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    )
}