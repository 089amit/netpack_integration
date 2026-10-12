import { useState, useEffect } from 'react'
import http from '@/utils/http'
import { SHIPMENT_ENDPOINT, CUSTOM_MANIFEST_ENDPOINTS } from '@/constants/endpoint'
import { ShipmentItem } from '@/type/shipment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Check, Globe } from 'lucide-react'

export interface HubItem {
  id: number
  code: string
  name: string
}

interface CustomClearanceDialogProps {
  open: boolean
  onClose: () => void
  selectedShipments: ShipmentItem[]
  onSuccess: () => void
}

export function CustomClearanceDialog({
  open,
  onClose,
  selectedShipments,
  onSuccess,
}: CustomClearanceDialogProps) {
  const [hubs, setHubs] = useState<HubItem[]>([])
  const [selectedHub, setSelectedHub] = useState<string>('')
  const [isAddingHub, setIsAddingHub] = useState(false)
  const [newHubCode, setNewHubCode] = useState('')
  const [newHubName, setNewHubName] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchHubs = async () => {
    try {
      const res = await http.get<HubItem[]>(CUSTOM_MANIFEST_ENDPOINTS.GET_HUBS)
      if (Array.isArray(res)) {
        setHubs(res)
        if (!selectedHub && res.length > 0) {
          setSelectedHub(res[0].code)
        }
      }
    } catch (err) {
      console.error('Failed to load custom manifest hubs:', err)
      // Fallback defaults
      setHubs([
        { id: 1, code: 'AUS', name: 'Australia Gateway' },
        { id: 2, code: 'LHR', name: 'London Heathrow Hub' },
        { id: 3, code: 'DXB', name: 'Dubai Hub' },
      ])
      if (!selectedHub) setSelectedHub('AUS')
    }
  }

  useEffect(() => {
    if (open) {
      fetchHubs()
      setIsAddingHub(false)
      setNewHubCode('')
      setNewHubName('')
    }
  }, [open])

  const handleAddNewHub = async () => {
    const code = newHubCode.trim().toUpperCase()
    if (!code) {
      toast.error('Please enter a hub code (e.g. AUS, FRA, USA)')
      return
    }
    setLoading(true)
    try {
      await http.post<HubItem>(CUSTOM_MANIFEST_ENDPOINTS.CREATE_HUB, {
        code,
        name: newHubName.trim() || `${code} Hub`,
      })
      toast.success(`Custom clearance hub ${code} created successfully`)
      await fetchHubs()
      setSelectedHub(code)
      setIsAddingHub(false)
      setNewHubCode('')
      setNewHubName('')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to create hub')
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!selectedHub) {
      toast.error('Please select a custom manifest hub')
      return
    }
    if (selectedShipments.length === 0) {
      toast.error('No shipments selected')
      return
    }
    setLoading(true)
    try {
      const ids = selectedShipments.map((s) => Number(s.id))
      await http.post(SHIPMENT_ENDPOINT.BULK_ASSIGN_CUSTOM_MANIFEST, {
        ids,
        customManifestHub: selectedHub,
      })
      toast.success(
        `Assigned ${ids.length} shipment(s) to Custom Manifest ${selectedHub}`
      )
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Failed to assign custom manifest hub')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <Globe className='h-5 w-5 text-amber-600' />
            <DialogTitle>Assign Custom Clearance Hub</DialogTitle>
          </div>
          <DialogDescription>
            Group shipments under a customs clearance gateway hub (e.g. AUS, LHR, DXB)
            before airline MAWB generation.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label className='text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Select Custom Manifest Hub
            </Label>
            <div className='flex items-center gap-2'>
              <Select value={selectedHub} onValueChange={setSelectedHub}>
                <SelectTrigger className='flex-1'>
                  <SelectValue placeholder='Select custom manifest' />
                </SelectTrigger>
                <SelectContent>
                  {hubs.map((hub) => (
                    <SelectItem key={hub.code} value={hub.code}>
                      <span className='font-bold text-amber-700 dark:text-amber-400 mr-2'>
                        {hub.code}
                      </span>
                      <span className='text-muted-foreground text-xs'>
                        {hub.name}
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value='NONE'>
                    <span className='text-red-500 font-medium'>
                      Clear / Unassign Hub
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                type='button'
                variant='outline'
                size='icon'
                onClick={() => setIsAddingHub(!isAddingHub)}
                title='Add new custom manifest hub'
                className='shrink-0'
              >
                <Plus className={`h-4 w-4 transition-transform ${isAddingHub ? 'rotate-45' : ''}`} />
              </Button>
            </div>
          </div>

          {isAddingHub && (
            <div className='rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20 space-y-3'>
              <div className='text-xs font-semibold text-amber-800 dark:text-amber-300'>
                Add New Clearance Gateway
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    Hub Code (e.g. AUS, USA)
                  </Label>
                  <Input
                    placeholder='Code'
                    value={newHubCode}
                    onChange={(e) => setNewHubCode(e.target.value.toUpperCase())}
                    className='h-8 text-xs font-bold uppercase'
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label className='text-[11px] text-muted-foreground'>
                    Hub Name / Gateway
                  </Label>
                  <Input
                    placeholder='e.g. Frankfurt Hub'
                    value={newHubName}
                    onChange={(e) => setNewHubName(e.target.value)}
                    className='h-8 text-xs'
                  />
                </div>
              </div>
              <Button
                type='button'
                size='sm'
                className='w-full h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white'
                onClick={handleAddNewHub}
                disabled={loading || !newHubCode.trim()}
              >
                <Check className='mr-1 h-3.5 w-3.5' /> Save Hub
              </Button>
            </div>
          )}

          <div className='rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground'>
            <span className='font-semibold text-foreground'>
              {selectedShipments.length}
            </span>{' '}
            shipment(s) selected for custom manifest assignment.
          </div>
        </div>

        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={loading || !selectedHub}
            className='bg-amber-600 hover:bg-amber-700 text-white'
          >
            {loading ? 'Assigning...' : `Assign to Custom Manifest ${selectedHub !== 'NONE' ? selectedHub : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
