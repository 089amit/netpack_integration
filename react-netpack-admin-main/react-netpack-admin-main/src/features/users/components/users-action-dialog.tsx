'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import http from '@/utils/http'
import {
  USER_ENDPOINTS,
  USER_ROLE,
  COUNTRY_ENDPOINT,
} from '@/constants/endpoint'
import { Eye, EyeOff, Bike } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectDropdown } from '@/components/select-dropdown'
import { User } from '../data/schema'

const formSchema = z.object({
  fullName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  email: z
    .string()
    .min(1, { message: 'Email is required.' })
    .email({ message: 'Email is invalid.' }),
  role: z.string().min(1, { message: 'Role is required.' }),
  isEdit: z.boolean(),
  // rider & credentials fields
  username: z.string().nullable().optional(),
  password: z.string().nullable().optional(),
  confirmPassword: z.string().nullable().optional(),
  // customer-specific fields
  address1: z.string().nullable().optional(),
  address2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postcode: z.string().nullable().optional(),
  countryId: z.string().nullable().optional(),
  isOrganization: z.boolean().optional(),
  organizationName: z.string().nullable().optional(),
})

type UserForm = z.infer<typeof formSchema>

interface Props {
  currentRow?: User
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const isEdit = !!currentRow
  const [showPassword, setShowPassword] = React.useState(false)
  const [roles, setRoles] = React.useState<{ label: string; value: string }[]>(
    []
  )
  const [countries, setCountries] = React.useState<
    { label: string; value: string }[]
  >([])

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          fullName: currentRow?.fullName || '',
          phoneNumber: currentRow?.phoneNumber || '',
          email: currentRow?.email || '',
          role: currentRow?.role || '',
          isEdit,
          username: currentRow?.username || '',
          password: '',
          confirmPassword: '',
          address1: currentRow?.address1 || '',
          address2: currentRow?.address2 || '',
          city: currentRow?.city || '',
          state: currentRow?.state || '',
          postcode: currentRow?.postcode || '',
          countryId: currentRow?.countryId ? String(currentRow.countryId) : '',
          isOrganization: currentRow?.isOrganization || false,
          organizationName: currentRow?.organizationName || '',
        }
      : {
          fullName: '',
          phoneNumber: '',
          email: '',
          role: '',
          isEdit,
          username: '',
          password: '',
          confirmPassword: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          postcode: '',
          countryId: '',
          isOrganization: false,
          organizationName: '',
        },
  })

  const selectedRole = form.watch('role')
  const isCustomer = selectedRole?.toLowerCase() === 'customer'
  const isPickup = selectedRole?.toLowerCase() === 'pickup'
  const isOrganization = form.watch('isOrganization')

  // Fetch roles dynamically from API when dialog opens
  const fetchRoles = async () => {
    try {
      const res = await http.get<any>(USER_ROLE.GET_ALL_ROLES)
      const rolesArray = res?.roles || []
      const rolesData = rolesArray.map((r: any) => ({
        label: r.name,
        value: r.name,
      }))
      setRoles(rolesData)
    } catch (error) {
      console.error('Failed to fetch roles', error)
      setRoles([])
    }
  }

  // Fetch countries from API when dialog opens
  const fetchCountries = async () => {
    try {
      const res = await http.get<any>(COUNTRY_ENDPOINT.GET_ALL_COUNTRY)
      const countriesArray = res?.data || []
      const countriesData = countriesArray.map((c: any) => ({
        label: c.name,
        value: String(c.id),
      }))
      setCountries(countriesData)

      if (isEdit) {
        if (currentRow?.countryId) {
          form.setValue('countryId', String(currentRow.countryId))
        } else if (currentRow?.country) {
          const matched = countriesArray.find(
            (c: any) =>
              c.name.toLowerCase() === currentRow.country?.toLowerCase()
          )
          if (matched) {
            form.setValue('countryId', String(matched.id))
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch countries', error)
      setCountries([])
    }
  }

  React.useEffect(() => {
    if (open) {
      fetchRoles()
      fetchCountries()
    }
  }, [open])

  const onSubmit = async (values: UserForm) => {
    // Password validation for Pickup role
    if (isPickup) {
      if (!values.isEdit && (!values.password || values.password.trim().length < 6)) {
        toast.error('Please provide a password of at least 6 characters for the pickup rider.')
        form.setError('password', { message: 'Password must be at least 6 characters.' })
        return
      }
      if (values.password && values.password !== values.confirmPassword) {
        toast.error('Passwords do not match. Please verify your password entry.')
        form.setError('confirmPassword', { message: 'Passwords do not match.' })
        return
      }
    }

    // General password mismatch check if password was entered
    if (values.password && values.confirmPassword && values.password !== values.confirmPassword) {
      toast.error('Passwords do not match. Please verify your password entry.')
      form.setError('confirmPassword', { message: 'Passwords do not match.' })
      return
    }

    try {
      const payload: any = { ...values }
      if (!payload.password || !payload.password.trim()) {
        delete payload.password
      }
      delete payload.confirmPassword

      if (values.isEdit) {
        await http.put(
          USER_ENDPOINTS.UPDATE_ADMIN_USER(String(currentRow?.id)),
          payload
        )
        toast.success('User updated successfully!')
      } else {
        await http.post(USER_ENDPOINTS.CREATE_USER, payload)
        toast.success('User created successfully!')
      }

      window.location.reload()
      onOpenChange(false)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save user'
      console.error('Submission error:', message)
      toast.error(message)
      if (message.toLowerCase().includes('email')) {
        form.setError('email', { type: 'server', message })
      }
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>{isEdit ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the user here. ' : 'Create new user here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='-mr-4 h-[26.25rem] w-full overflow-y-auto py-1 pr-4'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 p-0.5'
            >
              {/* Full Name */}
              <FormField
                control={form.control}
                name='fullName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='John Doe'
                        className='col-span-4 w-70'
                        autoComplete='off'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='john.doe@gmail.com'
                        className='col-span-4 w-70'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name='phoneNumber'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Phone Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='+123456789'
                        className='col-span-4 w-70'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* Role - Dynamic */}
              <FormField
                control={form.control}
                name='role'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Role
                    </FormLabel>
                    <FormControl>
                      <SelectDropdown
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select a role'
                        className='col-span-4'
                        items={roles}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {/* ── Pickup Rider Credentials & Password (when role is pickup) ─────────── */}
              {isPickup && (
                <div className='rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 p-3.5 space-y-3.5 my-2'>
                  <div className='flex items-center justify-between border-b border-primary/20 pb-2'>
                    <div className='flex items-center gap-2'>
                      <div className='h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-xs'>
                        <Bike className='h-3.5 w-3.5' />
                      </div>
                      <div>
                        <div className='text-xs font-bold text-foreground flex items-center gap-1.5'>
                          Pickup Rider Account & Login
                        </div>
                        <div className='text-[10px] text-muted-foreground'>
                          Set credentials for logging into the NetPack Pickup PWA
                        </div>
                      </div>
                    </div>
                    <Badge variant='outline' className='text-[10px] bg-primary/10 text-primary border-primary/30'>
                      Rider Access
                    </Badge>
                  </div>

                  {/* Rider ID / Code */}
                  <FormField
                    control={form.control}
                    name='username'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-right text-xs font-semibold'>
                          Rider ID / Code
                        </FormLabel>
                        <FormControl>
                          <div className='col-span-4 space-y-1'>
                            <Input
                              placeholder='e.g. rider-01 or ram.shrestha'
                              className='w-full text-xs h-9'
                              {...field}
                              value={field.value || ''}
                            />
                            <p className='text-[10px] text-muted-foreground'>
                              Rider can log in using this ID, their email, or phone number.
                            </p>
                          </div>
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name='password'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-right text-xs font-semibold'>
                          {isEdit ? 'New Password' : 'Password *'}
                        </FormLabel>
                        <FormControl>
                          <div className='col-span-4 space-y-1'>
                            <div className='relative'>
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder={
                                  isEdit
                                    ? 'Leave blank to keep existing password'
                                    : 'Minimum 6 characters (e.g. Driver@123)'
                                }
                                className='w-full text-xs h-9 pr-9 font-mono'
                                {...field}
                                value={field.value || ''}
                              />
                              <button
                                type='button'
                                onClick={() => setShowPassword(!showPassword)}
                                className='absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                                tabIndex={-1}
                              >
                                {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                              </button>
                            </div>
                            {isEdit && (
                              <p className='text-[10px] text-muted-foreground'>
                                Only enter a new password if you want to reset this rider's credentials.
                              </p>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />

                  {/* Confirm Password */}
                  <FormField
                    control={form.control}
                    name='confirmPassword'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-right text-xs font-semibold'>
                          Confirm Password
                        </FormLabel>
                        <FormControl>
                          <div className='col-span-4'>
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder='Re-enter password to confirm'
                              className='w-full text-xs h-9 font-mono'
                              {...field}
                              value={field.value || ''}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* ── Customer-only fields ─────────────────────────── */}
              {isCustomer && (
                <>
                  {/* Is Organization */}
                  <FormField
                    control={form.control}
                    name='isOrganization'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-right'>
                          Organization?
                        </FormLabel>
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                            className='col-span-4'
                          />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />

                  {/* Organization Name (only when isOrganization is true) */}
                  {isOrganization && (
                    <FormField
                      control={form.control}
                      name='organizationName'
                      render={({ field }) => (
                        <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                          <FormLabel className='col-span-2 text-right'>
                            Org. Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder='Acme Corp'
                              className='col-span-4 w-70'
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage className='col-span-4 col-start-3' />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Address 1 */}
                  <FormField
                    control={form.control}
                    name='address1'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-right'>
                          Address 1
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='123 Main St'
                            className='col-span-4 w-70'
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />

                  {/* Address 2 */}
                  <FormField
                    control={form.control}
                    name='address2'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-right'>
                          Address 2
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Apt 4B'
                            className='col-span-4 w-70'
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />

                  {/* City */}
                  <FormField
                    control={form.control}
                    name='city'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-right'>
                          City
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='New York'
                            className='col-span-4 w-70'
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />

                  {/* State */}
                  <FormField
                    control={form.control}
                    name='state'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-right'>
                          State
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='NY'
                            className='col-span-4 w-70'
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />

                  {/* Postcode */}
                  <FormField
                    control={form.control}
                    name='postcode'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-right'>
                          Postcode
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder='10001'
                            className='col-span-4 w-70'
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />

                  {/* Country */}
                  <FormField
                    control={form.control}
                    name='countryId'
                    render={({ field }) => (
                      <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                        <FormLabel className='col-span-2 text-right'>
                          Country
                        </FormLabel>
                        <FormControl>
                          <SelectDropdown
                            defaultValue={field.value ?? ''}
                            onValueChange={field.onChange}
                            placeholder='Select a country'
                            className='col-span-4'
                            items={countries}
                            isControlled={true}
                          />
                        </FormControl>
                        <FormMessage className='col-span-4 col-start-3' />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form'>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
