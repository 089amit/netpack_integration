import { useState } from 'react'
import { Cross2Icon } from '@radix-ui/react-icons'
// import { useNavigate } from '@tanstack/react-router'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from '../components/data-table-view-options'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onSearchQueryChange?: (query: string) => void
  onReset?: () => void
  apiEndpoint: string // Unused here but kept for parity
}

export function DataTableToolbar<TData>({
  table,
  onSearchQueryChange,
  onReset,
}: DataTableToolbarProps<TData>) {
  const [searchValue, setSearchValue] = useState('')
  // const navigate = useNavigate()

  const handleSearch = (value: string) => {
    onSearchQueryChange?.(value)
  }

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Search...'
          value={searchValue}
          onChange={(e) => {
            const value = e.target.value
            setSearchValue(value)
            handleSearch(value)
          }}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        {/* Optional status filter */}
        {/* <div className='flex gap-x-2'>
          {table.getColumn('status') && (
            <DataTableFacetedFilter
              column={table.getColumn('status')}
              title='Status'
              options={statuses}
            />
          )}
        </div> */}

        {searchValue && (
          <Button
            variant='ghost'
            onClick={() => {
              setSearchValue('')
              table.getColumn('name')?.setFilterValue('')
              onReset?.()
            }}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>

      <DataTableViewOptions table={table} />
    </div>
  )
}
