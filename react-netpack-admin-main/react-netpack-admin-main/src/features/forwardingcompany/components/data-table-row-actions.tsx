'use client'

import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { IconPencil, IconSettings, IconTrash } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useTasks } from '../context/tasks-context'
import { forwardingCompanyFormSchema, ForwardingCompany } from '../data/schema'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const parseResult = forwardingCompanyFormSchema.safeParse(row.original)

  if (!parseResult.success) {
    console.error('Schema validation failed:', parseResult.error)
    // Provide fallback values for invalid data
    const fallbackTask = {
      id: (row.original as any).id || '',
      name: (row.original as any).name || '',
      contactEmail: (row.original as any).contactEmail || '',
      contactPhone: (row.original as any).contactPhone || '',
      address: (row.original as any).address || '',
    } as ForwardingCompany
    return renderActions(fallbackTask)
  }

  const task = parseResult.data

  return renderActions(task)
}

function renderActions(task: ForwardingCompany) {
  const { setOpen, setCurrentRow, setMode, deleteForwardingCompany } =
    useTasks()

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

      <DropdownMenuContent align='end' className='w-[180px]'>
        {/* ✏️ Edit Company */}
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(task)
            setMode('update')
            setOpen('update') // Make sure this matches drawer rendering
          }}
        >
          <IconPencil className='mr-2 h-4 w-4' />
          Edit
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(task)
            setMode('services')
            setOpen('services') // Make sure this matches drawer rendering
          }}
        >
          <IconSettings className='mr-2 h-4 w-4' />
          Manage Services
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            if (
              confirm(
                'Are you sure you want to delete this forwarding company?'
              )
            ) {
              await deleteForwardingCompany(parseInt(task.id))
            }
          }}
          className='text-red-600 focus:text-red-600'
        >
          <IconTrash className='mr-2 h-4 w-4' />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
