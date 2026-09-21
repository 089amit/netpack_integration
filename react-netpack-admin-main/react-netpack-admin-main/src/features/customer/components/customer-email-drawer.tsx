import { useState } from 'react'
import { IconPhoto, IconX } from '@tabler/icons-react'
import { Customer } from '@/type/customer'
import { toast } from 'sonner'
import http from '@/utils/http'
import { AUTH_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Customer | null
}

export function CustomerEmailDrawer({ open, onOpenChange, currentRow }: Props) {
  const [subject, setSubject] = useState('')
  const [textContent, setTextContent] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhoto(file)
    }
  }

  const removePhoto = () => {
    setPhoto(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim()) {
      toast.error('Please enter a subject', { duration: 3000 })
      return
    }

    if (!textContent.trim()) {
      toast.error('Please enter email content', { duration: 3000 })
      return
    }

    if (!currentRow?.email) {
      toast.error('Customer email not available', { duration: 3000 })
      return
    }

    try {
      setLoading(true)

      const formData = new FormData()
      formData.append('email', currentRow.email)
      formData.append('subject', subject)
      formData.append('emailContent', textContent)

      if (photo) {
        formData.append('photo', photo)
      }

      await http.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, formData)

      toast.success('Email sent successfully!', { duration: 3000 })
      setSubject('')
      setTextContent('')
      setPhoto(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to send email:', error)
      toast.error('Failed to send email. Please try again.', { duration: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSubject('')
    setTextContent('')
    setPhoto(null)
    onOpenChange(false)
  }

  if (!currentRow) return null

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className='w-[500px] sm:w-[600px]'>
        <SheetHeader>
          <SheetTitle>Send Email to Customer</SheetTitle>
          <SheetDescription>
            Send an email to {currentRow.name} ({currentRow.email})
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='mt-6 space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='subject'>Email Subject *</Label>
            <Input
              id='subject'
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder='Enter email subject...'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='text-content'>Email Content *</Label>
            <Textarea
              id='text-content'
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder='Enter email content...'
              rows={8}
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='photo'>Attach Photo (Optional)</Label>
            <div className='flex items-center gap-2'>
              <Input
                id='photo'
                type='file'
                accept='image/*'
                onChange={handlePhotoChange}
                className='flex-1'
              />
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => document.getElementById('photo')?.click()}
              >
                <IconPhoto size={16} />
              </Button>
            </div>
            {photo && (
              <div className='bg-muted mt-2 flex items-center gap-2 rounded-md p-2'>
                <span className='flex-1 text-sm'>{photo.name}</span>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={removePhoto}
                >
                  <IconX size={16} />
                </Button>
              </div>
            )}
          </div>

          <div className='flex justify-end space-x-2'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading}>
              {loading ? 'Sending...' : 'Send Email'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
