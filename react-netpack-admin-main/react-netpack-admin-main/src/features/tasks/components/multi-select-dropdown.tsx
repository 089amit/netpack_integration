import { useState, useMemo, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { ItemRow, Box } from './enquiry-types'

interface MultiSelectDropdownWithQuantityProps {
  items: ItemRow[]
  selectedItems?: { itemId: string; quantity: number }[]
  boxIdx: number
  allBoxes: Box[]
  onChange: (itemSelections: { itemId: string; quantity: number }[]) => void
}

export function MultiSelectDropdownWithQuantity({
  items,
  selectedItems = [],
  boxIdx,
  allBoxes,
  onChange,
}: MultiSelectDropdownWithQuantityProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isProcessingRef = useRef(false)

  const handleSelect = (itemId: string) => {
    // Prevent rapid successive calls that cause infinite loops
    if (isProcessingRef.current) {
      return
    }

    isProcessingRef.current = true

    const isSelected = selectedItems.find((sel) => sel.itemId === itemId)
    if (isSelected) {
      onChange(selectedItems.filter((sel) => sel.itemId !== itemId))
    } else {
      onChange([...selectedItems, { itemId, quantity: 1 }])
    }

    // Reset after a short delay
    setTimeout(() => {
      isProcessingRef.current = false
    }, 100)
  }

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const availableQty = getDynamicAvailableQty(itemId)
    // Clamp the quantity to be at most availableQty and at least 1
    const clampedQty = Math.max(1, Math.min(quantity, availableQty))
    const newSelectedItems = selectedItems.map((sel) =>
      sel.itemId === itemId ? { ...sel, quantity: clampedQty } : sel
    )
    onChange(newSelectedItems)
  }

  const getDynamicAvailableQty = (itemId: string) => {
    // Sum all quantities for this item across all boxes except the current box
    const totalUsedInOtherBoxes = allBoxes
      .filter((_, idx) => idx !== boxIdx)
      .flatMap((box) => box.itemSelections)
      .filter((sel) => sel.itemId === itemId)
      .reduce((sum, sel) => sum + sel.quantity, 0)

    // Always get the latest value from the item table (items array)
    const item = items[parseInt(itemId)]
    const itemTableQty = item ? parseFloat(item.quantity) || 0 : 0

    // Available is item table quantity minus total used in other boxes
    return itemTableQty - totalUsedInOtherBoxes
  }

  const filteredItems = useMemo(
    () =>
      (items ?? []).filter((item) =>
        (item.description || '')
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [items, search]
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        triggerRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
        setSearch('')
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [open])

  const renderAvailableItems = () => {
    return (
      <div className='space-y-2'>
        {filteredItems.map((item: ItemRow) => {
          const originalIdx = items.indexOf(item)
          const itemId = originalIdx.toString()
          const selected = selectedItems.find((sel) => sel.itemId === itemId)
          const availableQty = getDynamicAvailableQty(itemId)

          return (
            <div
              key={itemId}
              className='hover:bg-muted flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors'
              onClick={() => handleSelect(itemId)}
            >
              <div
                onClick={(e) => {
                  // Stop checkbox click from bubbling to parent div
                  e.stopPropagation()
                  // Still trigger selection when clicking checkbox
                  handleSelect(itemId)
                }}
              >
                <Checkbox
                  checked={!!selected}
                // Don't use onCheckedChange to avoid double triggers
                />
              </div>
              <div className='flex-1'>
                <div className='text-sm'>
                  {item.description || `Item ${originalIdx + 1}`}
                </div>
                <div className='text-muted-foreground text-xs'>
                  Available: {availableQty}
                </div>
              </div>
            </div>
          )
        })}

        {filteredItems.length === 0 && (
          <div className='text-muted-foreground p-2 text-xs'>
            No items found
          </div>
        )}
      </div>
    )
  }

  const renderSelectedItems = () => {
    if (selectedItems.length === 0) {
      return (
        <div className='text-muted-foreground text-xs'>No items selected.</div>
      )
    }
    return (
      <div className='space-y-2'>
        {selectedItems.map((selection) => {
          const item = items[parseInt(selection.itemId)]
          const availableQty = getDynamicAvailableQty(selection.itemId)
          const overQty = selection.quantity > availableQty
          return (
            <div
              key={selection.itemId}
              className='flex items-center gap-2 rounded-lg border bg-white p-3 shadow'
            >
              <Checkbox
                checked={true}
                onCheckedChange={() => handleSelect(selection.itemId)}
              />
              <div className='flex-1'>
                <div className='text-sm font-medium'>
                  {item.description || `Item ${parseInt(selection.itemId) + 1}`}
                </div>
                <div className='text-muted-foreground text-xs'>
                  Available: {availableQty}
                </div>
              </div>
              <Input
                type='number'
                min='1'
                max={availableQty}
                value={selection.quantity}
                onChange={(e) =>
                  handleQuantityChange(
                    selection.itemId,
                    parseInt(e.target.value) || 1
                  )
                }
                className='w-20'
              />
              {overQty && (
                <div className='ml-2 text-xs text-red-600'>
                  Quantity exceeds available!
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='relative'>
        <Button
          type='button'
          ref={triggerRef}
          variant='outline'
          className='w-full justify-between'
          onClick={() => {
            setOpen(!open)
            if (open) setSearch('')
          }}
        >
          Select Items
          <span className='ml-2'>&#9662;</span>
        </Button>

        {open && (
          <div
            ref={dropdownRef}
            className='absolute top-full left-0 z-50 mt-1 w-80 rounded-md border bg-white shadow-lg'
            style={{
              maxHeight: '400px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Sticky search bar */}
            <div className='sticky top-0 z-10 bg-white p-2 border-b rounded-t-md'>
              <Input
                placeholder='Search items...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='w-full'
                autoFocus
              />
            </div>

            {/* Scrollable items list */}
            <div
              className='overflow-y-auto overflow-x-hidden p-2'
              style={{
                maxHeight: '300px',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {renderAvailableItems()}
            </div>
          </div>
        )}
      </div>
      <div>
        <div className='mb-1 text-base font-semibold'>Selected Items</div>
        <div className='bg-muted/10 rounded-lg border p-3'>
          {renderSelectedItems()}
        </div>
      </div>
    </div>
  )
}
