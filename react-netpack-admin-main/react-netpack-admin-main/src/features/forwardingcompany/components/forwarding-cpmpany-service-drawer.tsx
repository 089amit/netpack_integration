'use client'

import { useEffect, useState } from 'react'
import { Trash, Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import http from '@/utils/http'
import { FORWARDING_COMPANY_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { ForwardingCompany } from '../data/schema'

interface Service {
  id: number
  name: string
  description?: string
  companyId: number
  createdAt: string
  updatedAt: string
  forwardingCompany?: {
    id: number
    name: string
    contactEmail: string
    contactPhone: string
    address: string
    createdAt: string
    updatedAt: string
  }
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: ForwardingCompany | null
}

export function ForwardingCompanyServiceDrawer({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const [services, setServices] = useState<Service[]>([])
  const [formState, setFormState] = useState<Partial<Service>>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const resetForm = () => {
    setFormState({})
    setEditingId(null)
  }

  const loadServices = async () => {
    if (!currentRow?.id) return

    setLoading(true)
    try {
      const response = await http.get<{ data: Service[] }>(
        FORWARDING_COMPANY_ENDPOINTS.GET_COMPANY_SERVICE +
          '/' +
          parseInt(currentRow.id)
      )
      setServices(response.data)
    } catch (error) {
      console.error('Failed to load services:', error)
      toast.error('Failed to load services')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formState.name || !currentRow?.id) return

    setSaving(true)
    try {
      if (editingId) {
        // Update existing service
        const response = await http.put<Service | { data: Service }>(
          FORWARDING_COMPANY_ENDPOINTS.UPDATE_SERVICE(editingId),
          {
            name: formState.name,
            description: formState.description,
            companyId: parseInt(currentRow.id),
          }
        )

        // Handle different response structures
        const serviceData = 'data' in response ? response.data : response
        setServices((prev) =>
          (prev || []).map((service) =>
            service.id === editingId ? serviceData : service
          )
        )
        toast.success('Service updated successfully')
      } else {
        // Create new service
        const response = await http.post<Service | { data: Service }>(
          FORWARDING_COMPANY_ENDPOINTS.CREATE_SERVICE,
          {
            name: formState.name,
            description: formState.description,
            companyId: parseInt(currentRow.id),
          }
        )

        // Handle different response structures
        const serviceData = 'data' in response ? response.data : response
        setServices((prev) => [...(prev || []), serviceData])
        toast.success('Service created successfully')
      }

      resetForm()
    } catch (error) {
      console.error('Failed to save service:', error)
      toast.error('Failed to save service')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    setDeleting(id)
    try {
      await http.delete(FORWARDING_COMPANY_ENDPOINTS.DELETE_SERVICE(id))
      setServices((prev) => (prev || []).filter((service) => service.id !== id))
      toast.success('Service deleted successfully')
    } catch (error) {
      console.error('Failed to delete service:', error)
      toast.error('Failed to delete service')
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (service: Service) => {
    setFormState({
      name: service.name,
      description: service.description,
    })
    setEditingId(service.id)
  }

  // Load services when drawer opens
  useEffect(() => {
    if (open && currentRow) {
      loadServices()
    } else {
      setServices([])
      resetForm()
    }
  }, [open, currentRow])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col md:max-w-xl'>
        <SheetHeader>
          <SheetTitle>Manage Services</SheetTitle>
          <SheetDescription>
            Add, update, or delete services for{' '}
            <strong>{currentRow?.name}</strong>
          </SheetDescription>
        </SheetHeader>

        {/* List of Services */}
        <div className='mt-4 max-h-[300px] space-y-3 overflow-y-auto px-4'>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <Loader2 className='h-6 w-6 animate-spin' />
              <span className='text-muted-foreground ml-2 text-sm'>
                Loading services...
              </span>
            </div>
          ) : !services || services.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              No services added yet.
            </p>
          ) : (
            services.map((service) => (
              <div
                key={service.id}
                className='flex items-start justify-between rounded-md border p-3'
              >
                <div>
                  <p className='font-medium'>{service.name}</p>
                  <p className='text-muted-foreground text-sm'>
                    {service.description}
                  </p>
                </div>
                <div className='mt-1 flex gap-2'>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => handleEdit(service)}
                    disabled={deleting === service.id}
                  >
                    <Pencil className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='destructive'
                    size='icon'
                    onClick={() => handleDelete(service.id)}
                    disabled={deleting === service.id}
                  >
                    {deleting === service.id ? (
                      <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                      <Trash className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Form */}
        <div className='mt-6 space-y-4 border-t px-4 pt-4'>
          <h4 className='text-sm font-medium'>
            {editingId ? 'Edit Service' : 'Add New Service'}
          </h4>

          <Input
            placeholder='Service Name'
            value={formState.name || ''}
            onChange={(e) =>
              setFormState({ ...formState, name: e.target.value })
            }
            disabled={saving}
          />
          <Textarea
            placeholder='Description (optional)'
            value={formState.description || ''}
            onChange={(e) =>
              setFormState({ ...formState, description: e.target.value })
            }
            disabled={saving}
          />

          <div className='flex justify-end gap-2'>
            {editingId && (
              <Button variant='ghost' onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || !formState.name}>
              {saving ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {editingId ? 'Updating...' : 'Adding...'}
                </>
              ) : editingId ? (
                'Update'
              ) : (
                'Add'
              )}
            </Button>
          </div>
        </div>

        <SheetFooter className='mt-auto px-4 pt-6 pb-4'>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
