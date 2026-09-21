// import {
//   ChevronLeftIcon,
//   ChevronRightIcon,
//   DoubleArrowLeftIcon,
//   DoubleArrowRightIcon,
// } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  onPageChange?: (pageIndex: number, pageSize: number) => void
  paginationData?: {
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export function DataTablePagination<TData>({
  table,
  onPageChange,
  paginationData,
}: DataTablePaginationProps<TData>) {
  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  
  // Use server-side pagination data if available, otherwise fall back to client-side
  const totalPages = paginationData?.totalPages || table.getPageCount()
  const totalItems = paginationData?.totalItems || table.getFilteredRowModel().rows.length
  const hasNextPage = paginationData?.hasNextPage ?? (pageIndex < totalPages - 1)
  const hasPreviousPage = paginationData?.hasPreviousPage ?? (pageIndex > 0)

  const handlePageChange = (newPageIndex: number, newPageSize: number) => {
    table.setPageIndex(newPageIndex)
    table.setPageSize(newPageSize)
    onPageChange?.(newPageIndex, newPageSize)
  }

  return (
    <div className='flex items-center justify-between px-2'>
      <div className='text-muted-foreground hidden flex-1 text-sm sm:block'>
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {totalItems} row(s) selected.
      </div>
      <div className='flex items-center gap-6 lg:gap-8'>
        <div className='flex items-center space-x-2'>
          <p className='hidden text-sm font-medium sm:block'>Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              handlePageChange(0, Number(value))
            }}
          >
            <SelectTrigger className='h-8 w-[70px]'>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side='top'>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex w-[100px] items-center justify-center text-sm font-medium'>
          Page {pageIndex + 1} of {totalPages}
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(pageIndex - 1, pageSize)}
            disabled={!hasPreviousPage}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => handlePageChange(pageIndex + 1, pageSize)}
            disabled={!hasNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
