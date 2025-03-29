"use client"

import React, { useState } from "react"
import { Tag as TagIcon, Plus, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast/use-toast"
import { BaseTicketComponentProps, Tag } from "./types"

interface TicketTagsSectionProps extends BaseTicketComponentProps {
    tags: Tag[];
    handleAddTag: (tag: string) => void;
    handleRemoveTag: (tagId: string) => void;
}

const TicketTagsSection: React.FC<TicketTagsSectionProps> = ({
    tags,
    handleAddTag,
    handleRemoveTag,
    isDisabled = false
}) => {
    const [newTagInput, setNewTagInput] = useState<string>("");

    const handleAddNewTag = () => {
        if (!newTagInput.trim()) return;

        // Check if tag already exists
        if (tags.some(tag => tag.name.toLowerCase() === newTagInput.trim().toLowerCase())) {
            toast({
                title: "Uyarı",
                description: "Bu etiket zaten eklenmiş",
                variant: "default",
            });
            return;
        }

        handleAddTag(newTagInput.trim());
        setNewTagInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddNewTag();
        }
    };

    return (
        <div>
            <h3 className="text-sm font-semibold mb-1.5">Etiketler</h3>
            <div className="border rounded-md p-2">
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {tags.length === 0 ? (
                        <div className="text-xs text-gray-500 py-1">Henüz etiket eklenmemiş</div>
                    ) : (
                        tags.map(tag => (
                            <Badge 
                                key={tag.id} 
                                variant="secondary" 
                                className="flex items-center gap-1 px-2 py-1 h-6"
                            >
                                <span className="text-xs truncate max-w-[150px]">{tag.name}</span>
                                {!isDisabled && (
                                    <button 
                                        onClick={() => handleRemoveTag(tag.id)}
                                        className="h-3.5 w-3.5 rounded-full hover:bg-gray-200 flex items-center justify-center"
                                    >
                                        <X className="h-2.5 w-2.5" />
                                    </button>
                                )}
                            </Badge>
                        ))
                    )}
                </div>
                
                {!isDisabled && (
                    <div className="flex items-center space-x-1">
                        <div className="flex-1 relative">
                            <TagIcon className="h-3.5 w-3.5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                            <Input
                                value={newTagInput}
                                onChange={(e) => setNewTagInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="h-7 pl-7 text-xs"
                                placeholder="Yeni etiket ekle..."
                            />
                        </div>
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 px-2"
                            onClick={handleAddNewTag}
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketTagsSection;
