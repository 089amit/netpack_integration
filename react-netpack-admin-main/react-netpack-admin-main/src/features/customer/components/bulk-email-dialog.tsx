import { useState, useEffect, useCallback } from 'react'
import { IconPhoto, IconX, IconSearch, IconUserPlus } from '@tabler/icons-react'
import { Customer, CustomerResponse } from '@/type/customer'
import { toast } from 'sonner'
import http from '@/utils/http'
import { AUTH_ENDPOINTS, USER_ENDPOINTS } from '@/constants/endpoint'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import debounce from 'lodash.debounce'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCustomers: Customer[]
}

export function BulkEmailDialog({
  open,
  onOpenChange,
  selectedCustomers,
}: Props) {
  const [subject, setSubject] = useState('')
  const [textContent, setTextContent] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  
  // New states for creative features
  const [sendToAll, setSendToAll] = useState(false)
  const [recipients, setRecipients] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Customer[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Sync recipients when dialog opens or selectedCustomers change
  useEffect(() => {
    if (open) {
      setRecipients([...selectedCustomers])
    }
  }, [open, selectedCustomers])

  const handleSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        return
      }
      try {
        setIsSearching(true)
        const response = await http.get<CustomerResponse>(
          `${USER_ENDPOINTS.GET_ALL_CUSTOMER}?search=${encodeURIComponent(query)}&limit=5`
        )
        if (response?.data) {
          setSearchResults(response.data)
        }
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setIsSearching(false)
      }
    }, 500),
    []
  )

  useEffect(() => {
    handleSearch(searchQuery)
  }, [searchQuery, handleSearch])

  const addRecipient = (customer: Customer) => {
    if (!recipients.some((r) => r.id === customer.id)) {
      setRecipients((prev) => [...prev, customer])
      toast.success(`Added ${customer.name}`)
    } else {
      toast.info(`${customer.name} is already in the list`)
    }
    setSearchQuery('')
    setSearchResults([])
  }

  const removeRecipient = (id: number) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id))
  }

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
      toast.error('Please enter a subject')
      return
    }

    if (!textContent.trim()) {
      toast.error('Please enter email content')
      return
    }

    if (!sendToAll && recipients.length === 0) {
      toast.error('No recipients selected')
      return
    }

    try {
      setLoading(true)
      const formData = new FormData()

      if (sendToAll) {
        formData.append('sendToAll', 'true')
      } else {
        const emails = recipients.map((r) => r.email)
        formData.append('emails', JSON.stringify(emails))
      }

      formData.append('subject', subject)
      formData.append('emailContent', textContent)

      if (photo) {
        formData.append('photo', photo)
      }

      const endpoint = sendToAll 
        ? AUTH_ENDPOINTS.BULK_EMAIL_BROADCAST 
        : AUTH_ENDPOINTS.BULK_EMAIL_SENDER

      await http.post(endpoint, formData)

      toast.success(
        sendToAll 
          ? 'Email broadcast started to all customers!'
          : `Email sent successfully to ${recipients.length} recipients!`
      )
      
      handleClose()
    } catch (error) {
      console.error('Failed to send bulk emails:', error)
      toast.error('Failed to send emails. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSubject('')
    setTextContent('')
    setPhoto(null)
    setSendToAll(false)
    setRecipients([])
    setSearchQuery('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[650px] overflow-hidden flex flex-col max-h-[90vh]'>
        <DialogHeader>
          <DialogTitle>Send Bulk Email</DialogTitle>
          <DialogDescription>
            {sendToAll 
              ? 'Broadcasting to ALL customers in the database.' 
              : `Sending to ${recipients.length} recipient(s).`}
          </DialogDescription>
        </DialogHeader>

        <div className='flex items-center justify-between bg-muted/50 p-3 rounded-lg mb-4'>
          <div className='flex flex-col gap-1'>
            <Label htmlFor='send-to-all' className='font-semibold'>Broadcast to All Customers</Label>
            <span className='text-xs text-muted-foreground'>Skip individual selection and send to everyone</span>
          </div>
          <Switch 
            id='send-to-all' 
            checked={sendToAll} 
            onCheckedChange={setSendToAll} 
          />
        </div>

        {!sendToAll && (
          <div className='space-y-3 mb-4'>
            <div className='flex flex-col gap-2'>
              <Label className='text-sm font-medium'>Recipients:</Label>
              <ScrollArea className='h-[120px] w-full rounded-md border p-2'>
                <div className='flex flex-wrap gap-2'>
                  {recipients.length === 0 && (
                    <span className='text-xs text-muted-foreground italic p-2'>No recipients selected yet. Search and add below.</span>
                  )}
                  {recipients.map((customer) => (
                    <Badge key={customer.id} variant='secondary' className='pl-2 flex items-center gap-1'>
                      {customer.name}
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='h-4 w-4 hover:bg-destructive hover:text-destructive-foreground rounded-full'
                        onClick={() => removeRecipient(customer.id)}
                      >
                        <IconX size={10} />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className='relative'>
              <div className='absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground'>
                <IconSearch size={16} />
              </div>
              <Input
                placeholder='Search and add more customers...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
              {searchResults.length > 0 && (
                <div className='absolute z-50 top-full mt-1 w-full bg-popover text-popover-foreground border rounded-md shadow-lg overflow-hidden'>
                  {searchResults.map((customer) => (
                    <button
                      key={customer.id}
                      type='button'
                      className='w-full flex items-center justify-between px-4 py-2 hover:bg-accent text-sm text-left'
                      onClick={() => addRecipient(customer)}
                    >
                      <div className='flex flex-col'>
                        <span className='font-medium'>{customer.name}</span>
                        <span className='text-xs text-muted-foreground'>{customer.email}</span>
                      </div>
                      <IconUserPlus size={16} className='text-muted-foreground' />
                    </button>
                  ))}
                </div>
              )}
              {isSearching && (
                <div className='absolute right-3 top-1/2 -translate-y-1/2'>
                  <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className='space-y-4 flex-1 overflow-auto pr-2'>
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
              className='min-h-[150px]'
              required
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='photo'>Attach Photo (Optional)</Label>
            <div className='flex items-center gap-2'>
              <Input
                id='photo-input'
                type='file'
                accept='image/*'
                onChange={handlePhotoChange}
                className='hidden'
              />
              <Button
                type='button'
                variant='outline'
                className='w-full border-dashed h-20 flex flex-col gap-2'
                onClick={() => document.getElementById('photo-input')?.click()}
              >
                {photo ? (
                  <span className='text-sm text-primary font-medium'>{photo.name}</span>
                ) : (
                  <>
                    <IconPhoto size={24} className='text-muted-foreground' />
                    <span className='text-xs text-muted-foreground'>Click to upload attachment</span>
                  </>
                )}
              </Button>
              {photo && (
                <Button
                  type='button'
                  variant='outline'
                  size='icon'
                  className='h-20 w-12'
                  onClick={removePhoto}
                >
                  <IconX size={18} />
                </Button>
              )}
            </div>
          </div>

          <DialogFooter className='pt-4 border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={loading} className='min-w-[150px]'>
              {loading
                ? 'Sending...'
                : sendToAll 
                  ? 'Send to Everyone' 
                  : `Send to ${recipients.length} Recipient(s)`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
