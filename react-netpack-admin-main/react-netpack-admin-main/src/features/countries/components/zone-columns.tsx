import { ColumnDef } from '@tanstack/react-table'
import { Country } from '@/type/country'
import { Zone } from '@/type/zone'
import { Button } from '@/components/ui/button'

export const zoneColumns = (
  onEdit: (zone: Zone) => void
): ColumnDef<Zone>[] => [
  {
    accessorKey: 'name',
    header: 'Zone Name',
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => <div>{row.getValue('description') || '-'}</div>,
  },
  {
    accessorKey: 'weightLimit',
    header: 'Weight Limit',
    cell: ({ row }) => <div>{row.getValue('weightLimit')}</div>,
  },
  {
    accessorKey: 'countries',
    header: 'Countries',
    cell: ({ row }) => {
      const countries = row.getValue('countries') as Country[]
      return <div>{countries?.length || 0} countries</div>
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <div className='flex gap-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={() => onEdit(row.original)}
        >
          Edit
        </Button>
      </div>
    ),
  },
]
