'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import http from '@/utils/http'
import { FORWARDING_COMPANY_ENDPOINTS } from '@/constants/endpoint'
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

// ✅ Schema
const forwardingCompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Company name is required'),
  contactEmail: z.string().email('Invalid email').optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
})

export type ForwardingCompanyFormValues = z.infer<
  typeof forwardingCompanySchema
>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: ForwardingCompanyFormValues | null
  mode: 'create' | 'update' | 'services'
}

export function ForwardingCompanyDrawer({
  open,
  onOpenChange,
  currentRow,
  mode,
}: Props) {
  const isUpdate = !!currentRow && mode === 'update'
  const form = useForm<ForwardingCompanyFormValues>({
    resolver: zodResolver(forwardingCompanySchema),
    defaultValues: currentRow ?? {
      name: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    },
  })

  const [services, setServices] = useState<string[]>([])
  const [newService, setNewService] = useState('')

  useEffect(() => {
    if (currentRow) {
      form.reset(currentRow)
    }
  }, [currentRow, form])

  useEffect(() => {
    if (mode === 'services') {
      // Replace with actual fetch logic if services are stored separately
    }
  }, [mode, currentRow])

  const onSubmit = async (data: ForwardingCompanyFormValues) => {
    try {
      const { id, ...payload } = data

      if (isUpdate && currentRow?.id) {
        // Update existing company
        const response = await http.put(
          FORWARDING_COMPANY_ENDPOINTS.UPDATE_COMPANY(Number(currentRow.id)),
          payload
        )
        if (response) {
          window.dispatchEvent(new Event('forwarding-company-updated'))
        }
      } else {
        // Create new company
        const response = await http.post(
          FORWARDING_COMPANY_ENDPOINTS.CREATE_COMPANY,
          payload
        )
        if (response) {
          window.dispatchEvent(new Event('forwarding-company-updated'))
        }
      }

      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to submit forwarding company:', error)
    }
  }

  const handleAddService = () => {
    if (!newService.trim()) return
    setServices((prev) => [...prev, newService.trim()])
    setNewService('')
  }

  const handleDeleteService = (index: number) => {
    setServices((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col md:max-w-xl'>
        <SheetHeader className='text-left'>
          <SheetTitle>
            {mode === 'services'
              ? 'Manage Services'
              : isUpdate
                ? 'Update Forwarding Company'
                : 'Create Forwarding Company'}
          </SheetTitle>
          <SheetDescription>
            {mode === 'services'
              ? `Manage services for ${currentRow?.name || ''}.`
              : isUpdate
                ? 'Update the forwarding company details.'
                : 'Add a new forwarding company. Click save when you’re done.'}
          </SheetDescription>
        </SheetHeader>

        {mode === 'services' ? (
          <div className='flex-1 space-y-5 px-4 py-2'>
            <div>
              <label className='text-sm font-medium'>Add New Service</label>
              <div className='mt-2 flex gap-2'>
                <Input
                  value={newService}
                  onChange={(e) => setNewService(e.target.value)}
                  placeholder='e.g. Air Cargo'
                />
                <Button type='button' onClick={handleAddService}>
                  Add
                </Button>
              </div>
            </div>

            <div>
              <label className='text-sm font-medium'>Existing Services</label>
              <ul className='mt-2 space-y-2'>
                {services.map((service, index) => (
                  <li
                    key={index}
                    className='flex items-center justify-between rounded border p-2'
                  >
                    <span>{service}</span>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => handleDeleteService(index)}
                    >
                      Delete
                    </Button>
                  </li>
                ))}
                {services.length === 0 && (
                  <p className='text-muted-foreground text-sm'>
                    No services found.
                  </p>
                )}
              </ul>
            </div>
          </div>
        ) : (
          <Form {...form}>
            <form
              id='forwarding-company-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='flex-1 space-y-5 px-4 py-2'
            >
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. DHL Express' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='contactEmail'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. support@dhl.com' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='contactPhone'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. +977 9800000000' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='address'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. Kathmandu, Nepal' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <SheetFooter className='mt-auto gap-2 pt-4'>
                <SheetClose asChild>
                  <Button variant='outline'>Close</Button>
                </SheetClose>
                <Button type='submit'>Save changes</Button>
              </SheetFooter>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  )
}
