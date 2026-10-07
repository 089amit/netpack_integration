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
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import { EnquiryFormData } from './enquiry-types'
import { ENQUIRY_ENDPOINTS, LOCATION_ENDPOINT } from '@/constants/endpoint'
import http from '@/utils/http'
import { validateAddressDetails, updateTelephoneWithCountryCode } from './enquiry-utils'

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
  const [verificationResult, setVerificationResult] = useState<{
    isVerified: boolean
    hasCorrections?: boolean
    corrections?: string[]
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

  // Real-time automatic address verification with Google Maps (debounced 800ms)
  useEffect(() => {
    const addr1 = formData?.receiver.addressLine1?.trim() || ''
    if (addr1.length < 5) {
      setVerificationResult(null)
      return
    }

    const timer = setTimeout(async () => {
      setIsVerifying(true)
      try {
        const res: any = await http.post(LOCATION_ENDPOINT.VERIFY_ADDRESS, {
          addressLine1: formData?.receiver.addressLine1 || '',
          addressLine2: formData?.receiver.addressLine2 || '',
          city: formData?.receiver.city || '',
          state: formData?.receiver.state || '',
          postalCode: formData?.receiver.postcode || '',
          country: formData?.receiver.country || '',
        })
        setVerificationResult(res)
      } catch (err) {
        console.warn('Auto address verification warning:', err)
      } finally {
        setIsVerifying(false)
      }
    }, 800)

    return () => clearTimeout(timer)
  }, [
    formData?.receiver.addressLine1,
    formData?.receiver.addressLine2,
    formData?.receiver.city,
    formData?.receiver.state,
    formData?.receiver.postcode,
    formData?.receiver.country,
  ])

  // Automatically prefix telephone with country dial code if telephone is empty
  useEffect(() => {
    if (formData?.receiver.country && (!formData?.receiver.telephone || formData.receiver.telephone.trim() === '' || formData.receiver.telephone.trim() === '+')) {
      const initialDial = updateTelephoneWithCountryCode('', formData.receiver.country)
      if (initialDial) {
        onFormChange({ target: { name: 'telephone', value: initialDial } }, 'receiver')
      }
    }
  }, [formData?.receiver.country])

  const handleApplySuggestion = () => {
    if (!verificationResult?.suggestion) return
    const s = verificationResult.suggestion
    if (s.addressLine1) {
      onFormChange({ target: { name: 'addressLine1', value: s.addressLine1 } }, 'receiver')
    }
    if (s.addressLine2 !== undefined) {
      onFormChange({ target: { name: 'addressLine2', value: s.addressLine2 } }, 'receiver')
    }
    if (s.city) {
      onFormChange({ target: { name: 'city', value: s.city } }, 'receiver')
    }
    if (s.state) {
      onFormChange({ target: { name: 'state', value: s.state } }, 'receiver')
    }
    if (s.postalCode) {
      onFormChange({ target: { name: 'postcode', value: s.postalCode } }, 'receiver')
    }
    if (s.country) {
      onFormChange({ target: { name: 'country', value: s.country } }, 'receiver')
    }
    setVerificationResult((prev) => (prev ? { ...prev, hasCorrections: false } : null))
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
          setSurchargeType(data.formattedWarning || data.surchargeMessage || data.message || data.surchargeType || null)
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

      {/* Real-time Google Maps Address Corrections & Suggestions Banner */}
      {verificationResult?.hasCorrections && (
        <div className='mb-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs shadow-xs transition-all dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'>
          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200'>
              <AlertTriangle className='h-4 w-4 text-amber-600 shrink-0' />
              <span>Suggested Address Corrections</span>
              <span className='rounded bg-white/80 dark:bg-amber-900/60 px-1.5 py-0.5 text-[10px] font-normal border border-amber-200 dark:border-amber-800'>
                {verificationResult.provider || 'Google Maps'}
              </span>
            </div>
            <Button
              type='button'
              size='sm'
              onClick={handleApplySuggestion}
              className='h-7 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-2.5 shadow-xs'
            >
              <Sparkles className='mr-1.5 h-3.5 w-3.5' />
              Apply Corrections
            </Button>
          </div>

          {verificationResult.corrections && verificationResult.corrections.length > 0 && (
            <ul className='mt-2 space-y-1 list-disc list-inside text-[11px] text-amber-950 dark:text-amber-200'>
              {verificationResult.corrections.map((corr: string, idx: number) => (
                <li key={idx} className='leading-tight font-medium'>
                  {corr}
                </li>
              ))}
            </ul>
          )}

          {verificationResult.formattedAddress && (
            <div className='mt-2 rounded bg-amber-100/70 dark:bg-amber-900/40 p-2 text-[11px] font-mono text-amber-900 dark:text-amber-200 leading-snug'>
              <span className='font-sans font-semibold'>Standardized: </span>
              {verificationResult.formattedAddress}
            </div>
          )}
        </div>
      )}

      {/* Verified without any corrections needed */}
      {verificationResult?.isVerified && !verificationResult?.hasCorrections && (
        <div className='mb-3 flex items-center justify-between rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'>
          <div className='flex items-center gap-1.5 font-semibold'>
            <CheckCircle2 className='h-4 w-4 text-emerald-600 shrink-0' />
            <span>Address Verified with Google Maps</span>
          </div>
          {verificationResult.formattedAddress && (
            <span className='text-[11px] text-muted-foreground truncate max-w-[280px]'>
              {verificationResult.formattedAddress}
            </span>
          )}
        </div>
      )}

      {/* Verifying background status */}
      {isVerifying && (
        <div className='mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground'>
          <Loader2 className='h-3 w-3 animate-spin text-blue-600' />
          <span>Verifying address with Google Maps...</span>
        </div>
      )}

      {/* Local Address Structure Warning */}
      {!addressValidation.isValid && (formData?.receiver.postcode || formData?.receiver.addressLine1) && !verificationResult?.isVerified && !verificationResult?.hasCorrections && (
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
              const newPhone = updateTelephoneWithCountryCode(formData?.receiver.telephone, value)
              if (newPhone) {
                onFormChange({ target: { name: 'telephone', value: newPhone } }, 'receiver')
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
          <div className='mt-3 flex items-center gap-2 rounded-md border border-red-400 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700 shadow-sm dark:border-red-800 dark:bg-red-950/40 dark:text-red-300'>
            <span className='text-sm shrink-0'>⚠️</span>
            <span>{surchargeType}</span>
          </div>
        )}
      </div>
    </div>
  )
}

