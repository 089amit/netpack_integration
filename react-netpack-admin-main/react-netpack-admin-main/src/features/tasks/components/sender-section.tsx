import { useEffect } from 'react'
import { Customer } from '@/type/customer'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EnquiryFormData } from './enquiry-types'

interface SenderSectionProps {
  formData: EnquiryFormData | null
  countries: any[]
  filteredCustomers: Customer[]
  senderSearchOpen: boolean
  senderSearchValue: string
  onSenderSearchChange: (search: string) => void
  onCustomerSelect: (customer: Customer) => void
  onSenderSearchOpenChange: (open: boolean) => void
  onFormChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } },
    type: 'sender'
  ) => void
  onCreateCustomer?: () => void
  onSearchCustomers?: (search: string) => void
  hasError?: boolean
  senderAddressLine1Error?: boolean
  senderAddressLine2Error?: boolean
  senderCityError?: boolean
  senderPostcodeError?: boolean
  senderCountryError?: boolean
  senderTelephoneError?: boolean
  userRole?: string
  onSelfDetailSelect?: () => void
  canEdit?: boolean
}

export function SenderSection({
  formData,
  countries,
  filteredCustomers,
  senderSearchOpen,
  senderSearchValue,
  onSenderSearchChange,
  onCustomerSelect,
  onSenderSearchOpenChange,
  onFormChange,
  onCreateCustomer,
  onSearchCustomers,
  hasError = false,
  senderAddressLine1Error = false,
  senderAddressLine2Error = false,
  senderCityError = false,
  senderPostcodeError = false,
  senderCountryError = false,
  senderTelephoneError = false,
  userRole,
  onSelfDetailSelect,
  canEdit = true,
}: SenderSectionProps) {
  useEffect(() => {
    if (userRole === 'CUSTOMER' && onSelfDetailSelect) {
      onSelfDetailSelect()
    }
  }, [userRole, onSelfDetailSelect])

  const handleSearchChange = (search: string) => {
    onSenderSearchChange(search)
    // Call API search if provided
    if (onSearchCustomers) {
      onSearchCustomers(search)
    }
  }

  const isEditable = canEdit && userRole !== 'CUSTOMER'

  return (
    <div className='border-r pr-6'>
      <h3 className='mb-4 text-lg font-semibold'>Sender Details</h3>
      <div className='space-y-3'>
        {/* Customer Search Dropdown */}
        <div className='space-y-2'>
          <div className='flex items-center justify-between'>
            <label className='text-sm font-medium'>
              Customer Name <span className='text-red-500'>*</span>
            </label>
           
          </div>
          <Popover
            open={senderSearchOpen}
            onOpenChange={onSenderSearchOpenChange}
          >
            <PopoverTrigger asChild>
              <Button
                id='sender-name'
                variant='outline'
                role='combobox'
                aria-expanded={senderSearchOpen}
                disabled={!isEditable}
                className={cn(
                  'w-full justify-between',
                  hasError && 'border-red-500 ring-1 ring-red-500'
                )}
              >
                {formData?.sender.name || 'Search customers...'}
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-full p-0'>
              <Command>
                <CommandInput
                  placeholder='Search customers...'
                  value={senderSearchValue}
                  onValueChange={handleSearchChange}
                />
                <CommandList>
                  <CommandEmpty>
                    <div className='flex flex-col items-center gap-2 p-4'>
                      <p className='text-muted-foreground text-sm'>
                        No customers found.
                      </p>
                      {onCreateCustomer && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={onCreateCustomer}
                          className='flex items-center gap-2'
                        >
                          <Plus className='h-4 w-4' />
                          Create New Customer
                        </Button>
                      )}
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredCustomers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.name}
                        onSelect={() => onCustomerSelect(customer)}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            formData?.sender.id === customer.id
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        <div className='flex flex-col'>
                          <span>{customer.name}</span>
                          <span className='text-muted-foreground text-xs'>
                            {customer.email} • {customer.phone}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {hasError && (
            <p className='text-sm text-red-500'>Customer name is required</p>
          )}
        </div>

        <div className='space-y-1'>
          <label className='text-sm font-medium'>
            Address Line 1 <span className='text-red-500'>*</span>
          </label>
          <Input
            name='addressLine1'
            id='sender-address1'
            value={formData?.sender.addressLine1 || ''}
            onChange={(e) => onFormChange(e, 'sender')}
            disabled={!isEditable}
            className={cn(
              senderAddressLine1Error && 'border-red-500 ring-1 ring-red-500'
            )}
          />
          {senderAddressLine1Error && (
            <p className='text-sm text-red-500'>Address Line 1 is required</p>
          )}
        </div>
        <div className='space-y-1'>
          <label className='text-sm font-medium'>
            Address Line 2 <span className='text-red-500'>*</span>
          </label>
          <Input
            name='addressLine2'
            id='sender-address2'
            value={formData?.sender.addressLine2 || ''}
            onChange={(e) => onFormChange(e, 'sender')}
            disabled={!isEditable}
            className={cn(
              senderAddressLine2Error && 'border-red-500 ring-1 ring-red-500'
            )}
          />
          {senderAddressLine2Error && (
            <p className='text-sm text-red-500'>Address Line 2 is required</p>
          )}
        </div>

        <div className='space-y-1'>
          <label className='text-sm font-medium'>
            City <span className='text-red-500'>*</span>
          </label>
          <Input
            name='city'
            id='sender-city'
            value={formData?.sender.city || ''}
            onChange={(e) => onFormChange(e, 'sender')}
            disabled={!isEditable}
            className={cn(
              senderCityError && 'border-red-500 ring-1 ring-red-500'
            )}
          />
          {senderCityError && (
            <p className='text-sm text-red-500'>City is required</p>
          )}
        </div>

        <div className='space-y-1'>
          <label className='text-sm font-medium'>
            Postcode <span className='text-red-500'>*</span>
          </label>
          <Input
            name='postcode'
            id='sender-postcode'
            value={formData?.sender.postcode || ''}
            onChange={(e) => onFormChange(e, 'sender')}
            disabled={!isEditable}
            className={cn(
              senderPostcodeError && 'border-red-500 ring-1 ring-red-500'
            )}
          />
          {senderPostcodeError && (
            <p className='text-sm text-red-500'>Postcode is required</p>
          )}
        </div>

        <div className='space-y-1'>
          <label className='text-sm font-medium'>
            Country <span className='text-red-500'>*</span>
          </label>
          <Select
            value={formData?.sender.country || 'Nepal'}
            onValueChange={(value) =>
              onFormChange({ target: { name: 'country', value } }, 'sender')
            }
            disabled={!isEditable}
          >
            <SelectTrigger
              id='sender-country'
              className={cn(
                senderCountryError && 'border-red-500 ring-1 ring-red-500'
              )}
            >
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
          {senderCountryError && (
            <p className='text-sm text-red-500'>Country is required</p>
          )}
        </div>

        <div className='space-y-1'>
          <label className='text-sm font-medium'>
            Telephone <span className='text-red-500'>*</span>
          </label>
          <Input
            name='telephone'
            id='sender-telephone'
            value={formData?.sender.telephone || ''}
            onChange={(e) => onFormChange(e, 'sender')}
            placeholder='Enter telephone number'
            disabled={!isEditable}
            className={cn(
              senderTelephoneError && 'border-red-500 ring-1 ring-red-500'
            )}
          />
          {senderTelephoneError && (
            <p className='text-sm text-red-500'>Telephone is required</p>
          )}
        </div>
      </div>
    </div>
  )
}
