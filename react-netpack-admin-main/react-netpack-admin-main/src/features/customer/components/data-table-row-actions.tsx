import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { IconTrash, IconHistory } from '@tabler/icons-react'
import { Customer } from '@/type/customer'
import { toast } from 'sonner'
import { useCheckRole } from '@/utils/role-utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  // DropdownMenuRadioGroup,
  // DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTasks } from '../context/tasks-context'

// import { labels } from '../data/data'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const customer = row.original as Customer

  const { setOpen, setCurrentRow, deleteCustomer } = useTasks()

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
        {!useCheckRole('ACCOUNTS') ? (
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(customer)
              setOpen('update')
            }}
          >
            Edit
          </DropdownMenuItem>
        ) : (
          <></>
        )}

        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(customer)
            setOpen('history')
          }}
        >
          View History
          <DropdownMenuShortcut>
            <IconHistory size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />

        {!useCheckRole('ACCOUNTS') ? (
          <DropdownMenuItem
            onClick={async () => {
              if (!customer.id) {
                toast.error('Customer ID not found')
                return
              }

              if (
                window.confirm(
                  `Are you sure you want to delete customer "${customer.name}"?`
                )
              ) {
                try {
                  await deleteCustomer(customer.id)
                  setOpen(null)
                } catch (error) {
                  console.error('Failed to delete customer:', error)
                }
              }
            }}
          >
            Delete
            <DropdownMenuShortcut>
              <IconTrash size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        ) : (
          <></>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
