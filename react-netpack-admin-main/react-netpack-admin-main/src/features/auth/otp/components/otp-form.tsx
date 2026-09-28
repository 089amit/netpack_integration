import { HTMLAttributes, useState, useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import http from '@/utils/http'
import { AUTH_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'

type OtpFormProps = HTMLAttributes<HTMLFormElement>

const formSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    otp: z.string().length(6, 'Please enter the 6-digit code'),
    newPassword: z
      .string()
      .min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z
      .string()
      .min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ['confirmPassword'],
  })

export function OtpForm({ className, ...props }: OtpFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  const urlEmail = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('email') || ''
    : ''

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: urlEmail,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (urlEmail && !form.getValues('email')) {
      form.setValue('email', urlEmail)
    }
  }, [urlEmail, form])

  const currentEmail = form.watch('email')
  const otp = form.watch('otp')

  async function handleResendCode() {
    const emailToUse = currentEmail?.trim()
    if (!emailToUse || !emailToUse.includes('@')) {
      toast.error('Please enter a valid email address first.')
      return
    }

    setIsResending(true)
    try {
      await http.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, { email: emailToUse })
      toast.success('A new 6-digit verification code has been sent to your email.')
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend verification code.')
    } finally {
      setIsResending(false)
    }
  }

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await http.post(AUTH_ENDPOINTS.RESET_PASSWORD, {
        email: data.email.trim(),
        code: data.otp.trim(),
        newPassword: data.newPassword,
      })

      toast.success('Password reset successfully! Please log in with your new password.')
      setTimeout(() => {
        window.location.href = '/sign-in'
      }, 1000)
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail ||
        err.detail ||
        err.message ||
        'Failed to reset password. Please check your verification code.'
      toast.error(errorMsg)
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
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel>Registered Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='name@example.com'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='otp'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <div className='flex items-center justify-between'>
                <FormLabel>6-Digit Verification Code</FormLabel>
                <button
                  type='button'
                  onClick={handleResendCode}
                  disabled={isResending}
                  className='text-xs text-blue-600 hover:underline disabled:opacity-50'
                >
                  {isResending ? 'Sending...' : 'Resend Code'}
                </button>
              </div>
              <FormControl>
                <InputOTP
                  maxLength={6}
                  value={field.value}
                  onChange={field.onChange}
                  containerClassName='justify-between sm:[&>[data-slot="input-otp-group"]>div]:w-11'
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='newPassword'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='Enter new password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='Confirm new password' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type='submit'
          className='mt-2 w-full'
          disabled={otp.length < 6 || isLoading}
        >
          {isLoading ? 'Resetting Password...' : 'Reset Password'}
        </Button>
      </form>
    </Form>
  )
}

