'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import http from '@/utils/http'
import { RATE_ENDPOINT } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

type Rate = {
  id?: number
  weightFrom?: number | null
  weightTo?: number | null
  rate?: number | null
  isPerKg: boolean
  countryName?: string
  zoneName?: string
}

interface Props {
  rate: Rate
  onChange: (rate: Rate) => void
  onDelete?: () => void
  countryName?: string
  zoneName?: string
}

export function RateForm({
  rate,
  onChange,
  onDelete,
  countryName,
  zoneName,
}: Props) {
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const normalizedRate = {
    ...rate,
    weightFrom: rate.weightFrom ?? 0,
    weightTo: rate.weightTo ?? 0,
    rate: rate.rate ?? 0,
  }

  const handleChange = (key: keyof Rate, value: any) => {
    const updated = { ...normalizedRate, [key]: value }
    onChange(updated)
  }

  const handleNumberChange = (key: keyof Rate, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value)
    handleChange(key, numValue)
  }

  const sanitizeRate = (r: Rate) => ({
    ...r,
    weightFrom: r.weightFrom ?? 0,
    weightTo: r.weightTo ?? 0,
    rate: r.rate ?? 0,
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Rate = zoneName
        ? { ...rate, zoneName }
        : { ...rate, countryName: countryName || '' }

      if (rate.id) {
        await http.put(`${RATE_ENDPOINT.UPDATE_RATE}/${rate.id}`, [
          sanitizeRate(payload),
        ])
        toast.success('Rate updated successfully')
      } else {
        const data = await http.post<{ id: number }>(RATE_ENDPOINT.ADD_RATE, [
          sanitizeRate(payload),
        ])
        onChange({ ...rate, id: data.id })
        toast.success('Rate added successfully')
      }
    } catch (error) {
      console.error('Failed to save rate:', error)
      toast.error('Failed to save rate')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!rate.id) {
      onDelete?.()
      return
    }
    setDeleting(true)
    try {
      await http.delete(`${RATE_ENDPOINT.DELETE_RATE}/${rate.id}`)
      onDelete?.()
      toast.success('Rate deleted')
    } catch (error) {
      console.error('Failed to delete rate:', error)
      toast.error('Failed to delete rate')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <tr className='hover:bg-muted/10 border-b transition'>
      <td className='px-4 py-3'>
        <Input
          type='number'
          step='0.1'
          className='h-9 w-15 text-sm'
          value={normalizedRate.weightFrom}
          onChange={(e) => handleNumberChange('weightFrom', e.target.value)}
        />
      </td>
      <td className='px-4 py-3'>
        <Input
          type='number'
          step='0.1'
          className='h-9 w-15 text-sm'
          value={normalizedRate.weightTo}
          onChange={(e) => handleNumberChange('weightTo', e.target.value)}
        />
      </td>
      <td className='px-4 py-3'>
        <Input
          type='number'
          className='h-9 w-25 text-sm'
          value={normalizedRate.rate}
          onChange={(e) => handleNumberChange('rate', e.target.value)}
        />
      </td>
      <td className='px-4 py-3'>
        <div className='flex items-center gap-2'>
          <Checkbox
            checked={normalizedRate.isPerKg}
            onCheckedChange={(checked) =>
              handleChange('isPerKg', checked === true)
            }
          />
          <span className='text-sm'>
            {normalizedRate.isPerKg ? 'Per Kg' : 'Flat'}
          </span>
        </div>
      </td>
      <td className='px-4 py-3 text-right'>
        <div className='flex justify-end gap-2'>
          <Button
            size='sm'
            variant='secondary'
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            size='sm'
            variant='destructive'
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </td>
    </tr>
  )
}
