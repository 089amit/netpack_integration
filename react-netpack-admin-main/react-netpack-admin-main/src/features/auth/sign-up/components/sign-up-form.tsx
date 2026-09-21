import { useEffect, HTMLAttributes, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import http from '@/utils/http'
import { USER_ENDPOINTS, COUNTRY_ENDPOINT } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'

type SignUpFormProps = HTMLAttributes<HTMLFormElement>

const formSchema = z
  .object({
    fullName: z.string().min(1, { message: 'Please enter your full name' }),
    phoneNumber: z
      .string()
      .min(1, { message: 'Please enter your phone number' }),
    email: z
      .string()
      .min(1, { message: 'Please enter your email' })
      .email({ message: 'Invalid email address' }),
    address1: z.string().min(1, { message: 'Please enter address 1' }),
    address2: z.string().min(1, { message: 'Please enter address 2' }),
    city: z.string().min(1, { message: 'Please enter city' }),
    state: z.string().min(1, { message: 'Please enter state' }),
    postcode: z.string().min(1, { message: 'Please enter postcode' }),
    countryId: z
      .number({ required_error: 'Please select a country' })
      .min(1, 'Please select a country'),
    isOrganization: z.boolean(),
    organizationName: z.string(),
    password: z
      .string()
      .min(1, {
        message: 'Please enter your password',
      })
      .min(7, {
        message: 'Password must be at least 7 characters long',
      }),
    confirmPassword: z
      .string()
      .min(1, { message: 'Please confirm your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  })
  .superRefine((data, ctx) => {
    if (
      data.isOrganization &&
      (!data.organizationName || data.organizationName.trim() === '')
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Organization name is required',
        path: ['organizationName'],
      })
    }
  })

type SignUpFormValues = z.infer<typeof formSchema>

export function SignUpForm({ className, ...props }: SignUpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countries, setCountries] = useState([])

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: '',
      phoneNumber: '',
      email: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postcode: '',
      countryId: 0,
      isOrganization: false,
      organizationName: '',
      password: '',
      confirmPassword: '',
    },
  })

  const isOrganization = form.watch('isOrganization')

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response: any = await http.get(COUNTRY_ENDPOINT.GET_ALL_COUNTRY)
        const data = response.data || []
        setCountries(data)

        // Find Nepal and set as default country
        const nepal = data.find(
          (c: any) => c.name?.toLowerCase().trim() === 'nepal'
        )
        if (nepal) {
          form.setValue('countryId', nepal.id, { shouldDirty: true })
        }
      } catch (err) {
        console.error('Error fetching countries:', err)
      }
    }

    fetchCountries()
  }, [form])

  async function onSubmit(data: SignUpFormValues) {
    setIsLoading(true)
    setError(null)

    try {
      await http.post(USER_ENDPOINTS.SIGN_UP, {
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        address1: data.address1,
        address2: data.address2,
        city: data.city,
        state: data.state,
        postcode: data.postcode,
        countryId: data.countryId,
        isOrganization: data.isOrganization,
        organizationName: data.isOrganization ? data.organizationName : '',
      })

      // Redirect to sign-in after successful account creation
      window.location.href = '/sign-in'
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        {error && <p className='text-center text-sm text-red-500'>{error}</p>}

        <FormField
          control={form.control}
          name='fullName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder='John Doe'
                  {...field}
                  value={field.value as string}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='isOrganization'
          render={({ field }) => (
            <FormItem className='flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4 shadow-sm'>
              <FormControl>
                <Checkbox
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className='space-y-1 leading-none'>
                <FormLabel>Register as Organization</FormLabel>
              </div>
            </FormItem>
          )}
        />

        {isOrganization && (
          <FormField
            control={form.control}
            name='organizationName'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Acme Inc.'
                    {...field}
                    value={field.value as string}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name='phoneNumber'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input
                  placeholder='+1 234 567 8900'
                  {...field}
                  value={field.value as string}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder='name@example.com'
                  {...field}
                  value={field.value as string}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='address1'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address 1</FormLabel>
              <FormControl>
                <Input
                  placeholder='Street address, P.O. box, etc.'
                  {...field}
                  value={field.value as string}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='address2'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address 2</FormLabel>
              <FormControl>
                <Input
                  placeholder='Apartment, suite, unit, building, floor, etc.'
                  {...field}
                  value={field.value as string}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='grid grid-cols-3 gap-3'>
          <FormField
            control={form.control}
            name='city'
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input
                    placeholder='City'
                    {...field}
                    value={field.value as string}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='state'
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input
                    placeholder='State'
                    {...field}
                    value={field.value as string}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='postcode'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postcode</FormLabel>
                <FormControl>
                  <Input
                    placeholder='Postcode'
                    {...field}
                    value={field.value as string}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name='countryId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <SelectDropdown
                defaultValue={field.value?.toString()}
                onValueChange={(val) => field.onChange(Number(val))}
                isControlled
                items={countries.map((c: any) => ({
                  label: c.name,
                  value: c.id.toString(),
                }))}
                placeholder='Select country'
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='********'
                  {...field}
                  value={field.value as string}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <PasswordInput
                  placeholder='********'
                  {...field}
                  value={field.value as string}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>
    </Form>
  )
}
