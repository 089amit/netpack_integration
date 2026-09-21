import { Cross2Icon, CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from './data-table-view-options'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

import { STATUS_OPTIONS } from '@/features/tasks/data/data'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  searchQuery?: string
  onSearchChange?: (query: string) => void
  statusFilter?: string[]
  onStatusChange?: (status: string[]) => void
}

export function DataTableToolbar<TData>({
  table,
  searchQuery = '',
  onSearchChange,
  statusFilter = [],
  onStatusChange,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || !!searchQuery || statusFilter.length > 0

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange?.(event.target.value)
  }

  const handleReset = () => {
    if (onSearchChange) onSearchChange('')
    if (onStatusChange) onStatusChange([])
    table.resetColumnFilters()
  }

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Filter shipments...'
          value={searchQuery}
          onChange={handleSearchChange}
          className='h-8 w-[150px] lg:w-[250px]'
        />
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant='outline' size='sm' className='h-8 border-dashed'>
              <PlusCircledIcon className='mr-2 h-4 w-4' />
              Status
              {statusFilter.length > 0 && (
                <>
                  <Separator orientation='vertical' className='mx-2 h-4' />
                  <Badge
                    variant='secondary'
                    className='rounded-sm px-1 font-normal lg:hidden'
                  >
                    {statusFilter.length}
                  </Badge>
                  <div className='hidden space-x-1 lg:flex'>
                    {statusFilter.length > 2 ? (
                      <Badge
                        variant='secondary'
                        className='rounded-sm px-1 font-normal'
                      >
                        {statusFilter.length} selected
                      </Badge>
                    ) : (
                      STATUS_OPTIONS
                        .filter((option) => statusFilter.includes(option.value))
                        .map((option) => (
                          <Badge
                            variant='secondary'
                            key={option.value}
                            className='rounded-sm px-1 font-normal'
                          >
                            {option.label}
                          </Badge>
                        ))
                    )}
                  </div>
                </>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-[200px] p-0' align='start'>
            <Command>
              <CommandInput placeholder='Status' />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {STATUS_OPTIONS.map((option) => {
                    const isSelected = statusFilter.includes(option.value)
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => {
                          if (isSelected) {
                            onStatusChange?.(statusFilter.filter((v) => v !== option.value))
                          } else {
                            onStatusChange?.([...statusFilter, option.value])
                          }
                        }}
                      >
                        <div
                          className={cn(
                            'border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border',
                            isSelected
                              ? 'bg-primary text-primary-foreground'
                              : 'opacity-50 [&_svg]:invisible'
                          )}
                        >
                          <CheckIcon className={cn('h-4 w-4')} />
                        </div>
                        <span>{option.label}</span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
                {statusFilter.length > 0 && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => onStatusChange?.([])}
                        className='justify-center text-center'
                      >
                        Clear filters
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {isFiltered && (
          <Button
            variant='ghost'
            onClick={handleReset}
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
