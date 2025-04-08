import React, { useState } from 'react';
import { Message } from '../types';

interface DebugViewProps {
    message: Message;
}

export function DebugView({ message }: DebugViewProps) {
    const [activeTab, setActiveTab] = useState<'raw' | 'tables' | 'analysis'>('raw');
    
    // Markdown içeriğinden tabloları çıkaran fonksiyon
    const extractTablesForDebug = (content: string): { tables: string[], info: any[] } => {
        // Eğer content undefined veya boş ise, boş sonuç döndür
        if (!content) {
            return { tables: [], info: [] };
        }
        
        const tables: string[] = [];
        const info: any[] = [];
        const lines = content.split('\n');
        let currentTable: string[] = [];
        let inTable = false;
        let tableStartIndex = 0;
        let tableTitle = '';

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Karmaşık başlık formatını kontrol et (başlık ve tablo başlığı birleşmiş)
            if (!inTable && line.includes('|') && line.endsWith('|') && !line.startsWith('|')) {
                // Başlık ve tablo başlığını ayır
                const parts = line.split('|');
                tableTitle = parts[0].trim();
                
                // Tablo başlığı kısmını oluştur
                const tableHeaderPart = '|' + parts.slice(1).join('|');
                
                // Tablo işlemeyi başlat
                inTable = true;
                tableStartIndex = i;
                currentTable = [tableHeaderPart];
                continue;
            }
            
            // Potansiyel tablo başlığını kontrol et
            if (!inTable && i < lines.length - 1 && 
                lines[i + 1].trim().startsWith('|') && lines[i + 1].trim().endsWith('|') && 
                !line.startsWith('|')) {
                tableTitle = line;
            }
            
            if (line.startsWith('|') && line.endsWith('|')) {
                if (!inTable) {
                    inTable = true;
                    tableStartIndex = i;
                    currentTable = []; // Yeni bir tablo başlat
                    
                    // Eğer önceki satır bir başlık olabilecek bir metin ise
                    if (i > 0 && !lines[i - 1].trim().startsWith('|') && lines[i - 1].trim() !== '') {
                        tableTitle = lines[i - 1].trim();
                    }
                }
                currentTable.push(lines[i]);
                
                // Eğer sonraki satır tablo değilse veya son satırdaysak
                if (i === lines.length - 1 || !lines[i + 1].trim().startsWith('|')) {
                    if (currentTable.length >= 1) {
                        const tableContent = currentTable.join('\n');
                        tables.push(tableContent);
                        
                        // Tablo bilgilerini analiz et
                        const tableRows = currentTable.length;
                        const tableCols = currentTable[0].split('|').filter(cell => cell.trim() !== '').length;
                        
                        // Ayırıcı satırı kontrol et
                        let hasSeparatorRow = false;
                        let separatorRowIndex = -1;
                        
                        if (tableRows > 1) {
                            for (let j = 1; j < currentTable.length; j++) {
                                const rowContent = currentTable[j];
                                if (rowContent.replace(/[\|\s\-:]/g, '').length === 0) {
                                    hasSeparatorRow = true;
                                    separatorRowIndex = j;
                                    break;
                                }
                            }
                            
                            // Eğer ayırıcı satır yoksa, uyarı ekle
                            if (!hasSeparatorRow) {
                                info.push({
                                    title: tableTitle,
                                    rows: tableRows,
                                    cols: tableCols,
                                    hasSeparatorRow: false,
                                    separatorRowIndex: -1,
                                    isFirstRowHeader: true,
                                    warning: "⚠️ Ayırıcı satır bulunamadı! " + tableRows + " satır, " + tableCols + " sütun."
                                });
                                continue;
                            }
                        }
                        
                        // İlk satırın başlık olup olmadığını kontrol et
                        const firstRowCells = currentTable[0].split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
                        const isFirstRowHeader = firstRowCells.some(cell => isNaN(Number(cell.replace(/[,.]/g, ''))));
                        
                        info.push({
                            title: tableTitle,
                            rows: tableRows,
                            cols: tableCols,
                            hasSeparatorRow,
                            separatorRowIndex,
                            isFirstRowHeader
                        });
                    }
                    currentTable = [];
                    inTable = false;
                    tableTitle = '';
                }
            }
        }

        return { tables, info };
    };
    
    const { tables, info: tableInfo } = extractTablesForDebug(message.content);
    
    return (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Hata Ayıklama Görünümü</h3>
            
            {/* Sekme Menüsü */}
            <div className="flex space-x-2 mb-4">
                <button
                    className={`px-3 py-1 rounded ${activeTab === 'raw' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setActiveTab('raw')}
                >
                    Ham Markdown
                </button>
                <button
                    className={`px-3 py-1 rounded ${activeTab === 'tables' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setActiveTab('tables')}
                >
                    Tablolar ({tables.length})
                </button>
                <button
                    className={`px-3 py-1 rounded ${activeTab === 'analysis' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                    onClick={() => setActiveTab('analysis')}
                >
                    Tablo Analizi
                </button>
            </div>
            
            {/* Ham Markdown İçeriği */}
            {activeTab === 'raw' && (
                <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-300 dark:border-gray-700">
                    <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">Ham Markdown İçeriği:</h4>
                    <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                        {message.content}
                    </pre>
                </div>
            )}
            
            {/* Tablolar */}
            {activeTab === 'tables' && (
                <div className="bg-white dark:bg-gray-900 p-4 rounded border border-gray-300 dark:border-gray-700">
                    <h4 className="text-md font-semibold mb-2 text-gray-800 dark:text-gray-200">Tespit Edilen Tablolar:</h4>
                    {tables.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 italic">Tablo bulunamadı.</p>
                    ) : (
                        <div className="space-y-4">
                            {tables.map((table, index) => (
                                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                                    <h5 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                                        Tablo {index + 1} ({table.split('\n').length} satır)
                                    </h5>
                                    <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 dark:bg-gray-800 p-2 rounded overflow-x-auto">
                                        {table}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {/* Tablo Analizi */}
            {activeTab === 'analysis' && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Tablo Analizi:</h3>
                    {tables.length > 0 ? (
                        <div className="space-y-4">
                            {tables.map((table, index) => (
                                <div key={index} className="mb-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                                    <div className="font-medium mb-1">Tablo {index + 1} ({tableInfo[index]?.rows || 'bilinmeyen'} satır)</div>
                                    <pre className="text-xs overflow-x-auto p-2 bg-white dark:bg-gray-900 rounded border border-gray-300 dark:border-gray-700">
                                        {table}
                                    </pre>
                                    <div className="mt-2 text-sm">
                                        {tableInfo[index]?.hasSeparatorRow ? (
                                            <span className="text-green-600 dark:text-green-400">✅ Tablo yapısı geçerli. {tableInfo[index]?.rows} satır, {tableInfo[index]?.cols} sütun.</span>
                                        ) : (
                                            <span className="text-amber-600 dark:text-amber-400">⚠️ Ayırıcı satır bulunamadı! {tableInfo[index]?.rows} satır, {tableInfo[index]?.cols} sütun.</span>
                                        )}
                                        {tableInfo[index]?.title && (
                                            <div className="mt-1">
                                                <span className="font-medium">Başlık: </span>
                                                <span className="italic">{tableInfo[index]?.title}</span>
                                            </div>
                                        )}
                                        {!tableInfo[index]?.isFirstRowHeader && (
                                            <div className="mt-1 text-amber-600 dark:text-amber-400">
                                                ⚠️ İlk satır başlık olarak tanımlanmamış. Otomatik başlık oluşturulacak.
                                            </div>
                                        )}
                                        {tableInfo[index]?.warning && (
                                            <div className="mt-1 text-amber-600 dark:text-amber-400">
                                                {tableInfo[index]?.warning}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 dark:text-gray-400 italic">Analiz edilecek tablo bulunamadı.</p>
                    )}
                </div>
            )}
        </div>
    );
}
