'use client'

import { useState, useEffect } from 'react'
import { Select } from 'react-day-picker'
// This might not be needed; check below
import http from '@/utils/http'
import { ENQUIRY_ENDPOINTS, LOCATION_ENDPOINT } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

// Import correct UI Select if react-day-picker's Select is not the intended one
// Example: import { Select } from '@/components/ui/select'

interface ItemRow {
  description: string
  weight: string
  value: string
  quantity: string
  unitPrice: string
  hsCode: string
  totalValue: string
}

interface SenderInfo {
  id?: string | number
  name: string
  addressLine1: string
  addressLine2: string
  postcodeCity: string
  location: string
  country: string
  telephoneEmail: string
}

interface ReceiverInfo {
  name: string
  addressLine1: string
  addressLine2: string
  city?: string
  postcodeCity: string
  location: string
  country: string
  telephone: string
  email: string
}

interface EnquiryFormData {
  sender: SenderInfo
  receiver: ReceiverInfo
  items: ItemRow[]
  destinationCountryId?: string // Add optional fields
  destinationLocation?: string
  noOfBox?: number
  weight?: number
  status?: string
  estimatedRate?: number
  finalRate?: number
}
interface Props {
  open: boolean
  onClose: () => void
  selectedEnquiries: Array<{
    id: string
    customerName: string
    customerPhone: string
    title: string
  }>
  initialData?: EnquiryFormData | null
  onEnquiryCreated?: () => void // ← New prop
}

