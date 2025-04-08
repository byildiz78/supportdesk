import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Message } from '../types'
import { useEffect, useState } from 'react'
import { DebugView } from './debug-view'
import { RawTable } from './raw-table'

interface MessageContentProps {
    message: Message
}

// Markdown içeriğinden tabloları çıkaran yardımcı fonksiyon
const extractTables = (content: string): { tables: string[], positions: number[], titles: string[] } => {
    // Eğer content undefined veya boş ise, boş sonuç döndür
    if (!content) {
        return { tables: [], positions: [], titles: [] };
    }
    
    const tables: string[] = [];
    const positions: number[] = [];
    const titles: string[] = [];
    const lines = content.split('\n');
    let currentTable: string[] = [];
    let inTable = false;
    let tableStartIndex = 0;
    let potentialTitle = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Tablo başlığını tespit et
        if (!inTable && i < lines.length - 1 && lines[i + 1].trim().startsWith('|') && lines[i + 1].trim().endsWith('|')) {
            potentialTitle = line;
        }
        
        if (line.startsWith('|') && line.endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableStartIndex = i;
                currentTable = []; // Yeni bir tablo başlat
                
                // Eğer önceki satır bir başlık olabilecek bir metin ise
                if (i > 0 && !lines[i - 1].trim().startsWith('|') && lines[i - 1].trim() !== '') {
                    potentialTitle = lines[i - 1].trim();
                }
            }
            currentTable.push(lines[i]); // Orijinal satırı kullan
            
            // Eğer sonraki satır tablo değilse veya son satırdaysak, tabloyu işle
            if (i === lines.length - 1 || !lines[i + 1].trim().startsWith('|')) {
                if (currentTable.length >= 1) {
                    tables.push(currentTable.join('\n'));
                    positions.push(tableStartIndex);
                    titles.push(potentialTitle);
                }
                currentTable = [];
                inTable = false;
                potentialTitle = '';
            }
        }
    }

    return { tables, positions, titles };
};

