'use client'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useEffect, useState, useMemo } from 'react'
import { AlertTriangle, MapPin, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { EnquiryFormData } from './enquiry-types'
import { ENQUIRY_ENDPOINTS, LOCATION_ENDPOINT } from '@/constants/endpoint'
import http from '@/utils/http'
import { validateAddressDetails } from './enquiry-utils'

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
  receiverAddressLine2Error: _receiverAddressLine2Error = false,
  receiverCityError = false,
  receiverStateError = false,
  receiverPostcodeError = false,
  receiverCountryError = false,
  receiverTelephoneError = false,
  sameAsSender = false,
  onSameAsSenderChange,
}: ReceiverSectionProps) {
  const [surchargeType, setSurchargeType] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [appliedSuggestion, setAppliedSuggestion] = useState(false)
  const [verificationResult, setVerificationResult] = useState<{
    isVerified: boolean
    status: string
    formattedAddress?: string
    lat?: number
    lng?: number
    postalCode?: string
    city?: string
    state?: string
    country?: string
    suggestion?: any
    provider?: string
    message?: string
  } | null>(null)

  const handleVerifyAddress = async () => {
    if (!formData?.receiver.addressLine1) return
    setIsVerifying(true)
    setAppliedSuggestion(false)
    try {
      const res: any = await http.post(LOCATION_ENDPOINT.VERIFY_ADDRESS, {
        addressLine1: formData.receiver.addressLine1,
        addressLine2: formData.receiver.addressLine2 || '',
        city: formData.receiver.city || '',
        state: formData.receiver.state || '',
        postalCode: formData.receiver.postcode || '',
        country: formData.receiver.country || '',
      })
      setVerificationResult(res)
    } catch (err: any) {
      console.error('Failed to verify address:', err)
      setVerificationResult({
        isVerified: false,
        status: 'ERROR',
        message: 'Could not contact address verification service.',
        provider: 'Google Maps Platform',
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleApplySuggestion = () => {
    if (!verificationResult) return
    const s = verificationResult.suggestion || {}
    if (s.postalCode) {
      onFormChange({ target: { name: 'postcode', value: s.postalCode } }, 'receiver')
    }
    if (s.city) {
      onFormChange({ target: { name: 'city', value: s.city } }, 'receiver')
    }
    if (s.state) {
      onFormChange({ target: { name: 'state', value: s.state } }, 'receiver')
    }
    if (s.country) {
      onFormChange({ target: { name: 'country', value: s.country } }, 'receiver')
    }
    setAppliedSuggestion(true)
  }

  const addressValidation = useMemo(() => {
    return validateAddressDetails(formData?.receiver || {})
  }, [
    formData?.receiver.addressLine1,
    formData?.receiver.city,
    formData?.receiver.state,
    formData?.receiver.postcode,
    formData?.receiver.country,
  ])

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
        if (data.success || data.hasSurcharge) {
          setSurchargeType(data.surchargeMessage || data.surchargeType || null)
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

      {/* Google Maps / Geocoding Verification Banner */}
      {verificationResult && (
        <div
          className={cn(
            'mb-3 rounded-md border p-2.5 text-xs shadow-xs transition-all',
            verificationResult.isVerified
              ? 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200'
          )}
        >
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-1.5 font-semibold'>
              {verificationResult.isVerified ? (
                <CheckCircle2 className='h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0' />
              ) : (
                <AlertTriangle className='h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0' />
              )}
              <span>{verificationResult.message || (verificationResult.isVerified ? 'Address Verified' : 'Address Notice')}</span>
              {verificationResult.provider && (
                <span className='rounded bg-background/80 px-1.5 py-0.5 text-[10px] font-normal border'>
                  {verificationResult.provider}
                </span>
              )}
            </div>
            {verificationResult.isVerified && verificationResult.suggestion && (
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={handleApplySuggestion}
                disabled={appliedSuggestion}
                className='h-6 px-2 text-[11px] font-medium border-emerald-600 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-900/40'
              >
                <Sparkles className='mr-1 h-3 w-3' />
                {appliedSuggestion ? 'Applied' : 'Auto-fill'}
              </Button>
            )}
          </div>
          {verificationResult.formattedAddress && (
            <p className='mt-1 text-[11px] leading-relaxed opacity-90'>
              <span className='font-medium'>Matched:</span> {verificationResult.formattedAddress}
            </p>
          )}
        </div>
      )}

      {/* Address Verification Warning with Suggestion */}
      {!addressValidation.isValid && (formData?.receiver.postcode || formData?.receiver.addressLine1) && !verificationResult?.isVerified && (
        <div className='mb-3 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 shadow-xs dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200'>
          <div className='flex items-center gap-1.5 font-semibold'>
            <AlertTriangle className='h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0' />
            <span>Address Verification Warning</span>
          </div>
          <p className='mt-1 leading-relaxed'>{addressValidation.warning}</p>
          {addressValidation.suggestion && (
            <p className='mt-1 text-muted-foreground dark:text-amber-300/80 italic'>
              Suggestion: {addressValidation.suggestion}
            </p>
          )}
        </div>
      )}

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
          <div className='mb-1 flex items-center justify-between'>
            <label className='block text-sm font-medium'>
              Address Line 1 <span className='text-red-500'>*</span>
            </label>
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={handleVerifyAddress}
              disabled={isVerifying || !formData?.receiver.addressLine1}
              className='h-6 px-2 text-[11px] font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50'
            >
              {isVerifying ? (
                <>
                  <Loader2 className='mr-1 h-3 w-3 animate-spin' />
                  Verifying...
                </>
              ) : (
                <>
                  <MapPin className='mr-1 h-3 w-3 text-blue-600 dark:text-blue-400' />
                  Verify with Maps
                </>
              )}
            </Button>
          </div>
          <Input
            name='addressLine1'
            id='receiver-address1'
            value={formData?.receiver.addressLine1 || ''}
            onChange={(e) => {
              onFormChange(e, 'receiver')
              setVerificationResult(null)
            }}
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
            Address Line 2 (Optional)
          </label>
          <Input
            name='addressLine2'
            id='receiver-address2'
            value={formData?.receiver.addressLine2 || ''}
            onChange={(e) => onFormChange(e, 'receiver')}
          />
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
            onValueChange={(value) => {
              onFormChange({ target: { name: 'country', value } }, 'receiver')
              const selectedCountryObj = countries.find((c) => c.name === value)
              const dialCode = selectedCountryObj?.dialCode || selectedCountryObj?.phoneCode
              if (dialCode && (!formData?.receiver.telephone || formData.receiver.telephone === '+')) {
                const cleanDial = dialCode.startsWith('+') ? dialCode : `+${dialCode}`
                onFormChange({ target: { name: 'telephone', value: `${cleanDial} ` } }, 'receiver')
              }
            }}
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
          <div className='mt-3 flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200'>
            <span>⚠️</span>
            <span>{surchargeType.includes('Surcharge') ? surchargeType : `${surchargeType} Surcharge Applied`}</span>
          </div>
        )}
      </div>
    </div>
  )
}

