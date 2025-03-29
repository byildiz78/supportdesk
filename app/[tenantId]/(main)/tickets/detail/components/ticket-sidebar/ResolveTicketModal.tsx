"use client"

import React from "react"
import { Tag as TagIcon, Plus, X, Loader2, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BaseTicketComponentProps, Tag } from "./types"

interface ResolveTicketModalProps extends BaseTicketComponentProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    resolutionDetails: string;
    setResolutionDetails: (details: string) => void;
    resolutionTags: Tag[];
    newTag: string;
    setNewTag: (tag: string) => void;
    handleAddResolutionTag: () => void;
    handleRemoveResolutionTag: (tag: Tag) => void;
    handleResolveTicket: () => Promise<void>;
    isResolvingTicket: boolean;
}

const ResolveTicketModal: React.FC<ResolveTicketModalProps> = ({
    isOpen,
    setIsOpen,
    resolutionDetails,
    setResolutionDetails,
    resolutionTags,
    newTag,
    setNewTag,
    handleAddResolutionTag,
    handleRemoveResolutionTag,
    handleResolveTicket,
    isResolvingTicket
}) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddResolutionTag();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Bileti Çözümlendi Olarak Kapat</DialogTitle>
                    <DialogDescription>
                        Lütfen çözüm detaylarını ve ilgili etiketleri girin.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="resolution-details">Çözüm Detayları</Label>
                        <Textarea
                            id="resolution-details"
                            value={resolutionDetails}
                            onChange={(e) => setResolutionDetails(e.target.value)}
                            placeholder="Çözüm detaylarını buraya yazın..."
                            className="min-h-[100px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Çözüm Etiketleri</Label>
                        <div className="border rounded-md p-2">
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {resolutionTags.length === 0 ? (
                                    <div className="text-xs text-gray-500 py-1">Henüz etiket eklenmemiş</div>
                                ) : (
                                    resolutionTags.map(tag => (
                                        <Badge 
                                            key={tag.id} 
                                            variant="secondary" 
                                            className={`flex items-center gap-1 px-2 py-1 h-6 ${tag.isNew ? 'bg-blue-100' : ''}`}
                                        >
                                            <span className="text-xs truncate max-w-[150px]">{tag.name}</span>
                                            <button 
                                                onClick={() => handleRemoveResolutionTag(tag)}
                                                className="h-3.5 w-3.5 rounded-full hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <X className="h-2.5 w-2.5" />
                                            </button>
                                        </Badge>
                                    ))
                                )}
                            </div>
                            <div className="flex items-center space-x-1">
                                <div className="flex-1 relative">
                                    <TagIcon className="h-3.5 w-3.5 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
                                    <Input
                                        value={newTag}
                                        onChange={(e) => setNewTag(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        className="h-7 pl-7 text-xs"
                                        placeholder="Yeni etiket ekle..."
                                    />
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-7 px-2"
                                    onClick={handleAddResolutionTag}
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        disabled={isResolvingTicket}
                    >
                        İptal
                    </Button>
                    <Button
                        onClick={handleResolveTicket}
                        disabled={isResolvingTicket || !resolutionDetails.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white"
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
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ResolveTicketModal;
