import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EnquiryFormData } from './enquiry-types'

// -------------------------------------------------------------
// CurrencyCombobox Component (Supports both dropdown and manual entry)
// -------------------------------------------------------------

interface CurrencyComboboxProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder: string
}

/**
 * Combobox that allows both selecting from dropdown and manual entry.
 * If the value is not in the options list, it shows as a manual entry.
 */
function CurrencyCombobox({
  options,
  value,
  onChange,
  placeholder,
}: CurrencyComboboxProps) {
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualValue, setManualValue] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  // Check if current value exists in options
  const valueInOptions = value ? options.includes(value.toUpperCase()) : false

  // When value changes externally (e.g., from API), update manual value
  useEffect(() => {
    setManualValue(value)
    // If value is not in options and not empty, switch to manual mode
    if (value && !valueInOptions) {
      setIsManualMode(true)
    }
  }, [value, valueInOptions])

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value
    if (selectedValue === '__manual__') {
      setIsManualMode(true)
      setTimeout(() => inputRef.current?.focus(), 0)
    } else {
      setIsManualMode(false)
      onChange(selectedValue.toUpperCase())
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.toUpperCase().replace(/[^A-Z]/g, '')
    setManualValue(inputValue)
    onChange(inputValue)
  }

  const handleInputBlur = () => {
    // If manual value matches an option, switch back to dropdown mode
    if (manualValue && options.includes(manualValue.toUpperCase())) {
      setIsManualMode(false)
    }
  }

  // Show input field if in manual mode or value is not in options
  if (isManualMode || (value && !valueInOptions)) {
    return (
      <div className='flex items-center gap-1'>
        <Input
          ref={inputRef}
          value={manualValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          maxLength={3}
          className='h-9 w-[90px] text-xs font-medium uppercase'
        />
        <select
          value='__manual__'
          onChange={handleSelectChange}
          className='border-input bg-background focus:ring-primary h-9 w-[90px] cursor-pointer rounded-md border px-2 py-1.5 text-xs font-medium uppercase shadow-sm transition-colors focus:ring-1 focus:outline-none'
        >
          <option value='__manual__'>Custom</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <select
      value={value || ''}
      onChange={handleSelectChange}
      className='border-input bg-background focus:ring-primary h-9 w-[90px] cursor-pointer rounded-md border px-3 py-1.5 text-xs font-medium uppercase shadow-sm transition-colors focus:ring-1 focus:outline-none'
    >
      <option value='' disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
      <option value='__manual__'>Other (Custom)</option>
    </select>
  )
}

// -------------------------------------------------------------
// ItemTable Component
// -------------------------------------------------------------

interface ItemTableProps {
  formData: EnquiryFormData | null
  onFormChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'items',
    index: number
  ) => void
  onTotalCurrencyChange: (value: string) => void
  onDeleteItem: (index: number) => void
  onAddItem: () => void
  itemErrors?: boolean[]
}