export function ManifestFormModal({
  open,
  onClose,
  selectedEnquiries,
  onEnquiryCreated,
  initialData = null,
}: Props) {
  const [formData, setFormData] = useState<EnquiryFormData>({
    sender: {
      name: '',
      addressLine1: '',
      addressLine2: '',
      postcodeCity: '',
      location: '',
      country: '',
      telephoneEmail: '',
    },
    receiver: {
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postcodeCity: '',
      location: '',
      country: '',
      telephone: '',
      email: '',
    },
    items: [
      {
        description: '',
        weight: '',
        value: '',
        quantity: '',
        unitPrice: '',
        hsCode: '',
        totalValue: '',
      },
    ],
  })

  const [countries, setCountries] = useState<any[]>([])

  useEffect(() => {
    http
      .get<any>(LOCATION_ENDPOINT.GET_ALL_LOCATION)
      .then((data) => setCountries(data.data))
      .catch((error) => console.error('Error fetching countries:', error))
  }, [])

  useEffect(() => {
    if (open && selectedEnquiries.length > 0 && !initialData) {
      const firstEnquiry = selectedEnquiries[0]
      setFormData((prev) => ({
        ...prev,
        sender: {
          ...prev.sender,
          name: firstEnquiry.customerName || '',
          location: firstEnquiry.title || '',
          telephoneEmail: firstEnquiry.customerPhone || '',
        },
      }))
    }
  }, [open, selectedEnquiries, initialData])

  useEffect(() => {
    if (open && initialData) {
      setFormData(initialData)
    } else if (open && selectedEnquiries.length > 0 && !initialData) {
      const firstEnquiry = selectedEnquiries[0]
      setFormData((prev) => ({
        ...prev,
        sender: {
          ...prev.sender,
          name: firstEnquiry.customerName || '',
          location: firstEnquiry.title || '',
          telephoneEmail: firstEnquiry.customerPhone || '',
        },
      }))
    }
  }, [open, initialData, selectedEnquiries])

  // Update this function to accept both input and select events
  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>,
    type: 'sender' | 'receiver' | 'items',
    index?: number
  ) => {
    const { name, value } = e.target
    if (type === 'sender' || type === 'receiver') {
      setFormData((prev) => ({
        ...prev,
        [type]: {
          ...prev[type],
          [name]: value,
        },
      }))
    }

    if (type === 'items' && typeof index === 'number') {
      const updatedItems = [...formData.items]
      updatedItems[index] = {
        ...updatedItems[index],
        [name]: value,
      }
      setFormData((prev) => ({
        ...prev,
        items: updatedItems,
      }))
    }
  }

  const handleAddItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: '',
          weight: '',
          value: '',
          quantity: '',
          unitPrice: '',
          hsCode: '',
          totalValue: '',
        },
      ],
    }))
  }

  const isFormValid = () => {
    return (
      formData.receiver.country.trim() !== '' &&
      formData.receiver.telephone.length > 5
    )
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate receiver country
    if (!formData.receiver.country || formData.receiver.country.trim() === '') {
      alert('Receiver country is required')
      return
    }

    try {
      await http.post<any>(
        ENQUIRY_ENDPOINTS.CREATE_ENQUIRY,
        formData
      )

      alert('Enquiry submitted successfully!')
      onEnquiryCreated?.() // Notify parent to refresh
      onClose()
    } catch (error: any) {
      alert(error.message || 'Something went wrong.')
      console.error('Submission error:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        aria-label='Enquiry Form'
        className='!h-[90vh] !w-[1000px] !max-w-[1000px] overflow-auto'
        // className='max-h-[90vh] max-w-full overflow-auto'
      >
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Enquiry' : 'Create Enquiry'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {/* Sender & Receiver Section */}
          <div className='mb-6 grid grid-cols-2 gap-8'>
            {/* Sender Details */}
            <div className='border-r pr-6'>
              <h3 className='mb-4 text-lg font-semibold'>Sender Details</h3>
              <div className='space-y-3'>
                <Input
                  label='Name'
                  name='name'
                  value={formData.sender.name}
                  onChange={(e) => handleChange(e, 'sender')}
                />
                <Input
                  label='Address Line 1'
                  name='addressLine1'
                  value={formData.sender.addressLine1}
                  onChange={(e) => handleChange(e, 'sender')}
                />
                <Input
                  label='Address Line 2'
                  name='addressLine2'
                  value={formData.sender.addressLine2}
                  onChange={(e) => handleChange(e, 'sender')}
                />
                <Input
                  label='Postcode / City'
                  name='postcodeCity'
                  value={formData.sender.postcodeCity}
                  onChange={(e) => handleChange(e, 'sender')}
                />
                <Input
                  label='Location'
                  name='location'
                  value={formData.sender.location}
                  onChange={(e) => handleChange(e, 'sender')}
                />

                {/* Use correct Select without options prop */}
                <Select
                  name='country'
                  value={formData.sender.country}
                  onChange={(e) => handleChange(e, 'sender')}
                >
                  <option value='' disabled>
                    Select Country
                  </option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label='Telephone / Email'
                  name='telephoneEmail'
                  value={formData.sender.telephoneEmail}
                  onChange={(e) => handleChange(e, 'sender')}
                />
              </div>
            </div>

            {/* Receiver Details */}
            <div className='pl-6'>
              <h3 className='mb-4 text-lg font-semibold'>Receiver Details</h3>
              <div className='space-y-3'>
                <Input
                  label='Name'
                  name='name'
                  value={formData.receiver.name}
                  onChange={(e) => handleChange(e, 'receiver')}
                />
                <Input
                  label='Address Line 1'
                  name='addressLine1'
                  value={formData.receiver.addressLine1}
                  onChange={(e) => handleChange(e, 'receiver')}
                />
                <Input
                  label='Address Line 2'
                  name='addressLine2'
                  value={formData.receiver.addressLine2}
                  onChange={(e) => handleChange(e, 'receiver')}
                />
                <Input
                  label='City'
                  name='city'
                  value={formData.receiver.city || ''}
                  onChange={(e) => handleChange(e, 'receiver')}
                />
                <Input
                  label='Postcode / City'
                  name='postcodeCity'
                  value={formData.receiver.postcodeCity}
                  onChange={(e) => handleChange(e, 'receiver')}
                />
                <Input
                  label='Location'
                  name='location'
                  value={formData.receiver.location}
                  onChange={(e) => handleChange(e, 'receiver')}
                />

                <Select
                  name='country'
                  value={formData.receiver.country}
                  onChange={(e) => handleChange(e, 'receiver')}
                >
                  <option value='' disabled>
                    Select Country
                  </option>
                  {countries.map((country) => (
                    <option key={country.id} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label='Telephone'
                  name='telephone'
                  value={formData.receiver.telephone}
                  onChange={(e) => handleChange(e, 'receiver')}
                />
                <Input
                  label='Email'
                  name='email'
                  value={formData.receiver.email}
                  onChange={(e) => handleChange(e, 'receiver')}
                />
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className='mb-6 overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-muted/40'>
                <tr>
                  <th className='px-4 py-2 text-left'>Description of Goods</th>
                  <th className='px-4 py-2 text-left'>Weight</th>
                  <th className='px-4 py-2 text-left'>Value</th>
                  <th className='px-4 py-2 text-left'>Quantity</th>
                  <th className='px-4 py-2 text-left'>Unit Price</th>
                  <th className='px-4 py-2 text-left'>HS Code</th>
                  <th className='px-4 py-2 text-left'>Total Value</th>
                  <th className='px-4 py-2 text-left'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200'>
                {formData.items.map((item, index) => (
                  <tr key={index} className='border-b'>
                    <td className='px-4 py-2'>
                      <Input
                        name='description'
                        value={item.description}
                        onChange={(e) => handleChange(e, 'items', index)}
                      />
                    </td>
                    <td className='px-4 py-2'>
                      <Input
                        name='weight'
                        value={item.weight}
                        onChange={(e) => handleChange(e, 'items', index)}
                      />
                    </td>
                    <td className='px-4 py-2'>
                      <Input
                        name='value'
                        value={item.value}
                        onChange={(e) => handleChange(e, 'items', index)}
                      />
                    </td>
                    <td className='px-4 py-2'>
                      <Input
                        name='quantity'
                        value={item.quantity}
                        onChange={(e) => handleChange(e, 'items', index)}
                      />
                    </td>
                    <td className='px-4 py-2'>
                      <Input
                        name='unitPrice'
                        value={item.unitPrice}
                        onChange={(e) => handleChange(e, 'items', index)}
                      />
                    </td>
                    <td className='px-4 py-2'>
                      <Input
                        name='hsCode'
                        value={item.hsCode}
                        onChange={(e) => handleChange(e, 'items', index)}
                      />
                    </td>
                    <td className='px-4 py-2'>
                      <Input
                        name='totalValue'
                        value={item.totalValue}
                        disabled
                        onChange={(e) => handleChange(e, 'items', index)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              type='button'
              variant='outline'
              onClick={handleAddItem}
              className='mt-4 w-full'
            >
              + Add Another Item
            </Button>
          </div>

          {/* Declaration */}
          <div className='mt-6'>
            <p className='font-medium'>
              I declare that the contents of this invoice are true and correct.
            </p>
          </div>

          {/* Submit Button */}
          <div className='mt-6 flex justify-end gap-3'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='submit'
              className='bg-primary hover:bg-primary-dark text-white'
              disabled={!isFormValid()}
            >
              Generate Manifest
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
