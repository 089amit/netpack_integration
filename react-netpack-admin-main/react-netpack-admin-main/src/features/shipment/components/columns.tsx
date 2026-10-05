// src/app/shipments/components/columns.tsx
import { ColumnDef } from '@tanstack/react-table'
import { ShipmentItem } from '@/type/shipment'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<ShipmentItem>[] = [
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
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ID' />
    ),
    cell: ({ row }) => <div className='w-[80px]'>{row.getValue('id')}</div>,
  },
  // {
  //   accessorKey: 'customerName',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title='Customer' />
  //   ),
  //   cell: ({ row }) => (
  //     <div className='truncate'>{row.getValue('customerName') || 'N/A'}</div>
  //   ),
  // },
  // {
  //   accessorKey: 'customerPhone',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title='Phone' />
  //   ),
  //   cell: ({ row }) => (
  //     <div className='truncate'>{row.getValue('customerPhone') || 'N/A'}</div>
  //   ),
  // },
  {
    accessorKey: 'senderName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Sender Name' />
    ),
    cell: ({ row }) => {
      const shipment = row.original
      const senderName = shipment.senderName || '—'
      return (
        <div className='w-[200px]'>
          <div className='truncate font-medium'>{senderName}</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'reciverName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Reciver Name' />
    ),
    cell: ({ row }) => {
      const value = row.getValue('reciverName') as string
      if (!value) return <div className='truncate'>N/A</div>
      // If value is long and contains '/', split and show each part on a new line
      if (value.length > 15 && value.includes('/')) {
        return (
          <div>
            {value.split('/').map((part, idx) => (
              <div key={idx} className='truncate'>
                {part.trim()}
              </div>
            ))}
          </div>
        )
      }
      return <div className='truncate'>{value}</div>
    },
  },
  {
    accessorKey: 'destinationCountryName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Destination' />
    ),
    cell: ({ row }) => (
      <div className='truncate'>
        {row.getValue('destinationCountryName') || 'N/A'}
      </div>
    ),
  },
  {
    accessorKey: 'mawbNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='MAWB ' />
    ),
    cell: ({ row }) => (
      <div className='truncate'>{row.getValue('mawbNumber') || 'N/A'}</div>
    ),
  },
  {
    accessorKey: 'hawbno',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='HAWB ' />
    ),
    cell: ({ row }) => {
      const hawb = (row.getValue('hawbno') as string) || (row.original as any)?.hawbNumber || 'N/A'
      const partBadge = (row.original as any)?.partBadge
      const isSplit = (row.original as any)?.isSplitHawb || (row.original as any)?.siblingShipments?.length > 1

      return (
        <div className='flex items-center gap-1.5 flex-wrap'>
          <span className='font-mono font-medium'>{hawb}</span>
          {isSplit && partBadge && (
            <Badge variant='outline' className='text-[10px] px-1.5 py-0 h-4 bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-300 font-sans font-bold'>
              {partBadge}
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'forwardingCompanyName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Forwarding Details' />
    ),
    cell: ({ row }) => {
      const shipment = row.original

      const companyName = shipment.forwardingCompanyName || 'N/A'

      const forwardingNumber = shipment.forwardingNumber || 'N/A'

      return (
        <div className='w-[200px]'>
          <div className='truncate font-medium'>{companyName}</div>
          <div className='text-muted-foreground truncate text-sm'>
            {forwardingNumber}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'agentCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Agent' />
    ),
    cell: ({ row }) => (
      <div className='truncate'>{row.getValue('agentCode') || 'N/A'}</div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return <Badge className='capitalize'>{status}</Badge>
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
