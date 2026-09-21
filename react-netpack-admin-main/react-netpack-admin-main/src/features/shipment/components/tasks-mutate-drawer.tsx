'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ShipmentItem } from '@/type/shipment'
import { toast } from 'sonner'
import http from '@/utils/http'
import {
  AGENTS_ENDPOINTS,
  FORWARDING_COMPANY_ENDPOINTS,
  MAWB_ENDPOINTS,
  SHIPMENT_ENDPOINT,
} from '@/constants/endpoint'
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
import { SelectDropdown } from '@/components/select-dropdown'
import { shipmentFormSchema, ShipmentForm } from '../data/schema'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: ShipmentItem
  onSuccess?: () => void
}

export function TasksMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  onSuccess,
}: Props) {
  const isUpdate = !!currentRow

  const [forwardingCompanies, setForwardingCompanies] = useState([])
  const [forwardingCompanyServices, setForwardingCompanyServices] = useState([])
  const [agents, setAgents] = useState([])
  const [mawbs, setMawbs] = useState<any[]>([])
  const [mawbSearchTerm, setMawbSearchTerm] = useState('')
  const [isComboboxOpen, setIsComboboxOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pastMilestones, setPastMilestones] = useState<any[]>([])

  const defaultValues: ShipmentForm = {
    id: currentRow?.id ?? '',
    status: currentRow?.status ?? 'PENDING',
    customerPhone: currentRow?.customerPhone ?? '',
    destinationCountryName: currentRow?.destinationCountryName ?? '',
    forwardingCompanyName: currentRow?.forwardingCompanyName ?? '',
    serviceName: currentRow?.serviceName ?? '',
    reciverName: currentRow?.reciverName ?? '',
    hawbNumber: currentRow?.hawbNumber ?? '',
    forwardingNumber: currentRow?.forwardingNumber ?? '',
    note: currentRow?.note ?? '',
    trackingMode: ((currentRow as any)?.trackingMode === 'API' ? 'API' : 'MANUAL') as any,
    agentId:
      typeof (currentRow as any)?.agentId === 'number'
        ? (currentRow as any).agentId
        : undefined,
    customerId:
      typeof currentRow?.customerId === 'number'
        ? currentRow.customerId
        : undefined,
    enquiryId:
      typeof currentRow?.enquiryId === 'number'
        ? currentRow.enquiryId
        : undefined,
    mawbId:
      typeof currentRow?.mawbId === 'number' ? currentRow.mawbId : undefined,
    forwardingCompanyId:
      typeof currentRow?.forwardingCompanyId === 'number'
        ? currentRow.forwardingCompanyId
        : undefined,
    serviceId:
      typeof currentRow?.serviceId === 'number'
        ? currentRow.serviceId
        : undefined,
    countryId:
      typeof currentRow?.countryId === 'number'
        ? currentRow.countryId
        : undefined,
  }

  const form = useForm<ShipmentForm>({
    resolver: zodResolver(shipmentFormSchema),
    defaultValues,
  })

  const watchStatus = form.watch('status')
  const watchForwardingCompany = form.watch('forwardingCompanyId')
  const watchAgent = form.watch('agentId')

  // Load dropdown options initially
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [fcRes, agentRes, mawbRes] = await Promise.all([
          http
            .get<any>(FORWARDING_COMPANY_ENDPOINTS.GET_ALL_COMPANIES)
            .then((res) => res.data),
          http
            .get<any>(AGENTS_ENDPOINTS.GET_ALL_AGENTS)
            .then((res) => res.data),
          http
            .get<any>(MAWB_ENDPOINTS.GET_ALL_MAWBS + '?limit=5')
            .then((res) => res.data),
        ])

        setForwardingCompanies(fcRes || [])
        setAgents(agentRes || [])
        setMawbs(mawbRes || [])

        // Preselect agent if editing existing shipment
        if (isUpdate && currentRow?.agent && Array.isArray(agentRes)) {
          const match = (agentRes as any[]).find(
            (a: any) => a?.code === (currentRow as any).agent
          )
          if (match) {
            form.setValue('agentId', match.id)
          }
        }
      } catch (error) {
        console.error('❌ Error fetching dropdown data:', error)
      }
    }

    fetchInitialData()
  }, [])

  // Fetch MAWBs based on search term
  useEffect(() => {
    if (!open) return
    const fetchMAWBs = async () => {
      try {
        const query = new URLSearchParams({ limit: '10' })
        if (mawbSearchTerm.trim()) {
          query.append('search', mawbSearchTerm.trim())
        }
        const response = await http.get<any>(
          `${MAWB_ENDPOINTS.GET_ALL_MAWBS}?${query.toString()}`
        )
        // Handling both cases: if API returns array directly or { data: array }
        const mawbData = response.data?.data || response.data || []
        setMawbs(Array.isArray(mawbData) ? mawbData : [])
      } catch (error) {
        console.error('❌ Error fetching MAWBs:', error)
      }
    }

    const timeoutId = setTimeout(fetchMAWBs, 300)
    return () => clearTimeout(timeoutId)
  }, [mawbSearchTerm, open])

  // Fetch specific shipment data when drawer opens
  useEffect(() => {
    const fetchShipmentData = async () => {
      if (open && isUpdate && currentRow?.id) {
        try {
          const response = await http.get<any>(
            SHIPMENT_ENDPOINT.GET_BY_ID(currentRow.id)
          )
          const data = response.data
          if (data) {
            form.reset({
              id: data.id?.toString() ?? '',
              status: data.status ?? 'PENDING',
              customerPhone: data.customerPhone ?? '',
              destinationCountryName: data.destinationCountryName ?? '',
              forwardingCompanyName: data.forwardingCompanyName ?? '',
              serviceName: data.serviceName ?? '',
              reciverName: data.reciverName ?? '',
              hawbNumber: data.hawbno ?? data.hawbNumber ?? '',
              forwardingNumber: data.forwardingNumber ?? '',
              note: data.note ?? '',
              agentId: data.agentId || undefined,
              customerId: data.customerId || undefined,
              enquiryId: data.enquiryId || undefined,
              mawbId: data.mawbId ?? undefined,
              forwardingCompanyId: data.forwardingCompanyId ?? undefined,
              serviceId: data.serviceId ?? undefined,
              countryId: data.countryId ?? undefined,
              trackingMode: data.trackingMode === 'API' ? 'API' : 'MANUAL',
            })
            // Update the ref to prevent HAWB re-generation if agentId is the same
            prevAgentIdRef.current = data.agentId || undefined
          }
        } catch (error) {
          console.error('❌ Error fetching shipment data:', error)
        }
      }
    }

    fetchShipmentData()
  }, [open, currentRow?.id, isUpdate, form])

  // Fetch memorized milestone notes for this shipment
  useEffect(() => {
    const fetchMilestones = async () => {
      if (open && isUpdate && currentRow?.id) {
        try {
          const res = await http.get<any>(`/api/tracking/${currentRow.id}`)
          const data = res?.data || res
          if (data && Array.isArray(data.checkpoints)) {
            const notes = data.checkpoints.filter(
              (cp: any) => cp.activity && (cp.source === 'MANUAL_NOTE' || cp.activity !== cp.status)
            )
            setPastMilestones(notes)
          }
        } catch (err) {
          console.warn('Could not fetch past milestones:', err)
          setPastMilestones([])
        }
      } else {
        setPastMilestones([])
      }
    }

    fetchMilestones()
  }, [open, currentRow?.id, isUpdate])

  // Fetch forwarding company services when company is selected
  useEffect(() => {
    const fetchForwardingCompanyServices = async () => {
      if (watchForwardingCompany) {
        try {
          const response = await http.get<any>(
            FORWARDING_COMPANY_ENDPOINTS.GET_SERVICES_BY_COMPANY_ID(
              watchForwardingCompany
            )
          )
          setForwardingCompanyServices(response.data || [])
          form.setValue('serviceId', undefined)
        } catch (error) {
          console.error('❌ Error fetching forwarding company services:', error)
          setForwardingCompanyServices([])
        }
      } else {
        setForwardingCompanyServices([])
      }
    }

    fetchForwardingCompanyServices()
  }, [watchForwardingCompany, form])

  // Trigger hook on status change
  useEffect(() => {
    if (watchStatus) {
      fetch(`/api/status-update-hook?newStatus=${watchStatus}`)
    }
  }, [watchStatus])

  // HAWB logic (only fetch if not already set)
  const prevAgentIdRef = useRef<number | undefined>(undefined)
  const isInitialMountRef = useRef(true)

  // Reset initial mount flag when drawer opens
  useEffect(() => {
    if (open) {
      isInitialMountRef.current = true
      // Initialize prevAgentIdRef with current agentId if HAWB exists
      const existingHawb = currentRow?.hawbNumber?.trim()
      const currentAgentId =
        typeof (currentRow as any)?.agentId === 'number'
          ? (currentRow as any).agentId
          : typeof currentRow?.customerId === 'number'
            ? currentRow.customerId
            : undefined

      if (existingHawb && existingHawb !== '' && existingHawb !== 'N/A') {
        // If HAWB exists, set prevAgentIdRef to prevent fetching on initial mount
        prevAgentIdRef.current = currentAgentId as any
      } else {
        prevAgentIdRef.current = undefined
      }
    }
  }, [open, currentRow])

  useEffect(() => {
    const fetchHawbForAgent = async () => {
      try {
        const previousAgentId = prevAgentIdRef.current
        const existingHawb = currentRow?.hawbNumber?.trim()

        // ✅ On initial mount: if HAWB already exists from API, skip fetching
        if (isInitialMountRef.current) {
          if (existingHawb && existingHawb !== '' && existingHawb !== 'N/A') {
            // Set the ref to current agent to prevent fetching on initial mount
            prevAgentIdRef.current = watchAgent as any
            isInitialMountRef.current = false
            return
          }
          // For new shipments or when no HAWB exists, allow fetching
          isInitialMountRef.current = false
        }

        // ✅ Skip if no agent selected
        if (!watchAgent) {
          form.setValue('hawbNumber', '')
          prevAgentIdRef.current = watchAgent as any
          return
        }

        // ✅ Fetch HAWB when agent changes (user manually changes it)
        // For new shipments: fetch when agent is selected (previousAgentId is undefined)
        // For updates: fetch only when agent actually changes (previousAgentId !== watchAgent)
        if (previousAgentId !== watchAgent) {
          const response = await http.get(
            SHIPMENT_ENDPOINT.GET_AGENT_SHIPMENT_HAWBNO(watchAgent)
          )

          const hawbno = (response as any)?.hawbno
          if (hawbno) {
            form.setValue('hawbNumber', hawbno, {
              shouldDirty: true,
              shouldTouch: true,
            })
            toast.success('HAWB number generated successfully')
          } else {
            toast.warning('No HAWB number received from server')
          }

          // Optional: sync agent if backend returns code
          const returnedAgentCode =
            (response as any)?.agent || (response as any)?.agentCode
          if (returnedAgentCode && Array.isArray(agents) && agents.length > 0) {
            const matchedAgent = (agents as any[]).find(
              (a: any) => a?.code === returnedAgentCode
            )
            if (matchedAgent && matchedAgent.id !== watchAgent) {
              form.setValue('agentId', matchedAgent.id)
            }
          }
        }

        prevAgentIdRef.current = watchAgent as any
      } catch (error) {
        console.error('❌ Error fetching HAWB number:', error)
        form.setValue('hawbNumber', '')
      }
    }

    fetchHawbForAgent()
  }, [watchAgent, form, agents, currentRow])

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      console.log('Submitting shipment data:', data)

      if (data.agentId && !data.customerId) {
        data.customerId = data.agentId
      }

      if (isUpdate && currentRow?.id) {
        const { customerPhone, id, ...updatePayload } = data
        const response = await http.put(
          `${SHIPMENT_ENDPOINT.ALL_SHIPMENTS}/${currentRow.id}`,
          updatePayload
        )

        if (response) {
          toast.success('Shipment updated successfully!')
          onSuccess?.()
        }
      } else {
        const response = await http.post(SHIPMENT_ENDPOINT.ALL_SHIPMENTS, data)
        if (response) {
          toast.success('Shipment created successfully!')
          onSuccess?.()
        }
      }

      onOpenChange(false)
    } catch (error) {
      console.error('❌ Error submitting shipment:', error)
      toast.error('Failed to save shipment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className='flex h-screen max-h-screen flex-col overflow-hidden'
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className='relative text-left'>
          <SheetTitle>{isUpdate ? 'Update' : 'Create'} Shipment</SheetTitle>
          <SheetDescription>
            {isUpdate
              ? 'Update the shipment details below.'
              : 'Create a new shipment by filling in the form below.'}
          </SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto px-4 py-2'>
          {isUpdate && (
            <div className='bg-muted/30 mb-6 space-y-4 rounded-md border p-4 text-sm'>
              <div className='grid grid-cols-2 gap-x-4 gap-y-3'>
                <div>
                  <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
                    Customer Name
                  </p>
                  <p className='text-foreground/90 mt-0.5 font-semibold'>
                    {currentRow?.senderName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
                    Destination
                  </p>
                  <p className='text-foreground/90 mt-0.5 font-semibold'>
                    {currentRow?.destinationCountryName || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
                    Reciver Name
                  </p>
                  <p className='text-foreground/90 mt-0.5 font-semibold'>
                    {currentRow?.reciverName ||
                      currentRow?.reciverName ||
                      'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-muted-foreground text-[10px] font-medium tracking-wider uppercase'>
                    Organization
                  </p>
                  <p className='text-foreground/90 mt-0.5 font-semibold'>
                    {currentRow?.senderOrganization || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-5'>
              {!isUpdate && (
                <FormField
                  name='customerPhone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Phone</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter customer phone' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                name='agentId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent</FormLabel>
                    <SelectDropdown
                      defaultValue={
                        field.value ? field.value.toString() : 'none'
                      }
                      onValueChange={(val) => {
                        // Handle empty/clear selection
                        if (val === '' || val === 'none') {
                          field.onChange(undefined)
                        } else {
                          field.onChange(Number(val))
                        }
                      }}
                      isControlled
                      placeholder='Select an agent (optional)'
                      items={[
                        { label: 'None', value: 'none' },
                        ...agents.map((agent: any) => ({
                          label: agent.code + ' - ' + agent.companyName,
                          value: agent.id.toString(),
                        })),
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='hawbNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HAWB Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='HAWB number will be auto-generated'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='status'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      items={[
                        { label: 'Enquiry Generated (Pending)', value: 'PENDING' },
                        { label: 'Picked Up', value: 'PICKED_UP' },
                        {
                          label: 'Shipment Created',
                          value: 'SHIPMENT_CREATED',
                        },
                        { label: 'In Transit', value: 'IN_TRANSIT' },
                        { label: 'Arrived At Hub', value: 'ARRIVED_AT_HUB' },
                        { label: 'Carrier Scanned', value: 'CARRIER_SCANNED' },
                        { label: 'Delivered', value: 'DELIVERED' },
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='trackingMode'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tracking Mode</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value || 'MANUAL'}
                      onValueChange={(val) => field.onChange(val)}
                      items={[
                        { label: 'Manual (System Defined)', value: 'MANUAL' },
                        { label: 'By API (External Carrier Scans)', value: 'API' },
                      ]}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='forwardingCompanyId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forwarding Company</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value?.toString()}
                      onValueChange={(val) => field.onChange(Number(val))}
                      items={forwardingCompanies.map((fc: any) => ({
                        label: fc.name,
                        value: fc.id.toString(),
                      }))}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='forwardingNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forwarding Number</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter forwarding number' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name='note'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milestone / Checkpoint Note</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter milestone note (e.g. Cleared London customs / In transit on cargo flight)' {...field} />
                    </FormControl>
                    <p className='text-[11px] text-muted-foreground'>
                      Notes saved here are memorized and recorded in the tracking history as milestone events.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {pastMilestones.length > 0 && (
                <div className='rounded-lg border bg-muted/40 p-3 space-y-2 text-xs'>
                  <div className='flex items-center justify-between'>
                    <span className='font-bold uppercase tracking-wider text-[10px] text-muted-foreground'>
                      Memorized Milestone Notes ({pastMilestones.length})
                    </span>
                  </div>
                  <div className='space-y-1.5 max-h-36 overflow-y-auto pr-1'>
                    {pastMilestones.map((item, idx) => (
                      <div
                        key={idx}
                        className='flex items-start justify-between gap-2 p-2 rounded-md bg-background border border-border/70 hover:border-primary/50 transition-colors'
                      >
                        <div className='space-y-0.5 text-left flex-1 min-w-0'>
                          <div className='flex items-center gap-1.5 flex-wrap'>
                            <span className='font-semibold text-foreground text-[11px] leading-tight'>
                              {item.activity}
                            </span>
                            {item.status && (
                              <span className='text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground font-mono'>
                                {item.status}
                              </span>
                            )}
                          </div>
                          <p className='text-[10px] text-muted-foreground'>
                            {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Past update'}
                            {item.location ? ` • ${item.location}` : ''}
                          </p>
                        </div>
                        <button
                          type='button'
                          onClick={() => form.setValue('note', item.activity, { shouldDirty: true, shouldTouch: true })}
                          className='text-[10px] text-primary hover:underline font-medium shrink-0 pt-0.5'
                        >
                          Use note
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <FormField
                name='serviceId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <SelectDropdown
                      defaultValue={field.value?.toString()}
                      onValueChange={(val) => field.onChange(Number(val))}
                      items={forwardingCompanyServices.map((service: any) => ({
                        label: service.name,
                        value: service.id.toString(),
                      }))}
                      disabled={!watchForwardingCompany}
                      placeholder={
                        watchForwardingCompany
                          ? 'Select service'
                          : 'Select forwarding company first'
                      }
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name='mawbId'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>MAWB</FormLabel>
                    <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant='outline'
                            role='combobox'
                            className={cn(
                              'w-full justify-between font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value
                              ? (() => {
                                  const selected = mawbs.find(
                                    (m) => m.id === field.value
                                  )
                                  return selected
                                    ? `${selected.mawbNumber} - ${selected.airlineName || 'N/A'}`
                                    : 'Selected MAWB'
                                })()
                              : 'Select MAWB'}
                            <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-[460px] p-0' align='start'>
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder='Search MAWB...'
                            value={mawbSearchTerm}
                            onValueChange={setMawbSearchTerm}
                          />
                          <CommandList>
                            <CommandEmpty>No matching MAWB found.</CommandEmpty>
                            <CommandGroup>
                              {mawbs.map((mawb: any) => (
                                <CommandItem
                                  value={mawb.id.toString()}
                                  key={mawb.id}
                                  onSelect={() => {
                                    field.onChange(
                                      field.value === mawb.id
                                        ? undefined
                                        : mawb.id
                                    )
                                    setIsComboboxOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      mawb.id === field.value
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                  {mawb.mawbNumber} - {mawb.airlineName || 'N/A'}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <SheetFooter className='gap-2 pt-4'>
          <SheetClose asChild>
            <Button
              variant='outline'
              disabled={isSubmitting}
              onClick={() => {
                onOpenChange(false)
                // Refresh the page so the shipment list reflects deletions/changes
                if (typeof window !== 'undefined') {
                  window.location.reload()
                }
              }}
            >
              Cancel
            </Button>
          </SheetClose>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isUpdate ? 'Update' : 'Create'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
