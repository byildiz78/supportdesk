"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, X } from "lucide-react"
import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getUserId } from "@/utils/user-utils"
import axios from "@/lib/axios"
import { useTicketStore } from "@/stores/ticket-store"

interface FileUploadProps {
    ticketId: string;
    onSubmit?: (files: File[], attachments: any[]) => void;
    disabled?: boolean;
}

export function FileUpload({ ticketId, onSubmit, disabled = false }: FileUploadProps) {
    const [files, setFiles] = useState<File[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState("")
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    const { addAttachments } = useTicketStore()
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return
        
        setIsUploading(true)
        setUploadProgress(0)
        setError("")
        
        try {
            // Create form data for file upload
            const formData = new FormData();
            
            // Add each file to the form data
            files.forEach(file => {
                formData.append('file', file);
            });
            
            // API'nin beklediği entityType ve createdBy parametrelerini ekleyelim
            formData.append('entityType', 'ticket');
            formData.append('entityId', ticketId);
            formData.append('createdBy', getUserId() || '1f56b863-0363-407f-8466-b9495b8b4ff9');
            
            // Upload the files
            const response = await axios.post('/api/main/files/uploadFile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percentCompleted > 95 ? 95 : percentCompleted); // Cap at 95% until completely done
                    }
                }
            });
            
            // Set to 100% when done
            setUploadProgress(100);
            
            if (!response.data.success) {
                throw new Error(response.data?.message || 'Dosya yükleme başarısız');
            }
            
            const uploadResult = response.data;
            let uploadedAttachments: any[] = [];
            
            // API yanıtındaki dosya bilgilerini kullan
            if (uploadResult.files && uploadResult.files.length > 0) {
                uploadedAttachments = uploadResult.files.map((file: any) => {
                    return {
                        id: file.id,
                        name: file.name,
                        originalFilename: file.originalFilename || file.name,
                        size: file.size,
                        mimeType: file.mimeType,
                        url: file.url,
                        storagePath: file.storagePath || `/uploads/${file.name}`,
                        uploadedAt: file.uploadedAt || new Date().toISOString(),
                        uploadedBy: file.uploadedBy || uploadResult.metadata.createdBy
                    };
                });
            } 
            // Eğer API dosya bilgilerini döndürmediyse ve metadata varsa
            else if (uploadResult.metadata && (!uploadResult.files || uploadResult.files.length === 0) && files && files.length > 0) {
                // Yüklenen dosyaları kullanarak dosya bilgilerini oluştur
                uploadedAttachments = files.map((file, index) => {
                    // Benzersiz bir ID oluştur
                    const fileId = `temp-${Date.now()}-${index}`;
                    // Dosya adını al
                    const fileName = file.name;
                    // Dosya uzantısını al
                    const fileExt = fileName.substring(fileName.lastIndexOf('.'));
                    // Dosya boyutunu al
                    const fileSize = file.size;
                    // Dosya tipini al
                    const fileType = file.type;
                    // Dosya URL'ini oluştur
                    const fileUrl = `${uploadResult.metadata.basePath}/uploads/${fileId}${fileExt}`;

                    return {
                        id: fileId,
                        name: fileName,
                        originalFilename: fileName,
                        size: fileSize,
                        mimeType: fileType, 
                        url: fileUrl,
                        uploadedAt: new Date().toISOString(),
                        uploadedBy: uploadResult.metadata.createdBy
                    };
                });
            } else {
                uploadedAttachments = [];
            }
            
            if (uploadedAttachments.length > 0) {
                // API'den dönen dosya formatını store'un beklediği formata dönüştür
                const formattedAttachments = uploadedAttachments.map((attachment) => ({
                    id: attachment.id,
                    name: attachment.name,
                    originalFilename: attachment.originalFilename,
                    size: attachment.size,
                    type: attachment.mimeType,
                    url: attachment.url,
                    uploaded_at: attachment.uploadedAt,
                    uploaded_by: attachment.uploadedBy
                }));
                
                // Add attachments to store with ticket ID
                addAttachments(ticketId, formattedAttachments);
                
                // Notify parent component if callback exists
                if (onSubmit) {
                    onSubmit(files, formattedAttachments);
                }
                
                // Reset state
                setFiles([]);
                
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadProgress(0);
                }, 500);
                
                toast({
                    title: "Başarılı",
                    description: `${files.length} dosya başarıyla yüklendi`,
                });
            } else {
                throw new Error('Dosya yükleme sırasında beklenmeyen bir hata oluştu');
            }
        } catch (error: unknown) {
            setUploadProgress(0);
            
            // Error handling
            let errorMessage = 'Bilinmeyen bir hata oluştu';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            console.error('Dosya yükleme hatası:', error);
            
            toast({
                title: "Hata",
                description: errorMessage,
                variant: "destructive"
            });
            
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || disabled}
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Dosya Seç
                </Button>
                <Button 
                    type="button" 
                    onClick={handleUpload}
                    disabled={files.length === 0 || isUploading || disabled}
                >
                    {isUploading ? "Yükleniyor..." : "Dosyaları Yükle"}
                </Button>
                <Input 
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
