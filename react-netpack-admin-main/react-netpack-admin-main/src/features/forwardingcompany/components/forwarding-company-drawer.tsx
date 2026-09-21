'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import http from '@/utils/http'
import { FORWARDING_COMPANY_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import { useTasks } from '../context/tasks-context'
import { ForwardingCompany, forwardingCompanyFormSchema } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: ForwardingCompany | null
}

export function ForwardingCompanyEditDrawer({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const isUpdate = !!currentRow
  const { refreshForwardingCompanies } = useTasks()

  const defaultValues: ForwardingCompany = {
    id: '', // placeholder id for new entries
    name: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
  }

  const form = useForm<ForwardingCompany>({
    resolver: zodResolver(forwardingCompanyFormSchema),
    defaultValues,
  })

  useEffect(() => {
    form.reset(currentRow ?? defaultValues)
  }, [currentRow])

  const onSubmit = async (data: ForwardingCompany) => {
    try {
      if (isUpdate) {
        await http.put(
          FORWARDING_COMPANY_ENDPOINTS.UPDATE_COMPANY(Number(data.id)),
          data
        )
      } else {
        // Exclude `id` field when creating
        const { id: _, ...createData } = data
        await http.post(FORWARDING_COMPANY_ENDPOINTS.CREATE_COMPANY, createData)
      }

      refreshForwardingCompanies()
      onOpenChange(false)
      form.reset()
    } catch (err) {
      console.error('Error submitting:', err)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col md:max-w-xl'>
        <SheetHeader className='text-left'>
          <SheetTitle>
            {isUpdate ? 'Edit' : 'Create'} Forwarding Company
          </SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the forwarding company details.'
              : 'Add a new forwarding company.'}
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-5 px-4 py-2'
            id='forwarding-company-form'
          >
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. DHL Express' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='contactEmail'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder='support@dhl.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='contactPhone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder='+977 9800000000' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='address'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g. Kathmandu' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <SheetFooter className='mt-auto gap-2 pt-4'>
          <SheetClose asChild>
            <Button variant='outline'>Cancel</Button>
          </SheetClose>
          <Button form='forwarding-company-form' type='submit'>
            Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
