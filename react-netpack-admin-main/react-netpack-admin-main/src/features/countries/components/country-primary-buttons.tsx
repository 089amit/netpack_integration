import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useCountry } from '../context/country-context'
import http from '@/utils/http'
import { RATE_ENDPOINT } from '@/constants/endpoint'

export function CountryPrimaryButton() {
  const { setOpen, setCurrentRow } = useCountry()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await http.post<{ message: string }>(
        RATE_ENDPOINT.IMPORT_EXCEL,
        formData
      )
      alert(res.message || 'Rates successfully imported from Excel!')
      window.location.reload()
    } catch (err: any) {
      console.error(err)
      alert(`Failed to import Excel file: ${err.message || 'Unknown error'}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className='flex gap-2'>
      <input
        type='file'
        ref={fileInputRef}
        onChange={handleExcelUpload}
        accept='.xlsx, .xls'
        className='hidden'
      />
      <Button
        className='bg-emerald-600 hover:bg-emerald-700 text-white'
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? 'Importing...' : '📊 Import Tariff Excel'}
      </Button>
      <Button
        onClick={() => {
          setCurrentRow(null)
          setOpen('create')
        }}
      >
        Create
      </Button>
    </div>
  )
}
