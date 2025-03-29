"use client"

import React from "react"
import { Save, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BaseTicketComponentProps } from "./types"

interface TicketActionsProps extends BaseTicketComponentProps {
    isSaving: boolean;
    isResolvingTicket: boolean;
    hasChanges: boolean;
    handleSave: () => Promise<void>;
    handleResolveClick: () => void;
}

const TicketActions: React.FC<TicketActionsProps> = ({
    isSaving,
    isResolvingTicket,
    hasChanges,
    handleSave,
    handleResolveClick,
    isDisabled = false
}) => {
    return (
        <div className="flex items-center justify-between space-x-2 mt-4">
            <Button
                variant="outline"
                className="flex-1 h-9"
                onClick={handleResolveClick}
                disabled={isDisabled || isSaving || isResolvingTicket}
            >
                {isResolvingTicket ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        İşleniyor...
                    </>
                ) : (
                    <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Çözümlendi olarak Kapat
                    </>
                )}
            </Button>
            
            <Button
                className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSave}
                disabled={isDisabled || isSaving || !hasChanges}
            >
                {isSaving ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Kaydediliyor...
                    </>
                ) : (
                    <>
                        <Save className="h-4 w-4 mr-2" />
                        Kaydet
                    </>
                )}
            </Button>
        </div>
    );
};

export default TicketActions;
