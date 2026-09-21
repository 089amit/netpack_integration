'use client'

import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AGENTS_ENDPOINTS } from '@/constants/endpoint'
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
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

// 🔧 Schema for Agent form
const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  companyName: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  phone: z.string().optional(),
  code: z.string().min(1, 'Agent code is required'),
})

export type AgentFormValues = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: AgentFormValues | null // optional if editing
}

export function AgentMutateDrawer({ open, onOpenChange, currentRow }: Props) {
  const isUpdate = !!currentRow
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 🔁 Default values
  const defaultValues = currentRow ?? {
    name: '',
    companyName: '',
    country: '',
    city: '',
    address: '',
    postcode: '',
    phone: '',
    code: '',
  }

  // 🧠 Form setup
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  })

  // ✅ Submit handler
  const onSubmit = async (data: AgentFormValues) => {
    setIsSubmitting(true)
    try {
      console.log('Submitting agent data:', data)

      const url =
        isUpdate && data.id
          ? AGENTS_ENDPOINTS.UPDATE_AGENTS(Number(data.id))
          : AGENTS_ENDPOINTS.CREATE_AGENTS

      const method = isUpdate ? 'PUT' : 'POST'

      // Remove id from payload for API call
      const { id, ...payload } = data

      console.log('Making request to:', url)
      console.log('Method:', method)
      console.log('Payload:', payload)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        throw new Error(
          `Failed to submit: ${response.status} ${response.statusText}`
        )
      }

      const result = await response.json()
      console.log('Success response:', result)

      toast.success(
        isUpdate ? 'Agent updated successfully!' : 'Agent created successfully!'
      )

      // Notify parent of update
      window.dispatchEvent(new Event('agent-updated'))

      onOpenChange(false)
      form.reset()

      // Simulate refresh
      window.location.reload()
    } catch (err) {
      console.error('Submission failed:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save agent')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex h-full w-full flex-col overflow-hidden md:max-w-xl'>
        <SheetHeader>
          <SheetTitle>{isUpdate ? 'Edit' : 'Create'} Agent</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the agent by providing necessary info.'
              : 'Add a new agent by providing necessary info.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <div className='flex-1 overflow-auto'>
          <Form {...form}>
            <form
              id='agent-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-5 px-4 py-2'
            >
              {/* Full Name */}
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. John Doe' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Company Name */}
              <FormField
                control={form.control}
                name='companyName'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. ABC Logistics' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name='country'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. AE' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City */}
              <FormField
                control={form.control}
                name='city'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. Dubai' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address */}
              <FormField
                control={form.control}
                name='address'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. Bur Dubai' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Postcode */}
              <FormField
                control={form.control}
                name='postcode'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. 44735' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. +971559728280' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Agent Code */}
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel>Agent Code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. SMNP' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <SheetFooter className='bg-background sticky bottom-0 mt-auto gap-2 border-t pt-4'>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type='submit' form='agent-form' disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
