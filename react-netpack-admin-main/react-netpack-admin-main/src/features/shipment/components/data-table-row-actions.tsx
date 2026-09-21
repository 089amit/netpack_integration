import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { IconTrash } from '@tabler/icons-react'
import { ShipmentItem } from '@/type/shipment'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { shipmentFormSchema } from '@/features/shipment/data/schema'
import { useTasks } from '../context/shipments-context'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const parsedTask = shipmentFormSchema.safeParse(row.original)
  const task = parsedTask.success ? parsedTask.data : (row.original as any)

  const { setOpen, setCurrentRow } = useTasks()

  if (!task) {
    return null
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-[160px]'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original as ShipmentItem)
            setOpen('info')
          }}
        >
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow({
              ...task,
              hawbNumber:
                (row.original as any).hawbNumber ||
                (row.original as any).hawbno ||
                '',
            } as ShipmentItem)
            setOpen('update')
          }}
        >
          Edit
        </DropdownMenuItem>
{task.mawbId ==null?(
        <DropdownMenuItem
          onClick={() => {
            console.log('task', task)
            setCurrentRow(task as ShipmentItem)
            setOpen('delete')
          }}
        >
          Delete
          <DropdownMenuShortcut>
            <IconTrash size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        ):null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
