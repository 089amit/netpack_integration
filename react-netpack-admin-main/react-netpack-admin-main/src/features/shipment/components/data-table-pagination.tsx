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
import { Pagination } from '@/type/pagination'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  pagination?: Pagination
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function DataTablePagination<TData>({
  table,
  pagination,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps<TData>) {
  // Use server-side pagination if available, otherwise fall back to client-side
  const isServerSide = !!pagination
  const currentPage = isServerSide ? pagination.page : table.getState().pagination.pageIndex + 1
  const totalPages = isServerSide ? pagination.totalPages : table.getPageCount()
  const pageSize = isServerSide ? pagination.limit : table.getState().pagination.pageSize
  const hasNextPage = isServerSide ? pagination.hasNextPage : table.getCanNextPage()
  const hasPreviousPage = isServerSide ? pagination.hasPreviousPage : table.getCanPreviousPage()

  const handlePreviousPage = () => {
    if (isServerSide && onPageChange) {
      onPageChange(currentPage - 1)
    } else {
      table.previousPage()
    }
  }

  const handleNextPage = () => {
    if (isServerSide && onPageChange) {
      onPageChange(currentPage + 1)
    } else {
      table.nextPage()
    }
  }

  const handlePageSizeChange = (value: string) => {
    const newPageSize = Number(value)
    if (isServerSide && onPageSizeChange) {
      onPageSizeChange(newPageSize)
    } else {
      table.setPageSize(newPageSize)
    }
  }

  return (
    <div className='flex items-center justify-between px-2'>
      <div className='text-muted-foreground hidden flex-1 text-sm sm:block'>
        {table.getFilteredSelectedRowModel().rows.length} of{' '}
        {table.getFilteredRowModel().rows.length} row(s) selected.
      </div>
      <div className='flex items-center gap-6 lg:gap-8'>
        <div className='flex items-center space-x-2'>
          <p className='hidden text-sm font-medium sm:block'>Rows per page</p>
          <Select
            value={`${pageSize}`}
            onValueChange={handlePageSizeChange}
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
          Page {currentPage} of {totalPages}
        </div>

        <div className='flex items-center space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={handlePreviousPage}
            disabled={!hasPreviousPage}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={handleNextPage}
            disabled={!hasNextPage}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
