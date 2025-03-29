"use client"

import React from "react"
import { User, Loader2, RefreshCw } from "lucide-react"
import ReactSelect from "react-select"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast/use-toast"
import { BaseTicketComponentProps, SelectOption } from "./types"

interface AssignedUserSelectorProps extends BaseTicketComponentProps {
    users: { id: string; name: string }[];
    selectedUserId?: string;
    handleAssignedToChange: (userId?: string) => void;
    refetchUsers: () => Promise<void>;
    selectClassNames: any;
    selectStyles: any;
    selectTheme: any;
    menuPortalTarget: HTMLElement | null;
}

const AssignedUserSelector: React.FC<AssignedUserSelectorProps> = ({
    users,
    selectedUserId,
    handleAssignedToChange,
    refetchUsers,
    selectClassNames,
    selectStyles,
    selectTheme,
    menuPortalTarget,
    isLoading = false
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center space-x-2 p-2 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className="text-xs text-gray-500">Kullanıcılar yükleniyor...</span>
            </div>
        );
    }

    const userOptions: SelectOption[] = users.map(user => ({
        value: user.id || "",
        label: user.name || "İsimsiz Kullanıcı"
    }));

    const handleRefreshUsers = async () => {
        try {
            await refetchUsers();
            toast({
                title: "Başarılı",
                description: "Kullanıcı listesi güncellendi.",
                variant: "default",
                duration: 2000
            });
        } catch (error) {
            toast({
                title: "Hata",
                description: "Kullanıcı listesi güncellenirken bir hata oluştu.",
                variant: "destructive",
                duration: 3000
            });
        }
    };

    return (
        <div className="flex flex-col space-y-1.5">
            <div className="flex items-start space-x-2">
                <User className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                <div className="w-full relative">
                    <div className="flex items-center space-x-2">
                        <div className="flex-1">
                            <ReactSelect
                                options={userOptions}
                                value={userOptions.find(option => option.value === selectedUserId)}
                                onChange={(option) => handleAssignedToChange(option?.value)}
                                placeholder="Seçiniz"
                                className="w-full max-w-full"
                                classNames={selectClassNames}
                                styles={selectStyles}
                                menuPortalTarget={menuPortalTarget}
                                unstyled
                                theme={selectTheme}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-8 px-2 bg-blue-600 hover:bg-blue-700 hover:text-white text-white"
                            onClick={handleRefreshUsers}
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignedUserSelector;
