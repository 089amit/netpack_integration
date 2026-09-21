'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm, Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Country } from '@/type/country'
import { Zone } from '@/type/zone'
import { toast } from 'sonner'
import http from '@/utils/http'
import { ZONE_ENDPOINT } from '@/constants/endpoint'
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
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { useCountry } from '../context/country-context'

// Form schema for validation
const countryFormSchema = z.object({
  name: z.string().min(1, 'Country name is required'),
  // Allow empty input (treated as undefined) or a non-negative number
  boxWeightLimit: z.preprocess((val) => {
    if (val === '' || val === null || typeof val === 'undefined')
      return undefined
    return Number(val)
  }, z.number().min(0, 'Box weight limit must be 0 or greater').optional()),
  isActive: z.boolean(),
  zoneId: z.number().nullable(),
})

type CountryFormValues = z.infer<typeof countryFormSchema>

export function CountryDetailDrawer() {
  const { state, setOpen, createCountry, updateCountry } = useCountry()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const isEdit = state.open === 'update'

  const form = useForm<CountryFormValues>({
    resolver: zodResolver(
      countryFormSchema
    ) as unknown as Resolver<CountryFormValues>,
    defaultValues: {
      name: '',
      boxWeightLimit: 0,
      isActive: true,
      zoneId: null,
    },
  })

  // Fetch zones for dropdown
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const result = await http.get<Zone[] | { data: Zone[] }>(
          ZONE_ENDPOINT.GET_ALL_ZONES
        )

        // Handle different response structures
        const zonesData = Array.isArray(result) ? result : result.data
        setZones(zonesData)
      } catch (error) {
        console.error('Failed to fetch zones:', error)
        toast.error('Failed to load zones')
      }
    }
    fetchZones()
  }, [])

  // Reset form when drawer opens/closes or current row changes
  useEffect(() => {
    if (isEdit && state.currentRow) {
      form.reset({
        name: state.currentRow.name,
        boxWeightLimit: state.currentRow.boxWeightLimit,
        isActive: state.currentRow.isActive,
        zoneId: state.currentRow.zoneId,
      })
    } else {
      form.reset({
        name: '',
        boxWeightLimit: 0,
        isActive: true,
        zoneId: null,
      })
    }
  }, [state.open, state.currentRow, form])

  const onSubmit = async (formData: CountryFormValues) => {
    setIsSubmitting(true)
    try {
      console.log('Submitting form data:', formData)

      if (isEdit && state.currentRow) {
        console.log('Updating country with ID:', state.currentRow.id)
        const result = await updateCountry(state.currentRow.id, formData)
        console.log('Update result:', result)

        if (result) {
          toast.success('Country updated successfully')
          setOpen('')
          window.location.reload()
        } else {
          toast.error('Failed to update country')
        }
      } else {
        console.log('Creating new country')
        const result = await createCountry(formData as Omit<Country, 'id'>)
        console.log('Create result:', result)

        if (result) {
          toast.success('Country created successfully')
          setOpen('')
          window.location.reload()
        } else {
          toast.error('Failed to create country')
        }
      }
    } catch (error) {
      console.error('Form submission error:', error)
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isOpen = state.open === 'create' || state.open === 'update'

  return (
    <Sheet open={isOpen} onOpenChange={() => setOpen('')}>
      <SheetContent side='right' className='w-full sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle className='text-xl font-semibold'>
            {isEdit ? 'Edit Country' : 'Create Country'}
          </SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Update the country information below.'
              : 'Add a new country to the system.'}
          </SheetDescription>
        </SheetHeader>

        <Separator className='my-4' />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-6 px-4'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter country name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='boxWeightLimit'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Box Weight Limit (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='Enter weight limit'
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === ''
                            ? undefined
                            : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='zoneId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === 'none' ? null : Number(value))
                    }
                    value={field.value?.toString() || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a zone' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='none'>No Zone</SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id.toString()}>
                          {zone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='isActive'
              render={({ field }) => (
                <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                  <div className='space-y-0.5'>
                    <FormLabel className='text-base'>Active Status</FormLabel>
                    <div className='text-muted-foreground text-sm'>
                      Enable or disable this country
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <SheetFooter className='px-4 pb-4'>
              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting
                  ? isEdit
                    ? 'Updating...'
                    : 'Creating...'
                  : isEdit
                    ? 'Update Country'
                    : 'Create Country'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