// Markdown içeriğini temizleyip normalize eden fonksiyon
const cleanMarkdown = (content: string): string => {
    // Eğer content undefined veya boş ise, boş string döndür
    if (!content) {
        return '';
    }
    
    let cleanedContent = content;
    
    // Yaygın tablo biçimlendirme sorunlarını düzelt
    // Başlıkların hash işaretinden sonra boşluk olmasını sağla
    cleanedContent = cleanedContent.replace(/###(\w)/g, '### $1');
    cleanedContent = cleanedContent.replace(/##(\w)/g, '## $1');
    cleanedContent = cleanedContent.replace(/#(\w)/g, '# $1');
    
    // Liste öğelerinin tire işaretinden sonra boşluk olmasını sağla
    cleanedContent = cleanedContent.replace(/\n-(\w)/g, '\n- $1');
    
    // Tabloları düzelt
    cleanedContent = fixTables(cleanedContent);
    
    return cleanedContent;
};

// Tablolarda eksik ayırıcı satırları ve başlık satırlarını ekleyen fonksiyon
const fixTables = (content: string): string => {
    if (!content) return '';
    
    const lines = content.split('\n');
    const result: string[] = [];
    let inTable = false;
    let tableStartIndex = -1;
    let hasSeparator = false;
    let tableHeaderCells = 0;
    let lastLineWasTableHeader = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Karmaşık başlık formatını kontrol et (başlık ve tablo başlığı birleşmiş)
        if (!inTable && line.includes('|') && line.endsWith('|') && !line.startsWith('|')) {
            // Başlık ve tablo başlığını ayır
            const parts = line.split('|');
            const titlePart = parts[0].trim();
            
            // Başlık kısmını ekle
            if (titlePart) {
                result.push(titlePart);
            }
            
            // Tablo başlığı kısmını oluştur
            const tableHeaderPart = '|' + parts.slice(1).join('|');
            result.push(tableHeaderPart);
            
            // Tablo işlemeyi başlat
            inTable = true;
            tableStartIndex = result.length - 1;
            tableHeaderCells = tableHeaderPart.split('|').filter(cell => cell.trim() !== '').length;
            hasSeparator = false;
            lastLineWasTableHeader = true;
            continue;
        }
        
        // Tablo satırı tespit et
        if (line.startsWith('|') && line.endsWith('|')) {
            if (!inTable) {
                inTable = true;
                tableStartIndex = result.length;
                tableHeaderCells = line.split('|').filter(cell => cell.trim() !== '').length;
                hasSeparator = false;
                lastLineWasTableHeader = true;
            } else {
                lastLineWasTableHeader = false;
            }
            
            // Ayırıcı satır kontrolü
            if (line.replace(/[\|\s\-:]/g, '').length === 0) {
                hasSeparator = true;
            }
            
            result.push(lines[i]);
            
            // Tablo sonu kontrolü
            if (i === lines.length - 1 || !lines[i + 1].trim().startsWith('|')) {
                // Tablo bitti, ayırıcı satır kontrolü yap
                if (tableStartIndex !== -1 && !hasSeparator && result.length > tableStartIndex + 1) {
                    // Ayırıcı satır oluştur ve ekle
                    const headerRow = result[tableStartIndex];
                    const headerCells = headerRow.split('|').filter(cell => cell.trim() !== '');
                    const separatorRow = '|' + headerCells.map(() => '---').join('|') + '|';
                    
                    // Ayırıcı satırı başlık satırından sonra ekle
                    result.splice(tableStartIndex + 1, 0, separatorRow);
                }
                
                inTable = false;
                tableStartIndex = -1;
                hasSeparator = false;
                lastLineWasTableHeader = false;
            }
        } else {
            result.push(lines[i]);
            // Tablo içinde değilsek ve bu satır tablo değilse, tablo durumunu sıfırla
            if (inTable && !lastLineWasTableHeader) {
                inTable = false;
                tableStartIndex = -1;
                hasSeparator = false;
                lastLineWasTableHeader = false;
            }
        }
    }

    return result.join('\n');
};

// Başlık ve tablo arasında boş satır olup olmadığını kontrol et
const fixHeaderTableSpacing = (content: string): string => {
    // Eğer content undefined veya boş ise, boş string döndür
    if (!content) {
        return '';
    }
    
    // Başlık satırlarını bul
    const headerRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    let result = content;
    
    while ((match = headerRegex.exec(content)) !== null) {
        const headerLine = match[0];
        const headerIndex = match.index;
        const headerEndIndex = headerIndex + headerLine.length;
        
        // Başlıktan sonraki içeriğe bak
        const afterHeader = content.substring(headerEndIndex);
        const nextLineIndex = afterHeader.indexOf('\n');
        const nextLine = nextLineIndex !== -1 ? afterHeader.substring(0, nextLineIndex).trim() : '';
        
        // Eğer başlıktan hemen sonra tablo başlıyorsa, araya boş satır ekle
        if (nextLine.startsWith('|') && nextLine.endsWith('|')) {
            const replacement = headerLine + '\n\n';
            result = result.substring(0, headerIndex) + replacement + result.substring(headerEndIndex);
        }
    }
    
    return result;
};

export function MessageContent({ message }: MessageContentProps) {
    const [processedContent, setProcessedContent] = useState(message.content);
    const [tables, setTables] = useState<string[]>([]);
    const [showDebug, setShowDebug] = useState(false);

    useEffect(() => {
        // Markdown içeriğini temizle
        const cleaned = cleanMarkdown(message.content);
        
        // Başlık ve tablo arasındaki boşlukları düzelt
        const fixedSpacing = fixHeaderTableSpacing(cleaned);
        
        // Tabloları çıkar
        const { tables: extractedTables, positions, titles } = extractTables(fixedSpacing);
        setTables(extractedTables);
        
        // Tabloları işaretleyerek içeriği ayarla
        let contentWithTableMarkers = fixedSpacing;
        
        // Tabloları sondan başa doğru değiştir (indekslerin kaymaması için)
        for (let i = extractedTables.length - 1; i >= 0; i--) {
            const tableContent = extractedTables[i];
            const tableLines = tableContent.split('\n');
            const startLine = positions[i];
            const tableTitle = titles[i];
            
            // Tablonun başlangıç ve bitiş indekslerini bul
            const contentLines = contentWithTableMarkers.split('\n');
            const endLine = startLine + tableLines.length - 1;
            
            // Tablonun olduğu kısmı işaretleyici ile değiştir
            const beforeTable = contentLines.slice(0, startLine - (tableTitle ? 1 : 0)).join('\n');
            const afterTable = contentLines.slice(endLine + 1).join('\n');
            
            contentWithTableMarkers = beforeTable + 
                (beforeTable ? '\n' : '') + 
                `<TABLE_MARKER_${i}>` + 
                (afterTable ? '\n' : '') + 
                afterTable;
        }
        
        setProcessedContent(contentWithTableMarkers);
        
        // Hata ayıklama için tabloları logla
        if (extractedTables.length > 0) {
        }
    }, [message.content]);

    // İçeriği parçalara ayırıp, tablo işaretleyicilerini gerçek tablolarla değiştir
    const renderContent = () => {
        if (!processedContent) return null;
        
        // İçeriği tablo işaretleyicilerine göre parçalara ayır
        const parts = processedContent.split(/<TABLE_MARKER_(\d+)>/);
        
        return parts.map((part, index) => {
            // Tek sayılı indeksler tablo numaralarını içerir
            if (index % 2 === 1) {
                const tableIndex = parseInt(part, 10);
                return <RawTable key={`table-${tableIndex}`} markdown={tables[tableIndex]} />;
            }
            
            // Çift sayılı indeksler normal içeriği içerir
            if (!part.trim()) return null;
            
            return (
                <ReactMarkdown
                    key={`text-${index}`}
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({ node, ...props }) => (
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed my-4" {...props} />
                        ),
                        h1: ({ node, ...props }) => (
                            <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-6 mb-4" {...props} />
                        ),
                        h2: ({ node, ...props }) => (
                            <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-5 mb-3" {...props} />
                        ),
                        h3: ({ node, ...props }) => (
                            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-4 mb-2" {...props} />
                        ),
                        ul: ({ node, ...props }) => (
                            <ul className="list-disc pl-6 my-4 text-gray-600 dark:text-gray-300" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                            <ol className="list-decimal pl-6 my-4 text-gray-600 dark:text-gray-300" {...props} />
                        ),
                    }}
                >
                    {part}
                </ReactMarkdown>
            );
        }).filter(Boolean); // null değerleri filtrele
    };

    return (
        <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-blue-900 dark:prose-headings:text-blue-100 prose-p:text-gray-600 dark:prose-p:text-gray-300">
            {renderContent()}
            
            {/* Debug butonu */}
            <div className="mt-4 flex justify-end">
                <button 
                    onClick={() => setShowDebug(!showDebug)}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                    {showDebug ? 'Hata Ayıklamayı Gizle' : 'Hata Ayıklamayı Göster'}
                </button>
            </div>
            
            {/* Hata ayıklama görünümü */}
            {showDebug && <DebugView message={message} />}
        </div>
    )
}
