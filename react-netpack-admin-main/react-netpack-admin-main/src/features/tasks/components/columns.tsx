import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Enquiry } from '@/type/enquiry'
import { Checkbox } from '@/components/ui/checkbox'
import { STATUS_OPTIONS } from '../data/data'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { ShipmentTrackingDialog } from './shipment-tracking-dialog'

// Define the actual data type used in table
export type EnquiryTableRow = {
  id: number
  status: string
  label: string
  senderName: string
  senderPhone: string
  receiverName: string
  receiverTelephone: string
  destinationLocation: string
  destinationCountryName: string
  weight: number
  noOfBox: number
  createdByName?: string
  hawbNumber?: string | null
  forwardingNumber?: string | null
  forwardingCompanyName?: string | null
  additionalNote?: string | null
  senderOrganization?: string | null
  trackingNumber: string | null
}

export const mapEnquiryToTableRow = (enquiry: Enquiry): EnquiryTableRow => ({
  id: enquiry.id,
  status: enquiry.shipmentStatus || enquiry.status || 'PENDING',
  label: 'default', // You can enhance this later if needed
  senderName: enquiry.senderName || 'N/A',
  senderPhone: enquiry.senderPhone || 'N/A',
  receiverName: enquiry.receiverName || 'N/A',
  receiverTelephone: enquiry.receiverTelephone || 'N/A',
  destinationLocation: enquiry.destinationLocation || 'N/A',
  destinationCountryName: enquiry.receiverCountry || 'N/A',
  weight: enquiry.weight || 0,
  noOfBox: enquiry.noOfBox || 0,
  createdByName: enquiry.createdByName ?? '—',
  hawbNumber: enquiry.hawbNumber || enquiry.hawbno || enquiry.hawb || null,
  forwardingNumber: enquiry.forwardingNumber ?? '-',
  forwardingCompanyName: enquiry.forwardingCompanyName ?? '-',
  additionalNote: enquiry.additionalNote ?? null,
  senderOrganization: enquiry.senderOrganization ?? null,
  trackingNumber: enquiry.trackingNumber ?? 'N/A',
})

const baseColumns: ColumnDef<EnquiryTableRow>[] = [
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
    enableSorting: false,
    enableHiding: false,
  },

  {
    accessorKey: 'senderName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Sender Name' />
    ),
    cell: ({ row }) => {
      const enquiry = row.original
      const createdByName =
        enquiry.createdByName !== 'N/A'
          ? enquiry.senderOrganization
          : 'Mobile App'
      return (
        <div className='w-[200px]'>
          <div className='truncate font-medium'>{enquiry.senderName}</div>
          {createdByName && (
            <div className='text-muted-foreground truncate text-sm'>
              {createdByName}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'senderPhone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Sender Phone' />
    ),
    cell: ({ row }) => (
      <div className='w-[150px]'>{row.getValue('senderPhone')}</div>
    ),
  },
  {
    accessorKey: 'receiverName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Receiver Name' />
    ),
    cell: ({ row }) => (
      <div className='w-[200px] truncate'>{row.getValue('receiverName')}</div>
    ),
  },
  {
    accessorKey: 'receiverTelephone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Receiver Phone' />
    ),
    cell: ({ row }) => (
      <div className='w-[150px]'>{row.getValue('receiverTelephone')}</div>
    ),
  },
  {
    accessorKey: 'hawbNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='HAWB' />
    ),
    cell: ({ row }) => {
      const hawb = row.getValue('hawbNumber') as string | null
      const hasHawb = hawb && hawb !== 'N/A' && hawb !== '-'
      if (!hasHawb) {
        return <div className='text-muted-foreground text-xs italic'>Not assigned</div>
      }
      return (
        <div className='w-[140px]'>
          <span className='inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-800 select-all dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'>
            {hawb}
          </span>
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
      const enquiry = row.original
      const companyName = enquiry.forwardingCompanyName || 'N/A'
      const forwardingNumber = enquiry.forwardingNumber || 'N/A'
      const hasForwarding = (companyName !== 'N/A' && companyName !== '-') || (forwardingNumber !== 'N/A' && forwardingNumber !== '-')

      if (!hasForwarding) {
        return <div className='text-muted-foreground text-xs italic'>Not forwarded yet</div>
      }

      return (
        <div className='w-[200px]'>
          <div className='flex items-center gap-1.5'>
            <span className='inline-flex items-center rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'>
              {companyName !== '-' && companyName !== 'N/A' ? companyName : 'Courier'}
            </span>
          </div>
          {forwardingNumber && forwardingNumber !== '-' && forwardingNumber !== 'N/A' && (
            <div
              className='text-muted-foreground mt-0.5 truncate font-mono text-xs select-all'
              title={forwardingNumber}
            >
              {forwardingNumber}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'destinationCountryName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Country' />
    ),
    cell: ({ row }) => (
      <div className='truncate'>{row.getValue('destinationCountryName')}</div>
    ),
  },
  {
    accessorKey: 'weight',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Weight (kg)' />
    ),
    cell: ({ row }) => (
      <div className='w-[100px]'>{row.getValue('weight')} kg</div>
    ),
  },
  {
    accessorKey: 'noOfBox',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Boxes' />
    ),
    cell: ({ row }) => (
      <div className='w-[80px]'>{row.getValue('noOfBox')}</div>
    ),
  },
  {
    accessorKey: 'trackingNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Tracking No' />
    ),
    cell: ({ row }) => (
      <div className='text-primary w-[140px] font-mono text-xs font-bold'>
        {row.getValue('trackingNumber')}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const rawStatus = row.getValue('status') as string
      const status = STATUS_OPTIONS.find(
        (status) => status.value === rawStatus
      )
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [open, setOpen] = useState(false)

      const getStatusStyle = (st: string) => {
        switch (st) {
          case 'DELIVERED':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
          case 'OUT_FOR_DELIVERY':
            return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800'
          case 'ARRIVED_AT_HUB':
            return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
          case 'CARRIER_SCANNED':
            return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
          case 'IN_TRANSIT':
            return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
          case 'SHIPMENT_CREATED':
            return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
          default:
            return 'bg-muted text-muted-foreground border-transparent'
        }
      }

      return (
        <>
          <button
            onClick={() => setOpen(true)}
            className='cursor-pointer text-left transition-transform hover:scale-105'
            title='Click to view full tracking timeline & carrier details'
          >
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${getStatusStyle(
                rawStatus
              )}`}
            >
              {status?.label ?? rawStatus}
            </span>
          </button>
          <ShipmentTrackingDialog
            open={open}
            onOpenChange={setOpen}
            currentStatus={row.getValue('status')}
            additionalNote={row.original.additionalNote}
            enquiryId={row.original.id}
            trackingNumber={row.original.trackingNumber}
            hawbNumber={row.original.hawbNumber}
            forwardingNumber={row.original.forwardingNumber}
            forwardingCompanyName={row.original.forwardingCompanyName}
          />
        </>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
]

const actionsColumn: ColumnDef<EnquiryTableRow> = {
  id: 'actions',
  cell: ({ row }) => <DataTableRowActions row={row} />,
}

// Export columns with Actions; Created By is shown below Sender Name for admins
export const columns: ColumnDef<EnquiryTableRow>[] = [
  ...baseColumns,
  actionsColumn,
]
