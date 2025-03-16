import React from "react";
import { Loader2, Database, Check, AlertCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ColumnData {
  name: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
}

interface TableData {
  status: 'success' | 'pending';
  message: string;
  missingColumns: ColumnData[];
}

interface ColumnsData {
  tables: {
    [key: string]: TableData;
  };
}

interface ColumnCheckerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columnsData: ColumnsData | null;
  selectedTables: {[key: string]: boolean};
  onSelectedTablesChange: (tables: {[key: string]: boolean}) => void;
  onAddColumns: () => void;
  isAddingColumns: boolean;
}

export function ColumnCheckerModal({
  open,
  onOpenChange,
  columnsData,
  selectedTables,
  onSelectedTablesChange,
  onAddColumns,
  isAddingColumns
}: ColumnCheckerModalProps) {
  if (!columnsData) return null;
  
  // Eksik kolonları olan tabloları filtrele
  const tablesWithMissingColumns = Object.entries(columnsData.tables)
    .filter(([_, tableData]) => tableData.status === 'pending');
  
  const hasMissingColumns = tablesWithMissingColumns.length > 0;
  
  // Seçili tablo sayısını hesapla
  const selectedTablesCount = Object.values(selectedTables).filter(Boolean).length;

  // Modal açıldığında tüm eksik kolonlu tabloları otomatik seç
  React.useEffect(() => {
    if (open && hasMissingColumns) {
      const allTables = { ...selectedTables };
      tablesWithMissingColumns.forEach(([tableName]) => {
        allTables[tableName] = true;
      });
      onSelectedTablesChange(allTables);
    }
  }, [open, hasMissingColumns]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 rounded-lg shadow-xl">
        <DialogHeader className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center gap-2 mb-1">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Veritabanı Kolon Yönetimi
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-300 mt-1">
            {hasMissingColumns 
              ? "Veritabanı tablolarında eksik kolonlar tespit edildi. Eklemek istediğiniz tabloları seçin."
              : "Tüm tablolarda gerekli kolonlar mevcut. Herhangi bir işlem yapmanıza gerek yok."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="overflow-y-auto p-6 flex-1">
          {hasMissingColumns ? (
            <Tabs defaultValue="missing" className="w-full">
              <TabsList className="grid grid-cols-2 mb-6 w-full bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <TabsTrigger 
                  value="missing" 
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 transition-all duration-200"
                >
                  Eksik Kolonlar
                </TabsTrigger>
                <TabsTrigger 
                  value="all" 
                  className="rounded-md data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 transition-all duration-200"
                >
                  Tüm Tablolar
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="missing" className="space-y-4 mt-2">
                {tablesWithMissingColumns.length > 0 ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {tablesWithMissingColumns.length} tablo eksik kolonlara sahip
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          const allSelected = tablesWithMissingColumns.every(
                            ([tableName]) => selectedTables[tableName]
                          );
                          
                          const newSelectedTables = { ...selectedTables };
                          tablesWithMissingColumns.forEach(([tableName]) => {
                            newSelectedTables[tableName] = !allSelected;
                          });
                          
                          onSelectedTablesChange(newSelectedTables);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-gray-800"
                      >
                        {tablesWithMissingColumns.every(([tableName]) => selectedTables[tableName])
                          ? "Tümünü Kaldır"
                          : "Tümünü Seç"}
                      </Button>
                    </div>
                    {tablesWithMissingColumns.map(([tableName, tableData], index) => (
                      <motion.div
                        key={tableName}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <TableItem 
                          tableName={tableName}
                          tableData={tableData}
                          checked={selectedTables[tableName] || false}
                          onCheckedChange={(checked) => {
                            onSelectedTablesChange({
                              ...selectedTables,
                              [tableName]: !!checked
                            });
                          }}
                          prefix="missing"
                        />
                      </motion.div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-10">
                    <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-300">Tüm tablolarda gerekli kolonlar mevcut</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="all" className="space-y-4 mt-2">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Toplam {Object.keys(columnsData.tables).length} tablo
                  </div>
                </div>
                {Object.entries(columnsData.tables).map(([tableName, tableData], index) => (
                  <motion.div
                    key={tableName}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <TableItem 
                      tableName={tableName}
                      tableData={tableData}
                      checked={selectedTables[tableName] || false}
                      onCheckedChange={(checked) => {
                        onSelectedTablesChange({
                          ...selectedTables,
                          [tableName]: !!checked
                        });
                      }}
                      disabled={tableData.status === 'success'}
                      prefix="all"
                    />
                  </motion.div>
                ))}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-10 text-center">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Tüm Kolonlar Mevcut</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                Veritabanı tablolarında eksik kolon bulunmamaktadır. Tüm tablolar güncel durumda.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="p-4 border-t bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {hasMissingColumns && selectedTablesCount > 0 && (
              <span>{selectedTablesCount} tablo seçildi</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {hasMissingColumns ? "İptal" : "Kapat"}
            </Button>
            {hasMissingColumns && (
              <Button 
                onClick={onAddColumns} 
                disabled={isAddingColumns || Object.values(selectedTables).every(selected => !selected)}
                className={cn(
                  "bg-blue-600 hover:bg-blue-700 text-white",
                  isAddingColumns && "opacity-80"
                )}
              >
                {isAddingColumns ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tüm Eksik Kolonlar Ekleniyor...
                  </>
                ) : (
                  'Tüm Eksik Kolonları Ekle'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface TableItemProps {
  tableName: string;
  tableData: TableData;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  prefix: string;
}

function TableItem({ tableName, tableData, checked, onCheckedChange, disabled = false, prefix }: TableItemProps) {
  return (
    <div className={cn(
      "border rounded-lg overflow-hidden transition-all duration-200",
      checked ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20" : "border-gray-200 dark:border-gray-700",
      disabled && "opacity-70"
    )}>
      <div className="flex items-center p-4">
        <div className="flex items-center space-x-3 flex-1">
          <Checkbox 
            id={`select-${prefix}-${tableName}`} 
            checked={checked} 
            onCheckedChange={onCheckedChange}
            disabled={disabled}
            className={cn(
              "h-5 w-5 border-2",
              checked ? "border-blue-500 text-blue-600" : "border-gray-300",
              disabled && "border-gray-300 dark:border-gray-600"
            )}
          />
          <div>
            <label 
              htmlFor={`select-${prefix}-${tableName}`}
              className={cn(
                "font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2 cursor-pointer",
                disabled && "cursor-not-allowed"
              )}
            >
              {tableName}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {tableData.status === 'success' 
                ? 'Tüm gerekli kolonlar mevcut' 
                : `${tableData.missingColumns.length} eksik kolon bulundu`}
            </p>
          </div>
        </div>
        
        <div>
          {tableData.status === 'success' ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
              <Check className="h-3 w-3 mr-1" />
              Güncel
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              {tableData.missingColumns.length} eksik
            </Badge>
          )}
        </div>
      </div>
      
      {tableData.status === 'pending' && tableData.missingColumns.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value={`${prefix}-${tableName}`} className="border-t border-gray-200 dark:border-gray-700">
            <AccordionTrigger className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Eksik Kolonları Görüntüle
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400 transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 pt-1">
              <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="grid grid-cols-3 gap-2 text-sm bg-gray-50 dark:bg-gray-900 p-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="font-medium text-gray-700 dark:text-gray-300">Kolon Adı</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">Veri Tipi</div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">Özellikler</div>
                </div>
                
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {tableData.missingColumns.map((column, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 text-sm p-3 hover:bg-gray-50 dark:hover:bg-gray-850 transition-colors">
                      <div className="text-gray-900 dark:text-gray-100 font-medium">{column.name}</div>
                      <div className="text-gray-700 dark:text-gray-300">{column.type}</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {column.length !== undefined && column.length !== -1 && `Uzunluk: ${column.length}`}
                        {column.length !== undefined && column.length === -1 && 'MAX'}
                        {column.precision !== undefined && `Hassasiyet: ${column.precision}, Ölçek: ${column.scale}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
