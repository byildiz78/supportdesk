"use client"

import React from "react"
import { Clock, Flag } from "lucide-react"
import ReactSelect from "react-select"
import { BaseTicketComponentProps, SelectOption } from "./types"

interface TicketStatusSectionProps extends BaseTicketComponentProps {
    status?: string;
    priority?: string;
    handleStatusChange: (status?: string) => void;
    handlePriorityChange: (priority?: string) => void;
    selectClassNames: any;
    selectStyles: any;
    selectTheme: any;
    menuPortalTarget: HTMLElement | null;
}

const TicketStatusSection: React.FC<TicketStatusSectionProps> = ({
    status,
    priority,
    handleStatusChange,
    handlePriorityChange,
    selectClassNames,
    selectStyles,
    selectTheme,
    menuPortalTarget,
    isDisabled = false
}) => {
    // Status options
    const statusOptions: SelectOption[] = [
        { value: "open", label: "Açık" },
        { value: "in_progress", label: "İşlemde" },
        { value: "waiting", label: "Beklemede" }
    ];

    // Priority options
    const priorityOptions: SelectOption[] = [
        { value: "low", label: "Düşük" },
        { value: "medium", label: "Orta" },
        { value: "high", label: "Yüksek" },
        { value: "urgent", label: "Acil" }
    ];

    return (
        <div className="space-y-3">
            {/* Durum */}
            <div>
                <h3 className="text-sm font-semibold mb-1.5">Durum</h3>
                <div className="flex items-start space-x-2">
                    <Clock className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                    <div className="w-full">
                        <ReactSelect
                            options={statusOptions}
                            value={statusOptions.find(option => option.value === status)}
                            onChange={(option) => handleStatusChange(option?.value)}
                            placeholder="Seçiniz"
                            className="w-full"
                            classNames={selectClassNames}
                            styles={selectStyles}
                            menuPortalTarget={menuPortalTarget}
                            unstyled
                            theme={selectTheme}
                            isDisabled={isDisabled}
                        />
                    </div>
                </div>
            </div>

            {/* Öncelik */}
            <div>
                <h3 className="text-sm font-semibold mb-1.5">Öncelik</h3>
                <div className="flex items-start space-x-2">
                    <Flag className="h-4 w-4 mt-1 text-gray-500 flex-shrink-0" />
                    <div className="w-full">
                        <ReactSelect
                            options={priorityOptions}
                            value={priorityOptions.find(option => option.value === priority)}
                            onChange={(option) => handlePriorityChange(option?.value)}
                            placeholder="Seçiniz"
                            className="w-full"
                            classNames={selectClassNames}
                            styles={selectStyles}
                            menuPortalTarget={menuPortalTarget}
                            unstyled
                            theme={selectTheme}
                            isDisabled={isDisabled}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketStatusSection;
