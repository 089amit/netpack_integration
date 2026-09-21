import React from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { USER_ENDPOINTS } from '@/constants/endpoint'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTasks } from '../context/tasks-context'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onPageChange?: (page: number, pageSize: number) => void
  onFilterChange?: (filters: Record<string, string | number | string[] | undefined>) => void
  onReset?: () => void
  paginationData?: {
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  page?: number
  limit?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onPageChange,
  onFilterChange,
  onReset,
  paginationData,
  page = 1,
  limit = 10,
}: DataTableProps<TData, TValue>) {
  const { setSelectedCustomers, selectedCustomers } = useTasks()
  
  // Initialize rowSelection from selectedCustomers context
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>(() => {
    const initialSelection: Record<string, boolean> = {}
    selectedCustomers.forEach((customer) => {
      initialSelection[customer.id.toString()] = true
    })
    return initialSelection
  })

  // Keep rowSelection in sync with context if it changes from outside
  React.useEffect(() => {
    const newSelection: Record<string, boolean> = {}
    selectedCustomers.forEach((customer) => {
      newSelection[customer.id.toString()] = true
    })
    setRowSelection(newSelection)
  }, [selectedCustomers])

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: page - 1,
        pageSize: limit,
      },
    },
    enableRowSelection: true,
    getRowId: (row: any) => row.id.toString(), // ✅ Use ID for selection
    manualPagination: true,
    pageCount: paginationData?.totalPages || 0,
    onRowSelectionChange: (updater) => {
      const nextSelection = typeof updater === 'function' ? updater(rowSelection) : updater
      setRowSelection(nextSelection)
      
      // We need to handle the case where we add/remove from selectedCustomers
      // Since 'data' only contains current page, we need to be careful.
      // However, TanStack table row selection state now uses IDs.
      
      // Update selected customers in context
      const selectedIds = Object.keys(nextSelection).filter(id => nextSelection[id])
      
      // We want to keep previously selected customers that might not be in the current 'data'
      setSelectedCustomers((prev) => {
        // Find customers from current data that are newly selected
        const currentDataMap = new Map((data as any[]).map(c => [c.id.toString(), c]))
        
        // Start with existing selections
        const updatedSelections = [...prev]
        
        // Add new selections from current data if not already present
        selectedIds.forEach(id => {
          if (!updatedSelections.some(c => c.id.toString() === id)) {
            const customer = currentDataMap.get(id)
            if (customer) {
              updatedSelections.push(customer)
            }
          }
        })
        
        // Remove deselected ones
        return updatedSelections.filter(c => selectedIds.includes(c.id.toString()))
      })
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  // Check if there's no data
  const hasNoData = !data || data.length === 0

  return (
    <div className='space-y-4'>
      <DataTableToolbar
        table={table}
        apiEndpoint={USER_ENDPOINTS.GET_ALL_CUSTOMER}
        onFilterChange={onFilterChange}
        onReset={onReset}
      />

      {hasNoData ? (
        <div className='flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center'>
          <div className='mx-auto flex max-w-[420px] flex-col items-center justify-center text-center'>
            <div className='bg-muted flex h-20 w-20 items-center justify-center rounded-full'>
              <svg
                className='text-muted-foreground h-10 w-10'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
            </div>
            <h3 className='mt-4 text-lg font-semibold'>No customers found</h3>
            <p className='text-muted-foreground mt-2 mb-4 text-sm'>
              You haven&apos;t added any customers yet. Start by creating your
              first customer.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
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
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
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
                      className='h-24 text-center'
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination
            table={table}
            paginationData={paginationData}
            onPageChange={(newPageIndex, newPageSize) => {
              const newPage = newPageIndex + 1
              onPageChange?.(newPage, newPageSize)
            }}
          />
        </>
      )}
    </div>
  )
}