export function ItemTable({
  formData,
  onFormChange,
  onTotalCurrencyChange,
  onDeleteItem,
  onAddItem,
  itemErrors = [],
}: ItemTableProps) {
  // Standard list of common currencies for the dropdown
  const currencyOptions = [
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CAD',
    'AUD',
    'NPR',
    'INR',
    'AED',
    'SGD',
  ]

  // Calculate grand total
  const grandTotal = (formData?.items ?? []).reduce((sum, item: any) => {
    const unitValue = parseFloat(item.unitPrice) || 0
    const quantity = parseFloat(item.quantity) || 0
    return sum + unitValue * quantity
  }, 0)

  // Determine the currency for the Grand Total display, defaulting to USD
  const totalCurrency = formData?.items?.[0]?.currency?.toUpperCase() || 'USD'

  return (
    <div className='mb-6 overflow-x-auto'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-muted/40'>
          <tr>
            <th className='px-4 py-2 text-left'>
              Description <span className='text-red-500'>*</span>
            </th>
            <th className='px-4 py-2 text-left'>
              Quantity <span className='text-red-500'>*</span>
            </th>
            <th className='px-4 py-2 text-left'>
              Unit Value <span className='text-red-500'>*</span>
            </th>
            <th className='px-4 py-2 text-left'>HS Code</th>
            <th className='px-4 py-2 text-left'>Total</th>
            <th className='px-4 py-2 text-left'>Actions</th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200'>
          {(formData?.items ?? []).map((item: any, index: number) => {
            const unitValue = parseFloat(item.unitPrice) || 0
            const quantity = parseFloat(item.quantity) || 0
            const total = unitValue * quantity
            const hasError = itemErrors?.[index] || false
            return (
              <tr key={index} className='border-b'>
                <td className='px-4 py-2'>
                    <Input
                    name='description'
                    id={`item-${index}-description`}
                    value={item.description}
                    onChange={(e) =>
                      onFormChange(
                        e as React.ChangeEvent<HTMLInputElement>,
                        'items',
                        index
                      )
                    }
                    className={cn(
                      'w-full',
                      hasError &&
                        !item.description &&
                        'border-red-500 ring-1 ring-red-500'
                    )}
                  />
                </td>
                <td className='px-4 py-2'>
                  <Input
                    name='quantity'
                    id={`item-${index}-quantity`}
                    type='number'
                    value={item.quantity}
                    onChange={(e) =>
                      onFormChange(
                        e as React.ChangeEvent<HTMLInputElement>,
                        'items',
                        index
                      )
                    }
                    className={cn(
                      'w-full',
                      hasError &&
                        !item.quantity &&
                        'border-red-500 ring-1 ring-red-500'
                    )}
                  />
                </td>
                <td className='px-4 py-2'>
                  <Input
                    name='unitPrice'
                    id={`item-${index}-unitPrice`}
                    type='number'
                    value={item.unitPrice}
                    onChange={(e) =>
                      onFormChange(
                        e as React.ChangeEvent<HTMLInputElement>,
                        'items',
                        index
                      )
                    }
                    className={cn(
                      'w-full',
                      hasError &&
                        !item.unitPrice &&
                        'border-red-500 ring-1 ring-red-500'
                    )}
                  />
                </td>

                <td className='px-4 py-2'>
                  <Input
                    name='hsCode'
                    value={item.hsCode}
                    onChange={(e) =>
                      onFormChange(
                        e as React.ChangeEvent<HTMLInputElement>,
                        'items',
                        index
                      )
                    }
                    className='w-full'
                  />
                </td>

                <td className='flex items-center gap-1 px-4 py-2'>
                  {/* Displaying the overall total currency next to the item total for clarity */}
                  <span className='w-[40px] pr-1 text-right text-sm font-semibold'>
                    {totalCurrency}
                  </span>
                  <Input
                    name='totalValue'
                    value={total.toFixed(2)}
                    readOnly
                    className='bg-muted w-full'
                  />
                </td>
                <td className='px-4 py-2'>
                  <Button
                    type='button'
                    variant='destructive'
                    size='sm'
                    onClick={() => onDeleteItem(index)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            )
          })}
          <tr>
            <td
              className='flex items-center gap-4 px-4 py-2 font-bold'
              colSpan={3}
            >
              Grand Total
              {/* Currency Selector for Grand Total */}
              <CurrencyCombobox
                options={currencyOptions}
                value={totalCurrency}
                onChange={onTotalCurrencyChange}
                placeholder='USD'
              />
            </td>

            {/* Empty column for HS Code */}
            <td className='px-4 py-2 font-bold' colSpan={1}></td>

            <td className='flex items-center gap-1 px-4 py-2 font-bold'>
              {/* Grand Total Value */}
              <span className='w-[40px] pr-1 text-right text-sm font-bold'>
                {totalCurrency}
              </span>
              <Input
                value={grandTotal.toFixed(2)}
                readOnly
                className='bg-muted w-full font-bold'
              />
            </td>
            <td></td>
          </tr>
        </tbody>
      </table>
      <Button
        type='button'
        variant='outline'
        onClick={onAddItem}
        className='mt-2'
      >
        Add Item
      </Button>
    </div>
  )
}
