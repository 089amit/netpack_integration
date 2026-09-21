'use client'

import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import http from '@/utils/http'
import { AGENTS_ENDPOINTS, MAWB_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

// ✅ Schema
const formSchema = z.object({
  id: z.string().optional(),
  mawbNumber: z.string().min(1, 'MAWB number is required'),
  departureDate: z.string().min(1, 'Departure date is required'),
  flightNumber: z.string().optional(),
  arrivalDate: z.string().optional(),
  arrivalTime: z.string().optional(),
  agentId: z.number().int().positive('Please select an agent').optional(),
  airlineName: z.string().optional(),
  destination: z.string().optional(),
  hasShipment: z.boolean().optional(),
  documentUrl: z.string().optional(),
  image: z.instanceof(File).optional(),
  imageUrl: z.string().optional(),
})
export type MAWBFormValues = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: MAWBFormValues | null
  onSuccess?: () => void
}

interface Agent {
  id: number
  name: string
}

export function MawbMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: Props) {
  const isUpdate = !!currentRow
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agents, setAgents] = useState<Agent[]>([])
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loadingAgents, setLoadingAgents] = useState(true)

  // ✅ Searchable agent state
  const [agentSearch, setAgentSearch] = useState('')
  const [agentDropdownOpen, setAgentDropdownOpen] = useState(false)
  const agentDropdownRef = useRef<HTMLDivElement>(null)

  // ✅ Airline options
  const airlineOptions = [
    'Emirates', 'Qatar Airways', 'Singapore Airlines', 'Cathay Pacific',
    'Turkish Airlines', 'Lufthansa', 'British Airways', 'Air France',
    'KLM', 'Etihad Airways', 'Qantas', 'ANA All Nippon Airways',
    'Japan Airlines', 'Korean Air', 'EVA Air', 'China Airlines',
    'Hainan Airlines', 'Air Canada', 'United Airlines', 'Delta Air Lines',
    'American Airlines', 'Saudi Arabian Airlines', 'Thai Airways',
    'Malaysia Airlines', 'IndiGo', 'Vistara', 'Air India',
  ] as const

  // ✅ Format date for HTML input (parse as UTC to avoid timezone day-shift)
  const formatDateForInput = (dateString?: string | null): string => {
    if (!dateString) return ''
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // ✅ Default form values
  const getDefaultValues = (): MAWBFormValues => ({
    id: currentRow?.id ?? '',
    mawbNumber: currentRow?.mawbNumber ?? '',
    departureDate: formatDateForInput(currentRow?.departureDate),
    flightNumber: currentRow?.flightNumber ?? '',
    arrivalDate: formatDateForInput(currentRow?.arrivalDate),
    arrivalTime: currentRow?.arrivalTime ?? '',
    agentId: currentRow?.agentId ?? undefined,
    airlineName: currentRow?.airlineName?.trim() ?? '',
    destination: currentRow?.destination ?? '',
    hasShipment: currentRow?.hasShipment ?? false,
    documentUrl: currentRow?.documentUrl ?? '',
    imageUrl: currentRow?.documentUrl ?? '',
    image: undefined,
  })

  const form = useForm<MAWBFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  })

  // ✅ Handle image selection
  const handleImageChange = (file?: File) => {
    if (!file) return
    form.setValue('image', file)
    form.setValue('imageUrl', '')
    setImagePreview(URL.createObjectURL(file))
  }

  // ✅ Reset form when editing row changes
  useEffect(() => {
    if (currentRow) {
      form.reset({
        id: currentRow.id ?? '',
        mawbNumber: currentRow.mawbNumber ?? '',
        departureDate: formatDateForInput(currentRow.departureDate),
        flightNumber: currentRow.flightNumber ?? '',
        arrivalDate: formatDateForInput(currentRow.arrivalDate),
        arrivalTime: currentRow.arrivalTime ?? '',
        agentId: currentRow.agentId ?? undefined,
        airlineName: currentRow.airlineName?.trim() ?? '',
        destination: currentRow.destination ?? '',
        hasShipment: currentRow.hasShipment ?? false,
        documentUrl: currentRow.documentUrl ?? '',
        imageUrl: currentRow.documentUrl ?? '',
        image: undefined,
      })
      setImagePreview(currentRow.documentUrl ?? null)
      // Sync agent search label
      const matched = agents.find((a) => a.id === currentRow.agentId)
      setAgentSearch(matched?.name ?? '')
    } else {
      form.reset(getDefaultValues())
      setImagePreview(null)
      setAgentSearch('')
    }
  }, [currentRow])

  // ✅ Sync agent search label when agents list loads (for edit mode)
  useEffect(() => {
    if (agents.length > 0 && currentRow?.agentId) {
      const matched = agents.find((a) => a.id === currentRow.agentId)
      if (matched) setAgentSearch(matched.name)
    }
  }, [agents, currentRow?.agentId])

  // ✅ Close agent dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (agentDropdownRef.current && !agentDropdownRef.current.contains(e.target as Node)) {
        setAgentDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ✅ Load agents (limit=50) when drawer opens
  useEffect(() => {
    async function loadAgents() {
      setLoadingAgents(true)
      try {
        const res = await http.get<{ data: Agent[] }>(
          `${AGENTS_ENDPOINTS.GET_ALL_AGENTS}?limit=50`
        )
        setAgents(res.data || [])
      } catch (error) {
        console.error('❌ Error loading agents:', error)
        toast.error('Failed to load agents.')
      } finally {
        setLoadingAgents(false)
      }
    }
    if (open) loadAgents()
  }, [open])

  // ✅ Filtered agents for search
  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(agentSearch.toLowerCase())
  )

  // ✅ Submit handler
  const onSubmit = async (data: MAWBFormValues) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && key !== 'imageUrl') {
          if (key === 'image' && value instanceof File) {
            formData.append('image', value)
          } else {
            formData.append(key, String(value))
          }
        }
      })

      if (isUpdate && currentRow?.id) {
        await http.put(MAWB_ENDPOINTS.UPDATE_MAWB(Number(currentRow.id)), formData)
        toast.success('MAWB updated successfully!')
      } else {
        await http.post(MAWB_ENDPOINTS.CREATE_MAWB, formData)
        toast.success('MAWB created successfully!')
      }

      window.dispatchEvent(new Event('mawb-updated'))
      onSuccess?.()
      onOpenChange(false)
      form.reset()
      setImagePreview(null)
      setAgentSearch('')
    } catch (error) {
      console.error(error)
      toast.error('Failed to save MAWB.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex h-full w-full flex-col overflow-hidden md:max-w-xl'>
        <SheetHeader className='text-left'>
          <SheetTitle>{isUpdate ? 'Edit' : 'Create'} MAWB</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the MAWB by providing necessary info.'
              : 'Add a new MAWB by providing necessary info.'}
            Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <Form {...form}>
            <form
              id='mawb-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-5 px-4 py-2'
            >
              {/* MAWB Number */}
              <FormField
                control={form.control}
                name='mawbNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MAWB Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. 123-4567890' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Departure Date */}
              <FormField
                control={form.control}
                name='departureDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departure Date</FormLabel>
                    <FormControl>
                      <Input {...field} type='date' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Airline Name */}
              <FormField
                control={form.control}
                name='airlineName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Airline Name</FormLabel>
                    <FormControl>
                      <input
                        {...field}
                        list='airline-options'
                        type='text'
                        className='w-full rounded-md border p-2 text-sm leading-none'
                        placeholder='Type or select airline...'
                      />
                    </FormControl>
                    <datalist id='airline-options'>
                      {airlineOptions.map((name) => (
                        <option key={name} value={name} />
                      ))}
                    </datalist>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Agent — Searchable Combobox */}
              <FormField
                control={form.control}
                name='agentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Agent (Optional)</FormLabel>
                    <FormControl>
                      <div ref={agentDropdownRef} className='relative'>
                        <input
                          type='text'
                          className='w-full rounded-md border p-2 text-sm'
                          placeholder={loadingAgents ? 'Loading agents...' : 'Search agent...'}
                          disabled={loadingAgents}
                          value={agentSearch}
                          onChange={(e) => {
                            setAgentSearch(e.target.value)
                            setAgentDropdownOpen(true)
                            if (!e.target.value) {
                              field.onChange(undefined)
                            }
                          }}
                          onFocus={() => setAgentDropdownOpen(true)}
                        />
                        {agentDropdownOpen && filteredAgents.length > 0 && (
                          <div className='absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white shadow-md dark:bg-zinc-900'>
                            {/* Clear option */}
                            <div
                              className='cursor-pointer px-3 py-2 text-sm text-muted-foreground hover:bg-muted'
                              onMouseDown={(e) => {
                                e.preventDefault()
                                field.onChange(undefined)
                                setAgentSearch('')
                                setAgentDropdownOpen(false)
                              }}
                            >
                              No agent
                            </div>
                            {filteredAgents.map((agent) => (
                              <div
                                key={agent.id}
                                className={`cursor-pointer px-3 py-2 text-sm hover:bg-muted ${
                                  field.value === agent.id ? 'bg-muted font-medium' : ''
                                }`}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  field.onChange(agent.id)
                                  setAgentSearch(agent.name)
                                  setAgentDropdownOpen(false)
                                }}
                              >
                                {agent.name}
                              </div>
                            ))}
                          </div>
                        )}
                        {agentDropdownOpen && !loadingAgents && filteredAgents.length === 0 && agentSearch && (
                          <div className='absolute z-50 mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground shadow-md dark:bg-zinc-900'>
                            No agents found
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Destination */}
              <FormField
                control={form.control}
                name='destination'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Port</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='Vancouver, Canada' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Flight Number */}
              <FormField
                control={form.control}
                name='flightNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flight Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder='e.g. EK567' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Image Upload */}
              <FormField
                control={form.control}
                name='image'
                render={() => (
                  <FormItem>
                    <FormLabel>MAWB Image</FormLabel>
                    <FormControl>
                      <div className='space-y-3'>
                        {imagePreview ? (
                          <div className="relative rounded-md border p-2">
                            <img
                              src={imagePreview}
                              alt="MAWB"
                              className="h-48 w-full rounded-md object-cover"
                            />
                            <div className="mt-3 flex gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setImagePreview(null)
                                  form.setValue("image", undefined)
                                  form.setValue("imageUrl", "")
                                }}
                              >
                                Delete
                              </Button>
                              <a
                                href={imagePreview}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button type="button" variant="secondary" size="sm">
                                  View
                                </Button>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageChange(e.target.files?.[0])}
                          />
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Arrival Date */}
              <FormField
                control={form.control}
                name='arrivalDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Arrival</FormLabel>
                    <FormControl>
                      <Input {...field} type='date' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Arrival Time */}
              <FormField
                control={form.control}
                name='arrivalTime'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time of Arrival</FormLabel>
                    <FormControl>
                      <Input {...field} type='time' />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <SheetFooter className='bg-background sticky bottom-0 mt-auto gap-2 border-t pt-4'>
          <SheetClose asChild>
            <Button variant='outline' disabled={isSubmitting}>
              Close
            </Button>
          </SheetClose>
          <Button form='mawb-form' type='submit' disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
