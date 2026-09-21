import { ColumnDef } from '@tanstack/react-table'
// Icons (example using Lucide)
import { User as Mail, Phone, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import LongText from '@/components/long-text'
import { userTypes } from '../data/data'
// Types
import { User } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<User>[] = [
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
    meta: {
      className: cn(
        'sticky left-0 z-10 bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'fullName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Full Name' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>
        {row.getValue('fullName') || 'N/A'}
      </LongText>
    ),
    meta: {
      className: cn(
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
        'sticky left-6 md:table-cell'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-x-2'>
        <Mail className='text-muted-foreground h-4 w-4' />
        <span className='max-w-52 truncate'>{row.getValue('email')}</span>
      </div>
    ),
    meta: {
      className: 'min-w-[200px]',
    },
    enableSorting: true,
  },
  {
    accessorKey: 'phoneNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone Number' />
    ),
    cell: ({ row }) => (
      <div className='flex items-center gap-x-2'>
        <Phone className='text-muted-foreground h-4 w-4' />
        <span>{row.getValue('phoneNumber') || 'N/A'}</span>
      </div>
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean

      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      className: 'w-[120px]',
    },
  },
  {
    accessorKey: 'role',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const role = row.getValue('role') as string
      const userType = userTypes.find((type) => type.value === role)
      const username = row.original.username

      return (
        <div className='flex flex-col gap-0.5'>
          <div className='flex items-center gap-x-1.5'>
            {userType?.icon && (
              <userType.icon className='text-muted-foreground h-4 w-4' />
            )}
            <span className='capitalize font-medium'>{role}</span>
          </div>
          {role?.toLowerCase() === 'pickup' && username && (
            <span className='text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded w-fit font-bold'>
              ID: {username}
            </span>
          )}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      className: 'w-[120px]',
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return (
        <div className='flex items-center gap-x-2'>
          <Clock className='text-muted-foreground h-4 w-4' />
          <span>{date.toLocaleDateString()}</span>
        </div>
      )
    },
    meta: {
      className: 'w-[160px]',
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Updated At' />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('updatedAt'))
      return (
        <div className='flex items-center gap-x-2'>
          <Clock className='text-muted-foreground h-4 w-4' />
          <span>{date.toLocaleDateString()}</span>
        </div>
      )
    },
    meta: {
      className: 'w-[160px]',
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
