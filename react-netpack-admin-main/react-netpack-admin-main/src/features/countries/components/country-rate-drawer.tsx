'use client'

import { useState, useEffect } from 'react'
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

interface Country {
  id: number
  name: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Country | null
}

/**
 * Generates the default weight ranges (0-10kg in 0.5kg steps) in ASCENDING order,
 * merging with existing rates. Custom rates (> 10kg or non-standard steps)
 * are included and sorted at the end.
 */
const generateDefaultRates = (existingRates: Rate[]): Rate[] => {
  const defaultRates: Rate[] = []
  const maxWeight = 10
  const step = 0.5
  const rangeLength = 0.4 // e.g., 0 to 0.4 is 0.5 kg range
  const numSteps = Math.round(maxWeight / step)

  // Helper to check if an existing rate covers the default range
  const findMatchingRate = (from: number, to: number) => {
    return existingRates.find(
      (r) => (r.weightFrom ?? 0) === from && (r.weightTo ?? 0) === to
    )
  }

  // 1. Generate default rates in ASCENDING order (from 0kg up to 10kg)
  for (let i = 0; i < numSteps; i++) {
    const weightFrom = i * step
    const weightTo = weightFrom + rangeLength

    const existingRate = findMatchingRate(weightFrom, weightTo)

    if (existingRate) {
      defaultRates.push(existingRate)
    } else {
      // Create an empty rate for the default range
      const newRate: Rate = {
        weightFrom: weightFrom,
        weightTo: weightTo,
        rate: undefined, // undefined/null keeps the input field empty
        isPerKg: false,
      }
      defaultRates.push(newRate)
    }
  }

  // 2. Identify and prepare custom rates (rates outside the 0-10kg standard ranges)
  const defaultRanges = defaultRates.map((r) => ({
    from: r.weightFrom,
    to: r.weightTo,
  }))

  const customRates = existingRates
    .filter((existingRate) => {
      // Keep rates that are not exactly one of the generated default ranges
      return !defaultRanges.some(
        (def) =>
          def.from === existingRate.weightFrom &&
          def.to === existingRate.weightTo
      )
    })
    // Sort custom rates also in ascending order based on weightFrom
    .sort((a, b) => (a.weightFrom ?? 0) - (b.weightFrom ?? 0))

  // 3. Combine default rates (0kg to 10kg) with custom rates (> 10kg)
  // This results in a fully ascending list of rates by weight.
  return [...defaultRates, ...customRates]
}

export function CountryRateDrawer({ open, onOpenChange, initialData }: Props) {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch rates and combine with default ranges when drawer opens
  useEffect(() => {
    const fetchRates = async () => {
      if (!initialData?.name || !open) {
        setRates([])
        return
      }

      setLoading(true)
      let fetchedRates: Rate[] = []

      try {
        const res = await http.get<any>(
          RATE_ENDPOINT.GET_RATE_BY_COUNTRY + '/' + initialData.name
        )
        if (res?.rates && Array.isArray(res.rates)) {
          // Normalize null values to undefined so input fields are empty
          fetchedRates = res.rates.map((r: Rate) => ({
            ...r,
            weightFrom: r.weightFrom ?? undefined,
            weightTo: r.weightTo ?? undefined,
            rate: r.rate ?? undefined,
          }))
        }
      } catch (err) {
        console.error('Failed to fetch rates:', err)
        // Keep fetchedRates as empty array on error
      } finally {
        // Generate the combined list (default ranges + fetched/custom rates)
        const combinedRates = generateDefaultRates(fetchedRates)
        setRates(combinedRates)
        setLoading(false)
      }
    }

    fetchRates()
  }, [initialData?.name, open])

  const addNewRate = () => {
    // This allows adding rates above the 10kg maximum of the default set
    const newRate: Rate = {
      weightFrom: undefined, // undefined/null allows empty input
      weightTo: undefined,
      rate: undefined,
      isPerKg: false,
    }
    // Add new rate to the beginning, which usually makes it easy to spot
    // However, for strict ascending order, you might want to place it at the end
    // or rely on the user filling out the fields and re-sorting later if necessary.
    // For now, keeping it at the top for immediate visibility upon clicking '+ Add'.
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
      <SheetContent side='right' className='w-full sm:max-w-lg'>
        <SheetHeader className='border-b px-8 py-4'>
          <SheetTitle className='text-lg font-semibold'>
            Edit Rates for {initialData?.name}
          </SheetTitle>
        </SheetHeader>

        {/* Add New Rate Button */}
        <div className='bg-muted/30 flex items-center justify-between border-b px-8 py-3'>
          <Button onClick={addNewRate}>+ Add New Rate</Button>
        </div>

        {/* Table Layout */}
        <div className='flex-grow overflow-y-auto px-8 py-4'>
          {loading ? (
            <p>Loading rates...</p>
          ) : rates.length === 0 ? (
            <p>No rates found for this country.</p>
          ) : (
            <div className='overflow-x-auto'>
              <table className='w-full border-collapse text-sm'>
                <thead>
                  <tr className='bg-muted/30 border-b text-left'>
                    <th className='px-4 py-2'>Weight From (kg)</th>
                    <th className='px-4 py-2'>Weight To (kg)</th>
                    <th className='px-4 py-2'>Rate (NPR)</th>
                    <th className='px-4 py-2'>Type</th>
                    <th className='px-4 py-2 text-right'>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rates.map((rate, index) => (
                    <RateForm
                      key={rate.id || index}
                      rate={rate}
                      onChange={(updatedRate) => updateRate(index, updatedRate)}
                      onDelete={() => deleteRate(index)}
                      countryName={initialData?.name}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
