import React from 'react';

interface RawTableProps {
    markdown?: string;
    data?: any[];
}

export function RawTable({ markdown, data }: RawTableProps) {
    // Eğer data varsa, veri tablosunu oluştur
    if (data && data.length > 0) {
        // Tüm anahtarları topla
        const allKeys = Array.from(
            new Set(
                data.flatMap(item => Object.keys(item))
            )
        );
        
        return (
            <div className="overflow-x-auto my-4">
                <table className="min-w-full border border-gray-300 dark:border-gray-700">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                            {allKeys.map((key, index) => (
                                <th 
                                    key={index} 
                                    className="px-4 py-2 text-left border-b border-gray-300 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300"
                                >
                                    {key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <tr 
                                key={rowIndex} 
                                className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}
                            >
                                {allKeys.map((key, cellIndex) => (
                                    <td 
                                        key={cellIndex} 
                                        className="px-4 py-2 border-t border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                                    >
                                        {row[key] !== undefined ? String(row[key]) : ''}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    
    // Eğer markdown undefined veya boş ise, null döndür
    if (!markdown) return null;
    
    // Tabloyu satırlara ayır
    const lines = markdown.split('\n');
    
    // Karmaşık başlık formatını kontrol et
    let processedLines = [...lines];
    for (let i = 0; i < processedLines.length; i++) {
        const line = processedLines[i].trim();
        
        // Karmaşık başlık formatını kontrol et (başlık ve tablo başlığı birleşmiş)
        if (line.includes('|') && line.endsWith('|') && !line.startsWith('|')) {
            // Başlık ve tablo başlığını ayır
            const parts = line.split('|');
            const titlePart = parts[0].trim();
            
            // Tablo başlığı kısmını oluştur
            const tableHeaderPart = '|' + parts.slice(1).join('|');
            
            // Orijinal satırı başlık ve tablo başlığı olarak iki satıra böl
            processedLines.splice(i, 1, titlePart, tableHeaderPart);
            break; // İlk karmaşık başlığı düzelttikten sonra dur
        }
    }
    
    // Tablo satırlarını bul
    const tableLines = processedLines.filter(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
    
    if (tableLines.length < 1) return null;
    
    // Tüm satırları işle
    const rows = tableLines.map(line => {
        return line
            .trim()
            .split('|')
            .filter(cell => cell !== '') // Boş hücreleri filtrele
            .map(cell => cell.trim());   // Hücrelerdeki boşlukları temizle
    });
    
    // Tablo başlığını tespit et
    let tableTitle = '';
    const tableStartIndex = processedLines.findIndex(line => line.trim().startsWith('|') && line.trim().endsWith('|'));
    
    if (tableStartIndex > 0) {
        // Önceki satırı başlık olarak kontrol et
        const prevLine = processedLines[tableStartIndex - 1].trim();
        if (prevLine && !prevLine.startsWith('|')) {
            tableTitle = prevLine;
        }
    }
    
    // Başlık satırını ve ayırıcı satırı tespit et
    let headerRow: string[] = [];
    let dataRows: string[][] = [];
    let hasSeparatorRow = false;
    
    if (tableLines.length >= 2) {
        // İkinci satırın ayırıcı satır olup olmadığını kontrol et
        const secondLine = tableLines[1].trim();
        hasSeparatorRow = secondLine.replace(/[\|\s\-:]/g, '').length === 0;
        
        if (hasSeparatorRow) {
            // Başlık satırı ve veri satırları
            headerRow = rows[0] || [];
            dataRows = rows.slice(2);
        } else {
            // Ayırıcı satır yok, ilk satırı başlık olarak kullan ve ayırıcı satır ekle
            headerRow = rows[0] || [];
            dataRows = rows.slice(1);
            
            // Ayırıcı satır oluştur
            const separatorRow = headerRow.map(() => '---');
            
            // rows dizisine ayırıcı satırı ekle
            rows.splice(1, 0, separatorRow);
        }
    } else if (tableLines.length === 1) {
        // Tek satırlık tablo, başlık satırı olarak kullan
        headerRow = rows[0] || [];
        dataRows = [];
    }
    
    // Tüm satırlardaki maksimum sütun sayısını bul
    const maxColumns = Math.max(...rows.map(row => row.length));
    
    // Tablo başlıklarını belirle
    const tableHeaders = headerRow.map((header, index) => {
        // Eğer başlık boşsa veya sadece çizgilerden oluşuyorsa
        if (!header || header.replace(/[\-\:\s]/g, '').length === 0) {
            return `Sütun ${index + 1}`;
        }
        return header;
    });
    
    // Eksik sütunları tamamla
    while (tableHeaders.length < maxColumns) {
        tableHeaders.push(`Sütun ${tableHeaders.length + 1}`);
    }
    
    return (
        <div className="overflow-x-auto my-4">
            {tableTitle && (
                <div className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                    {tableTitle}
                </div>
            )}
            <table className="min-w-full border border-gray-300 dark:border-gray-700">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        {tableHeaders.map((header, index) => (
                            <th 
                                key={index} 
                                className="px-4 py-2 text-left border-b border-gray-300 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {dataRows.map((row, rowIndex) => (
                        <tr 
                            key={rowIndex} 
                            className={rowIndex % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800/50'}
                        >
                            {row.map((cell, cellIndex) => (
                                <td 
                                    key={cellIndex} 
                                    className="px-4 py-2 border-t border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                                >
                                    {cell}
                                </td>
                            ))}
                            {/* Eksik sütunları tamamla */}
                            {[...Array(Math.max(0, maxColumns - row.length))].map((_, i) => (
                                <td 
                                    key={`empty-cell-${rowIndex}-${i}`}
                                    className="px-4 py-2 border-t border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                                >
                                    &nbsp;
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
