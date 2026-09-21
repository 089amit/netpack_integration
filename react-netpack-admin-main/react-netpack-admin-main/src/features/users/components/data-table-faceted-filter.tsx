import * as React from 'react'
import { CheckIcon, PlusCircledIcon, TrashIcon } from '@radix-ui/react-icons'
import { Column } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import http from '@/utils/http'
import { USER_ROLE } from '@/constants/endpoint'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

interface Role {
  id: number
  name: string
}

interface DataTableFacetedFilterProps<TData, TValue> {
  column?: Column<TData, TValue>
  title?: string
  options: {
    label: string
    value: string
    id: number
  }[]
  onAddRole?: (role: { label: string; value: string; id: number }) => void
  onDeleteRole?: (role: { label: string; value: string; id: number }) => void
}

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
  onAddRole,
  onDeleteRole,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const facets = column?.getFacetedUniqueValues()
  const [selectedValues, setSelectedValues] = React.useState<Set<string>>(
    new Set((column?.getFilterValue() as string[]) || [])
  )
  const [showAddRole, setShowAddRole] = React.useState(false)
  const [newRole, setNewRole] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    setSelectedValues(new Set((column?.getFilterValue() as string[]) || []))
  }, [column?.getFilterValue()])

  // ✅ Create role API call
  const handleAddRole = async () => {
    if (!newRole.trim()) return
    try {
      setLoading(true)
      console.log('Creating role:', newRole)

      const payload = { name: newRole.trim() }
      const res = await http.post(USER_ROLE.CREATE_ROLES, payload)
      console.log('Role created:', res)

      // Simulate new role object from API
      const createdRole = {
        label: newRole.trim(),
        value: newRole.trim(),
        id: Date.now(), // fallback if API doesn’t return id
      }

      onAddRole?.(createdRole)
      setNewRole('')
      setShowAddRole(false)
    } catch (error) {
      console.error('Failed to create role:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleValue = (value: string) => {
    const newSet = new Set(selectedValues)
    if (newSet.has(value)) newSet.delete(value)
    else newSet.add(value)
    setSelectedValues(newSet)
    const filterValues = Array.from(newSet)
    column?.setFilterValue(filterValues.length ? filterValues : undefined)
  }

  const confirmDelete = (option: {
    id: number
    label: string
    value: string
  }) => {
    if (
      window.confirm(`Are you sure you want to delete role "${option.label}"?`)
    ) {
      console.log('Deleted role id:', option.id)
      http.delete(`${USER_ROLE.DELETE_ROLE}/${option.id}`).catch((error) => {
        console.error('Failed to delete role:', error)
      })
      onDeleteRole?.(option)
      const newSet = new Set(selectedValues)
      newSet.delete(option.value)
      setSelectedValues(newSet)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 border-dashed'>
          <PlusCircledIcon className='h-4 w-4' />
          {title}
          {selectedValues.size > 0 && (
            <>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <Badge
                variant='secondary'
                className='rounded-sm px-1 font-normal lg:hidden'
              >
                {selectedValues.size}
              </Badge>
              <div className='hidden space-x-1 lg:flex'>
                {selectedValues.size > 2 ? (
                  <Badge
                    variant='secondary'
                    className='rounded-sm px-1 font-normal'
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedValues.has(option.value))
                    .map((option) => (
                      <Badge
                        key={option.id}
                        variant='secondary'
                        className='flex items-center space-x-1 rounded-sm px-1 font-normal'
                      >
                        <span>{option.label}</span>
                        <Button
                          size='icon'
                          variant='ghost'
                          onClick={() => confirmDelete(option)}
                        >
                          <TrashIcon className='h-3 w-3' />
                        </Button>
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className='w-[240px] p-0' align='start'>
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                return (
                  <CommandItem
                    key={option.id}
                    onSelect={() => toggleValue(option.value)}
                  >
                    <div
                      className={cn(
                        'border-primary flex h-4 w-4 items-center justify-center rounded-sm border',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50 [&_svg]:invisible'
                      )}
                    >
                      <CheckIcon className='h-4 w-4' />
                    </div>

                    <span>{option.label}</span>

                    {facets?.get(option.value) && (
                      <span className='ml-auto flex h-4 w-4 items-center justify-center font-mono text-xs'>
                        {facets.get(option.value)}
                      </span>
                    )}

                    <Button
                      size='icon'
                      variant='ghost'
                      className='ml-2'
                      onClick={(e) => {
                        e.stopPropagation()
                        confirmDelete(option)
                      }}
                    >
                      <TrashIcon className='h-3 w-3' />
                    </Button>
                  </CommandItem>
                )
              })}
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup>
              <CommandItem
                onSelect={() => setShowAddRole(true)}
                className='justify-center text-center'
              >
                <PlusCircledIcon className='mr-2 h-4 w-4' />
                Add Role
              </CommandItem>
            </CommandGroup>

            {showAddRole && (
              <div className='flex space-x-2 p-2'>
                <Input
                  placeholder='New role'
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddRole()
                  }}
                />
                <Button size='sm' onClick={handleAddRole} disabled={loading}>
                  {loading ? 'Adding...' : 'Add'}
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setShowAddRole(false)}
                >
                  Cancel
                </Button>
              </div>
            )}

            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setSelectedValues(new Set())
                      column?.setFilterValue(undefined)
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

// ----------- Parent Component -----------
export function RolesFilterExample<TData, TValue>({
  column,
}: {
  column?: Column<TData, TValue>
}) {
  const [roles, setRoles] = React.useState<
    { label: string; value: string; id: number }[]
  >([])

  // ✅ Fetch roles from API dynamically
  const fetchRoles = async () => {
    try {
      console.log('Fetching roles...')
      const res = await http.get<any>(USER_ROLE.GET_ALL_ROLES)
      console.log('API response:', res)

      const rolesArray: Role[] = res?.roles ?? []
      const rolesData = rolesArray.map((r) => ({
        label: r.name,
        value: r.name,
        id: r.id,
      }))
      setRoles(rolesData)
    } catch (error) {
      console.error('Failed to fetch roles', error)
      setRoles([])
    }
  }

  React.useEffect(() => {
    fetchRoles()
  }, [])

  const handleAddRole = (role: {
    label: string
    value: string
    id: number
  }) => {
    setRoles((prev) => [...prev, role])
  }

  const handleDeleteRole = (role: {
    label: string
    value: string
    id: number
  }) => {
    console.log('Deleted role id:', role.id)
    setRoles((prev) => prev.filter((r) => r.id !== role.id))
  }

  return (
    <DataTableFacetedFilter
      column={column}
      title='Roles'
      options={roles}
      onAddRole={handleAddRole}
      onDeleteRole={handleDeleteRole}
    />
  )
}
