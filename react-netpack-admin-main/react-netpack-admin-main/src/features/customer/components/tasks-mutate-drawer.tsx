'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Customer } from '@/type/customer'
import { Check, ChevronsUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import http from '@/utils/http'
import { USER_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useTasks } from '../context/tasks-context'
import { customerFormSchema, CustomerFormValues } from '../data/schema'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Customer
  onSuccess?: () => void
}

export function CustomerMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: Props) {
  const isUpdate = !!currentRow
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [openPopover, setOpenPopover] = useState(false)
  const { countries, refreshCustomers } = useTasks()

  const defaultValues: CustomerFormValues = {
    id: currentRow?.id,
    name: currentRow?.name ?? '',
    phone: currentRow?.phone ?? '',
    address1: currentRow?.address1 ?? '',
    address2: currentRow?.address2 ?? '',
    city: currentRow?.city ?? '',
    postcode: currentRow?.postcode ?? '',
    countryId: currentRow?.countryId ?? currentRow?.country?.id ?? null,
    gender: currentRow?.gender ?? 'MALE',
    email: currentRow?.email ?? '', // already optional in defaultValues
    organizationName: currentRow?.organizationName ?? '',
    isOrganization: currentRow?.isOrganization ?? false,
  }

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  })

  // Reset form when currentRow changes
  useEffect(() => {
    if (currentRow) {
      form.reset({
        id: currentRow.id,
        name: currentRow.name,
        phone: currentRow.phone || '',
        address1: currentRow.address1 || '',
        address2: currentRow.address2 || '',
        city: currentRow.city || '',
        postcode: currentRow.postcode || '',
        countryId: currentRow.countryId ?? currentRow.country?.id ?? null,
        gender: currentRow.gender,
        email: currentRow.email || '', // ensure empty string if undefined
        organizationName: currentRow.organizationName || '',
        isOrganization: currentRow.isOrganization,
      })
    } else {
      form.reset(defaultValues)
    }
  }, [currentRow, form])

  const onSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true)
    try {
      console.log('Submitting customer data:', data)

      if (isUpdate && currentRow?.id) {
        // Update existing customer
        const { id, ...updatePayload } = data
        const response = await http.put(
          `${USER_ENDPOINTS.UPDATE_CUSTOMER}/${currentRow.id}`,
          updatePayload
        )

        if (response) {
          console.log('Customer updated successfully:', response)
          toast.success('Customer updated successfully!')
          onSuccess?.()
          refreshCustomers()
        }
      } else {
        // Create new customer
        const { id, ...createPayload } = data
        const response = await http.post(
          USER_ENDPOINTS.GET_ALL_CUSTOMER,
          createPayload
        )

        if (response) {
          console.log('Customer created successfully:', response)
          toast.success('Customer created successfully!')
          onSuccess?.()
          refreshCustomers()
        }
      }

      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error submitting customer:', error)

      // Handle API validation errors
      if (error instanceof Error) {
        const errorMessage = error.message

        // Debug: Log the exact error message
        console.log('API Error Message:', errorMessage)

        // Handle specific validation errors
        if (
          errorMessage.includes('phone number already exists') ||
          errorMessage.includes(
            'Customer with this phone number already exists'
          ) ||
          errorMessage === 'Customer with this phone number already exists.' ||
          errorMessage === 'Customer with this phone number already exists'
        ) {
          form.setError('phone', {
            type: 'server',
            message: 'A customer with this phone number already exists.',
          })
          toast.error(
            'Phone number already exists. Please use a different number.',
            {
              duration: 4000,
            }
          )
          return
        } else if (
          errorMessage.includes('email already exists') ||
          errorMessage.includes('Customer with this email already exists') ||
          errorMessage === 'Customer with this email already exists.' ||
          errorMessage === 'Customer with this email already exists'
        ) {
          form.setError('email', {
            type: 'server',
            message: 'A customer with this email already exists.',
          })
          toast.error('Email already exists. Please use a different email.', {
            duration: 4000,
          })
          return
        } else if (
          errorMessage.includes('name already exists') ||
          errorMessage.includes('Customer with this name already exists') ||
          errorMessage === 'Customer with this name already exists.' ||
          errorMessage === 'Customer with this name already exists'
        ) {
          form.setError('name', {
            type: 'server',
            message: 'A customer with this name already exists.',
          })
          toast.error('Name already exists. Please use a different name.', {
            duration: 4000,
          })
          return
        } else {
          // Show the specific error message from the API
          toast.error(errorMessage, {
            duration: 4000,
          })
          return
        }
      }

      // Fallback error message
      toast.error('Failed to save customer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col p-0 md:max-w-xl'>
        <SheetHeader className='px-4 pt-4 text-left'>
          <SheetTitle>{isUpdate ? 'Edit' : 'Create'} Customer</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the customer details below.'
              : 'Add a new customer to your system.'}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable form area (without buttons) */}
        <div className='flex flex-1 flex-col overflow-y-auto px-4 py-2'>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className='flex h-full flex-col space-y-5'
              id='customer-form'
            >
              {/* Organization Checkbox */}
              <FormField
                control={form.control}
                name='isOrganization'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-start space-y-0 space-x-3'>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className='space-y-1 leading-none'>
                      <FormLabel>Is Organization</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Organization Name (conditional) */}
              {form.watch('isOrganization') && (
                <FormField
                  control={form.control}
                  name='organizationName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter organization name'
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Email */}
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='Enter email address'
                        {...field}
                        value={field.value ?? ''}
                      />
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
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter phone number'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Line 1 */}
              <FormField
                control={form.control}
                name='address1'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 1</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter address line 1'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Address Line 2 */}
              <FormField
                control={form.control}
                name='address2'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address Line 2</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter address line 2 (optional)'
                        {...field}
                        value={field.value || ''}
                      />
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
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter city'
                        {...field}
                        value={field.value || ''}
                      />
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
                  <FormItem>
                    <FormLabel>Postcode</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Enter postcode'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Country */}
              <FormField
                control={form.control}
                name='countryId'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Country</FormLabel>
                    <Popover open={openPopover} onOpenChange={setOpenPopover}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className={cn(
                              'w-full justify-between',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? countries.find(
                                  (country) => Number(country.id) === Number(field.value)
                                )?.name ||
                                (currentRow?.country && Number(currentRow.country.id) === Number(field.value)
                                  ? currentRow.country.name
                                  : null) ||
                                `ID: ${field.value}`
                              : 'Select a country'}
                            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-full p-0'>
                        <Command>
                          <CommandInput placeholder='Search country...' />
                          <CommandList>
                            <CommandEmpty>No country found.</CommandEmpty>
                            <CommandGroup>
                              {countries.map((country) => (
                                <CommandItem
                                  key={country.id}
                                  value={country.name}
                                  onSelect={() => {
                                    form.setValue('countryId', country.id)
                                    setOpenPopover(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      Number(country.id) === Number(field.value)
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                  {country.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gender - only show if not organization */}
              {!form.watch('isOrganization') && (
                <FormField
                  control={form.control}
                  name='gender'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select gender' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='MALE'>Male</SelectItem>
                          <SelectItem value='FEMALE'>Female</SelectItem>
                          <SelectItem value='OTHER'>Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </form>
          </Form>
        </div>

        {/* Action Buttons (fixed at bottom, outside scrollable area) */}
        <div className='flex justify-end gap-2 border-t bg-white px-4 py-4'>
          <SheetClose asChild>
            <Button variant='outline' disabled={isSubmitting}>
              Cancel
            </Button>
          </SheetClose>
          <Button
            type='submit'
            form='customer-form'
            disabled={isSubmitting}
            onClick={form.handleSubmit(onSubmit)}
          >
            {isSubmitting ? 'Saving...' : isUpdate ? 'Update' : 'Create'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
