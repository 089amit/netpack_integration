import { useEffect, useState, useMemo } from 'react'
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
  Eye,
  LayoutGrid,
  List,
} from 'lucide-react'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { PICKUP_ENDPOINTS } from '@/constants/endpoint'
import { WeighPickupModal } from './components/weigh-pickup-modal'
import { ShipmentTrackingDialog } from '@/features/tasks/components/shipment-tracking-dialog'

export default function PickupsDashboard() {
  const [pickups, setPickups] = useState<any[]>([])
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
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null)

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
            Pickup Operations & Warehouse Intake
          </h1>
        </div>
        <div className='ml-auto flex items-center space-x-3'>
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
                Awaiting Collection
              </CardDescription>
              <CardTitle className='text-2xl font-black text-amber-600 dark:text-amber-400'>
                {loading ? <Skeleton className='h-8 w-16' /> : stats.pendingCount}
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3 pt-0 text-[11px] text-muted-foreground'>
              Enquiries pending pickup
            </CardContent>
          </Card>

          <Card className='border-emerald-200/60 bg-gradient-to-br from-emerald-50/50 to-background dark:border-emerald-900/40 dark:from-emerald-950/20'>
            <CardHeader className='p-4 pb-2'>
              <CardDescription className='text-xs font-medium text-emerald-700 dark:text-emerald-400'>
                Warehouse Intake
              </CardDescription>
              <CardTitle className='text-2xl font-black text-emerald-600 dark:text-emerald-400'>
                {loading ? <Skeleton className='h-8 w-16' /> : stats.pickedUpCount}
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3 pt-0 text-[11px] text-muted-foreground'>
              Picked up & verified
            </CardContent>
          </Card>

          <Card className='border-blue-200/60 bg-gradient-to-br from-blue-50/50 to-background dark:border-blue-900/40 dark:from-blue-950/20'>
            <CardHeader className='p-4 pb-2'>
              <CardDescription className='text-xs font-medium text-blue-700 dark:text-blue-400'>
                Today's Weight Intake
              </CardDescription>
              <CardTitle className='text-2xl font-black text-blue-600 dark:text-blue-400'>
                {loading ? <Skeleton className='h-8 w-16' /> : `${stats.totalWeightToday} kg`}
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3 pt-0 text-[11px] text-muted-foreground'>
              Processed on warehouse scale
            </CardContent>
          </Card>

          <Card className='border-violet-200/60 bg-gradient-to-br from-violet-50/50 to-background dark:border-violet-900/40 dark:from-violet-950/20'>
            <CardHeader className='p-4 pb-2'>
              <CardDescription className='text-xs font-medium text-violet-700 dark:text-violet-400'>
                Today's Boxes Collected
              </CardDescription>
              <CardTitle className='text-2xl font-black text-violet-600 dark:text-violet-400'>
                {loading ? <Skeleton className='h-8 w-16' /> : stats.totalBoxesToday}
              </CardTitle>
            </CardHeader>
            <CardContent className='px-4 pb-3 pt-0 text-[11px] text-muted-foreground'>
              Individual parcels handled
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
                <span>Pending Pickups</span>
              </TabsTrigger>
              <TabsTrigger value='PICKED_UP' className='gap-1.5 text-xs'>
                <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
                <span>Picked Up & Weighed</span>
              </TabsTrigger>
              <TabsTrigger value='ALL' className='text-xs'>
                All Shipments
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
                    {/* Pickup Address & Location */}
                    <div className='flex items-start gap-1.5 text-muted-foreground bg-muted/30 p-2 rounded-md'>
                      <MapPin className='h-4 w-4 shrink-0 text-primary mt-0.5' />
                      <span className='line-clamp-2 text-foreground font-medium'>
                        {pickup.pickupLocations && pickup.pickupLocations[0]?.location
                          ? pickup.pickupLocations[0].location
                          : pickup.senderAddress}
                      </span>
                    </div>

                    {pickup.pickupLocations && pickup.pickupLocations[0]?.note && (
                      <div className='rounded border border-amber-300/40 bg-amber-50/60 p-2 text-[11px] text-amber-900 dark:bg-amber-950/30 dark:text-amber-300'>
                        <strong>Note:</strong> {pickup.pickupLocations[0].note}
                      </div>
                    )}

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

                    {/* Weighing Scale Proof Photo Preview */}
                    {pickup.weightProofImageUrl ? (
                      <div className='flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-50/30 p-2 dark:bg-emerald-950/20'>
                        <button
                          type='button'
                          onClick={() => setPreviewPhotoUrl(pickup.weightProofImageUrl)}
                          className='relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-emerald-300 shadow-xs group cursor-pointer'
                        >
                          <img
                            src={pickup.weightProofImageUrl}
                            alt='Scale Proof'
                            className='h-full w-full object-cover transition-transform group-hover:scale-105'
                          />
                          <div className='absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white'>
                            <Eye className='h-3.5 w-3.5' />
                          </div>
                        </button>
                        <div className='flex-1 text-[11px] overflow-hidden'>
                          <div className='font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1'>
                            <Camera className='h-3.5 w-3.5' />
                            <span>Scale Proof Verified</span>
                          </div>
                          <button
                            type='button'
                            onClick={() => setPreviewPhotoUrl(pickup.weightProofImageUrl)}
                            className='text-primary hover:underline font-medium text-[11px]'
                          >
                            Click to view full photo
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>

                  <CardFooter className='flex gap-2 p-4 pt-1 border-t bg-muted/10'>
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
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <div className='rounded-lg border bg-background shadow-xs overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[140px]'>Tracking #</TableHead>
                  <TableHead>Shipper / Sender</TableHead>
                  <TableHead>Pickup Location</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Boxes</TableHead>
                  <TableHead>Verified Wt</TableHead>
                  <TableHead>Scale Proof</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
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
                    <TableRow key={pickup.id}>
                      <TableCell className='font-mono font-bold text-xs'>
                        {pickup.trackingNumber}
                      </TableCell>
                      <TableCell>
                        <div className='font-semibold text-xs'>{pickup.senderName}</div>
                        {pickup.senderPhone && (
                          <a
                            href={`tel:${pickup.senderPhone}`}
                            className='text-[11px] text-primary hover:underline'
                          >
                            {pickup.senderPhone}
                          </a>
                        )}
                      </TableCell>
                      <TableCell className='max-w-[200px] truncate text-xs text-muted-foreground'>
                        {pickup.pickupLocations && pickup.pickupLocations[0]?.location
                          ? pickup.pickupLocations[0].location
                          : pickup.senderAddress}
                      </TableCell>
                      <TableCell className='text-xs'>
                        <div>{pickup.receiverCountry}</div>
                        <div className='text-[11px] text-muted-foreground truncate'>
                          {pickup.receiverName}
                        </div>
                      </TableCell>
                      <TableCell className='text-xs font-semibold'>
                        {pickup.noOfBox || 1}
                      </TableCell>
                      <TableCell className='text-xs font-semibold'>
                        {pickup.weight ? `${pickup.weight} kg` : '-'}
                      </TableCell>
                      <TableCell>
                        {pickup.weightProofImageUrl ? (
                          <button
                            type='button'
                            onClick={() => setPreviewPhotoUrl(pickup.weightProofImageUrl)}
                            className='relative h-9 w-9 rounded-md border overflow-hidden cursor-pointer hover:opacity-80'
                          >
                            <img
                              src={pickup.weightProofImageUrl}
                              alt='Proof'
                              className='h-full w-full object-cover'
                            />
                          </button>
                        ) : (
                          <span className='text-[11px] text-muted-foreground'>None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={badgeCfg.cls}>
                          {badgeCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          size='sm'
                          variant={isPastPickup ? 'outline' : 'default'}
                          onClick={() => handleOpenWeighModal(pickup)}
                          className='h-8 text-xs font-semibold gap-1'
                        >
                          <Scale className='h-3.5 w-3.5' />
                          <span>{isPastPickup ? 'Update' : 'Weigh'}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
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

      {/* Lightbox / Zoom Dialog for Weighing Scale Proof Photo */}
      <Dialog
        open={!!previewPhotoUrl}
        onOpenChange={(open) => !open && setPreviewPhotoUrl(null)}
      >
        <DialogContent className='max-w-3xl overflow-hidden p-2 sm:rounded-xl'>
          <DialogHeader className='p-2 pb-0'>
            <DialogTitle className='text-sm font-bold flex items-center gap-1.5'>
              <Camera className='h-4 w-4 text-primary' />
              Weighing Scale Proof Photo (Verified at Warehouse)
            </DialogTitle>
          </DialogHeader>
          <div className='flex max-h-[75vh] items-center justify-center overflow-auto rounded-lg bg-black/90 p-1'>
            {previewPhotoUrl && (
              <img
                src={previewPhotoUrl}
                alt='Weighing Scale Proof Full'
                className='max-h-[70vh] w-auto object-contain'
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
