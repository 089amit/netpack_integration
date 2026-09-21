// src/app/enquiries/components/columns.tsx
import { ColumnDef } from '@tanstack/react-table'
import { MAWBTableItem } from '@/type/mawb'
// import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
// import { labels, statuses } from '../data/data'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<MAWBTableItem>[] = [
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
    enableHiding: true,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ID' />
    ),
    cell: ({ row }) => <div className='w-[80px]'>{row.getValue('id')}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'mawbNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='MAWB NUMBER' />
    ),
    cell: ({ row }) => {
      return (
        <div className='flex space-x-2'>
          <span className='max-w-32 truncate font-medium sm:max-w-72 md:max-w-[31rem]'>
            {row.getValue('mawbNumber')}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'departureDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='DEPARTURE' />
    ),
    cell: ({ row }) => (
      <div className='w-[200px] truncate'>{row.getValue('departureDate')}</div>
    ),
  },
  {
    accessorKey: 'airlineName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='AIRLINES' />
    ),
    cell: ({ row }) => (
      <div className='w-[150px]'>{row.getValue('airlineName')}</div>
    ),
  },
  {
    accessorKey: 'destination',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='DESTINATION' />
    ),
    cell: ({ row }) => (
      <div className='w-[200px] truncate'>{row.getValue('destination')}</div>
    ),
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
