import * as React from 'react'
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
import { MAWBResponse } from '@/type/mawb'
import http from '@/utils/http'
import { MAWB_ENDPOINTS } from '@/constants/endpoint'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '../components/data-table-pagination'
import { DataTableToolbar } from '../components/data-table-toolbar'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [rows, setRows] = React.useState<TData[]>(data)
  const [totalPages, setTotalPages] = React.useState<number>(1)
  const [searchQuery, setSearchQuery] = React.useState<string>('')

  React.useEffect(() => {
    setRows(data)
  }, [data])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    manualPagination: true,
    pageCount: totalPages,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
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

  // Server-side fetch when page, pageSize, or search changes
  React.useEffect(() => {
    const fetchPage = async () => {
      const page = table.getState().pagination.pageIndex + 1
      const limit = table.getState().pagination.pageSize
      const url = `${MAWB_ENDPOINTS.GET_ALL_MAWBS}?page=${page}&limit=${limit}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''
        }`
      try {
        const res = await http.get<MAWBResponse>(url)
        if (res?.data) {
          const mapped = (res.data as any[]).map((mawb: any) => ({
            id: String(mawb.id),
            mawbNumber: mawb.mawbNumber,
            departureDate: mawb.departureDate
              ? new Date(mawb.departureDate).toLocaleDateString()
              : '',
            departureDateRaw: mawb.departureDate ?? '',
            airlineName: mawb.airlineName || 'N/A',
            destination: mawb.destination ?? 'N/A',
            hasShipment: mawb.hasShipment ?? false,
            documentUrl: mawb.documentUrl ?? '',
            agentId: mawb.agentId ?? undefined,
            flightNumber: mawb.flightNumber ?? '',
            dateOfArrival: mawb.dateOfArrival ?? '',
            timeOfArrival: mawb.timeOfArrival ?? '',
          })) as unknown as TData[]
          setRows(mapped)
        }
        const total = (res as any)?.pagination?.totalPages || 1
        setTotalPages(total)
      } catch (e) {
        console.error('Failed to fetch MAWB page', e)
      }
    }
    fetchPage()
  }, [
    table.getState().pagination.pageIndex,
    table.getState().pagination.pageSize,
    searchQuery,
  ])

  return (
    <div className='space-y-4'>
      <DataTableToolbar
        table={table}
        apiEndpoint={MAWB_ENDPOINTS.GET_ALL_MAWBS}
        onSearchQueryChange={(q) => {
          setSearchQuery(q)
          // Reset to first page when searching
          table.setPageIndex(0)
        }}
        onReset={() => {
          setSearchQuery('')
          table.setPageIndex(0)
        }}
      />
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
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
      <DataTablePagination table={table} />
      <div className='text-muted-foreground px-2 text-xs'>
        Server pages: {totalPages}
      </div>
    </div>
  )
}
