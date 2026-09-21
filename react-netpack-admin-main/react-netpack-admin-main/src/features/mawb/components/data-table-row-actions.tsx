// src/components/data-table-row-actions.tsx
import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { IconEye, IconPencil, IconTable, IconFileText } from '@tabler/icons-react'
import { MAWB } from '@/type/mawb'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import http from '@/utils/http'
// optional, for notifications

// import { EnquiryItem } from '@/type/enquiry'
// import { MAWBTableItem } from '@/type/mawb'
import { MAWB_ENDPOINTS } from '@/constants/endpoint'
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
import { mawbFormSchema } from '../data/schema'

// Extend EnquiryItem type to include all needed fields
export type FullEnquiry = {
  id: number
  destinationLocation: string
  destinationCountry: number
  noOfBox: number
  weight: number
  status: string
  customer: {
    name: string
    phone: string
  }
  country: {
    name: string
  }
}

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTableRowActions<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const task = mawbFormSchema.parse(row.original)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [excelData, setExcelData] = useState<any[][] | null>(null)
  const [excelError, setExcelError] = useState<string | null>(null)
  const [previewType, setPreviewType] = useState<
    'manifest' | 'dataSheet' | null
  >(null)

  const { setOpen, setCurrentRow } = useTasks()
  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete MAWB ${task.mawbNumber}?`)) {
      return
    }

    try {
      const response = await http.delete<any>(
        MAWB_ENDPOINTS.DELETE_MAWB + '/' + task.id
      )

      toast.success(response.message)

      // 🔄 Reload page after success
      setTimeout(() => {
        window.location.reload()
      }, 800) // small delay so toast shows before reload
    } catch (error: any) {
      console.error(error)
      toast.error(`Could not delete MAWB ${task.mawbNumber}`)
    }
  }

  const handleGenerateManifest = () => {
    const url = `${MAWB_ENDPOINTS.GENERATE_MANIFEST}/${task.mawbNumber}`
    const link = document.createElement('a')
    link.href = url
    link.download = `manifest-${task.mawbNumber}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleGenerateDataSheet = () => {
    const url = `${MAWB_ENDPOINTS.GENERATE_DATA_SHEET}/${task.mawbNumber}`
    const link = document.createElement('a')
    link.href = url
    link.download = `datasheet-${task.mawbNumber}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePreviewManifest = async () => {
    setPreviewOpen(true)
    setPreviewType('manifest')
    setExcelData(null)
    setExcelError(null)
    try {
      const url = `${MAWB_ENDPOINTS.GENERATE_MANIFEST}/${task.mawbNumber}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch manifest Excel file')
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      setExcelData(data as any[][])
    } catch (err: any) {
      setExcelError(
        'Could not preview Excel file. You can still generate and download it.'
      )
    }
  }

  const handlePreviewDataSheet = async () => {
    setPreviewOpen(true)
    setPreviewType('dataSheet')
    setExcelData(null)
    setExcelError(null)
    try {
      const url = `${MAWB_ENDPOINTS.GENERATE_DATA_SHEET}/${task.mawbNumber}`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch data sheet Excel file')
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const workbook = XLSX.read(arrayBuffer, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
      setExcelData(data as any[][])
    } catch (err: any) {
      setExcelError(
        'Could not preview Excel file. You can still generate and download it.'
      )
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
        <DropdownMenuContent align='end' className='w-[180px]'>
          {/* ✅ Edit Action */}
          <DropdownMenuItem
            onClick={() => {

              setCurrentRow({
                ...task,
                id: parseInt(task.id),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              } as MAWB) // Set current data
              setOpen('update') // Open drawer in edit mode
            }}
          >
            <IconPencil className='mr-2 h-4 w-4' />
            Edit
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              window.location.href = `/custom-manifest`
            }}
          >
            <IconFileText className='mr-2 h-4 w-4 text-primary' />
            Customs & Chambers Hub
          </DropdownMenuItem>

          <DropdownMenuItem disabled>Make a copy</DropdownMenuItem>
          <DropdownMenuItem onClick={handlePreviewManifest}>
            <IconEye className='mr-2 h-4 w-4' />
            Preview Manifest
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePreviewDataSheet}>
            <IconTable className='mr-2 h-4 w-4' />
            Preview Data Sheet
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuSeparator />
          {task.hasShipment == false ? <DropdownMenuItem onClick={handleDelete} className='text-red-600'>
            Delete
          </DropdownMenuItem> : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal Popup */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='h-[95vh] max-h-none min-h-[60vh] w-[98vw] max-w-none min-w-[60vw] overflow-auto'>
          <DialogHeader>
            <DialogTitle>
              {previewType === 'manifest'
                ? `Manifest Preview for MAWB ${task.mawbNumber}`
                : previewType === 'dataSheet'
                  ? `Data Sheet Preview for MAWB ${task.mawbNumber}`
                  : ''}
            </DialogTitle>
          </DialogHeader>
          {excelError && <div className='mb-2 text-red-600'>{excelError}</div>}
          {excelData ? (
            <div className='h-[75vh] overflow-auto'>
              <table className='min-w-full border text-xs'>
                <tbody>
                  {excelData.map((row, i) => (
                    <tr key={i}>
                      {row.map((cell, j) => (
                        <td key={j} className='border px-2 py-1 whitespace-pre-line align-top'>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !excelError ? (
            <div className='py-4 text-center'>Loading preview...</div>
          ) : null}
          <div className='mt-6 flex gap-2 text-right'>
            <Button onClick={handleGenerateManifest}>Generate Manifest</Button>
            <Button onClick={handleGenerateDataSheet} variant='secondary'>
              Generate Data Sheet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
