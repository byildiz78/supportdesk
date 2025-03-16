'use client';

import * as React from 'react';
import { useState, Fragment } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Column<T> {
  key: keyof T;
  title: string;
  width?: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  fixed?: 'left' | 'right';
}

interface Filter<T> {
  key: keyof T;
  title: string;
  options: { label: string; value: string }[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  filters?: Filter<T>[];
  onFilterChange?: (filters: Record<string, string>) => void;
  itemsPerPage?: number;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  renderActions?: (item: T) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;
  className?: string;
  idField?: keyof T;
  isLoading?: boolean;
}

const SortIcon = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => {
  return active ? (
    direction === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    )
  ) : (
    <ChevronDown className="w-4 h-4 opacity-30" />
  );
};

export function DataTable<T>({
  data,
  columns,
  filters = [],
  onFilterChange,
  itemsPerPage = 10,
  searchPlaceholder = "Ara...",
  searchFields = [],
  renderActions,
  renderEmptyState,
  className,
  idField = 'id' as keyof T,
  isLoading = false
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFilters, setCurrentFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (key: keyof T) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...currentFilters, [key]: value };
    setCurrentFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  const filteredData = React.useMemo(() => {
    return data.filter((item) => {
      // Apply search
      if (searchTerm && searchFields.length > 0) {
        const searchMatch = searchFields.some((field) => {
          const value = String(item[field]).toLowerCase();
          return value.includes(searchTerm.toLowerCase());
        });
        if (!searchMatch) return false;
      }

      // Apply filters
      return Object.entries(currentFilters).every(([key, value]) => {
        if (!value) return true;
        return String(item[key as keyof T]) === value;
      });
    });
  }, [data, searchTerm, currentFilters, searchFields]);

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof T];
      const bValue = b[sortConfig.key as keyof T];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage]);

  const pageCount = Math.ceil(sortedData.length / itemsPerPage);

  return (
    <div className={`flex flex-col flex-grow min-h-0 p-6 ${className}`}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[250px]"
            />
          </div>
          {filters.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filtrele
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Filtreler</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filters.map((filter) => (
                  <div key={String(filter.key)} className="p-2">
                    <label className="text-sm font-medium">{filter.title}</label>
                    <select
                      value={currentFilters[String(filter.key)] || ''}
                      onChange={(e) => handleFilterChange(String(filter.key), e.target.value)}
                      className="w-full mt-1 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="">Tümü</option>
                      {filter.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden flex-grow min-h-0">
        <div className="overflow-auto h-full
        [&::-webkit-scrollbar]:w-2
        [&::-webkit-scrollbar-thumb]:bg-gray-300/50
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-track]:bg-transparent
        dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
        hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
        dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={`${column.width ? `min-w-[${column.width}]` : 'w-full'} 
                      ${column.fixed ? `sticky ${column.fixed}-0 bg-inherit` : ''}`}
                  >
                    <div className="flex items-center gap-1">
                      {column.title}
                      {column.sortable && (
                        <button
                          onClick={() => handleSort(column.key)}
                          className="ml-1 focus:outline-none"
                        >
                          <SortIcon
                            active={sortConfig.key === column.key}
                            direction={sortConfig.direction}
                          />
                        </button>
                      )}
                    </div>
                  </TableHead>
                ))}
                {renderActions && (
                  <TableHead className="sticky right-0 bg-inherit">
                    <div className="text-right">İşlemler</div>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (renderActions ? 1 : 0)} className="h-[400px]">
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="relative w-20 h-20">
                        {/* Outer circle */}
                        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-primary/30 border-b-primary/10 border-l-primary/50 animate-[spin_1.5s_linear_infinite]" />
                        {/* Inner circle */}
                        <div className="absolute inset-3 rounded-full border-4 border-l-primary/50 border-t-primary/20 border-b-primary/80 border-r-primary/40 animate-[spin_2s_linear_infinite_reverse]" />
                        {/* Center dot */}
                        <div className="absolute inset-[30%] bg-gradient-to-tr from-primary/80 to-primary rounded-full animate-pulse" />
                      </div>
                      <div className="mt-6 text-center">
                        <div className="text-lg font-medium text-muted-foreground/80">Yükleniyor</div>
                        <div className="text-sm text-muted-foreground/60">Veriler hazırlanıyor...</div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    {paginatedData.map((item, index) => (
                      <motion.tr
                        key={String(item[idField])}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="group hover:bg-muted/50"
                      >
                        {columns.map((column) => (
                          <TableCell
                            key={String(column.key)}
                            className={column.fixed ? `sticky ${column.fixed}-0 bg-inherit` : ''}
                          >
                            {column.render ? column.render(item) : String(item[column.key])}
                          </TableCell>
                        ))}
                        {renderActions && (
                          <TableCell className="sticky right-0 bg-inherit">
                            {renderActions(item)}
                          </TableCell>
                        )}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {paginatedData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={columns.length + (renderActions ? 1 : 0)} className="h-[400px] text-center">
                        {renderEmptyState ? renderEmptyState() : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <div className="rounded-full bg-muted p-4 mb-4">
                              <Search className="w-8 h-8" />
                            </div>
                            <div className="text-xl font-medium mb-2">Sonuç Bulunamadı</div>
                            <div className="text-sm max-w-sm mx-auto">
                              Arama kriterlerinize uygun kayıt bulunamadı. Lütfen farklı bir arama yapmayı deneyin.
                            </div>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-4">
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          Toplam <span className="font-medium text-foreground">{sortedData.length}</span> kayıttan{' '}
          <span className="font-medium text-foreground">
            {(currentPage - 1) * itemsPerPage + 1}
          </span>{' '}
          -{' '}
          <span className="font-medium text-foreground">
            {Math.min(currentPage * itemsPerPage, sortedData.length)}
          </span>{' '}
          arası gösteriliyor
        </div>
        <div className="flex gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Önceki
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: pageCount }, (_, i) => i + 1)
              .filter(page => {
                const distance = Math.abs(page - currentPage);
                return distance === 0 || distance === 1 || page === 1 || page === pageCount;
              })
              .map((page, index, array) => (
                <Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="text-muted-foreground">...</span>
                  )}
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="h-8 w-8"
                  >
                    {page}
                  </Button>
                </Fragment>
              ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
            disabled={currentPage === pageCount}
            className="h-8"
          >
            Sonraki
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
