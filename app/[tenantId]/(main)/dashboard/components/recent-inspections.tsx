"use client"

import { useMemo, memo, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { useAuditTable } from "@/hooks/useAuditTable"
import { format } from 'date-fns'
import { useTabStore } from "@/stores/tab-store"

function TruncatedCell({ content, maxWidth = "200px" }: { content: string, maxWidth?: string }) {
  if (!content) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="max-w-[200px] md:max-w-[300px] truncate">
            {content}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs whitespace-pre-wrap">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const formColors: { [key: string]: string } = {
  'O.D.Z': 'bg-blue-500',
  'KDZ': 'bg-green-500',
  'HDZ': 'bg-purple-500',
  'M.O.D.Z': 'bg-orange-500',
  'default': 'bg-gray-500'
}

interface RecentInspectionsProps {
  className?: string;
  branches: number[];
  refreshTrigger: number;
}

export const RecentInspections = memo(function RecentInspections({
  className,
  branches,
  refreshTrigger
}: RecentInspectionsProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { activeTab } = useTabStore();
  const { data: inspections, isLoading, error } = useAuditTable(activeTab === "dashboard" ? { branches, refreshTrigger } : null);

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "date",
      header: "Tarih",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return format(date, "dd.MM.yyyy HH:mm");
      }
    },
    {
      accessorKey: "branchName",
      header: "Şube",
    },
    {
      accessorKey: "formName",
      header: "Form",
    },
    {
      accessorKey: "regionalManager",
      header: "Bölge Müdürü",
    },
    {
      accessorKey: "description",
      header: "Açıklama",
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        if (!description) return null;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="max-w-[200px] truncate">
                  {description}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-[400px] max-h-[300px] p-4 overflow-auto
                [&::-webkit-scrollbar]:w-2
                        [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-track]:bg-transparent
                        dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                        hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                        dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80"
                avoidCollisions={true}
              >
                <p className="text-sm">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
    },
    {
      accessorKey: "notes",
      header: "Notlar",
      cell: ({ row }) => {
        const notes = row.getValue("notes") as string;
        if (!notes) return null;

        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="max-w-[200px] truncate">
                  {notes}
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="max-w-[400px] max-h-[300px] p-4 overflow-auto
                [&::-webkit-scrollbar]:w-2
                        [&::-webkit-scrollbar-thumb]:bg-gray-300/50
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-track]:bg-transparent
                        dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50
                        hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80
                        dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80"
                avoidCollisions={true}
              >
                <p className="text-sm whitespace-pre-wrap">{notes}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }
    }
  ], []);

  const table = useReactTable({
    data: inspections,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div className="hidden md:block">
      <div className={cn(
        "h-[400px] rounded-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-900/50",
        "shadow-xl shadow-gray-200/40 dark:shadow-gray-900/40 border border-gray-200/60 dark:border-gray-800/60",
        "overflow-auto",
        "[&::-webkit-scrollbar]:w-2",
        "[&::-webkit-scrollbar-thumb]:bg-gray-300/50",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "dark:[&::-webkit-scrollbar-thumb]:bg-gray-700/50",
        "hover:[&::-webkit-scrollbar-thumb]:bg-gray-300/80",
        "dark:hover:[&::-webkit-scrollbar-thumb]:bg-gray-700/80"
      )}>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Veri yüklenirken bir hata oluştu
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    Kayıt bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
        <div className="text-sm text-muted-foreground">
          Sayfa {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 px-3 text-xs"
          >
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 px-3 text-xs"
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  )
})