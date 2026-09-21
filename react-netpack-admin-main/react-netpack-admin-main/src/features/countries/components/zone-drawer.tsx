'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Country } from '@/type/country'
import { Zone } from '@/type/zone'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import http from '@/utils/http'
import { COUNTRY_ENDPOINT, RATE_ENDPOINT } from '@/constants/endpoint'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useZone } from '../context/zone-context'
import { RateForm } from './rate-form'

// Schema for Zone form
const zoneFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Zone name is required'),
  description: z.string().optional(),
  weightLimit: z.number().min(0, 'Weight limit must be 0 or greater'),
  countryIds: z.array(z.number()).optional(),
})

export type ZoneFormValues = z.infer<typeof zoneFormSchema>

interface ZoneDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: Zone | null
}

type Rate = {
  id?: number
  weightFrom?: number | null
  weightTo?: number | null
  rate?: number | null
  isPerKg: boolean
  countryName?: string
  zoneName?: string
}

export function ZoneDrawer({
  open,
  onOpenChange,
  initialData,
}: ZoneDrawerProps) {
  const { createZone, updateZone } = useZone()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countries, setCountries] = useState<Country[]>([])
  const [selectedCountries, setSelectedCountries] = useState<Country[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const isUpdate = !!initialData

  // Fetch countries for dropdown
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const result = await http.get<{ data: Country[] }>(
          COUNTRY_ENDPOINT.GET_ALL_COUNTRY
        )
        setCountries(result.data)
      } catch (error) {
        console.error('Failed to fetch countries:', error)
      }
    }
    fetchCountries()
  }, [])

  // Initialize selected countries from initial data
  useEffect(() => {
    if (initialData?.countries) {
      setSelectedCountries(initialData.countries)
    } else {
      setSelectedCountries([])
    }
  }, [initialData])

  // Fetch rates for zone when drawer opens
  useEffect(() => {
    const fetchRates = async () => {
      if (!initialData?.id || !open) return
      setLoadingRates(true)
      try {
        // const res = await http.get<any>(
        //   RATE_ENDPOINT.GET_RATE_BY_COUNTRY + '/' + initialData.id
        // )

        const res = await http.get<any>(
          RATE_ENDPOINT.GET_RATE_BY_ZONE + '/' + initialData.id
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
        setLoadingRates(false)
      }
    }
    fetchRates()
  }, [initialData?.id, open])

  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: {
      id: initialData?.id?.toString() || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      weightLimit: initialData?.weightLimit || 0,
      countryIds: initialData?.countries?.map((c) => c.id) || [],
    },
  })

  useEffect(() => {
    if (initialData) {
      form.reset({
        id: initialData.id.toString(),
        name: initialData.name,
        description: initialData.description || '',
        weightLimit: initialData.weightLimit,
        countryIds: initialData.countries?.map((c) => c.id) || [],
      })
    } else {
      form.reset({
        id: '',
        name: '',
        description: '',
        weightLimit: 0,
        countryIds: [],
      })
    }
  }, [initialData, form])

  const handleCountrySelect = (countryId: string) => {
    const country = countries.find((c) => c.id.toString() === countryId)
    if (country && !selectedCountries.find((c) => c.id === country.id)) {
      setSelectedCountries([...selectedCountries, country])
      form.setValue(
        'countryIds',
        [...(form.getValues('countryIds') || []), country.id],
        { shouldValidate: true }
      )
    }
  }

  const handleCountryRemove = (countryId: number) => {
    console.log('=== handleCountryRemove called ===')
    console.log('Removing country:', countryId)
    console.log('Current selectedCountries:', selectedCountries)

    const updatedCountries = selectedCountries.filter((c) => c.id !== countryId)
    const updatedCountryIds = (form.getValues('countryIds') || []).filter(
      (id) => id !== countryId
    )

    console.log('Updated countries:', updatedCountries)
    console.log('Updated country IDs:', updatedCountryIds)

    setSelectedCountries(updatedCountries)
    form.setValue('countryIds', updatedCountryIds, { shouldValidate: true })
  }

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

  const onSubmit = async (data: ZoneFormValues) => {
    setIsSubmitting(true)
    try {
      if (isUpdate && initialData) {
        const result = await updateZone(initialData.id, {
          name: data.name,
          description: data.description,
          weightLimit: data.weightLimit,
          countryIds: data.countryIds,
        })
        if (result) {
          toast.success('Zone updated successfully')
          onOpenChange(false)
          window.location.reload()
        } else {
          toast.error('Failed to update zone')
        }
      } else {
        const result = await createZone({
          name: data.name,
          description: data.description,
          weightLimit: data.weightLimit,
          countryIds: data.countryIds,
        })
        if (result) {
          toast.success('Zone created successfully')
          onOpenChange(false)
          window.location.reload()
        } else {
          toast.error('Failed to create zone')
        }
      }
    } catch (error) {
      toast.error('An error occurred')
      console.error('Error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='flex h-screen max-h-screen w-full flex-col overflow-hidden sm:max-w-lg'
      >
        <SheetHeader>
          <SheetTitle>{isUpdate ? 'Edit Zone' : 'Create Zone'}</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Make changes to the zone here.'
              : 'Add a new zone to the system.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          {/* --- EXISTING ZONE FORM --- */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-6 py-4'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter zone name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder='Enter description' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='weightLimit'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight Limit</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='Enter weight limit'
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='countryIds'
                render={({}) => (
                  <FormItem>
                    <FormLabel>Countries</FormLabel>
                    <FormControl>
                      <div className='space-y-2'>
                        <Select onValueChange={handleCountrySelect}>
                          <SelectTrigger>
                            <SelectValue placeholder='Select countries to add' />
                          </SelectTrigger>
                          <SelectContent>
                            {countries
                              .filter(
                                (country) =>
                                  !selectedCountries.find(
                                    (c) => c.id === country.id
                                  )
                              )
                              .map((country) => (
                                <SelectItem
                                  key={country.id}
                                  value={country.id.toString()}
                                >
                                  {country.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>

                        {selectedCountries.length > 0 && (
                          <div className='mt-2 flex flex-wrap gap-2'>
                            {selectedCountries.map((country) => (
                              <Badge
                                key={country.id}
                                variant='secondary'
                                className='flex items-center gap-1'
                              >
                                {country.name}
                                <button
                                  type='button'
                                  className='ml-1 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-red-100'
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log('Removing country:', country.id)
                                    handleCountryRemove(country.id)
                                  }}
                                >
                                  <X className='h-3 w-3 text-gray-500 hover:text-red-500' />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter>
                <Button type='submit' disabled={isSubmitting}>
                  {isSubmitting
                    ? 'Saving...'
                    : isUpdate
                      ? 'Update Zone'
                      : 'Create Zone'}
                </Button>
              </SheetFooter>
            </form>
          </Form>

          {/* --- ZONE RATES SECTION --- */}
          <div className='bg-muted/30 mt-4 flex items-center justify-between border-b px-6 py-3'>
            <span className='font-semibold'>Zone Rates</span>
            <Button onClick={() => form.handleSubmit(onSubmit)()}>
              Apply Rate to Country
            </Button>
            <Button onClick={addNewRate}>+ Add New Rate</Button>
          </div>
          <div className='flex-grow overflow-y-auto px-6 py-4'>
            {loadingRates ? (
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
