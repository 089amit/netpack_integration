import React from 'react'
import { useSearch } from '@tanstack/react-router'
import { Cross2Icon, CheckIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { DataTableViewOptions } from '../components/data-table-view-options'
import { useTasks } from '../context/tasks-context'
import { Gender } from '@/type/customer'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onFilterChange?: (filters: Record<string, string | number | string[] | undefined>) => void
  onReset?: () => void
  apiEndpoint: string
}

const GENDER_OPTIONS = [
  { label: 'Male', value: Gender.MALE },
  { label: 'Female', value: Gender.FEMALE },
  { label: 'Other', value: Gender.OTHER },
]

export function DataTableToolbar<TData>({
  table,
  onFilterChange,
  onReset,
}: DataTableToolbarProps<TData>) {
  const searchParams: any = useSearch({ from: '/_authenticated/customers/' })
  const { countries } = useTasks()

  const searchValue = searchParams.search || ''
  const genderFilters = searchParams.gender || []
  const countryFilters = searchParams.countryId || []
  const organizationFilter = searchParams.isOrganization || 'all'

  const [localSearch, setLocalSearch] = React.useState(searchValue)

  // Sync local search with URL param
  React.useEffect(() => {
    setLocalSearch(searchValue)
  }, [searchValue])

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchValue) {
        onFilterChange?.({ search: localSearch })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [localSearch, onFilterChange, searchValue])

  const toggleGender = (value: string) => {
    const next = genderFilters.includes(value)
      ? genderFilters.filter((v: string) => v !== value)
      : [...genderFilters, value]
    onFilterChange?.({ gender: next })
  }

  const toggleCountry = (value: string) => {
    const next = countryFilters.includes(value)
      ? countryFilters.filter((v: string) => v !== value)
      : [...countryFilters, value]
    onFilterChange?.({ countryId: next })
  }

  const handleOrganizationChange = (value: string) => {
    onFilterChange?.({ isOrganization: value === 'all' ? '' : value })
  }

  const isFiltered = 
    searchValue || 
    genderFilters.length > 0 || 
    countryFilters.length > 0 || 
    organizationFilter !== 'all'

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-wrap items-center gap-2'>
        <Input
          placeholder='Search customers...'
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className='h-8 w-[150px] lg:w-[250px]'
        />

        {/* Gender Multi-Select */}
        <FacetedFilter
          title='Gender'
          options={GENDER_OPTIONS}
          selectedValues={genderFilters}
          onToggle={toggleGender}
        />

        {/* Country Multi-Select */}
        <FacetedFilter
          title='Country'
          options={countries.map(c => ({ label: c.name, value: c.id.toString() }))}
          selectedValues={countryFilters}
          onToggle={toggleCountry}
        />

        {/* Organization Filter */}
        <div className='flex items-center gap-1 border border-dashed rounded-md px-1'>
          <Button
            variant={organizationFilter === 'all' ? 'ghost' : 'secondary'}
            size='sm'
            className='h-7 text-xs px-2'
            onClick={() => handleOrganizationChange('all')}
          >
            All
          </Button>
          <Button
            variant={organizationFilter === 'true' ? 'secondary' : 'ghost'}
            size='sm'
            className='h-7 text-xs px-2'
            onClick={() => handleOrganizationChange('true')}
          >
            Orgs
          </Button>
          <Button
            variant={organizationFilter === 'false' ? 'secondary' : 'ghost'}
            size='sm'
            className='h-7 text-xs px-2'
            onClick={() => handleOrganizationChange('false')}
          >
            Indiv
          </Button>
        </div>

        {isFiltered && (
          <Button
            variant='ghost'
            onClick={onReset}
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

interface FacetedFilterProps {
  title: string
  options: { label: string; value: string }[]
  selectedValues: string[]
  onToggle: (value: string) => void
}

function FacetedFilter({ title, options, selectedValues, onToggle }: FacetedFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 border-dashed'>
          <PlusCircledIcon className='mr-2 h-4 w-4' />
          {title}
          {selectedValues?.length > 0 && (
            <>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <Badge
                variant='secondary'
                className='rounded-sm px-1 font-normal lg:hidden'
              >
                {selectedValues.length}
              </Badge>
              <div className='hidden space-x-1 lg:flex'>
                {selectedValues.length > 2 ? (
                  <Badge
                    variant='secondary'
                    className='rounded-sm px-1 font-normal'
                  >
                    {selectedValues.length} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.includes(option.value))
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
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  const allValues = options.map(o => o.value)
                  const isAllSelected = selectedValues.length === options.length
                  if (isAllSelected) {
                    // Deselect all
                    allValues.forEach(v => {
                      if (selectedValues.includes(v)) onToggle(v)
                    })
                  } else {
                    // Select all missing ones
                    allValues.forEach(v => {
                      if (!selectedValues.includes(v)) onToggle(v)
                    })
                  }
                }}
              >
                <div
                  className={cn(
                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                    selectedValues.length === options.length
                      ? 'bg-primary text-primary-foreground'
                      : 'opacity-50 [&_svg]:invisible'
                  )}
                >
                  <CheckIcon className={cn('h-4 w-4')} />
                </div>
                <span className='font-bold'>Select All</span>
              </CommandItem>
              <CommandSeparator className='my-1' />
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => onToggle(option.value)}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
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
            {selectedValues.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      // We need to call onToggle for each selected value to clear them
                      // Or better, pass a clear function. For now, let's just toggle them all off.
                      const currentSelected = [...selectedValues]
                      currentSelected.forEach(v => onToggle(v))
                    }}
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
  )
}
