// src/components/shipment-mawb-modal.tsx

'use client'

import { useState, useEffect } from 'react'
import { MAWBTableItem } from '@/type/mawb'
import { ShipmentItem } from '@/type/shipment'
import { toast } from 'sonner'
import http from '@/utils/http'
import { MAWB_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// src/components/shipment-mawb-modal.tsx

// src/components/shipment-mawb-modal.tsx

// src/components/shipment-mawb-modal.tsx

// src/components/shipment-mawb-modal.tsx

interface ShipmentMAWBModalProps {
  selectedShipments: ShipmentItem[]
  onCreate: (selectedMawb: MAWBTableItem) => void
}

export function ShipmentMAWBModal({
  selectedShipments,
  onCreate,
}: ShipmentMAWBModalProps) {
  const [open, setOpen] = useState(false)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [mawbs, setMawbs] = useState<MAWBTableItem[]>([])
  const [selectedMawbId, setSelectedMawbId] = useState<string>('')
  const [selectedMawbData, setSelectedMawbData] =
    useState<MAWBTableItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  console.log(selectedShipments)

  // Fetch MAWB list from API
  useEffect(() => {
    const fetchMAWBs = async () => {
      try {
        const query = new URLSearchParams({ limit: '10' })
        if (searchTerm.trim()) {
          query.append('search', searchTerm.trim())
        }
        const result = await http.get<{ data: MAWBTableItem[] }>(
          `${MAWB_ENDPOINTS.GET_ALL_MAWBS}?${query.toString()}`
        )
        if (result?.data) {
          setMawbs(result.data)
        }
      } catch (err) {
        console.error('Failed to fetch MAWBs', err)
        toast.error('Failed to load MAWB list. Please try again.', {
          duration: 3000,
        })
      }
    }

    if (open) {
      const timeoutId = setTimeout(() => {
        fetchMAWBs()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [open, searchTerm])



  // Update displayed MAWB data when selection changes
  useEffect(() => {
    if (selectedMawbId) {
      const mawb = mawbs.find((item) => item.id === selectedMawbId) || null
      setSelectedMawbData(mawb)
    } else {
      setSelectedMawbData(null)
    }
  }, [selectedMawbId, mawbs])

  const handleCreate = async () => {
    if (!selectedMawbData) return

    if (
      !selectedShipments ||
      !Array.isArray(selectedShipments) ||
      selectedShipments.length === 0
    ) {
      toast.error('No shipments selected. Please select shipments first.', {
        duration: 3000,
      })
      return
    }

    setIsLoading(true)

    try {
      const shipmentIds = selectedShipments.map((ship) => ship.id)

      const response = await http.post(MAWB_ENDPOINTS.LINK_MAWB, {
        shipmentIds,
        mawbId: selectedMawbData.id,
      })

      console.log('Successfully linked shipments:', response)

      toast.success(
        `Successfully assigned ${selectedShipments.length} shipment(s) to MAWB ${selectedMawbData.mawbNumber}`,
        { duration: 4000 }
      )

      onCreate(selectedMawbData)
      setOpen(false)
    } catch (error) {
      console.error('Failed to link shipments to MAWB:', error)

      // Show more specific error message based on error type
      let errorMessage = 'Failed to assign MAWB. Please try again.'

      if (error instanceof Error) {
        if (error.message.includes('400')) {
          errorMessage =
            'Invalid request. Please check your selection and try again.'
        } else if (error.message.includes('404')) {
          errorMessage =
            'MAWB or shipment not found. Please refresh and try again.'
        } else if (error.message.includes('409')) {
          errorMessage = 'Shipment is already assigned to another MAWB.'
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.'
        }
      }

      toast.error(errorMessage, { duration: 4000 })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>Assign MAWB</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Select MAWBs</DialogTitle>
        </DialogHeader>

        <div className='py-4 flex flex-col gap-2'>
          <label className='block text-sm font-medium'>Choose MAWB</label>
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                aria-expanded={comboboxOpen}
                className='w-full justify-between font-normal'
              >
                {selectedMawbId
                  ? mawbs.find((mawb) => mawb.id === selectedMawbId)?.mawbNumber || 'Selected MAWB'
                  : 'Search MAWB by number...'}
                <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[460px] p-0'>
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder='Search MAWB...' 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>No matching results.</CommandEmpty>
                  <CommandGroup>
                    {mawbs.map((mawb) => (
                      <CommandItem
                        key={mawb.id}
                        value={mawb.id}
                        onSelect={() => {
                          setSelectedMawbId(mawb.id === selectedMawbId ? '' : mawb.id)
                          setComboboxOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            selectedMawbId === mawb.id ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                        {mawb.mawbNumber} - {mawb.airlineName} ({mawb.destination})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Display selected MAWB details */}
        {selectedMawbData && (
          <div className='bg-muted/30 mt-4 space-y-2 rounded-md border p-4'>
            <h4 className='font-semibold'>Selected MAWB Details</h4>
            <p>
              <strong>MAWB Number:</strong> {selectedMawbData.mawbNumber}
            </p>
            <p>
              <strong>Airline Name:</strong> {selectedMawbData.airlineName}
            </p>
            <p>
              <strong>Departure Date:</strong>{' '}
              {new Date(selectedMawbData.departureDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Destination:</strong> {selectedMawbData.destination}
            </p>
          </div>
        )}

        <Button
          onClick={handleCreate}
          disabled={!selectedMawbData || isLoading}
        >
          {isLoading ? 'Assigning...' : 'Assign MAWB'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
