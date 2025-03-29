"use client"

import React from "react"
import { AlertCircle, Edit, Phone, User, Mail, Building } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { ContactInfo, BaseTicketComponentProps } from "./types"

interface ContactInformationProps extends BaseTicketComponentProps {
    contactInfo: ContactInfo;
    isEditingContact: boolean;
    setIsEditingContact: (value: boolean) => void;
    handleContactInfoChange: (field: string, value: string) => void;
    loadingContactInfo?: boolean;
}

const ContactInformation: React.FC<ContactInformationProps> = ({
    contactInfo,
    isEditingContact,
    setIsEditingContact,
    handleContactInfoChange,
    isLoading = false,
    loadingContactInfo = false
}) => {
    if (isLoading || loadingContactInfo) {
        return (
            <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-xs text-gray-500">Kişi bilgileri yükleniyor...</span>
            </div>
        );
    }

    return (
        <div className="border rounded-md p-2 space-y-1.5">
            <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-gray-500">İletişim Bilgileri</h4>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsEditingContact(!isEditingContact)}
                >
                    <Edit className="h-3.5 w-3.5" />
                </Button>
            </div>

            <div className="space-y-1.5">
                {isEditingContact ? (
                    <>
                        <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <Input
                                value={contactInfo.phone}
                                onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                                className="h-7 text-sm"
                                placeholder="Telefon"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <Input
                                value={contactInfo.name}
                                onChange={(e) => handleContactInfoChange('name', e.target.value)}
                                className="h-7 text-sm"
                                placeholder="Ad Soyad"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <Input
                                value={contactInfo.email}
                                onChange={(e) => handleContactInfoChange('email', e.target.value)}
                                className="h-7 text-sm"
                                placeholder="E-posta"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Building className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <Input
                                value={contactInfo.position}
                                onChange={(e) => handleContactInfoChange('position', e.target.value)}
                                className="h-7 text-sm"
                                placeholder="Pozisyon"
                            />
                        </div>
                        <div className="flex justify-end space-x-2 mt-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setIsEditingContact(false)}
                            >
                                İptal
                            </Button>
                            <Button
                                size="sm"
                                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => setIsEditingContact(false)}
                            >
                                Tamam
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        {!contactInfo.phone && !contactInfo.name && !contactInfo.email && !contactInfo.position ? (
                            <div className="text-xs text-gray-500 flex items-center">
                                <AlertCircle className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                İletişim bilgisi bulunmuyor
                            </div>
                        ) : (
                            <>
                                {contactInfo.phone && (
                                    <div className="flex items-center text-xs">
                                        <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                                        <span className="truncate">{contactInfo.phone}</span>
                                    </div>
                                )}
                                {contactInfo.name && (
                                    <div className="flex items-center text-xs">
                                        <User className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                                        <span className="truncate">{contactInfo.name}</span>
                                    </div>
                                )}
                                {contactInfo.email && (
                                    <div className="flex items-center text-xs">
                                        <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                                        <span className="truncate">{contactInfo.email}</span>
                                    </div>
                                )}
                                {contactInfo.position && (
                                    <div className="flex items-center text-xs">
                                        <Building className="h-3.5 w-3.5 mr-1.5 text-gray-500 flex-shrink-0" />
                                        <span className="truncate">{contactInfo.position}</span>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ContactInformation;
