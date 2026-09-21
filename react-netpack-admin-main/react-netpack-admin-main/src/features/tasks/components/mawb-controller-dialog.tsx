// src/components/mawb-selector-modal.tsx

'use client'

import { useState, useEffect } from 'react'
import { EnquiryItem } from '@/type/enquiry'
import { MAWBTableItem } from '@/type/mawb'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// src/components/mawb-selector-modal.tsx

interface MAWBSelectorModalProps {
  selectedEnquiries: EnquiryItem[]
  onCreate: (selectedMawb: MAWBTableItem) => void
}

export function MAWBSelectorModal({
  selectedEnquiries,
  onCreate,
}: MAWBSelectorModalProps) {
  const [open, setOpen] = useState(false)
  const [mawbs, setMawbs] = useState<MAWBTableItem[]>([])
  const [filteredMawbs, setFilteredMawbs] = useState<MAWBTableItem[]>([])
  const [selectedMawbId, setSelectedMawbId] = useState<string>('')
  const [selectedMawbData, setSelectedMawbData] =
    useState<MAWBTableItem | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  console.log(selectedEnquiries)

  // Fetch MAWB list from API
  useEffect(() => {
    const fetchMAWBs = async () => {
      try {
        const result = await http.get<{ data: MAWBTableItem[] }>(
          MAWB_ENDPOINTS.GET_ALL_MAWBS
        )
        if (result?.data) {
          setMawbs(result.data)
          setFilteredMawbs(result.data)
        }
      } catch (err) {
        console.error('Failed to fetch MAWBs', err)
      }
    }

    if (open) {
      fetchMAWBs()
    }
  }, [open])

  // Filter MAWBs based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMawbs(mawbs)
      return
    }

    const lowerCaseSearch = searchTerm.toLowerCase()
    const filtered = mawbs.filter(
      (mawb) =>
        mawb.mawbNumber.toLowerCase().includes(lowerCaseSearch) ||
        mawb.airlineName?.toLowerCase().includes(lowerCaseSearch) ||
        mawb.destination.toLowerCase().includes(lowerCaseSearch)
    )

    setFilteredMawbs(filtered)
  }, [searchTerm, mawbs])

  // Update displayed MAWB data when selection changes
  useEffect(() => {
    if (selectedMawbId) {
      const mawb = mawbs.find((item) => item.id === selectedMawbId) || null
      console.log(mawb?.id)
      setSelectedMawbData(mawb)
    } else {
      setSelectedMawbData(null)
    }
  }, [selectedMawbId])

  const handleCreate = async () => {
    if (!selectedMawbData) return

    try {
      // Extract just the IDs from selectedEnquiries
      const enquiryIds = selectedEnquiries.map((enq) => enq.id)

      const response = await http.post(MAWB_ENDPOINTS.LINK_MAWB, {
        enquiryIds,
        mawbId: selectedMawbData.id,
      })

      console.log('Successfully linked enquiries:', response)
      onCreate(selectedMawbData)
      setOpen(false)
    } catch (error) {
      console.error('Failed to link enquiries to MAWB:', error)
      alert('Failed to assign MAWB. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant='outline'>Assign MAWB</Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[500px]'>
        <DialogHeader>
          <DialogTitle>Select MAWB</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className='py-2'>
          <Input
            placeholder='Search MAWB by number, airline or destination...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dropdown */}
        <div className='py-2'>
          <label className='mb-2 block text-sm font-medium'>Choose MAWB</label>
          <Select onValueChange={setSelectedMawbId} value={selectedMawbId}>
            <SelectTrigger>
              <SelectValue placeholder='Select MAWB' />
            </SelectTrigger>
            <SelectContent>
              {filteredMawbs.length > 0 ? (
                filteredMawbs.map((mawb) => (
                  <SelectItem key={mawb.id} value={mawb.id}>
                    {mawb.mawbNumber} - {mawb.airlineName}
                  </SelectItem>
                ))
              ) : (
                <div className='text-muted-foreground p-2 text-center'>
                  No matching results
                </div>
              )}
            </SelectContent>
          </Select>
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

        <Button onClick={handleCreate} disabled={!selectedMawbData}>
          Create
        </Button>
      </DialogContent>
    </Dialog>
  )
}
