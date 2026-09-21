import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { AgentTableItem } from '@/type/agent'
import { toast } from 'sonner'
import http from '@/utils/http'
import { AGENTS_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useTasks } from '../context/tasks-context'
// Zod schema (already defined in your schema file)
import { agentSchema } from '../data/schema'

// Define types
export type AgentDetail = {
  id: number
  name: string
  companyName: string
  country: string
  city: string
  address: string
  postcode: string
  phone: string
  code: string
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const [previewOpen, setPreviewOpen] = useState(false)

  // Parse the row data with Zod safely
  const parsed = agentSchema.safeParse(row.original)
  const agent = parsed.success
    ? {
        ...parsed.data,
        id: parsed.data.id ? Number(parsed.data.id) : (row.original as any).id,
        name: parsed.data.name || '',
        companyName: parsed.data.companyName || '',
        country: parsed.data.country || '',
        city: parsed.data.city || '',
        address: parsed.data.address || '',
        postcode: parsed.data.postcode || '',
        phone: parsed.data.phone || '',
        code: parsed.data.code || '',
      }
    : {
        id: (row.original as any)?.id,
        name: (row.original as any)?.name || '',
        companyName: (row.original as any)?.companyName || '',
        country: (row.original as any)?.country || '',
        city: (row.original as any)?.city || '',
        address: (row.original as any)?.address || '',
        postcode: (row.original as any)?.postcode || '',
        phone: (row.original as any)?.phone || '',
        code: (row.original as any)?.code || '',
      }
  const { setOpen, setCurrentRow } = useTasks()

  const handleGenerateReport = () => {
    // Example action: generate a report or PDF
    alert(`Generating report for agent ${agent.code}`)
  }
  const handleEdit = () => {
    setCurrentRow(row.original as AgentTableItem)
    setOpen('update')
  }

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete agent "${agent.name}"?`)) {
      try {
        if (!agent.id) {
          toast.error('Agent ID is missing')
          return
        }
        await http.delete(AGENTS_ENDPOINTS.DELETE_AGENT(agent.id))
        toast.success('Agent deleted successfully!')
        // Refresh the page
        window.location.reload()
      } catch (error) {
        console.error('Error deleting agent:', error)
        toast.error('Failed to delete agent. Please try again.')
      }
    }
  }

  return (
    <>
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
          <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
          {/* <DropdownMenuItem disabled>Make a copy</DropdownMenuItem> */}
          <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
            {/* <IconEye className='mr-2 h-4 w-4' /> */}
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* <DropdownMenuSub>
            <DropdownMenuSubTrigger>Actions</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={handleGenerateReport}>
                Generate Report
              </DropdownMenuItem>
              <DropdownMenuItem>Export to CSV</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub> */}
          {/* <DropdownMenuSeparator /> */}
          <DropdownMenuItem className='text-red-600' onClick={handleDelete}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal Popup */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='max-h-[80vh] max-w-3xl overflow-auto'>
          <DialogHeader>
            <DialogTitle>Agent Details: {agent.name}</DialogTitle>
          </DialogHeader>

          <div className='mt-4 space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p>
                  <strong>ID:</strong> {agent.id}
                </p>
                <p>
                  <strong>Name:</strong> {agent.name}
                </p>
                <p>
                  <strong>Company:</strong> {agent.companyName}
                </p>
                <p>
                  <strong>Phone:</strong> {agent.phone}
                </p>
              </div>
              <div>
                <p>
                  <strong>Country:</strong> {agent.country}
                </p>
                <p>
                  <strong>City:</strong> {agent.city}
                </p>
                <p>
                  <strong>Postcode:</strong> {agent.postcode}
                </p>
                <p>
                  <strong>Code:</strong> {agent.code}
                </p>
              </div>
              <div className='col-span-2'>
                <p>
                  <strong>Address:</strong> {agent.address}
                </p>
              </div>
            </div>

            {/* Optional Action Button */}
            <div className='mt-6 text-right'>
              <Button onClick={handleGenerateReport}>
                Generate Agent Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
