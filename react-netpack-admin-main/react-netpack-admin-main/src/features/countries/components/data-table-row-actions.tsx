'use client'

import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { Country } from '@/type/country'
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
} from '@/components/ui/dropdown-menu'
import { useCountry } from '../context/country-context'

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const country = row.original as Country
  const [previewOpen, setPreviewOpen] = useState(false)

  const { setOpen, setCurrentRow } = useCountry()

  const handleEdit = () => {
    setCurrentRow(country)
    setOpen('update')
  }

  const handleAddEditRate = () => {
    setCurrentRow(country)
    setOpen('rate')
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
            aria-label='Open menu'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddEditRate}>Rate</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal Popup */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='max-h-[80vh] max-w-3xl overflow-auto'>
          <DialogHeader>
            <DialogTitle>Country Details: {country.name}</DialogTitle>
          </DialogHeader>

          <div className='mt-4 space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p>
                  <strong>ID:</strong> {country.id}
                </p>
                <p>
                  <strong>Name:</strong> {country.name}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  {country.isActive ? 'Active' : 'Inactive'}
                </p>
                <p>
                  <strong>Box Weight Limit:</strong> {country.boxWeightLimit}
                </p>
              </div>
              <div>
                <p>
                  <strong>Zone ID:</strong> {country.zoneId || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
