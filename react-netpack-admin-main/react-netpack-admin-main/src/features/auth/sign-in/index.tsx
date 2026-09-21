import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export default function SignIn() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Login</CardTitle>
          <CardDescription>
            Enter your email and password below to <br />
            log into your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm />
        </CardContent>
        <CardFooter className='flex flex-col gap-2'>
          <div className='text-sm text-muted-foreground text-center'>
            Don't have an account?{' '}
            <Link
              to='/sign-up'
              className='text-primary underline-offset-4 hover:underline'
            >
              Sign up
            </Link>
          </div>
         
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
