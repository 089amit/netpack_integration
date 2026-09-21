'use client'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useEffect, useState } from 'react'
import { EnquiryFormData } from './enquiry-types'
import { ENQUIRY_ENDPOINTS } from '@/constants/endpoint'

interface ReceiverSectionProps {
  formData: EnquiryFormData | null
  countries: any[]
  onFormChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } },
    type: 'receiver'
  ) => void
  hasError?: boolean
  receiverAddressLine1Error?: boolean
  receiverAddressLine2Error?: boolean
  receiverCityError?: boolean
  receiverStateError?: boolean
  receiverPostcodeError?: boolean
  receiverCountryError?: boolean
  receiverTelephoneError?: boolean
  sameAsSender?: boolean
  onSameAsSenderChange?: (checked: boolean) => void
}

export function ReceiverSection({
  formData,
  countries,
  onFormChange,
  hasError = false,
  receiverAddressLine1Error = false,
  receiverAddressLine2Error = false,
  receiverCityError = false,
  receiverStateError = false,
  receiverPostcodeError = false,
  receiverCountryError = false,
  receiverTelephoneError = false,
  sameAsSender = false,
  onSameAsSenderChange,
}: ReceiverSectionProps) {
  const [surchargeType, setSurchargeType] = useState<string | null>(null)

  // Fetch surcharge whenever country + (city or postcode) changes
  useEffect(() => {
    const fetchSurcharge = async () => {
      if (!formData?.receiver.country) return
      if (!formData?.receiver.city && !formData?.receiver.postcode) return

      try {
        const res = await fetch(ENQUIRY_ENDPOINTS.CHECK_SURCHARGE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            countryName: formData.receiver.country,
            city: formData.receiver.city || undefined,
            postalCode: formData.receiver.postcode || undefined,
          }),
        })

        const data = await res.json()
        if (data.success) {
          setSurchargeType(data.surchargeType || null)
        } else {
          setSurchargeType(null)
        }
      } catch (err) {
        console.error('Failed to fetch surcharge', err)
        setSurchargeType(null)
      }
    }

    fetchSurcharge()
  }, [formData?.receiver.country, formData?.receiver.city, formData?.receiver.postcode])

  return (
    <div className='pl-6'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
        <h3 className='text-lg font-semibold'>Receiver Details</h3>
        {onSameAsSenderChange && (
          <div className='flex items-center gap-2'>
            <Switch
              id='same-as-sender'
              checked={sameAsSender}
              onCheckedChange={onSameAsSenderChange}
            />
            <Label
              htmlFor='same-as-sender'
              className='cursor-pointer text-xs font-medium select-none text-muted-foreground hover:text-foreground'
            >
              Same as sender details
            </Label>
          </div>
        )}
      </div>
      <div className='space-y-3'>
        <div className='space-y-1'>
          <label className='block text-sm font-medium'>
            Name <span className='text-red-500'>*</span>
          </label>
          <Input
            name='name'
            id='receiver-name'
            value={formData?.receiver.name || ''}
            onChange={(e) => onFormChange(e, 'receiver')}
            className={cn(hasError && 'border-red-500 ring-1 ring-red-500')}
          />
          {hasError && (
            <p className='text-xs text-red-500'>This field is required</p>
          )}
        </div>

        <Input
          label='Company Name'
          name='companyName'
          value={formData?.receiver.companyName || ''}
          onChange={(e) => onFormChange(e, 'receiver')}
        />

        <div>
          <label className='mb-1 block text-sm font-medium'>
            Address Line 1 <span className='text-red-500'>*</span>
          </label>
          <Input
            name='addressLine1'
            id='receiver-address1'
            value={formData?.receiver.addressLine1 || ''}
            onChange={(e) => onFormChange(e, 'receiver')}
            className={cn(
              receiverAddressLine1Error && 'border-red-500 ring-1 ring-red-500'
            )}
          />
          {receiverAddressLine1Error && (
            <p className='mt-1 text-xs text-red-500'>This field is required</p>
          )}
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>
            Address Line 2 <span className='text-red-500'>*</span>
          </label>
          <Input
            name='addressLine2'
            id='receiver-address2'
            value={formData?.receiver.addressLine2 || ''}
            onChange={(e) => onFormChange(e, 'receiver')}
             className={cn(
              receiverAddressLine2Error && 'border-red-500 ring-1 ring-red-500'
            )}
          />
           {receiverAddressLine2Error && (
            <p className='mt-1 text-xs text-red-500'>This field is required</p>
          )}
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>
            City <span className='text-red-500'>*</span>
          </label>
          <Input
            name='city'
            id='receiver-city'
            value={formData?.receiver.city || ''}
            onChange={(e) => onFormChange(e, 'receiver')}
             className={cn(
              receiverCityError && 'border-red-500 ring-1 ring-red-500'
            )}
          />
          {receiverCityError && (
            <p className='mt-1 text-xs text-red-500'>This field is required</p>
          )}
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>
            State <span className='text-red-500'>*</span>
          </label>
          <Input
            name='state'
            id='receiver-state'
            value={formData?.receiver.state || ''}
            onChange={(e) => onFormChange(e, 'receiver')}
            className={cn(
              receiverStateError && 'border-red-500 ring-1 ring-red-500'
            )}
          />
          {receiverStateError && (
            <p className='mt-1 text-xs text-red-500'>This field is required</p>
          )}
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>
            Postcode <span className='text-red-500'>*</span>
          </label>
          <Input
            name='postcode'
            id='receiver-postcode'
            value={formData?.receiver.postcode || ''}
            onChange={(e) => onFormChange(e, 'receiver')}
            className={cn(
              receiverPostcodeError && 'border-red-500 ring-1 ring-red-500'
            )}
          />
          {receiverPostcodeError && (
            <p className='mt-1 text-xs text-red-500'>This field is required</p>
          )}
        </div>

        <div className='flex flex-col gap-1'>
           <label className='text-sm font-medium'>
            Country <span className='text-red-500'>*</span>
          </label>
          <Select
            value={formData?.receiver.country || ''}
            onValueChange={(value) =>
              onFormChange({ target: { name: 'country', value } }, 'receiver')
            }
          >
            <SelectTrigger
               id='receiver-country'
               className={cn(
                receiverCountryError && 'border-red-500 ring-1 ring-red-500'
              )}>
              <SelectValue placeholder='Select Country' />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.id} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
           {receiverCountryError && (
            <p className='mt-1 text-xs text-red-500'>This field is required</p>
          )}
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium'>
            Telephone <span className='text-red-500'>*</span>
          </label>
          <Input
            name='telephone'
            id='receiver-telephone'
            value={formData?.receiver.telephone || ''}
            onChange={(e) => onFormChange(e, 'receiver')}
             className={cn(
              receiverTelephoneError && 'border-red-500 ring-1 ring-red-500'
            )}
          />
           {receiverTelephoneError && (
            <p className='mt-1 text-xs text-red-500'>This field is required</p>
          )}
        </div>

        <Input
          label='Email'
          name='email'
          value={formData?.receiver.email || ''}
          onChange={(e) => onFormChange(e, 'receiver')}
        />

        {/* Display surcharge info */}
        {surchargeType && (
          <p className='mt-2 text-sm font-medium text-red-600'>
             {surchargeType} Surcharge Applied
          </p>
        )}
      </div>
    </div>
  )
}
