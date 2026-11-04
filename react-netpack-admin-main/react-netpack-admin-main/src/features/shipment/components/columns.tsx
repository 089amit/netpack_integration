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
    accessorKey: 'senderName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Sender Name' />
    ),
    cell: ({ row }) => {
      const shipment = row.original
      const senderName = shipment.senderName || '—'
      return (
        <div className='w-[180px]'>
          <div className='truncate font-medium'>{senderName}</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'reciverName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Receiver Name' />
    ),
    cell: ({ row }) => {
      const value = row.getValue('reciverName') as string
      if (!value) return <div className='truncate'>N/A</div>
      if (value.length > 15 && value.includes('/')) {
        return (
          <div className='w-[180px]'>
            {value.split('/').map((part, idx) => (
              <div key={idx} className='truncate'>
                {part.trim()}
              </div>
            ))}
          </div>
        )
      }
      return <div className='w-[180px] truncate'>{value}</div>
    },
  },
  {
    accessorKey: 'destinationCountryName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Destination' />
    ),
    cell: ({ row }) => {
      const orig = row.original as any
      const senderCountry = (
        orig?.senderCountry ||
        orig?.enquiryDetails?.senderCountry ||
        'Nepal'
      ).trim().toLowerCase()

      let value =
        (row.getValue('destinationCountryName') as string) ||
        orig?.receiverCountry ||
        orig?.enquiryDetails?.receiverCountry ||
        ''

      if (value && value.trim().toLowerCase() === senderCountry) {
        if (
          orig?.receiverCountry &&
          orig.receiverCountry.trim().toLowerCase() !== senderCountry
        ) {
          value = orig.receiverCountry
        } else if (
          orig?.enquiryDetails?.receiverCountry &&
          orig.enquiryDetails.receiverCountry.trim().toLowerCase() !== senderCountry
        ) {
          value = orig.enquiryDetails.receiverCountry
        }
      }

      return <div className='w-[140px] truncate font-medium'>{value || 'N/A'}</div>
    },
    filterFn: (row, id, value) => {
      const orig = row.original as any
      const cellValue = String(row.getValue(id) || orig?.receiverCountry || '')
      return cellValue.toLowerCase().includes(String(value).toLowerCase())
    },
  },
  {
    accessorKey: 'hawbno',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='HAWB' />
    ),
    cell: ({ row }) => {
      const hawb = (row.getValue('hawbno') as string) || (row.original as any)?.hawbNumber || 'N/A'
      const partBadge = (row.original as any)?.partBadge
      const isSplit = (row.original as any)?.isSplitHawb || (row.original as any)?.siblingShipments?.length > 1

      return (
        <div className='flex items-center gap-1.5 flex-wrap w-[140px]'>
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
    accessorKey: 'mawbNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='MAWB' />
    ),
    cell: ({ row }) => (
      <div className='w-[130px] truncate font-mono font-medium'>{row.getValue('mawbNumber') || '—'}</div>
    ),
  },
  {
    accessorKey: 'forwardingCompanyName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Forwarding Details' />
    ),
    cell: ({ row }) => {
      const shipment = row.original
      const companyName = shipment.forwardingCompanyName || '—'
      const forwardingNumber = shipment.forwardingNumber || ''

      return (
        <div className='w-[180px]'>
          <div className='truncate font-medium'>{companyName}</div>
          {forwardingNumber && forwardingNumber !== '—' && (
            <div className='text-muted-foreground truncate text-xs font-mono select-all'>
              {forwardingNumber}
            </div>
          )}
        </div>
      )
    },
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
