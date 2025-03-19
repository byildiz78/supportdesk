"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getUserId } from "@/utils/user-utils"
import axios from "@/lib/axios"

interface FileUploadProps {
    ticketId: string;
    onUploadComplete: (files: any[]) => void;
}

export function FileUpload({ ticketId, onUploadComplete }: FileUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            toast({
                title: "Hata",
                description: "Lütfen yüklenecek dosya seçin",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            
            // Add each file to the form data
            files.forEach(file => {
                formData.append('file', file);
            });
            
            // Add metadata
            formData.append('entityType', 'ticket');
            formData.append('entityId', ticketId);
            formData.append('createdBy', getUserId() || '1f56b863-0363-407f-8466-b9495b8b4ff9');
            
            // Upload the files
            const uploadResponse = await axios.post('/supportdesk/api/main/files/uploadFile', formData);
            
            if (!uploadResponse.data.success) {
                throw new Error('Dosya yükleme başarısız');
            }
            
            const uploadResult = uploadResponse.data;
            
            if (uploadResult.success) {
                toast({
                    title: "Başarılı",
                    description: `${files.length} dosya başarıyla yüklendi`,
                });
                
                // Clear the files
                setFiles([]);
                
                // Notify parent component
                onUploadComplete(uploadResult.files || []);
            } else {
                throw new Error(uploadResult.message || 'Dosya yükleme başarısız');
            }
        } catch (error: any) {
            console.error('Dosya yükleme hatası:', error);
            toast({
                title: "Hata",
                description: error.message || "Dosya yüklenirken bir hata oluştu",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Dosya Seç
                </Button>
                <Button 
                    type="button" 
                    onClick={handleUpload}
                    disabled={files.length === 0 || isUploading}
                >
                    {isUploading ? "Yükleniyor..." : "Dosyaları Yükle"}
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                />
            </div>
            
            {files.length > 0 && (
                <div className="border rounded-md p-3">
                    <p className="text-sm text-gray-500 mb-2">Seçilen Dosyalar ({files.length})</p>
                    <div className="space-y-2">
                        {files.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium truncate max-w-[200px]" title={file.name}>
                                        {file.name}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                        ({Math.round(file.size / 1024)} KB)
                                    </span>
                                </div>
                                <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleRemoveFile(index)}
                                    disabled={isUploading}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
