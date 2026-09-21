import { format } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'
import { Customer } from '@/type/customer'
// import { Edit, Trash2 } from 'lucide-react'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useTasks } from '../context/tasks-context'
// import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { DataTableRowActions } from './data-table-row-actions'

// Export columns for use in DataTable
export const useCustomerColumns = (): ColumnDef<Customer>[] => {
  const { getCountryName } = useTasks()

  return [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
          className='translate-y-[2px]'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          className='translate-y-[2px]'
        />
      ),
      enableSorting: true,
      enableHiding: false,
    },
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <div className='w-[60px]'>{row.getValue('id')}</div>,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className='font-medium'>
            {customer.name}
            {customer.isOrganization && customer.organizationName && (
              <div className='text-muted-foreground text-sm'>
                {customer.organizationName}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => {
        return <div className='max-w-xs truncate'>{row.getValue('email')}</div>
      },
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => {
        return <div>{row.getValue('phone') || 'N/A'}</div>
      },
    },
    {
      accessorKey: 'gender',
      header: 'Gender',
      cell: ({ row }) => {
        const customer = row.original
        if (customer.isOrganization) {
          return <div className='text-muted-foreground'>Organization</div>
        }
        return (
          <div className='capitalize'>{row.getValue('gender') as string}</div>
        )
      },
    },
    {
      accessorKey: 'address1',
      header: 'Address',
      cell: ({ row }) => {
        const customer = row.original
        const address = [
          customer.address1,
          customer.address2,
          customer.postcode,
        ]
          .filter(Boolean)
          .join(', ')

        return (
          <div className='max-w-sm truncate' title={address}>
            {address || 'N/A'}
          </div>
        )
      },
    },
    {
      accessorKey: 'countryId',
      header: 'Country',
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className='max-w-xs truncate'>
            {customer.country?.name || getCountryName(customer.countryId)}
          </div>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => {
        return <div>{format(new Date(row.getValue('createdAt')), 'PPP')}</div>
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => <DataTableRowActions row={row} />,
    },
  ]
}

// Fallback columns for backward compatibility
export const columns: ColumnDef<Customer>[] = []
