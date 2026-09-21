'use client'

import { useState, useEffect } from 'react'
import { Zone } from '@/type/zone'
import http from '@/utils/http'
import { RATE_ENDPOINT } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { RateForm } from './rate-form'

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
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Zone | null
}

export function ZoneRateDrawer({ open, onOpenChange, initialData }: Props) {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchRates = async () => {
      if (!initialData?.id || !open) return

      setLoading(true)
      try {
        const res = await http.get<any>(
          RATE_ENDPOINT.GET_RATE_BY_COUNTRY + '/' + initialData.id
        )
        if (res?.rates && Array.isArray(res.rates)) {
          setRates(res.rates)
        } else {
          setRates([])
        }
      } catch (err) {
        console.error('Failed to fetch rates:', err)
        setRates([])
      } finally {
        setLoading(false)
      }
    }

    fetchRates()
  }, [initialData?.id, open])

  const addNewRate = () => {
    const newRate = { weightFrom: 0, weightTo: 0, rate: 0, isPerKg: false }
    setRates([newRate, ...rates])
  }

  const updateRate = (index: number, updatedRate: Rate) => {
    const newRates = [...rates]
    newRates[index] = updatedRate
    setRates(newRates)
  }

  const deleteRate = (index: number) => {
    setRates(rates.filter((_, i) => i !== index))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex h-[90vh] w-full max-w-4xl flex-col p-0'>
        <SheetHeader className='border-b px-6 py-4'>
          <SheetTitle>Edit Rates for Zone: {initialData?.name}</SheetTitle>
        </SheetHeader>
        <div className='bg-muted/30 flex items-center justify-between border-b px-6 py-3'>
          <Button onClick={addNewRate}>+ Add New Rate</Button>
        </div>
        <div className='flex-grow overflow-y-auto px-6 py-4'>
          {loading ? (
            <p>Loading rates...</p>
          ) : rates.length === 0 ? (
            <p>No rates found for this zone.</p>
          ) : (
            <div className='space-y-4'>
              {rates.map((rate, index) => (
                <div key={index} className='rounded-md border p-4 shadow-sm'>
                  <RateForm
                    rate={rate}
                    onChange={(updatedRate) => updateRate(index, updatedRate)}
                    onDelete={() => deleteRate(index)}
                    zoneName={initialData?.name}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
