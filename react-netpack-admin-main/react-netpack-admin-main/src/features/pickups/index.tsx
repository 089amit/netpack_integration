import { useEffect, useState, useMemo, Fragment } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Truck,
  Scale,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Search as SearchIcon,
  RefreshCw,
  Camera,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Navigation,
  Eye,
  LayoutGrid,
  List,
} from 'lucide-react'
import { useCheckRole } from '@/utils/role-utils'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { PICKUP_ENDPOINTS } from '@/constants/endpoint'
import { WeighPickupModal } from './components/weigh-pickup-modal'
import { ShipmentTrackingDialog } from '@/features/tasks/components/shipment-tracking-dialog'

export default function PickupsDashboard() {
  const isUserOrCustomer = useCheckRole('USER', 'CUSTOMER')
  const navigate = useNavigate()

  const [pickups, setPickups] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [stats, setStats] = useState<any>({
    pendingCount: 0,
    pickedUpCount: 0,
    totalWeightToday: 0,
    totalBoxesToday: 0,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeTab, setActiveTab] = useState<string>('PENDING')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  // Modals state
  const [selectedPickup, setSelectedPickup] = useState<any>(null)
  const [isWeighModalOpen, setIsWeighModalOpen] = useState<boolean>(false)
  const [trackingDialogOpen, setTrackingDialogOpen] = useState<boolean>(false)
  const [trackingItem, setTrackingItem] = useState<any>(null)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([])
  const [galleryIndex, setGalleryIndex] = useState<number>(0)
  const [galleryTitle, setGalleryTitle] = useState<string>('')
  const [expandedItemIds, setExpandedItemIds] = useState<number[]>([])

  const toggleExpandItem = (id: number) => {
    setExpandedItemIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Helper to extract clean array of all photo URLs
  const getPickupPhotos = (pickup: any): string[] => {
    if (Array.isArray(pickup?.weightProofImages) && pickup.weightProofImages.length > 0) {
      return pickup.weightProofImages.filter(Boolean)
    }
    if (typeof pickup?.weightProofImageUrl === 'string' && pickup.weightProofImageUrl.trim()) {
      return pickup.weightProofImageUrl
        .split(',')
        .map((u: string) => u.trim())
        .filter(Boolean)
    }
    return []
  }

  const handleOpenPhotoGallery = (pickup: any) => {
    const photos = getPickupPhotos(pickup)
    if (photos.length > 0) {
      setGalleryPhotos(photos)
      setGalleryIndex(0)
      setGalleryTitle(`${pickup.trackingNumber || 'Consignment'} - Scale & Box Proof Photos`)
    }
  }

  const fetchPickupsData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

      // 1. Fetch Stats
      const statsRes = await fetch(PICKUP_ENDPOINTS.STATS, { headers }).then(
        (r) => (r.ok ? r.json() : null)
      )
      if (statsRes) setStats(statsRes)

      // 2. Fetch Pickups
      const listRes = await fetch(
        `${PICKUP_ENDPOINTS.LIST}?status=${activeTab}&limit=50`,
        { headers }
      ).then((r) => (r.ok ? r.json() : null))

      if (listRes?.pickups) {
        setPickups(listRes.pickups)
      } else {
        setPickups([])
      }
    } catch (err: any) {
      toast.error('Failed fetching pickup assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPickupsData()
  }, [activeTab])

  // Filtered by search query
  const filteredPickups = useMemo(() => {
    if (!searchQuery.trim()) return pickups
    const q = searchQuery.toLowerCase()
    return pickups.filter((p) => {
      const trackMatch = p.trackingNumber?.toLowerCase().includes(q)
      const senderMatch = p.senderName?.toLowerCase().includes(q)
      const phoneMatch = p.senderPhone?.toLowerCase().includes(q)
      const receiverMatch = p.receiverName?.toLowerCase().includes(q)
      const cityMatch = p.senderCity?.toLowerCase().includes(q)
      return trackMatch || senderMatch || phoneMatch || receiverMatch || cityMatch
    })
  }, [pickups, searchQuery])

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPickups.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredPickups.map((p) => p.id))
    }
  }

  const handleBatchMarkPickedUp = async () => {
    if (selectedIds.length === 0) return
    const toastId = toast.loading(`Updating ${selectedIds.length} pickups to Picked Up...`)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(PICKUP_ENDPOINTS.BATCH_STATUS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          ids: selectedIds,
          pickupIds: selectedIds,
          status: 'PICKED_UP',
        }),
      })
      if (!res.ok) {
        let errMsg = 'Failed to update pickups status'
        try {
          const errData = await res.json()
          errMsg = errData.detail || errData.message || errMsg
        } catch {}
        throw new Error(errMsg)
      }
      toast.success(`Successfully marked ${selectedIds.length} pickups as Picked Up!`, { id: toastId })
      setSelectedIds([])
      fetchPickupsData()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update pickups status', { id: toastId })
    }
  }

  const handleQuickMarkPickedUp = async (pickupId: number) => {
    const toastId = toast.loading('Marking as Picked Up...')
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(PICKUP_ENDPOINTS.UPDATE_STATUS(pickupId), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: 'PICKED_UP',
        }),
      })
      if (!res.ok) {
        throw new Error('Failed to update pickup status')
      }
      toast.success('Pickup marked as Picked Up!', { id: toastId })
      fetchPickupsData()
    } catch (err: any) {
      toast.error('Failed to update pickup status', { id: toastId })
    }
  }

  const handleOpenWeighModal = (pickup: any) => {
    setSelectedPickup(pickup)
    setIsWeighModalOpen(true)
  }

  const handleOpenTrackingDialog = (pickup: any) => {
    setTrackingItem(pickup)
    setTrackingDialogOpen(true)
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <Truck className='h-5 w-5 text-primary' />
          <h1 className='text-lg font-semibold tracking-tight'>
            {isUserOrCustomer
              ? 'My Pickups & Consignments'
              : 'Pickup Operations & Warehouse Intake'}
          </h1>
        </div>
        <div className='ml-auto flex items-center space-x-3'>
          {isUserOrCustomer && (
            <Button
              size='sm'
              onClick={() => navigate({ to: '/tasks' })}
              className='gap-1.5 text-xs font-semibold'
            >
              <Truck className='h-3.5 w-3.5' />
              <span>Request Pickup</span>
            </Button>
          )}
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='space-y-5 p-4 sm:p-6'>
        {/* Top Metrics Row */}
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
          <Card className='border-amber-200/60 bg-gradient-to-br from-amber-50/50 to-background dark:border-amber-900/40 dark:from-amber-950/20'>
            <CardHeader className='p-4 pb-2'>
              <CardDescription className='text-xs font-medium text-amber-700 dark:text-amber-400'>
                {isUserOrCustomer ? 'Awaiting Pickup' : 'Awaiting Collection'}
              </CardDescription>
              <CardTitle className='text-2xl font-black text-amber-600 dark:text-amber-400'>
                {loading ? <Skeleton className='h-8 w-16' /> : stats.pendingCount}
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3 pt-0 text-[11px] text-muted-foreground'>
              {isUserOrCustomer ? 'Your shipments pending pickup' : 'Enquiries pending pickup'}
            </CardContent>
          </Card>

          <Card className='border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-background dark:border-emerald-900/40 dark:from-emerald-950/20'>
            <CardHeader className='p-4 pb-2'>
              <CardDescription className='text-xs font-medium text-emerald-700 dark:text-emerald-400'>
                {isUserOrCustomer ? 'Collected & Verified' : 'Warehouse Intake'}
              </CardDescription>
              <CardTitle className='text-2xl font-black text-emerald-600 dark:text-emerald-400'>
                {loading ? <Skeleton className='h-8 w-16' /> : stats.pickedUpCount}
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3 pt-0 text-[11px] text-muted-foreground'>
              {isUserOrCustomer ? 'Picked up & in warehouse' : 'Picked up & verified'}
            </CardContent>
          </Card>

          <Card className='border-blue-200/60 bg-gradient-to-br from-blue-50/50 to-background dark:border-blue-900/40 dark:from-blue-950/20'>
            <CardHeader className='p-4 pb-2'>
              <CardDescription className='text-xs font-medium text-blue-700 dark:text-blue-400'>
                {isUserOrCustomer ? 'Total Consignment Weight' : "Today's Weight Intake"}
              </CardDescription>
              <CardTitle className='text-2xl font-black text-blue-600 dark:text-blue-400'>
                {loading ? <Skeleton className='h-8 w-16' /> : `${stats.totalWeightToday} kg`}
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3 pt-0 text-[11px] text-muted-foreground'>
              {isUserOrCustomer ? 'Total verified weight' : 'Processed on warehouse scale'}
            </CardContent>
          </Card>

          <Card className='border-violet-200/60 bg-gradient-to-br from-violet-50/50 to-background dark:border-violet-900/40 dark:from-violet-950/20'>
            <CardHeader className='p-4 pb-2'>
              <CardDescription className='text-xs font-medium text-violet-700 dark:text-violet-400'>
                {isUserOrCustomer ? 'Total Boxes' : "Today's Boxes Collected"}
              </CardDescription>
              <CardTitle className='text-2xl font-black text-violet-600 dark:text-violet-400'>
                {loading ? <Skeleton className='h-8 w-16' /> : stats.totalBoxesToday}
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3 pt-0 text-[11px] text-muted-foreground'>
              {isUserOrCustomer ? 'Individual packages booked' : 'Individual parcels handled'}
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls & Search */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full sm:w-auto'
          >
            <TabsList className='grid w-full grid-cols-3 sm:w-auto'>
              <TabsTrigger value='PENDING' className='gap-1.5 text-xs'>
                <Clock className='h-3.5 w-3.5 text-amber-500' />
                <span>{isUserOrCustomer ? 'Pending Collection' : 'Pending Pickups'}</span>
              </TabsTrigger>
              <TabsTrigger value='PICKED_UP' className='gap-1.5 text-xs'>
                <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
                <span>{isUserOrCustomer ? 'Picked Up & Verified' : 'Picked Up & Weighed'}</span>
              </TabsTrigger>
              <TabsTrigger value='ALL' className='text-xs'>
                {isUserOrCustomer ? 'All My Shipments' : 'All Shipments'}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className='flex items-center gap-2'>
            <div className='relative flex-1 sm:w-64'>
              <SearchIcon className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                type='text'
                placeholder='Search sender, phone, tracking...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='h-9 pl-8 text-xs'
              />
            </div>

            <div className='flex items-center rounded-md border p-0.5 bg-muted/40'>
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size='icon'
                onClick={() => setViewMode('cards')}
                className='h-8 w-8'
                title='Cards View (Mobile & Field)'
              >
                <LayoutGrid className='h-4 w-4' />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size='icon'
                onClick={() => setViewMode('table')}
                className='h-8 w-8'
                title='Table View'
              >
                <List className='h-4 w-4' />
              </Button>
            </div>

            <Button
              variant='outline'
              size='icon'
              onClick={fetchPickupsData}
              disabled={loading}
              className='h-9 w-9 shrink-0'
              title='Refresh list'
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Batch Action Toolbar */}
        {selectedIds.length > 0 && !isUserOrCustomer && (
          <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/10 p-3 shadow-xs animate-in fade-in'>
            <div className='flex items-center gap-2'>
              <Badge variant='default' className='font-mono'>
                {selectedIds.length} Selected
              </Badge>
              <span className='text-xs font-medium text-foreground'>
                of {filteredPickups.length} pickups
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => setSelectedIds([])}
                className='h-8 text-xs'
              >
                Clear Selection
              </Button>
              <Button
                size='sm'
                onClick={handleBatchMarkPickedUp}
                className='h-8 gap-1.5 text-xs font-semibold'
              >
                <CheckCircle2 className='h-3.5 w-3.5' />
                <span>Mark Selected as Picked Up</span>
              </Button>
            </div>
          </div>
        )}

        {/* Content View: Cards or Table */}
        {loading ? (
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className='p-4 space-y-3'>
                <Skeleton className='h-6 w-3/4' />
                <Skeleton className='h-4 w-1/2' />
                <Skeleton className='h-16 w-full' />
                <Skeleton className='h-9 w-full' />
              </Card>
            ))}
          </div>
        ) : filteredPickups.length === 0 ? (
          <div className='flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-muted/20'>
            <Truck className='h-12 w-12 text-muted-foreground/50' />
            <h3 className='mt-3 text-base font-semibold'>No Pickups Found</h3>
            <p className='mt-1 max-w-sm text-xs text-muted-foreground'>
              {searchQuery
                ? 'No pickup tasks matched your search query.'
                : activeTab === 'PENDING'
                ? 'Great news! All scheduled pickups have been collected and weighed.'
                : 'No pickup records available under this filter.'}
            </p>
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards Grid View */
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {filteredPickups.map((pickup) => {
              const statusStr = (pickup.status || '').toUpperCase()
              const isPastPickup =
                ['PICKED_UP', 'PACKED', 'SHIPMENT_CREATED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'CARRIER_SCANNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(statusStr) ||
                !!pickup.weightProofImageUrl
              const isPickedUpOnly = statusStr === 'PICKED_UP' || !!pickup.weightProofImageUrl
              const isPickedUp = isPastPickup

              const getBadgeConfig = () => {
                if (statusStr === 'DELIVERED') return { label: 'DELIVERED', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' }
                if (statusStr === 'CARRIER_SCANNED' || statusStr === 'OUT_FOR_DELIVERY') return { label: 'CARRIER SCANNED', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' }
                if (statusStr === 'IN_TRANSIT') return { label: 'IN TRANSIT', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' }
                if (statusStr === 'ARRIVED_AT_HUB') return { label: 'ARRIVED AT HUB', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' }
                if (statusStr === 'SHIPMENT_CREATED') return { label: 'SHIPMENT CREATED', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' }
                if (statusStr === 'PACKED') return { label: 'PACKED', cls: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' }
                if (isPickedUpOnly) return { label: 'PICKED UP', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' }
                return { label: 'AWAITING PICKUP', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' }
              }

              const badgeCfg = getBadgeConfig()

              return (
                <Card
                  key={pickup.id}
                  className={`flex flex-col justify-between transition-all hover:shadow-md ${
                    isPastPickup
                      ? 'border-emerald-500/30 dark:border-emerald-500/20'
                      : 'border-amber-500/40 dark:border-amber-500/30'
                  }`}
                >
                  <CardHeader className='p-4 pb-2.5'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex items-center gap-2'>
                        {!isUserOrCustomer && (
                          <Checkbox
                            checked={selectedIds.includes(pickup.id)}
                            onCheckedChange={() => handleToggleSelect(pickup.id)}
                            aria-label={`Select pickup ${pickup.trackingNumber}`}
                            className='mt-0.5'
                          />
                        )}
                        <div>
                          <Badge
                            variant='outline'
                            className='font-mono text-xs font-bold tracking-wider'
                          >
                            {pickup.trackingNumber}
                          </Badge>
                          {pickup.hawbNumber && (
                            <span className='ml-1.5 text-[11px] font-mono text-muted-foreground'>
                              HAWB: {pickup.hawbNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge className={badgeCfg.cls}>
                        {badgeCfg.label}
                      </Badge>
                    </div>

                    <CardTitle className='mt-2 text-base font-bold flex items-center justify-between'>
                      <span>{pickup.senderName}</span>
                      {pickup.senderPhone && (
                        <a
                          href={`tel:${pickup.senderPhone}`}
                          className='inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20'
                          title='Call Customer'
                        >
                          <Phone className='h-3 w-3' />
                          <span>{pickup.senderPhone}</span>
                        </a>
                      )}
                    </CardTitle>
                    <CardDescription className='text-xs'>
                      To: <strong className='text-foreground'>{pickup.receiverName || 'Consignee'}</strong> ({pickup.receiverCountry})
                    </CardDescription>
                  </CardHeader>

                  <CardContent className='p-4 pt-1 space-y-3 text-xs'>
                    {/* Pickup Address & Multi-Location Stops */}
                    <div className='flex flex-col gap-1.5 text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/60'>
                      {pickup.pickupLocations && pickup.pickupLocations.length > 0 ? (
                        <div className='space-y-2'>
                          <div className='flex items-center justify-between text-[11px] font-bold text-primary'>
                            <span>📍 Pickup Itinerary ({pickup.pickupLocations.length} Stop{pickup.pickupLocations.length > 1 ? 's' : ''})</span>
                            {pickup.pickupLocations.length > 1 && (
                              <Badge variant='outline' className='text-[9px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5 font-bold'>
                                Multi-Stop
                              </Badge>
                            )}
                          </div>
                          {pickup.pickupLocations.map((loc: any, lIdx: number) => (
                            <div key={lIdx} className='p-2 rounded-lg bg-background border border-border/80 space-y-1'>
                              <div className='flex items-start justify-between gap-1.5'>
                                <div className='flex items-start gap-1.5 min-w-0 flex-1'>
                                  <span className='shrink-0 rounded bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5 mt-0.5'>
                                    Stop #{lIdx + 1}
                                  </span>
                                  <div className='font-semibold leading-snug text-foreground text-xs'>
                                    {loc.location}
                                  </div>
                                </div>
                                {loc.location && (
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.location)}`}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='shrink-0'
                                  >
                                    <Button size='sm' variant='secondary' className='h-6 px-2 text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30'>
                                      <Navigation className='h-3 w-3 mr-1 text-primary' /> Maps
                                    </Button>
                                  </a>
                                )}
                              </div>
                              {loc.phoneNumber && (
                                <div className='text-[10px] text-muted-foreground'>
                                  Tel: <a href={`tel:${loc.phoneNumber}`} className='text-primary font-medium hover:underline'>{loc.phoneNumber}</a>
                                </div>
                              )}
                              {loc.note && (
                                <div className='text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/10 px-2 py-1 rounded font-medium border border-amber-500/20'>
                                  <strong>Note:</strong> {loc.note}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className='flex items-start justify-between gap-1.5'>
                          <div className='flex items-start gap-1.5 min-w-0 flex-1'>
                            <MapPin className='h-4 w-4 shrink-0 text-primary mt-0.5' />
                            <span className='text-foreground font-medium text-xs leading-snug'>
                              {pickup.senderAddress}
                            </span>
                          </div>
                          {pickup.senderAddress && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup.senderAddress)}`}
                              target='_blank'
                              rel='noreferrer'
                              className='shrink-0'
                            >
                              <Button size='sm' variant='secondary' className='h-6 px-2 text-[10px] font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30'>
                                <Navigation className='h-3 w-3 mr-1 text-primary' /> Maps
                              </Button>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Weight & Boxes Specs */}
                    <div className='grid grid-cols-2 gap-2 rounded-lg border bg-background p-2.5'>
                      <div>
                        <div className='text-[10px] text-muted-foreground uppercase'>
                          Box Count
                        </div>
                        <div className='font-bold text-foreground'>
                          {pickup.noOfBox || 1} {pickup.noOfBox === 1 ? 'Box' : 'Boxes'}
                        </div>
                      </div>
                      <div>
                        <div className='text-[10px] text-muted-foreground uppercase'>
                          {isPickedUp ? 'Verified Weight' : 'Declared Weight'}
                        </div>
                        <div className='font-bold text-foreground flex items-center gap-1'>
                          <span>{pickup.weight ? `${pickup.weight} kg` : 'Pending'}</span>
                          {isPickedUp && (
                            <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
                          )}
                        </div>
                      </div>

                      {pickup.volumetricWeight && (
                        <div>
                          <div className='text-[10px] text-muted-foreground uppercase'>
                            Volumetric Wt
                          </div>
                          <div className='font-bold text-blue-600 dark:text-blue-400'>
                            {pickup.volumetricWeight} kg
                          </div>
                        </div>
                      )}

                      {pickup.chargeableWeight && (
                        <div>
                          <div className='text-[10px] text-muted-foreground uppercase'>
                            Chargeable Wt
                          </div>
                          <div className='font-bold text-violet-600 dark:text-violet-400'>
                            {pickup.chargeableWeight} kg
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Weighing Scale Proof Photos Preview */}
                    {(() => {
                      const photos = getPickupPhotos(pickup)
                      if (photos.length === 0) return null
                      const firstPhoto = photos[0]
                      const totalCount = photos.length

                      return (
                        <div className='flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-50/40 p-2 dark:bg-emerald-950/20'>
                          <button
                            type='button'
                            onClick={() => handleOpenPhotoGallery(pickup)}
                            className='relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-emerald-300 shadow-xs group cursor-pointer'
                          >
                            <img
                              src={firstPhoto}
                              alt='Scale Proof'
                              className='h-full w-full object-cover transition-transform group-hover:scale-105'
                            />
                            {totalCount > 1 && (
                              <div className='absolute bottom-0 right-0 bg-black/80 text-white font-mono text-[9px] font-bold px-1 rounded-tl-xs'>
                                +{totalCount - 1}
                              </div>
                            )}
                            <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white'>
                              <Eye className='h-3.5 w-3.5' />
                            </div>
                          </button>
                          <div className='flex-1 text-[11px] overflow-hidden'>
                            <div className='font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5'>
                              <Camera className='h-3.5 w-3.5 shrink-0' />
                              <span>Scale Proof Verified</span>
                              <Badge className='ml-auto bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0 font-bold border-none'>
                                {totalCount} {totalCount === 1 ? 'Photo' : 'Photos'}
                              </Badge>
                            </div>
                            <button
                              type='button'
                              onClick={() => handleOpenPhotoGallery(pickup)}
                              className='text-primary hover:underline font-medium text-[11px] mt-0.5'
                            >
                              Click to view all {totalCount} {totalCount === 1 ? 'photo' : 'photos'}
                            </button>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Expand / Collapse Details Toggle */}
                    <button
                      type='button'
                      onClick={() => toggleExpandItem(pickup.id)}
                      className='w-full py-1.5 px-2 rounded-lg border border-border/80 bg-background hover:bg-muted/50 text-[11px] font-bold text-primary flex items-center justify-center gap-1.5 transition-colors cursor-pointer'
                    >
                      {expandedItemIds.includes(pickup.id) ? (
                        <>
                          <ChevronUp className='h-3.5 w-3.5' />
                          <span>Collapse Consignment Details</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className='h-3.5 w-3.5' />
                          <span>
                            Expand Full Details{' '}
                            {pickup.pickupLocations && pickup.pickupLocations.length > 1
                              ? `(${pickup.pickupLocations.length} Stops)`
                              : ''}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Expanded Details Panel */}
                    {expandedItemIds.includes(pickup.id) && (
                      <div className='p-3 rounded-xl bg-muted/40 border border-border/80 space-y-3 text-[11px] animate-in fade-in-50 duration-150'>
                        {/* Full Shipper Details */}
                        <div className='space-y-1 border-b border-border/60 pb-2.5'>
                          <div className='font-bold text-foreground text-xs flex items-center gap-1'>
                            <span>👤 Shipper / Sender Details</span>
                          </div>
                          <div className='text-muted-foreground'>
                            <strong className='text-foreground'>{pickup.senderName}</strong>
                            {pickup.senderPhone && (
                              <span>
                                {' '}· Tel:{' '}
                                <a href={`tel:${pickup.senderPhone}`} className='text-primary hover:underline'>
                                  {pickup.senderPhone}
                                </a>
                              </span>
                            )}
                            {pickup.senderEmail && <div>Email: {pickup.senderEmail}</div>}
                            <div className='mt-0.5 text-foreground leading-snug'>{pickup.senderAddress}</div>
                          </div>
                        </div>

                        {/* Full Consignee Details */}
                        <div className='space-y-1 border-b border-border/60 pb-2.5'>
                          <div className='font-bold text-foreground text-xs flex items-center gap-1'>
                            <span>📦 Consignee / Delivery Destination</span>
                          </div>
                          <div className='text-muted-foreground'>
                            <strong className='text-foreground'>{pickup.receiverName || 'Consignee'}</strong>
                            {pickup.receiverPhone && (
                              <span>
                                {' '}· Tel:{' '}
                                <a href={`tel:${pickup.receiverPhone}`} className='text-primary hover:underline'>
                                  {pickup.receiverPhone}
                                </a>
                              </span>
                            )}
                            {pickup.receiverEmail && <div>Email: {pickup.receiverEmail}</div>}
                            <div>
                              Destination:{' '}
                              <strong className='text-foreground'>{pickup.receiverCountry || 'Global'}</strong>
                              {pickup.receiverCity ? ` (${pickup.receiverCity})` : ''}
                              {pickup.receiverPostcode ? ` - ${pickup.receiverPostcode}` : ''}
                            </div>
                            {(pickup.receiverAddressLine1 || pickup.receiverAddressLine2) && (
                              <div className='leading-snug text-foreground'>
                                {[pickup.receiverAddressLine1, pickup.receiverAddressLine2].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Box Breakdown */}
                        {pickup.boxes && pickup.boxes.length > 0 && (
                          <div className='space-y-1 border-b border-border/60 pb-2.5'>
                            <div className='font-bold text-foreground text-xs flex items-center gap-1'>
                              <span>📦 Box Breakdown ({pickup.boxes.length} Box{pickup.boxes.length > 1 ? 'es' : ''})</span>
                            </div>
                            <div className='space-y-1'>
                              {pickup.boxes.map((b: any, bIdx: number) => (
                                <div
                                  key={bIdx}
                                  className='p-1.5 rounded-md bg-background border border-border/60 flex items-center justify-between'
                                >
                                  <span className='font-medium text-foreground'>
                                    Box #{bIdx + 1} {b.dimensions ? `(${b.dimensions} cm)` : ''}
                                  </span>
                                  <span className='font-bold text-amber-600 dark:text-amber-400'>
                                    {b.weight ? `${b.weight} kg` : 'Wt pending'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Commodity & Notes */}
                        <div className='space-y-1 text-muted-foreground'>
                          <div>
                            Commodity: <strong className='text-foreground'>{pickup.commodity || 'General Cargo'}</strong>
                          </div>
                          {pickup.pickupNotes && (
                            <div className='text-amber-800 dark:text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20'>
                              <strong>Dispatch Note:</strong> {pickup.pickupNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className='flex flex-wrap gap-2 p-4 pt-1 border-t bg-muted/10'>
                    {isUserOrCustomer ? (
                      <Button
                        variant='default'
                        size='sm'
                        onClick={() => handleOpenTrackingDialog(pickup)}
                        className='flex-1 gap-1.5 text-xs font-semibold'
                      >
                        <Eye className='h-3.5 w-3.5' />
                        <span>Track & Details</span>
                      </Button>
                    ) : (
                      <>
                        {!isPastPickup && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleQuickMarkPickedUp(pickup.id)}
                            className='gap-1 border-emerald-300 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                            title='Quick mark as Picked Up without opening weight modal'
                          >
                            <CheckCircle2 className='h-3.5 w-3.5' />
                            <span>Mark Picked Up</span>
                          </Button>
                        )}
                        <Button
                          variant={isPastPickup ? 'outline' : 'default'}
                          size='sm'
                          onClick={() => handleOpenWeighModal(pickup)}
                          className='flex-1 gap-1.5 text-xs font-semibold'
                        >
                          <Scale className='h-3.5 w-3.5' />
                          <span>
                            {isPastPickup ? 'Update Wt / Scale Photo' : 'Weigh & Pick Up'}
                          </span>
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleOpenTrackingDialog(pickup)}
                          className='h-8 w-8'
                          title='View Tracking Milestones'
                        >
                          <ChevronRight className='h-4 w-4' />
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <div className='rounded-lg border bg-background shadow-xs overflow-x-auto'>
            <Table className='min-w-[1100px]'>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[36px] p-1 text-center'></TableHead>
                  {!isUserOrCustomer && (
                    <TableHead className='w-[40px]'>
                      <Checkbox
                        checked={
                          filteredPickups.length > 0 &&
                          selectedIds.length === filteredPickups.length
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label='Select all'
                      />
                    </TableHead>
                  )}
                  <TableHead className='w-[140px]'>Tracking #</TableHead>
                  <TableHead className='w-[170px]'>Shipper / Sender</TableHead>
                  <TableHead className='w-[220px]'>Pickup Location</TableHead>
                  <TableHead className='w-[170px]'>Destination</TableHead>
                  <TableHead className='w-[60px] text-center'>Boxes</TableHead>
                  <TableHead className='w-[90px]'>Verified Wt</TableHead>
                  <TableHead className='w-[100px]'>Scale Proof</TableHead>
                  <TableHead className='w-[140px]'>Status</TableHead>
                  <TableHead className='w-[150px] text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPickups.map((pickup) => {
                  const statusStr = (pickup.status || '').toUpperCase()
                  const isPastPickup =
                    ['PICKED_UP', 'PACKED', 'SHIPMENT_CREATED', 'IN_TRANSIT', 'ARRIVED_AT_HUB', 'CARRIER_SCANNED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(statusStr) ||
                    !!pickup.weightProofImageUrl
                  const isPickedUpOnly = statusStr === 'PICKED_UP' || !!pickup.weightProofImageUrl

                  const getTableBadgeConfig = () => {
                    if (statusStr === 'DELIVERED') return { label: 'DELIVERED', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' }
                    if (statusStr === 'CARRIER_SCANNED' || statusStr === 'OUT_FOR_DELIVERY') return { label: 'CARRIER SCANNED', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' }
                    if (statusStr === 'IN_TRANSIT') return { label: 'IN TRANSIT', cls: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300' }
                    if (statusStr === 'ARRIVED_AT_HUB') return { label: 'ARRIVED AT HUB', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' }
                    if (statusStr === 'SHIPMENT_CREATED') return { label: 'SHIPMENT CREATED', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' }
                    if (statusStr === 'PACKED') return { label: 'PACKED', cls: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' }
                    if (isPickedUpOnly) return { label: 'PICKED UP', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' }
                    return { label: 'AWAITING PICKUP', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' }
                  }

                  const badgeCfg = getTableBadgeConfig()

                  return (
                    <Fragment key={pickup.id}>
                      <TableRow className={selectedIds.includes(pickup.id) ? 'bg-primary/5' : ''}>
                      <TableCell className='w-[36px] p-1 text-center'>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer'
                          onClick={() => toggleExpandItem(pickup.id)}
                          title={expandedItemIds.includes(pickup.id) ? 'Collapse row details' : 'Expand row details'}
                        >
                          {expandedItemIds.includes(pickup.id) ? (
                            <ChevronUp className='h-4 w-4 text-primary' />
                          ) : (
                            <ChevronDown className='h-4 w-4' />
                          )}
                        </Button>
                      </TableCell>
                      {!isUserOrCustomer && (
                        <TableCell className='w-[40px]'>
                          <Checkbox
                            checked={selectedIds.includes(pickup.id)}
                            onCheckedChange={() => handleToggleSelect(pickup.id)}
                            aria-label={`Select pickup ${pickup.trackingNumber}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className='w-[140px] font-mono font-bold text-xs'>
                        {pickup.trackingNumber}
                      </TableCell>
                      <TableCell className='w-[170px] max-w-[170px]'>
                        <div className='font-semibold text-xs truncate' title={pickup.senderName}>
                          {pickup.senderName}
                        </div>
                        {pickup.senderPhone && (
                          <a
                            href={`tel:${pickup.senderPhone}`}
                            className='text-[11px] text-primary hover:underline block truncate'
                          >
                            {pickup.senderPhone}
                          </a>
                        )}
                      </TableCell>
                      <TableCell className='w-[220px] max-w-[220px] text-xs text-muted-foreground'>
                        {pickup.pickupLocations && pickup.pickupLocations.length > 0 ? (
                          <div className='space-y-0.5'>
                            <div className='truncate font-medium text-foreground' title={pickup.pickupLocations[0].location}>
                              {pickup.pickupLocations[0].location}
                            </div>
                            {pickup.pickupLocations.length > 1 && (
                              <div className='text-[10px] font-semibold text-primary'>
                                +{pickup.pickupLocations.length - 1} more stop{pickup.pickupLocations.length > 2 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className='truncate font-medium text-foreground' title={pickup.senderAddress || ''}>
                            {pickup.senderAddress || '-'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className='w-[170px] max-w-[170px] text-xs'>
                        <div className='font-semibold text-foreground truncate' title={pickup.receiverCountry || ''}>
                          {pickup.receiverCountry || '-'}
                        </div>
                        <div className='text-[11px] text-muted-foreground truncate' title={pickup.receiverName || ''}>
                          {pickup.receiverName}
                        </div>
                      </TableCell>
                      <TableCell className='w-[60px] text-center text-xs font-semibold'>
                        {pickup.noOfBox || 1}
                      </TableCell>
                      <TableCell className='w-[90px] text-xs font-semibold'>
                        {pickup.weight ? `${pickup.weight} kg` : '-'}
                      </TableCell>
                      <TableCell className='w-[100px]'>
                        {(() => {
                          const photos = getPickupPhotos(pickup)
                          if (photos.length === 0) {
                            return <span className='text-[11px] text-muted-foreground/60 italic'>—</span>
                          }
                          const firstPhoto = photos[0]
                          const totalCount = photos.length
                          return (
                            <button
                              type='button'
                              onClick={() => handleOpenPhotoGallery(pickup)}
                              className='relative group flex items-center gap-1.5 cursor-pointer text-left'
                              title={`View all ${totalCount} scale proof photos`}
                            >
                              <div className='relative h-9 w-9 rounded-md border border-emerald-400/60 overflow-hidden shrink-0 shadow-xs'>
                                <img
                                  src={firstPhoto}
                                  alt='Proof'
                                  className='h-full w-full object-cover transition-transform group-hover:scale-105'
                                />
                                {totalCount > 1 && (
                                  <div className='absolute bottom-0 right-0 bg-black/80 text-white font-mono text-[8px] font-bold px-0.5 rounded-tl-xs'>
                                    +{totalCount - 1}
                                  </div>
                                )}
                              </div>
                              <span className='inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20'>
                                <Camera className='h-3 w-3' />
                                <span>{totalCount}</span>
                              </span>
                            </button>
                          )
                        })()}
                      </TableCell>
                      <TableCell>
                        <Badge className={badgeCfg.cls}>
                          {badgeCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        {isUserOrCustomer ? (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => handleOpenTrackingDialog(pickup)}
                            className='h-8 text-xs font-semibold gap-1'
                          >
                            <Eye className='h-3.5 w-3.5' />
                            <span>Track</span>
                          </Button>
                        ) : (
                          <div className='flex items-center justify-end gap-1.5'>
                            {!isPastPickup && (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => handleQuickMarkPickedUp(pickup.id)}
                                className='h-8 text-xs font-semibold gap-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40'
                                title='Quick mark as Picked Up'
                              >
                                <CheckCircle2 className='h-3.5 w-3.5' />
                                <span>Quick Pick Up</span>
                              </Button>
                            )}
                            <Button
                              size='sm'
                              variant={isPastPickup ? 'outline' : 'default'}
                              onClick={() => handleOpenWeighModal(pickup)}
                              className='h-8 text-xs font-semibold gap-1'
                            >
                              <Scale className='h-3.5 w-3.5' />
                              <span>{isPastPickup ? 'Update' : 'Weigh'}</span>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>

                    {expandedItemIds.includes(pickup.id) && (
                      <TableRow className='bg-muted/30 hover:bg-muted/40 border-b border-border/80'>
                        <TableCell colSpan={!isUserOrCustomer ? 11 : 10} className='p-4'>
                          <div className='rounded-xl border border-border/80 bg-background/80 p-4 space-y-4 text-xs shadow-xs'>
                            <div className='flex items-center justify-between border-b border-border/60 pb-2.5'>
                              <div className='flex items-center gap-2'>
                                <Badge variant='outline' className='font-mono font-bold text-xs'>
                                  {pickup.trackingNumber}
                                </Badge>
                                {pickup.hawbNumber && (
                                  <span className='font-mono text-xs text-muted-foreground'>
                                    HAWB: {pickup.hawbNumber}
                                  </span>
                                )}
                                <Badge className={badgeCfg.cls}>{badgeCfg.label}</Badge>
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                Commodity: <strong className='text-foreground'>{pickup.commodity || 'General Cargo'}</strong> · {pickup.noOfBox || 1} Box(es)
                              </div>
                            </div>

                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                              {/* Itinerary / Multi-Stops */}
                              <div className='space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3'>
                                <div className='font-bold text-primary flex items-center justify-between'>
                                  <span>📍 Pickup Itinerary ({pickup.pickupLocations?.length || 1} Stop{(pickup.pickupLocations?.length || 1) > 1 ? 's' : ''})</span>
                                  {pickup.pickupLocations && pickup.pickupLocations.length > 1 && (
                                    <Badge variant='outline' className='text-[9px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5 font-bold'>
                                      Multi-Stop
                                    </Badge>
                                  )}
                                </div>
                                {pickup.pickupLocations && pickup.pickupLocations.length > 0 ? (
                                  <div className='space-y-2'>
                                    {pickup.pickupLocations.map((loc: any, idx: number) => (
                                      <div key={idx} className='p-2 rounded-md bg-background border border-border/80 space-y-1'>
                                        <div className='flex items-start justify-between gap-1'>
                                          <span className='rounded bg-primary/15 text-primary text-[10px] font-bold px-1.5 py-0.5'>
                                            Stop #{idx + 1}
                                          </span>
                                          {loc.location && (
                                            <a
                                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.location)}`}
                                              target='_blank'
                                              rel='noreferrer'
                                            >
                                              <Button size='sm' variant='secondary' className='h-5 px-1.5 text-[9px] font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30'>
                                                <Navigation className='h-2.5 w-2.5 mr-0.5' /> Maps
                                              </Button>
                                            </a>
                                          )}
                                        </div>
                                        <div className='font-semibold text-foreground text-xs leading-snug'>
                                          {loc.location}
                                        </div>
                                        {loc.phoneNumber && (
                                          <div className='text-[10px] text-muted-foreground'>
                                            Tel: <a href={`tel:${loc.phoneNumber}`} className='text-primary font-medium hover:underline'>{loc.phoneNumber}</a>
                                          </div>
                                        )}
                                        {loc.note && (
                                          <div className='text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded font-medium border border-amber-500/20'>
                                            <strong>Note:</strong> {loc.note}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className='p-2 rounded-md bg-background border border-border/80 space-y-1'>
                                    <div className='font-semibold text-foreground text-xs leading-snug'>
                                      {pickup.senderAddress}
                                    </div>
                                    {pickup.senderPhone && (
                                      <div className='text-[10px] text-muted-foreground'>
                                        Tel: <a href={`tel:${pickup.senderPhone}`} className='text-primary hover:underline'>{pickup.senderPhone}</a>
                                      </div>
                                    )}
                                    {pickup.senderAddress && (
                                      <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup.senderAddress)}`}
                                        target='_blank'
                                        rel='noreferrer'
                                      >
                                        <Button size='sm' variant='secondary' className='h-5 px-1.5 text-[9px] font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 mt-1'>
                                          <Navigation className='h-2.5 w-2.5 mr-0.5' /> Open in Google Maps
                                        </Button>
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Shipper & Consignee */}
                              <div className='space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3'>
                                <div>
                                  <div className='font-bold text-foreground text-xs'>👤 Shipper / Sender</div>
                                  <div className='text-muted-foreground text-[11px] mt-1 space-y-0.5'>
                                    <div className='font-semibold text-foreground'>{pickup.senderName}</div>
                                    {pickup.senderPhone && <div>Tel: <a href={`tel:${pickup.senderPhone}`} className='text-primary hover:underline'>{pickup.senderPhone}</a></div>}
                                    {pickup.senderEmail && <div>Email: {pickup.senderEmail}</div>}
                                    <div>Address: {pickup.senderAddress}</div>
                                  </div>
                                </div>

                                <div className='border-t border-border/60 pt-2'>
                                  <div className='font-bold text-foreground text-xs'>📦 Consignee / Receiver</div>
                                  <div className='text-muted-foreground text-[11px] mt-1 space-y-0.5'>
                                    <div className='font-semibold text-foreground'>{pickup.receiverName || 'Consignee'}</div>
                                    {pickup.receiverPhone && <div>Tel: <a href={`tel:${pickup.receiverPhone}`} className='text-primary hover:underline'>{pickup.receiverPhone}</a></div>}
                                    {pickup.receiverEmail && <div>Email: {pickup.receiverEmail}</div>}
                                    <div>Destination: <strong className='text-foreground'>{pickup.receiverCountry || 'Global'}</strong> {pickup.receiverCity ? `(${pickup.receiverCity})` : ''}</div>
                                    {(pickup.receiverAddressLine1 || pickup.receiverAddressLine2) && (
                                      <div>Address: {[pickup.receiverAddressLine1, pickup.receiverAddressLine2].filter(Boolean).join(', ')}</div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Boxes & Weight & Actions */}
                              <div className='space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3'>
                                <div>
                                  <div className='font-bold text-foreground text-xs'>⚖️ Weights & Boxes</div>
                                  <div className='grid grid-cols-2 gap-1.5 text-[11px] mt-1.5'>
                                    <div className='p-1.5 rounded bg-background border'>
                                      <span className='text-muted-foreground block text-[10px]'>Actual:</span>
                                      <span className='font-bold text-foreground'>{pickup.weight ? `${pickup.weight} kg` : 'Pending'}</span>
                                    </div>
                                    <div className='p-1.5 rounded bg-background border'>
                                      <span className='text-muted-foreground block text-[10px]'>Chargeable:</span>
                                      <span className='font-bold text-foreground'>{pickup.chargeableWeight ? `${pickup.chargeableWeight} kg` : '-'}</span>
                                    </div>
                                  </div>
                                  {pickup.boxes && pickup.boxes.length > 0 && (
                                    <div className='mt-2 space-y-1'>
                                      {pickup.boxes.map((b: any, bIdx: number) => (
                                        <div key={bIdx} className='p-1 rounded bg-background border text-[10px] flex justify-between'>
                                          <span>Box #{bIdx + 1} ({b.dimensions || 'Std'})</span>
                                          <span className='font-semibold'>{b.weight ? `${b.weight} kg` : '-'}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {pickup.pickupNotes && (
                                  <div className='p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-800 dark:text-amber-300'>
                                    <strong>Notes:</strong> {pickup.pickupNotes}
                                  </div>
                                )}

                                <div className='pt-1 flex items-center gap-2'>
                                  {!isPastPickup && (
                                    <Button
                                      size='sm'
                                      variant='outline'
                                      onClick={() => handleQuickMarkPickedUp(pickup.id)}
                                      className='h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400'
                                    >
                                      <CheckCircle2 className='h-3 w-3 mr-1' /> Mark Picked Up
                                    </Button>
                                  )}
                                  <Button
                                    size='sm'
                                    onClick={() => handleOpenWeighModal(pickup)}
                                    className='h-7 text-xs'
                                  >
                                    <Scale className='h-3 w-3 mr-1' /> {isPastPickup ? 'Update Wt' : 'Weigh & Pick Up'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
              </TableBody>
            </Table>
          </div>
        )}
      </Main>

      {/* Weighing & Pickup Action Modal */}
      {selectedPickup && (
        <WeighPickupModal
          open={isWeighModalOpen}
          onOpenChange={setIsWeighModalOpen}
          pickupItem={selectedPickup}
          onSuccess={fetchPickupsData}
        />
      )}

      {/* Tracking Dialog */}
      {trackingItem && (
        <ShipmentTrackingDialog
          open={trackingDialogOpen}
          onOpenChange={setTrackingDialogOpen}
          currentStatus={trackingItem.status || 'PENDING'}
          enquiryId={trackingItem.id}
          trackingNumber={trackingItem.trackingNumber}
          hawbNumber={trackingItem.hawbNumber}
        />
      )}

      {/* Multi-Photo Lightbox / Gallery Dialog */}
      <Dialog
        open={galleryPhotos.length > 0}
        onOpenChange={(open) => !open && setGalleryPhotos([])}
      >
        <DialogContent className='max-w-4xl overflow-hidden p-3 sm:rounded-2xl bg-card border-border'>
          <DialogHeader className='p-2 pb-0 flex flex-row items-center justify-between'>
            <div>
              <DialogTitle className='text-sm font-bold flex items-center gap-1.5'>
                <Camera className='h-4 w-4 text-primary' />
                <span>{galleryTitle || 'Weighing Scale & Box Proof Photos'}</span>
              </DialogTitle>
              <DialogDescription className='text-xs text-muted-foreground'>
                Photo {galleryIndex + 1} of {galleryPhotos.length} captured during pickup verification
              </DialogDescription>
            </div>
            <Badge className='bg-primary/10 text-primary border-primary/30 text-xs font-mono font-bold px-2 py-0.5'>
              {galleryPhotos.length} Total {galleryPhotos.length === 1 ? 'Photo' : 'Photos'}
            </Badge>
          </DialogHeader>

          {/* Main Full-Size Image Preview */}
          <div className='relative flex max-h-[70vh] min-h-[300px] items-center justify-center overflow-hidden rounded-xl bg-black/95 p-2 my-2'>
            {galleryPhotos[galleryIndex] && (
              <img
                src={galleryPhotos[galleryIndex]}
                alt={`Proof photo ${galleryIndex + 1}`}
                className='max-h-[66vh] w-auto max-w-full object-contain rounded'
              />
            )}

            {/* Previous Photo Button */}
            {galleryPhotos.length > 1 && (
              <Button
                type='button'
                variant='secondary'
                size='icon'
                onClick={() => setGalleryIndex((prev) => (prev > 0 ? prev - 1 : galleryPhotos.length - 1))}
                className='absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/90 border border-white/20'
              >
                <ChevronLeft className='h-6 w-6' />
              </Button>
            )}

            {/* Next Photo Button */}
            {galleryPhotos.length > 1 && (
              <Button
                type='button'
                variant='secondary'
                size='icon'
                onClick={() => setGalleryIndex((prev) => (prev < galleryPhotos.length - 1 ? prev + 1 : 0))}
                className='absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-black/90 border border-white/20'
              >
                <ChevronRight className='h-6 w-6' />
              </Button>
            )}
          </div>

          {/* Thumbnails Row */}
          {galleryPhotos.length > 1 && (
            <div className='flex items-center justify-center gap-2 overflow-x-auto py-1 px-2'>
              {galleryPhotos.map((url, idx) => (
                <button
                  key={idx}
                  type='button'
                  onClick={() => setGalleryIndex(idx)}
                  className={`relative h-14 w-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                    galleryIndex === idx
                      ? 'border-primary ring-2 ring-primary/40 scale-105'
                      : 'border-border/60 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={url} alt={`Thumb ${idx + 1}`} className='h-full w-full object-cover' />
                  <span className='absolute bottom-0 right-0 bg-black/70 text-white text-[9px] font-mono px-1 rounded-tl'>
                    #{idx + 1}
                  </span>
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
