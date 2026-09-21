import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import {
  IconEdit,
  IconUserCheck,
  IconUserX,
  IconMail,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import http from '@/utils/http'
import { USER_ENDPOINTS, AUTH_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useUsers } from '../context/users-context'
import { User } from '../data/schema'

interface DataTableRowActionsProps {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useUsers()
  const [isUpdating, setIsUpdating] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] =
    useState(false)
  const [isSendingForgotPassword, setIsSendingForgotPassword] = useState(false)
  const user = row.original

  const handleToggleStatus = async () => {
    setIsUpdating(true)
    try {
      const endpoint = user.isActive
        ? USER_ENDPOINTS.MAKE_USER_INACTIVE(user.id)
        : USER_ENDPOINTS.MAKE_USER_ACTIVE(user.id)

      await http.patch(endpoint, {})

      toast.success(
        `User ${user.isActive ? 'deactivated' : 'activated'} successfully!`
      )

      // Refresh the page to update the data
      window.location.reload()
    } catch (error) {
      toast.error(`Failed to ${user.isActive ? 'deactivate' : 'activate'} user`)
      console.error('Error updating user status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSendForgotPassword = async () => {
    setIsSendingForgotPassword(true)
    try {
      await http.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, {
        email: user.email,
      })

      toast.success('Password reset email sent successfully!')
      setShowForgotPasswordDialog(false)
    } catch (error) {
      toast.error('Failed to send password reset email')
      console.error('Error sending forgot password email:', error)
    } finally {
      setIsSendingForgotPassword(false)
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('edit')
            }}
          >
            Edit
            <DropdownMenuShortcut>
              <IconEdit size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowForgotPasswordDialog(true)}
            disabled={isSendingForgotPassword}
            className='text-blue-600'
          >
            Send Forgot Password
            <DropdownMenuShortcut>
              <IconMail size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowConfirmDialog(true)}
            disabled={isUpdating}
            className={user.isActive ? 'text-orange-600' : 'text-green-600'}
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
            <DropdownMenuShortcut>
              {user.isActive ? (
                <IconUserX size={16} />
              ) : (
                <IconUserCheck size={16} />
              )}
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={`${user.isActive ? 'Deactivate' : 'Activate'} User`}
        desc={
          <>
            Are you sure you want to{' '}
            <strong>{user.isActive ? 'deactivate' : 'activate'}</strong> the
            user <strong>{user.fullName || user.email}</strong>?
            <br />
            {user.isActive
              ? 'This will prevent the user from accessing the system.'
              : 'This will allow the user to access the system again.'}
          </>
        }
        confirmText={user.isActive ? 'Deactivate' : 'Activate'}
        handleConfirm={handleToggleStatus}
        destructive={user.isActive}
      />

      <ConfirmDialog
        open={showForgotPasswordDialog}
        onOpenChange={setShowForgotPasswordDialog}
        title='Send Forgot Password Email'
        desc={
          <>
            Are you sure you want to send a password reset email to{' '}
            <strong>{user.fullName || user.email}</strong>?
            <br />
            This will send a password reset link to{' '}
            <strong>{user.email}</strong>.
          </>
        }
        confirmText='Send Email'
        handleConfirm={handleSendForgotPassword}
        destructive={false}
      />
    </>
  )
}
