"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TicketService } from "@/app/[tenantId]/(main)/tickets/detail/services/ticket-service";
import { formatDates } from "@/lib/utils";
import { calculateSlaTime } from "@/app/[tenantId]/(main)/tickets/components/config/ticket-config";
import { 
  Loader2, Phone, Mail, Building, User, Calendar, Clock, 
  Flag, Tag, MessageSquare, AlertCircle, FileText, Info, X, 
  ArrowLeft, Paperclip, ExternalLink, AlertTriangle, Download,
  ChevronUp, ChevronDown
} from "lucide-react";

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
  ticketNo: number | null;
}

interface Attachment {
  id: string;
  url: string;
  name: string;
  filename: string;
  originalFilename: string;
  contentType?: string; // İsteğe bağlı olarak dosya türü bilgisi
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  createdByName: string;
  isInternal: boolean;
  attachments: Attachment[];
  htmlContent: string | null;
}

interface TicketDetail {
  id: string;
  ticketno: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  source: string;
  category_name: string;
  subcategory_name: string;
  group_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  company_name: string;
  contact_name: string;
  assigned_user_name: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  resolution_notes: string | null;
  comments: Comment[];
  sla_breach: boolean;
  // camelCase versiyonları
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string | null;
  categoryName?: string;
  subcategoryName?: string;
  groupName?: string;
  companyName?: string;
  contactName?: string;
  assignedUserName?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
  resolutionNotes?: string | null;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  ticketNo,
}) => {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTicketDetails = async () => {
      if (!ticketId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await TicketService.getTicketById(ticketId);
        
        // API'den gelen snake_case verileri camelCase versiyonlarıyla birleştir
        const processedTicket: TicketDetail = {
          ...response as any, // response'u TicketDetail tipine dönüştür
          // Eksik olabilecek alanları manuel olarak ekle
          ticketno: response.ticketno || response.ticket_no || 0,
          title: response.title || response.subject || '',
          description: response.description || '',
          status: response.status || '',
          priority: response.priority || '',
          source: response.source || '',
          category_name: response.category_name || '',
          subcategory_name: response.subcategory_name || '',
          group_name: response.group_name || '',
          customer_name: response.customer_name || '',
          customer_email: response.customer_email || '',
          customer_phone: response.customer_phone || null,
          company_name: response.company_name || '',
          contact_name: response.contact_name || '',
          assigned_user_name: response.assigned_user_name || '',
          due_date: response.due_date || '',
          created_at: response.created_at || '',
          updated_at: response.updated_at || '',
          resolution_notes: response.resolution_notes || null,
          comments: response.comments || [],
          sla_breach: response.sla_breach || false,
          
          // camelCase versiyonları
          customerName: response.customer_name || '',
          customerEmail: response.customer_email || '',
          customerPhone: response.customer_phone || null,
          categoryName: response.category_name || '',
          subcategoryName: response.subcategory_name || '',
          groupName: response.group_name || '',
          companyName: response.company_name || '',
          contactName: response.contact_name || '',
          assignedUserName: response.assigned_user_name || '',
          dueDate: response.due_date || '',
          createdAt: response.created_at || '',
          updatedAt: response.updated_at || '',
          resolutionNotes: response.resolution_notes || null,
        };
        
        setTicket(processedTicket);
      } catch (err) {
        console.error("Bilet detayları alınırken hata oluştu:", err);
        setError("Bilet detayları alınırken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && ticketId) {
      fetchTicketDetails();
    }
  }, [isOpen, ticketId]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
      case "yüksek":
        return "bg-red-500";
      case "medium":
      case "orta":
        return "bg-yellow-500";
      case "low":
      case "düşük":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
      case "açık":
        return "bg-blue-500";
      case "in_progress":
      case "işlemde":
        return "bg-yellow-500";
      case "resolved":
      case "çözüldü":
        return "bg-green-500";
      case "closed":
      case "kapatıldı":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "Açık";
      case "in_progress":
        return "İşlemde";
      case "resolved":
        return "Çözüldü";
      case "closed":
        return "Kapatıldı";
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "Yüksek";
      case "medium":
        return "Orta";
      case "low":
        return "Düşük";
      default:
        return priority;
    }
  };

  const renderInfoItem = (icon: React.ReactNode, label: string, value: React.ReactNode | string | null | undefined) => {
    return (
      <div className="flex items-center py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <div className="text-gray-500 mr-3">{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-0.5">{label}</p>
          <p className="text-sm font-medium">{value || "-"}</p>
        </div>
      </div>
    );
  };

  // Dosya tipini kontrol eden yardımcı fonksiyon
  const getFileType = (filename: string, contentType?: string): string => {
    // Eğer contentType varsa, buna göre dosya tipini belirle
    if (contentType) {
      if (contentType.startsWith('image/')) return 'image';
      if (contentType.startsWith('video/')) return 'video';
      if (contentType.startsWith('audio/')) return 'audio';
      if (contentType === 'application/pdf') return 'pdf';
    }
    
    // URL'den dosya tipini tahmin et
    if (filename.includes('.wav') || filename.includes('.mp3') || filename.includes('vapi.ai') && filename.includes('stereo.wav')) {
      return 'audio';
    }
    
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    // Resim dosyaları
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return 'image';
    }
    
    // PDF dosyaları
    if (extension === 'pdf') {
      return 'pdf';
    }
    
    // Video dosyaları
    if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
      return 'video';
    }
    
    // Ses dosyaları
    if (['mp3', 'wav', 'ogg', 'aac'].includes(extension)) {
      return 'audio';
    }
    
    // Diğer dosya türleri
    return 'other';
  };

  // URL'in Google Drive veya benzeri bir servis olup olmadığını kontrol et
  const isExternalStorageUrl = (url: string): boolean => {
    return url.includes('drive.google.com') || 
           url.includes('docs.google.com') || 
           url.includes('drivesdk') ||
           url.includes('googleusercontent.com');
  };

  // Google Drive URL'lerini gömülebilir formata dönüştür
  const getEmbedUrl = (url: string): string => {
    // Google Drive dosya linki
    if (url.includes('drive.google.com/file/d/')) {
      // Drive linki: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
      const match = url.match(/\/d\/([^/]+)/);
      if (match && match[1]) {
        const fileId = match[1];
        return `https://drive.google.com/file/d/${fileId}/preview`;
      }
    }
    
    // Google Docs, Sheets veya Slides
    if (url.includes('docs.google.com') && 
        (url.includes('/document/') || url.includes('/spreadsheets/') || url.includes('/presentation/'))) {
      // Format: https://docs.google.com/document/d/DOC_ID/edit?usp=sharing
      const match = url.match(/\/d\/([^/]+)/);
      if (match && match[1]) {
        const docId = match[1];
        if (url.includes('/document/')) {
          return `https://docs.google.com/document/d/${docId}/preview`;
        } else if (url.includes('/spreadsheets/')) {
          return `https://docs.google.com/spreadsheets/d/${docId}/preview`;
        } else if (url.includes('/presentation/')) {
          return `https://docs.google.com/presentation/d/${docId}/embed`;
        }
      }
    }
    
    // Google resim, video formatını da anlayıp destekleyelim
    if (url.includes('googleusercontent.com')) {
      return url; // Bu URL'ler genellikle direkt erişilebilir
    }
    
    // Dönüştürülemeyen URL için orjinali döndür
    return url;
  };

  // Ek bileşeni - dosya türüne göre uygun görüntüleyici gösterir
  const AttachmentViewer = ({ attachment }: { attachment: Attachment }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileName = attachment.originalFilename || attachment.filename || attachment.name;
    const fileType = getFileType(fileName, attachment.contentType);

    const toggleExpand = () => {
      setIsExpanded(!isExpanded);
      if (!isExpanded && fileType === 'image') {
        setIsLoading(true);
      }
    };

    const handleImageLoad = () => {
      setIsLoading(false);
    };

    const handleImageError = () => {
      setIsLoading(false);
      setImageError(true);
    };

    // URL güvenliği için - bazı attachment URL'leri doğrudan erişilebilir olmayabilir
    const fileUrl = attachment.url || '';
    const isExternalStorage = isExternalStorageUrl(fileUrl);
    const embedUrl = isExternalStorage ? getEmbedUrl(fileUrl) : fileUrl;

    return (
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-2">
        <div 
          className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 cursor-pointer"
          onClick={toggleExpand}
        >
          <div className="flex items-center gap-2 text-sm truncate">
            <Paperclip className="h-4 w-4 text-gray-500" />
            <span className="truncate max-w-[200px]">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? 
              <ChevronUp className="h-4 w-4 text-gray-500" /> : 
              <ChevronDown className="h-4 w-4 text-gray-500" />
            }
          </div>
        </div>
        
        {isExpanded && (
          <div className="p-3 bg-white dark:bg-gray-900">
            {fileType === 'image' && !imageError && !isExternalStorage ? (
              <div className="flex justify-center relative min-h-[200px]">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                )}
                <img 
                  src={fileUrl} 
                  alt={fileName} 
                  className={`max-w-full max-h-[500px] object-contain rounded ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              </div>
            ) : fileType === 'audio' ? (
              <div className="w-full flex flex-col items-center">
                <audio 
                  controls 
                  className="w-full max-w-md my-2"
                  controlsList="nodownload"
                >
                  <source src={fileUrl} type={attachment.contentType || "audio/wav"} />
                  Tarayıcınız ses oynatmayı desteklemiyor.
                </audio>
                <a 
                  href={fileUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Yeni sekmede aç
                </a>
              </div>
            ) : isExternalStorage ? (
              <div className="w-full">
                <iframe
                  src={embedUrl}
                  className="w-full h-[500px] border-0 rounded"
                  allowFullScreen
                  title={fileName}
                  onError={() => {
                    setImageError(true);
                  }}
                ></iframe>
              </div>
            ) : fileType === 'image' && imageError ? (
              <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <div className="h-12 w-12 text-gray-400 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Görüntü yüklenemedi
                </p>
                <a 
                  href={fileUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Görüntüle
                </a>
              </div>
            ) : fileType === 'pdf' || fileType === 'video' || fileType === 'other' ? (
              <div className="text-center p-6">
                <p className="text-sm text-gray-500 mb-3">Bu dosya ayrı bir pencerede görüntülenebilir</p>
                <a 
                  href={fileUrl} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Görüntüle
                </a>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  // Yorumları HTML içeriğinden ses dosyalarını çıkarıp oynatılabilir hale getiren fonksiyon
  const renderCommentContent = (content: string) => {
    // Eğer içerik HTML değilse doğrudan göster
    if (!content.includes('<') || !content.includes('>')) {
      return <p className="whitespace-pre-wrap text-sm">{content}</p>;
    }
    
    // Ses dosyası linklerini audio elementine dönüştür
    const processedContent = content.replace(
      /<a href=['"](https:\/\/storage\.vapi\.ai\/[^'"]+\.wav)['"][^>]*>([^<]+)<\/a>/g,
      (match, url, text) => {
        return `<div class="my-3">
          <p class="text-xs font-medium mb-1 text-gray-500">${text}</p>
          <audio controls class="w-full max-w-md" controlsList="nodownload">
            <source src="${url}" type="audio/wav">
            Tarayıcınız ses oynatmayı desteklemiyor.
          </audio>
        </div>`;
      }
    );
    
    return (
      <div 
        className="prose prose-sm max-w-none dark:prose-invert text-sm"
        dangerouslySetInnerHTML={{ __html: processedContent }}
      />
    );
  };

  const renderComments = () => {
    if (!ticket?.comments || ticket.comments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-white dark:bg-gray-900 rounded-lg my-3 border border-gray-100 dark:border-gray-800">
          <MessageSquare className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-500 text-sm">Henüz yorum bulunmamaktadır.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3 mt-3">
        {ticket.comments
          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          .map((comment) => (
            <div 
              key={comment.id} 
              className={`p-4 rounded-lg border ${
                comment.isInternal 
                  ? "bg-gray-50 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700" 
                  : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
              }`}
            >
              <div className="flex justify-between items-start mb-3 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{comment.createdByName || "Sistem"}</p>
                    {comment.isInternal && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                        Dahili
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDates(comment.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="mt-2 overflow-x-auto max-w-full">
                {comment.htmlContent ? (
                  renderCommentContent(comment.htmlContent)
                ) : comment.content && comment.content.includes('<') && comment.content.includes('>') ? (
                  renderCommentContent(comment.content)
                ) : (
                  <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
                )}
              </div>
              
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                    <Paperclip className="h-3 w-3" />
                    Ekler ({comment.attachments.length})
                  </p>
                  <div className="space-y-2">
                    {comment.attachments.map((attachment) => (
                      <AttachmentViewer key={attachment.id} attachment={attachment} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
      </div>
    );
  };

  const SectionTitle = ({ icon, title, className = "" }: { icon: React.ReactNode, title: string, className?: string }) => (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
      <div className={`text-primary ${className}`}>{icon}</div>
      <h4 className={`text-sm font-semibold text-gray-800 dark:text-gray-200 ${className}`}>{title}</h4>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-full sm:max-w-[95%] h-[100dvh] sm:h-[95dvh] p-0 rounded-none sm:rounded-lg flex flex-col overflow-hidden border-0 sm:border shadow-lg">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="h-8 w-8 rounded-full mr-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 dark:text-white">#{ticketNo}</span>
                {ticket && (
                  <Badge className={`${getStatusColor(ticket.status)} text-white text-xs px-2 py-0.5`}>
                    {getStatusText(ticket.status)}
                  </Badge>
                )}
              </div>
              {ticket && (
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{ticket.title}</p>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <span className="text-sm text-gray-500">Yükleniyor...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center p-6 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800/30 max-w-md">
              <AlertCircle className="h-6 w-6 mx-auto mb-2" />
              <p className="font-medium mb-1">Hata Oluştu</p>
              <p>{error}</p>
            </div>
          </div>
        ) : ticket ? (
          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <div className="p-4 space-y-4">
              {/* Başlık */}
              {ticket.title && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                  <h3 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">{ticket.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge className={`${getPriorityColor(ticket.priority)} text-white text-xs`}>
                      {getPriorityText(ticket.priority)}
                    </Badge>
                    {ticket.sla_breach && (
                      <Badge variant="destructive" className="text-xs">SLA İhlali</Badge>
                    )}
                  </div>
                </div>
              )}
              
              {/* Açıklama */}
              {ticket.description && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                  <SectionTitle icon={<FileText className="h-4 w-4" />} title="Açıklama" />
                  <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{ticket.description}</p>
                </div>
              )}
              
              {/* Müşteri Bilgileri */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                <SectionTitle icon={<User className="h-4 w-4" />} title="Müşteri Bilgileri" />
                
                {renderInfoItem(
                  <Building className="h-4 w-4" />, 
                  "Şirket", 
                  ticket.companyName || ticket.company_name
                )}
                
                {renderInfoItem(
                  <User className="h-4 w-4" />, 
                  "Müşteri", 
                  ticket.customerName || ticket.customer_name
                )}
                
                {renderInfoItem(
                  <Mail className="h-4 w-4" />, 
                  "E-posta", 
                  ticket.customerEmail || ticket.customer_email
                )}
                
                {renderInfoItem(
                  <Phone className="h-4 w-4" />, 
                  "Telefon", 
                  ticket.customerPhone || ticket.customer_phone
                )}
              </div>
              
              {/* Destek Bilgileri */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                <SectionTitle icon={<Info className="h-4 w-4" />} title="Destek Bilgileri" />
                
                {renderInfoItem(
                  <Tag className="h-4 w-4" />, 
                  "Kategori", 
                  ticket.categoryName || ticket.category_name
                )}
                
                {renderInfoItem(
                  <Tag className="h-4 w-4" />, 
                  "Alt Kategori", 
                  ticket.subcategoryName || ticket.subcategory_name
                )}
                
                {renderInfoItem(
                  <User className="h-4 w-4" />, 
                  "Atanan", 
                  ticket.assignedUserName || ticket.assigned_user_name
                )}
                
                {renderInfoItem(
                  <Flag className="h-4 w-4" />, 
                  "Grup", 
                  ticket.groupName || ticket.group_name
                )}
              </div>
              
              {/* Tarih Bilgileri */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                <SectionTitle icon={<Calendar className="h-4 w-4" />} title="Tarih Bilgileri" />
                
                {renderInfoItem(
                  <Calendar className="h-4 w-4" />, 
                  "Oluşturulma", 
                  formatDates(ticket.createdAt || ticket.created_at)
                )}
                
                {renderInfoItem(
                  <Clock className="h-4 w-4" />, 
                  "Son Güncelleme", 
                  formatDates(ticket.updatedAt || ticket.updated_at)
                )}
                
                {renderInfoItem(
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />, 
                  "SLA", 
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {calculateSlaTime(ticket.dueDate || ticket.due_date || "", !!ticket.sla_breach)}
                  </span>
                )}
              </div>
              
              {/* Çözüm Notları */}
              {(ticket.resolutionNotes || ticket.resolution_notes) && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg shadow-sm border border-green-200 dark:border-green-800">
                  <SectionTitle icon={<AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />} title="Çözüm Notları" className="text-green-700 dark:text-green-400" />
                  <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">{ticket.resolutionNotes || ticket.resolution_notes}</p>
                  </div>
                </div>
              )}
              
              {/* Yorumlar */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
                <SectionTitle icon={<MessageSquare className="h-4 w-4" />} title="Yorumlar" />
                {renderComments()}
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Footer */}
        {!loading && !error && ticket && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <Button 
              variant="default" 
              onClick={onClose} 
              className="w-full py-2 h-10 rounded-md font-medium"
            >
              Kapat
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetailModal;
