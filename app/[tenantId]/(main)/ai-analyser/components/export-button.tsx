'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ExportButtonProps {
    contentRef: React.RefObject<HTMLDivElement>
    fileName?: string
}

export function ExportButton({ contentRef, fileName = 'ai-analiz-raporu' }: ExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    const exportAsPDF = async () => {
        if (!contentRef.current) return
        
        try {
            setIsExporting(true)
            
            // PDF oluştur
            const pdf = new jsPDF('p', 'mm', 'a4')
            const element = contentRef.current
            
            // Sayfa genişliği
            const pdfWidth = pdf.internal.pageSize.getWidth()
            
            // Sayfanın ekran görüntüsünü al
            const canvas = await html2canvas(element, {
                scale: 2, // Daha yüksek kalite için
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            })
            
            // Canvas'ı PDF'e dönüştür
            const imgData = canvas.toDataURL('image/png')
            
            // Görüntü oranını hesapla ve PDF'e ekle
            const imgWidth = pdfWidth
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            
            let heightLeft = imgHeight
            let position = 0
            
            // İlk sayfayı ekle
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pdf.internal.pageSize.getHeight()
            
            // Gerekirse ek sayfalar ekle
            while (heightLeft > 0) {
                position = heightLeft - imgHeight
                pdf.addPage()
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
                heightLeft -= pdf.internal.pageSize.getHeight()
            }
            
            // PDF'i indir
            pdf.save(`${fileName}-${new Date().toISOString().slice(0, 10)}.pdf`)
        } catch (error) {
            console.error('PDF dışa aktarma hatası:', error)
            alert('PDF dışa aktarma sırasında bir hata oluştu.')
        } finally {
            setIsExporting(false)
        }
    }

    const exportAsHTML = () => {
        if (!contentRef.current) return
        
        try {
            setIsExporting(true)
            
            // İçeriği HTML olarak al
            const htmlContent = contentRef.current.innerHTML
            
            // Stil ekle
            const styledHTML = `
                <!DOCTYPE html>
                <html lang="tr">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>AI Analiz Raporu</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 1200px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        h1, h2, h3 { color: #2563eb; }
                        table {
                            border-collapse: collapse;
                            width: 100%;
                            margin: 20px 0;
                        }
                        th, td {
                            border: 1px solid #ddd;
                            padding: 8px;
                            text-align: left;
                        }
                        th { background-color: #f2f7ff; }
                        tr:nth-child(even) { background-color: #f9f9f9; }
                    </style>
                </head>
                <body>
                    <h1>AI Analiz Raporu</h1>
                    <p>Oluşturulma Tarihi: ${new Date().toLocaleDateString('tr-TR')}</p>
                    <hr>
                    ${htmlContent}
                </body>
                </html>
            `
            
            // HTML dosyasını indir
            const blob = new Blob([styledHTML], { type: 'text/html' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.html`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (error) {
            console.error('HTML dışa aktarma hatası:', error)
            alert('HTML dışa aktarma sırasında bir hata oluştu.')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                    {isExporting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Dışa Aktarılıyor...</span>
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4" />
                            <span>Dışa Aktar</span>
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportAsHTML} disabled={isExporting}>
                    HTML olarak indir
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
