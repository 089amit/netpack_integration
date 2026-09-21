import { useState, useEffect, useMemo } from 'react'
import http from '@/utils/http'
import { BASE_URL, MAWB_ENDPOINTS } from '@/constants/endpoint'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  FileSpreadsheet,
  FileText,
  Download,
  Package,
  Boxes,
  Plane,
  RefreshCw,
  Building2,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  ShieldCheck,
  Eye,
  ShoppingBag,
  Scale,
} from 'lucide-react'

interface MAWBItem {
  id: string
  mawbNumber: string
  airlineName?: string
  destination?: string
  departureDate?: string
  flightNumber?: string
}

interface EnquiryItem {
  id: number
  description: string
  quantity: number
  unitPrice: number
  value: number
  totalValue: number
  weight: number
  hsCode: string
}

interface ShipmentData {
  id: number
  hawbno: string
  forwardingNumber: string
  forwardingServiceName: string
  senderName: string
  receiverName: string
  destinationCountryName: string
  noOfBox: number
  weight: number
  value: number
  goodsDescription: string
  status: string
  enquiryItems: EnquiryItem[]
}

interface WTRow {
  HAWB: string
  Details: string
  Box: number
  BagMarking: string
  Weight: number
  Country: string
  SeparateClearance: boolean
}

interface Consignee {
  id: number
  name: string
  address: string
  country: string
  isDefault: boolean
}

interface GeneratedPart {
  partNumber: number
  invoiceNumber: string
  boxes: number
  pcs: number
  usd: number
  shipmentCount: number
  manifestFilename: string
  chamberFilename?: string | null
  manifestDownloadUrl?: string
  chamberDownloadUrl?: string | null
  sheets?: Record<string, any[][]>
  chamber?: {
    paragraphs: string[]
    tables: string[][][]
  } | null
}

const STORAGE_KEY_LAST_INVOICE = 'netpack_last_custom_invoice_number'

export function getNextInvoiceNumber(base: string, partIndex: number): string {
  if (partIndex === 0) return base
  if (!base || !base.trim()) return `INV-${(partIndex + 1).toString().padStart(3, '0')}`

  const clean = base.trim()
  // 1. Format with fiscal/suffix delimiter: e.g. "DK090-034/35" -> "DK091-034/35"
  const matchWithSuffix = clean.match(/^([A-Za-z\-_]*?)(\d+)([-/].*)$/)
  if (matchWithSuffix) {
    const [, prefix, numStr, suffix] = matchWithSuffix
    const num = parseInt(numStr, 10) + partIndex
    const padded = num.toString().padStart(numStr.length, '0')
    return `${prefix}${padded}${suffix}`
  }
  // 2. Format with trailing number: e.g. "INV-001" -> "INV-002" or "DK090" -> "DK091"
  const matchTrailing = clean.match(/^(.*?)(\d+)$/)
  if (matchTrailing) {
    const [, prefix, numStr] = matchTrailing
    const num = parseInt(numStr, 10) + partIndex
    const padded = num.toString().padStart(numStr.length, '0')
    return `${prefix}${padded}`
  }
  return `${clean}-${partIndex + 1}`
}

export default function CustomManifestPage() {
  const [mawbs, setMawbs] = useState<MAWBItem[]>([])
  const [selectedMawb, setSelectedMawb] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // MAWB Data
  const [mawbDetails, setMawbDetails] = useState<any>(null)
  const [shipments, setShipments] = useState<ShipmentData[]>([])
  const [wtRows, setWtRows] = useState<WTRow[]>([])
  const [bagMarkings, setBagMarkings] = useState<Record<string, string>>({})
  const [separateHawbs, setSeparateHawbs] = useState<Record<string, boolean>>({})

  // Bag Configuration
  const [maxBagWeight, setMaxBagWeight] = useState<number>(30.0)
  const [isBagBased, setIsBagBased] = useState<boolean>(false)
  const [selectedBagForSummary, setSelectedBagForSummary] = useState<string | null>(null)

  // Thresholds & Settings
  const [maxBoxPerPart, setMaxBoxPerPart] = useState<number>(10)
  const [maxUsdPerPart, setMaxUsdPerPart] = useState<number>(950)
  const [maxWeightPerPart, setMaxWeightPerPart] = useState<number>(1500)
  const [lastManifestNumber, setLastManifestNumber] = useState<string>('')

  // Consignees
  const [consignees, setConsignees] = useState<Consignee[]>([])
  const [selectedConsigneeId, setSelectedConsigneeId] = useState<number | ''>('')
  const [newConsigneeName, setNewConsigneeName] = useState('')
  const [newConsigneeAddress, setNewConsigneeAddress] = useState('')
  const [newConsigneeCountry, setNewConsigneeCountry] = useState('UK')
  const [isAddConsigneeOpen, setIsAddConsigneeOpen] = useState(false)

  // Invoice Inputs
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [invoiceNumbers, setInvoiceNumbers] = useState<string[]>([])
  const [narrationText, setNarrationText] = useState<string>('')

  // Generation Results & On-Screen Document Preview
  const [generating, setGenerating] = useState(false)
  const [generatedParts, setGeneratedParts] = useState<GeneratedPart[]>([])
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({})
  const [activePreviewPartIdx, setActivePreviewPartIdx] = useState<number>(0)
  const [activePreviewDoc, setActivePreviewDoc] = useState<'manifest' | 'packing_list' | 'chamber'>('manifest')

  // Search & Filter in WT-Box table
  const [tableSearch, setTableSearch] = useState<string>('')

  // Load Initial Settings & Consignees & MAWBs
  useEffect(() => {
    fetchMawbs()
    fetchSettings()
    fetchConsignees()
  }, [])

  const fetchMawbs = async () => {
    try {
      const res: any = await http.get(`${MAWB_ENDPOINTS.GET_ALL_MAWBS}?limit=200`)
      const list = res?.data || (Array.isArray(res) ? res : [])
      const mapped = list.map((m: any) => ({
        id: String(m.id),
        mawbNumber: m.mawbNumber,
        airlineName: m.airlineName,
        destination: m.destination,
        departureDate: m.departureDate,
        flightNumber: m.flightNumber,
      }))
      setMawbs(mapped)
      if (mapped.length > 0) {
        setSelectedMawb((prev) => {
          const currentValid = mapped.some((m: any) => m.mawbNumber === prev)
          const target = currentValid && prev ? prev : mapped[0].mawbNumber
          loadMawbData(target)
          return target
        })
      }
    } catch (e) {
      console.error('Failed to load MAWBs', e)
    }
  }

  const fetchSettings = async () => {
    try {
      const res: any = await http.get('/api/customs/settings')
      if (res) {
        if (res.maxBoxPerPart) setMaxBoxPerPart(res.maxBoxPerPart)
        if (res.maxUsdPerPart) setMaxUsdPerPart(res.maxUsdPerPart)
        if (res.maxWeightPerPart) setMaxWeightPerPart(res.maxWeightPerPart)
        if (res.lastManifestNumber) setLastManifestNumber(res.lastManifestNumber)
      }
    } catch (e) {
      console.error('Failed to load settings', e)
    }
  }

  const fetchConsignees = async () => {
    try {
      const res: any = await http.get('/api/customs/consignees')
      const list = Array.isArray(res) ? res : []
      setConsignees(list)
      const def = list.find((c: Consignee) => c.isDefault) || list[0]
      if (def) setSelectedConsigneeId(def.id)
    } catch (e) {
      console.error('Failed to load consignees', e)
    }
  }

  // Load MAWB Customs Data
  const loadMawbData = async (mawbNo?: string, customMaxBagWeight?: number) => {
    const target = mawbNo || selectedMawb
    if (!target) return
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    setGeneratedParts([])
    setDownloadUrls({})

    const bagWt = customMaxBagWeight !== undefined ? customMaxBagWeight : maxBagWeight
    try {
      const res: any = await http.get(`/api/customs/mawb-data/${encodeURIComponent(target)}?maxBagWeight=${bagWt}`)
      if (res) {
        setMawbDetails(res.mawb)
        setShipments(res.shipments || [])
        const rows: WTRow[] = res.wtRows || []
        setWtRows(rows)

        // Populate initial bag markings
        const initBags: Record<string, string> = {}
        const initSep: Record<string, boolean> = {}
        rows.forEach((r) => {
          if (r.BagMarking) initBags[r.HAWB] = r.BagMarking
          if (r.SeparateClearance) initSep[r.HAWB] = true
        })
        setBagMarkings(initBags)
        setSeparateHawbs(initSep)

        const firstMarking = Object.values(initBags)[0]
        if (firstMarking) setSelectedBagForSummary(firstMarking)
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to load MAWB customs data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedMawb) {
      loadMawbData(selectedMawb)
    }
  }, [selectedMawb])

  // Computed summary
  const activeShipments = useMemo(() => {
    return shipments.filter((s) => !separateHawbs[s.hawbno])
  }, [shipments, separateHawbs])

  // Bag Consolidation Groups
  const bagGroups = useMemo(() => {
    const groups: Record<
      string,
      {
        marking: string
        shipments: ShipmentData[]
        totalWeight: number
        totalBoxes: number
        isOverweight: boolean
        isConsoleBag: boolean
        isBoxMarking: boolean
      }
    > = {}

    shipments.forEach((s) => {
      const marking = (bagMarkings[s.hawbno] ?? '').trim()
      if (!marking) return
      if (!groups[marking]) {
        groups[marking] = {
          marking,
          shipments: [],
          totalWeight: 0,
          totalBoxes: 0,
          isOverweight: false,
          isConsoleBag: false,
          isBoxMarking: false,
        }
      }
      groups[marking].shipments.push(s)
      groups[marking].totalWeight += Number(s.weight || 0)
      groups[marking].totalBoxes += Number(s.noOfBox || 1)
    })

    Object.values(groups).forEach((g) => {
      g.totalWeight = Number(g.totalWeight.toFixed(2))
      // User rule: Overweight warning is ONLY required if marking starts with 'BAG' (console bag)
      // or if multiple distinct HAWBs are consolidated into one marking.
      // Box markings like '2-4', '4-9', '1-8' (or single number) within a single HAWB are box markings within a HAWB,
      // NOT console bags, and must NEVER trigger overweight bag warnings.
      const startsWithBag = /^BAG/i.test(g.marking.trim())
      const isMultiHawbConsole = g.shipments.length > 1
      const isConsoleBag = startsWithBag || isMultiHawbConsole

      g.isConsoleBag = isConsoleBag
      g.isBoxMarking = !isConsoleBag
      g.isOverweight = isConsoleBag && g.totalWeight > maxBagWeight
    })

    return groups
  }, [shipments, bagMarkings, maxBagWeight])

  const unassignedHawbs = useMemo(() => {
    return shipments.filter((s) => !(bagMarkings[s.hawbno] ?? '').trim())
  }, [shipments, bagMarkings])

  const summary = useMemo(() => {
    const totalBoxes = wtRows.reduce((acc, r) => acc + (r.Box || 0), 0)
    const totalWeight = wtRows.reduce((acc, r) => acc + (r.Weight || 0), 0)
    const getShipmentDeclaredUsd = (s: ShipmentData) => {
      if (s.enquiryItems && s.enquiryItems.length > 0) {
        const itemSum = s.enquiryItems.reduce(
          (sum: number, it: any) =>
            sum + (Number(it.totalValue) || (Number(it.quantity || 1) * Number(it.unitPrice || 0))),
          0
        )
        if (itemSum > 0) return itemSum
      }
      return Number(s.value || 0)
    }

    const totalUsd = shipments.reduce((acc, s) => acc + getShipmentDeclaredUsd(s), 0)

    const activeBoxes = activeShipments.reduce((acc, s) => acc + (s.noOfBox || 1), 0)
    const activeUsd = activeShipments.reduce((acc, s) => acc + getShipmentDeclaredUsd(s), 0)
    const activeWeight = activeShipments.reduce((acc, s) => acc + (s.weight || 0), 0)

    const estPartsByBoxes = Math.ceil(activeBoxes / (maxBoxPerPart || 10))
    const estPartsByUsd = Math.ceil(activeUsd / (maxUsdPerPart || 950))
    const estPartsByWeight = Math.ceil(activeWeight / (maxWeightPerPart || 1500))
    const estParts = Math.max(estPartsByBoxes, estPartsByUsd, estPartsByWeight, 1)

    return {
      totalShipments: shipments.length,
      activeShipments: activeShipments.length,
      totalBoxes,
      totalWeight: Number(totalWeight.toFixed(2)),
      totalUsd: Number(totalUsd.toFixed(2)),
      estParts,
    }
  }, [wtRows, shipments, activeShipments, maxBoxPerPart, maxUsdPerPart, maxWeightPerPart])

  // Sync Invoice Numbers array with estParts, respecting remembered invoice format
  useEffect(() => {
    const count = summary.estParts || 1
    const stored = localStorage.getItem(STORAGE_KEY_LAST_INVOICE)
    const baseInvoice = stored || lastManifestNumber || 'DK090-034/35'

    setInvoiceNumbers((prev) => {
      const activeBase = prev[0] && prev[0].trim() ? prev[0] : baseInvoice
      const updated: string[] = []
      for (let i = 0; i < count; i++) {
        if (prev[i] !== undefined && prev[i].trim() !== '') {
          updated.push(prev[i])
        } else {
          updated.push(getNextInvoiceNumber(activeBase, i))
        }
      }
      return updated
    })
  }, [summary.estParts, lastManifestNumber])

  const handleInvoiceChange = (idx: number, newVal: string) => {
    const updated = [...invoiceNumbers]
    updated[idx] = newVal

    // When the user edits Part 1, remember the invoice number & auto-increment subsequent parts
    if (idx === 0 && newVal.trim()) {
      const base = newVal.trim()
      localStorage.setItem(STORAGE_KEY_LAST_INVOICE, base)
      // Sync with backend customs setting in background
      http.post('/api/customs/settings', { lastManifestNumber: base }).catch(() => {})

      for (let i = 1; i < updated.length; i++) {
        updated[i] = getNextInvoiceNumber(base, i)
      }
    } else if (newVal.trim()) {
      localStorage.setItem(STORAGE_KEY_LAST_INVOICE, updated[0] || newVal.trim())
    }

    setInvoiceNumbers(updated)
  }

  // Bag Marking Handlers
  const handleAutoSuggestBags = async () => {
    if (!selectedMawb) return
    try {
      setLoading(true)
      const res: any = await http.get(
        `/api/customs/mawb-data/${encodeURIComponent(selectedMawb)}?maxBagWeight=${maxBagWeight}`
      )
      if (res?.suggestedBags) {
        setBagMarkings(res.suggestedBags)
        const firstMarking = Object.values(res.suggestedBags)[0] as string
        if (firstMarking) setSelectedBagForSummary(firstMarking)
        setSuccessMsg(
          `Auto-suggested courier bag markings generated successfully (Max ${maxBagWeight} KG/bag)!`
        )
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to auto-suggest bags')
    } finally {
      setLoading(false)
    }
  }

  const handleBagMarkingChange = (hawb: string, val: string) => {
    setBagMarkings((prev) => ({ ...prev, [hawb]: val }))
    if (val.trim()) {
      setSelectedBagForSummary(val.trim())
    }
  }

  const handleSeparateToggle = (hawb: string, checked: boolean) => {
    setSeparateHawbs((prev) => ({ ...prev, [hawb]: checked }))
  }

  // Generate Customs Package
  const handleGenerate = async () => {
    if (!selectedMawb) {
      setError('Please select a MAWB first')
      return
    }
    setGenerating(true)
    setError(null)
    setSuccessMsg(null)

    const chosenConsignee =
      consignees.find((c) => c.id === selectedConsigneeId) ||
      consignees[0] || {
        name: 'ESHIPPER EXPRESS COURIER',
        address: '',
        country: 'UK',
      }

    const payload = {
      mawbNumber: selectedMawb,
      consignee: {
        name: chosenConsignee.name,
        address: chosenConsignee.address,
        country: chosenConsignee.country,
      },
      invoiceNumbers,
      invoiceDate,
      maxBoxPerPart,
      maxUsdPerPart,
      maxWeightPerPart,
      isBagBased,
      maxBagWeight,
      bagMarkings,
      separateClearanceHawbs: Object.keys(separateHawbs).filter((h) => separateHawbs[h]),
      narrationText,
    }

    try {
      const res: any = await http.post('/api/customs/generate', payload)
      if (res?.success) {
        setGeneratedParts(res.parts || [])
        setDownloadUrls(res.downloadUrls || {})
        setActivePreviewPartIdx(0)
        setActivePreviewDoc('manifest')
        setSuccessMsg(
          `Successfully generated ${res.partsCount} Custom Manifest part(s) and Chamber certificates! On-screen preview is ready below.`
        )
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to generate customs package')
    } finally {
      setGenerating(false)
    }
  }


  // Download File Helper
  const downloadFile = (filename: string) => {
    window.open(`${BASE_URL}/customs/download/${encodeURIComponent(filename)}`, '_blank')
  }

  // Consignee CRUD
  const handleAddConsignee = async () => {
    if (!newConsigneeName.trim()) {
      setError('Please provide a consignee name')
      return
    }
    try {
      const res: any = await http.post('/api/customs/consignees', {
        name: newConsigneeName.trim(),
        address: newConsigneeAddress.trim(),
        country: newConsigneeCountry.trim() || 'UK',
      })
      if (res) {
        setNewConsigneeName('')
        setNewConsigneeAddress('')
        setIsAddConsigneeOpen(false)
        await fetchConsignees()
        if (res.id) {
          setSelectedConsigneeId(res.id)
        }
        setSuccessMsg(`Consignee '${res.name}' created and selected successfully!`)
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to add consignee')
    }
  }

  const handleDeleteConsignee = async (id: number) => {
    try {
      await http.delete(`/api/customs/consignees/${id}`)
      fetchConsignees()
    } catch (e) {
      setError('Failed to delete consignee')
    }
  }

  // Filtered WT Rows
  const filteredRows = useMemo(() => {
    if (!tableSearch.trim()) return wtRows
    const q = tableSearch.toLowerCase()
    return wtRows.filter(
      (r) =>
        r.HAWB.toLowerCase().includes(q) ||
        r.Details.toLowerCase().includes(q) ||
        r.Country.toLowerCase().includes(q) ||
        (bagMarkings[r.HAWB] || '').toLowerCase().includes(q)
    )
  }, [wtRows, tableSearch, bagMarkings])

  const currentSelectedBagGroup = selectedBagForSummary
    ? bagGroups[selectedBagForSummary]
    : null

  const currentPart = generatedParts[activePreviewPartIdx] || generatedParts[0]

  return (

    <>
      <Header fixed>
        <div className='flex items-center gap-2 px-4'>
          <ShieldCheck className='h-6 w-6 text-primary' />
          <div>
            <h1 className='text-lg font-bold leading-tight'>Customs Manifest & Chambers Hub</h1>
            <p className='text-xs text-muted-foreground'>
              Multi-part Customs Manifests, Chamber Certificates, WT-Box & Tracking Reports
            </p>
          </div>
        </div>
      </Header>

      <Main className='space-y-6 p-6'>
        {/* Alerts */}
        {error && (
          <div className='flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'>
            <AlertCircle className='h-5 w-5 shrink-0' />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className='flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'>
            <CheckCircle2 className='h-5 w-5 shrink-0' />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Top Bar: MAWB Selector & Reload ───────────────────────────── */}
        <Card className='border-primary/20 bg-muted/20 shadow-sm'>
          <CardContent className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4'>
            <div className='flex flex-wrap items-center gap-3'>
              <div className='flex items-center gap-2 shrink-0'>
                <Plane className='h-5 w-5 text-primary' />
                <span className='text-sm font-bold'>Select MAWB:</span>
              </div>
              <select
                value={selectedMawb}
                onChange={(e) => {
                  const val = e.target.value
                  setSelectedMawb(val)
                  if (val) loadMawbData(val)
                }}
                className='h-9 min-w-[280px] sm:min-w-[340px] rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer'
              >
                {mawbs.length === 0 ? (
                  <option value=''>No MAWBs found</option>
                ) : (
                  <>
                    {!selectedMawb && <option value=''>-- Select a MAWB --</option>}
                    {mawbs.map((m) => (
                      <option key={m.id} value={m.mawbNumber}>
                        {m.mawbNumber} {m.destination ? `(${m.destination})` : ''} {m.airlineName ? `• ${m.airlineName}` : ''}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  fetchMawbs()
                  if (selectedMawb) loadMawbData(selectedMawb)
                }}
                disabled={loading}
                className='gap-1.5 shadow-sm'
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Reload
              </Button>
            </div>

            {mawbDetails && (
              <div className='flex flex-wrap items-center gap-2 text-xs'>
                <Badge variant='outline' className='bg-background font-medium px-2.5 py-1'>
                  Airline: <span className='ml-1 font-bold text-foreground'>{mawbDetails.airlineName || 'N/A'}</span>
                </Badge>
                <Badge variant='outline' className='bg-background font-medium px-2.5 py-1'>
                  Flight: <span className='ml-1 font-bold text-foreground'>{mawbDetails.flightNumber || 'N/A'}</span>
                </Badge>
                <Badge variant='outline' className='bg-background font-medium px-2.5 py-1'>
                  Departure: <span className='ml-1 font-bold text-foreground'>{mawbDetails.flightDate ? new Date(mawbDetails.flightDate).toLocaleDateString() : 'N/A'}</span>
                </Badge>
                <Badge variant='outline' className='bg-background font-medium px-2.5 py-1'>
                  Destination: <span className='ml-1 font-bold text-foreground'>{mawbDetails.destination || 'N/A'}</span>
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── KPI Summary Cards ────────────────────────────────────────── */}
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5'>
          <Card>
            <CardHeader className='pb-2 pt-4'>
              <CardDescription className='text-xs font-medium'>Total Shipments</CardDescription>
              <CardTitle className='text-2xl font-bold flex items-center justify-between'>
                {summary.totalShipments}
                <Package className='h-5 w-5 text-muted-foreground' />
              </CardTitle>
            </CardHeader>
            <CardContent className='pb-4 pt-0 text-xs text-muted-foreground'>
              Active: <span className='font-bold text-foreground'>{summary.activeShipments}</span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2 pt-4'>
              <CardDescription className='text-xs font-medium'>Total Cartons / Boxes</CardDescription>
              <CardTitle className='text-2xl font-bold flex items-center justify-between'>
                {summary.totalBoxes}
                <Boxes className='h-5 w-5 text-muted-foreground' />
              </CardTitle>
            </CardHeader>
            <CardContent className='pb-4 pt-0 text-xs text-muted-foreground'>
              Physically verified
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2 pt-4'>
              <CardDescription className='text-xs font-medium'>Total Weight</CardDescription>
              <CardTitle className='text-2xl font-bold flex items-center justify-between'>
                {summary.totalWeight} <span className='text-sm font-normal text-muted-foreground'>KG</span>
                <Layers className='h-5 w-5 text-muted-foreground' />
              </CardTitle>
            </CardHeader>
            <CardContent className='pb-4 pt-0 text-xs text-muted-foreground'>
              Handed to Airline
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2 pt-4'>
              <CardDescription className='text-xs font-medium'>Declared Value</CardDescription>
              <CardTitle className='text-2xl font-bold flex items-center justify-between'>
                ${summary.totalUsd}
                <span className='text-xs font-bold text-emerald-600 dark:text-emerald-400'>USD</span>
              </CardTitle>
            </CardHeader>
            <CardContent className='pb-4 pt-0 text-xs text-muted-foreground'>
              From Enquiry Items
            </CardContent>
          </Card>

          <Card className='border-primary/30 bg-primary/5'>
            <CardHeader className='pb-2 pt-4'>
              <CardDescription className='text-xs font-semibold text-primary'>Est. Customs Parts</CardDescription>
              <CardTitle className='text-2xl font-bold text-primary flex items-center justify-between'>
                {summary.estParts} Part(s)
                <FileSpreadsheet className='h-5 w-5 text-primary' />
              </CardTitle>
            </CardHeader>
            <CardContent className='pb-4 pt-0 text-xs text-primary/80'>
              Max {maxBoxPerPart} boxes / ${maxUsdPerPart}
            </CardContent>
          </Card>
        </div>

        {/* ── Main Tabbed Interface ────────────────────────────────────── */}
        <Tabs defaultValue='wtbox' className='space-y-4'>
          <TabsList className='h-auto p-1.5 gap-2 bg-muted/80 rounded-xl inline-flex flex-wrap w-auto border border-border/60 shadow-sm'>
            <TabsTrigger
              value='wtbox'
              className='h-9 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg gap-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all'
            >
              <Boxes className='h-4 w-4 shrink-0' />
              WT-Box & Console Bags
            </TabsTrigger>
            <TabsTrigger
              value='customs'
              className='h-9 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg gap-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all'
            >
              <FileSpreadsheet className='h-4 w-4 shrink-0' />
              Customs & Chambers
            </TabsTrigger>
            <TabsTrigger
              value='consignees'
              className='h-9 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg gap-2 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all'
            >
              <Building2 className='h-4 w-4 shrink-0' />
              Consignees Directory
            </TabsTrigger>
          </TabsList>

          {/* ══════════════ TAB 1: WT-BOX & BAG CONSOLE ══════════════ */}
          <TabsContent value='wtbox' className='space-y-4'>
            {/* Bag Controls Banner */}
            <Card className='border-primary/20 bg-muted/30'>
              <CardContent className='p-4 flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div className='flex flex-wrap items-center gap-4 text-xs'>
                  <div className='flex items-center gap-2'>
                    <Scale className='h-4 w-4 text-primary shrink-0' />
                    <span className='font-bold text-foreground'>Max Bag Weight:</span>
                    <Input
                      type='number'
                      min={1}
                      max={100}
                      value={maxBagWeight}
                      onChange={(e) => setMaxBagWeight(Number(e.target.value))}
                      className='h-8 w-20 text-xs font-mono font-bold'
                    />
                    <span className='text-muted-foreground'>KG</span>
                  </div>

                  <div className='h-4 w-px bg-border hidden sm:block' />

                  <div className='flex items-center gap-2'>
                    <Switch
                      checked={isBagBased}
                      onCheckedChange={(c) => setIsBagBased(c)}
                      id='bag-based-toggle-wtbox'
                    />
                    <label htmlFor='bag-based-toggle-wtbox' className='font-medium cursor-pointer'>
                      Generate as Bag-Based Invoice
                    </label>
                  </div>
                </div>

                <div className='flex flex-wrap items-center gap-2.5 shrink-0'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={handleAutoSuggestBags}
                    disabled={loading || !selectedMawb}
                    className='gap-1.5 border-primary/40 text-primary hover:bg-primary/10 font-bold shadow-xs'
                  >
                    <Sparkles className='h-3.5 w-3.5 text-amber-500 shrink-0' />
                    Auto Suggest Bags
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => {
                      setBagMarkings({})
                      setSelectedBagForSummary(null)
                    }}
                    className='gap-1.5 text-xs'
                  >
                    Clear Markings
                  </Button>
                  <Button
                    size='sm'
                    onClick={() => {
                      if (downloadUrls.wtbox) {
                        downloadFile(downloadUrls.wtbox.replace('/api/customs/download/', ''))
                      } else {
                        handleGenerate()
                      }
                    }}
                    className='gap-1.5 bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90'
                  >
                    <Download className='h-4 w-4 shrink-0' />
                    Download WT-Box (.xlsx)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 2-Column Responsive Layout: WT Table (2/3) + Bag Inspector (1/3) */}
            <div className='grid grid-cols-1 xl:grid-cols-3 gap-6 items-start'>
              {/* Left Column: WT-Box Table */}
              <Card className='xl:col-span-2'>
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between gap-4'>
                    <div>
                      <CardTitle className='text-base font-bold flex items-center gap-2'>
                        <Boxes className='h-4 w-4 text-primary' />
                        Parcels & Markings Table
                      </CardTitle>
                      <CardDescription className='text-xs'>
                        Click any row or input a bag marking to inspect its consolidated weight.
                      </CardDescription>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      Showing <span className='font-bold text-foreground'>{filteredRows.length}</span> of{' '}
                      {wtRows.length} parcels
                    </div>
                  </div>
                  <div className='relative w-full max-w-sm pt-2'>
                    <Search className='absolute left-2.5 top-4.5 h-4 w-4 text-muted-foreground' />
                    <Input
                      placeholder='Search HAWB, consignee, country, bag marking...'
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className='pl-8 h-8 text-xs'
                    />
                  </div>
                </CardHeader>
                <CardContent className='p-0 sm:p-4'>
                  <div className='rounded-md border overflow-x-auto'>
                    <table className='w-full text-xs'>
                      <thead className='bg-muted/50 text-[11px] font-semibold text-muted-foreground border-b'>
                        <tr>
                          <th className='px-3 py-2.5 text-left'>HAWB #</th>
                          <th className='px-3 py-2.5 text-left'>Consigner &rarr; Consignee</th>
                          <th className='px-3 py-2.5 text-left'>Country</th>
                          <th className='px-3 py-2.5 text-center'>Boxes</th>
                          <th className='px-3 py-2.5 text-right'>Weight (KG)</th>
                          <th className='px-3 py-2.5 text-left w-32'>Bag Marking</th>
                          <th className='px-3 py-2.5 text-center w-28'>Clearance</th>
                          <th className='px-3 py-2.5 text-left'>Database Goods</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {filteredRows.map((r) => {
                          const s = shipments.find((item) => item.hawbno === r.HAWB)
                          const isSep = separateHawbs[r.HAWB] || false
                          const marking = bagMarkings[r.HAWB] ?? r.BagMarking ?? ''
                          const isHighlighted =
                            selectedBagForSummary && marking === selectedBagForSummary

                          return (
                            <tr
                              key={r.HAWB}
                              onClick={() => {
                                if (marking.trim()) setSelectedBagForSummary(marking.trim())
                              }}
                              className={`cursor-pointer transition-colors ${
                                isHighlighted
                                  ? 'bg-primary/10 font-medium'
                                  : isSep
                                  ? 'bg-amber-50/50 dark:bg-amber-950/20'
                                  : 'hover:bg-muted/30'
                              }`}
                            >
                              <td className='px-3 py-2 font-mono font-bold text-xs'>
                                {r.HAWB}
                              </td>
                              <td className='px-3 py-2'>
                                <div className='font-medium'>{r.Details.split('->')[0]}</div>
                                <div className='text-muted-foreground'>
                                  &rarr; {r.Details.split('->')[1]}
                                </div>
                              </td>
                              <td className='px-3 py-2 font-medium'>{r.Country}</td>
                              <td className='px-3 py-2 text-center font-bold'>{r.Box}</td>
                              <td className='px-3 py-2 text-right font-mono font-medium'>{r.Weight}</td>
                              <td className='px-3 py-2' onClick={(e) => e.stopPropagation()}>
                                <Input
                                  value={marking}
                                  onChange={(e) => handleBagMarkingChange(r.HAWB, e.target.value)}
                                  onFocus={() => {
                                    if (marking.trim()) setSelectedBagForSummary(marking.trim())
                                  }}
                                  placeholder='e.g. 1 or 1-8'
                                  className='h-7 text-xs font-mono w-28 font-bold'
                                />
                              </td>
                              <td className='px-3 py-2 text-center' onClick={(e) => e.stopPropagation()}>
                                <div className='flex items-center justify-center gap-1.5'>
                                  <Switch
                                    checked={isSep}
                                    onCheckedChange={(c) => handleSeparateToggle(r.HAWB, c)}
                                  />
                                  <span
                                    className={`text-[10px] font-bold ${
                                      isSep ? 'text-amber-600' : 'text-muted-foreground'
                                    }`}
                                  >
                                    {isSep ? 'Separate' : 'Doko'}
                                  </span>
                                </div>
                              </td>
                              <td className='px-3 py-2'>
                                {s?.enquiryItems && s.enquiryItems.length > 0 ? (
                                  <div className='space-y-0.5 max-w-xs'>
                                    {s.enquiryItems.map((it, i) => (
                                      <div key={i} className='truncate font-medium text-[10px]'>
                                        &bull; {it.description}:{' '}
                                        <span className='font-bold text-primary'>
                                          {it.quantity} PCS
                                        </span>{' '}
                                        (${it.totalValue})
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className='text-muted-foreground italic text-[10px]'>
                                    {s?.goodsDescription || 'General Goods'}
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Right Column: Interactive Bag Summary Panel */}
              <Card className='xl:col-span-1 sticky top-20 border-primary/30 shadow-md bg-card'>
                <CardHeader className='pb-3 border-b'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-sm font-bold flex items-center gap-2'>
                      <ShoppingBag className='h-4 w-4 text-primary' />
                      Bag Consolidation Inspector
                    </CardTitle>
                    <Badge variant='outline' className='text-[10px] font-bold'>
                      Limit: {maxBagWeight} KG
                    </Badge>
                  </div>
                  <CardDescription className='text-xs'>
                    Inspect bag groupings, member HAWBs, and courier overweight limits.
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-4 space-y-4'>
                  {/* Quick Bag Pills */}
                  <div className='space-y-1.5'>
                    <label className='text-[11px] font-bold text-muted-foreground'>
                      Active Bag Markings ({Object.keys(bagGroups).length}):
                    </label>
                    <div className='flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-muted/40 rounded-md border'>
                      {Object.keys(bagGroups).length === 0 ? (
                        <span className='text-xs text-muted-foreground italic p-1'>
                          No bag markings assigned yet. Click "Auto Suggest Bags".
                        </span>
                      ) : (
                        Object.values(bagGroups).map((g) => {
                          const isSelected = selectedBagForSummary === g.marking
                          return (
                            <button
                              key={g.marking}
                              onClick={() => setSelectedBagForSummary(g.marking)}
                              className={`px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 transition-all ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground shadow-xs'
                                  : g.isOverweight
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-200'
                                  : 'bg-background hover:bg-muted text-foreground border border-input'
                              }`}
                            >
                              <span>{g.marking}</span>
                              <span className='text-[10px] opacity-80'>({g.totalWeight}kg)</span>
                              {g.isOverweight && <AlertTriangle className='h-3 w-3 text-amber-500 shrink-0' />}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>

                  {/* Selected Bag Details */}
                  {currentSelectedBagGroup ? (
                    <div className='space-y-3 pt-2 border-t'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs font-bold'>
                            {currentSelectedBagGroup.isConsoleBag ? 'Inspecting Console Bag:' : 'Inspecting Box Range:'}
                          </span>
                          <Badge
                            className={`font-mono text-sm px-2.5 py-0.5 ${
                              currentSelectedBagGroup.isConsoleBag
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground border border-input font-bold'
                            }`}
                          >
                            {currentSelectedBagGroup.marking}
                          </Badge>
                        </div>
                        <span className='text-xs font-bold text-muted-foreground'>
                          {currentSelectedBagGroup.shipments.length} parcel(s)
                        </span>
                      </div>

                      {/* Weight Progress Bar */}
                      <div className='space-y-1 bg-muted/30 p-2.5 rounded-lg border'>
                        <div className='flex items-center justify-between text-xs'>
                          <span className='font-medium text-muted-foreground'>
                            {currentSelectedBagGroup.isConsoleBag ? 'Total Bag Weight:' : 'Total Cargo Weight:'}
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              currentSelectedBagGroup.isOverweight ? 'text-red-600' : 'text-foreground'
                            }`}
                          >
                            {currentSelectedBagGroup.isConsoleBag
                              ? `${currentSelectedBagGroup.totalWeight} / ${maxBagWeight} KG`
                              : `${currentSelectedBagGroup.totalWeight} KG (${currentSelectedBagGroup.totalBoxes} boxes)`}
                          </span>
                        </div>
                        {currentSelectedBagGroup.isConsoleBag ? (
                          <div className='w-full bg-muted rounded-full h-2 overflow-hidden'>
                            <div
                              className={`h-2 rounded-full transition-all ${
                                currentSelectedBagGroup.isOverweight
                                  ? 'bg-red-500'
                                  : currentSelectedBagGroup.totalWeight > maxBagWeight * 0.85
                                  ? 'bg-amber-500'
                                  : 'bg-primary'
                              }`}
                              style={{
                                width: `${Math.min(
                                  (currentSelectedBagGroup.totalWeight / maxBagWeight) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        ) : (
                          <div className='text-[11px] text-muted-foreground pt-0.5'>
                            Multi-box parcel within single HAWB ({currentSelectedBagGroup.shipments[0]?.hawbno}). Individual box weights apply.
                          </div>
                        )}
                      </div>

                      {/* Overweight Alert (Only for console bags exceeding maxBagWeight) */}
                      {currentSelectedBagGroup.isOverweight && (
                        <div className='flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 p-2.5 rounded-lg text-xs text-amber-900 dark:text-amber-200'>
                          <AlertTriangle className='h-4 w-4 text-amber-600 shrink-0 mt-0.5' />
                          <div>
                            <span className='font-bold'>Overweight Warning:</span> Console Bag{' '}
                            {currentSelectedBagGroup.marking} exceeds the {maxBagWeight} KG limit (
                            {currentSelectedBagGroup.totalWeight} KG). Courier guidelines suggest splitting
                            into separate bags.
                          </div>
                        </div>
                      )}

                      {/* Member Shipments List */}
                      <div className='space-y-1.5'>
                        <span className='text-[11px] font-bold text-muted-foreground'>
                          Member Parcels:
                        </span>
                        <div className='divide-y rounded-md border text-xs max-h-48 overflow-y-auto'>
                          {currentSelectedBagGroup.shipments.map((s) => (
                            <div
                              key={s.hawbno}
                              className='p-2 flex items-center justify-between hover:bg-muted/40'
                            >
                              <div>
                                <div className='font-mono font-bold text-foreground'>{s.hawbno}</div>
                                <div className='text-[10px] text-muted-foreground truncate max-w-[140px]'>
                                  {s.receiverName} ({s.destinationCountryName})
                                </div>
                              </div>
                              <div className='text-right'>
                                <div className='font-mono font-bold'>{s.weight} KG</div>
                                <div className='text-[10px] text-muted-foreground'>{s.noOfBox} box(es)</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className='p-6 text-center text-xs text-muted-foreground bg-muted/20 rounded-lg border border-dashed'>
                      <ShoppingBag className='h-6 w-6 text-muted-foreground/60 mx-auto mb-2' />
                      Select any bag marking or click a row in the table to view consolidation metrics.
                    </div>
                  )}

                  {/* Unassigned Warning */}
                  {unassignedHawbs.length > 0 && (
                    <div className='pt-2 border-t text-xs text-muted-foreground flex items-center justify-between'>
                      <span>Unassigned parcels:</span>
                      <Badge variant='secondary' className='font-mono text-xs'>
                        {unassignedHawbs.length}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          {/* ══════════════ TAB 2: CUSTOMS & CHAMBERS SPLITTER ══════════════ */}
          <TabsContent value='customs' className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Part Limits */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm font-bold flex items-center gap-2'>
                    <Layers className='h-4 w-4 text-primary' />
                    Customs Partition Limits
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Shipments split automatically once thresholds are reached.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3 text-sm'>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground'>
                      Max Boxes / Cartons per Part
                    </label>
                    <Input
                      type='number'
                      value={maxBoxPerPart}
                      onChange={(e) => setMaxBoxPerPart(Number(e.target.value))}
                      className='h-8 text-sm mt-1'
                    />
                  </div>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground'>
                      Max Declared Value (USD) per Part
                    </label>
                    <Input
                      type='number'
                      value={maxUsdPerPart}
                      onChange={(e) => setMaxUsdPerPart(Number(e.target.value))}
                      className='h-8 text-sm mt-1'
                    />
                  </div>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground'>
                      Max Weight (KG) per Part
                    </label>
                    <Input
                      type='number'
                      value={maxWeightPerPart}
                      onChange={(e) => setMaxWeightPerPart(Number(e.target.value))}
                      className='h-8 text-sm mt-1'
                    />
                  </div>
                  <div className='pt-2 border-t flex items-center justify-between'>
                    <label htmlFor='customs-bag-toggle' className='text-xs font-medium cursor-pointer'>
                      Bag-Based Invoice Mode
                    </label>
                    <Switch
                      id='customs-bag-toggle'
                      checked={isBagBased}
                      onCheckedChange={(c) => setIsBagBased(c)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Consignee & Date */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm font-bold flex items-center gap-2'>
                    <Building2 className='h-4 w-4 text-primary' />
                    Clearance Consignee
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Appears on Custom Manifest header & Chamber docx.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3 text-sm'>
                  <div>
                    <div className='flex items-center justify-between mb-1'>
                      <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                        Select Customs Consignee
                      </label>
                      <Dialog open={isAddConsigneeOpen} onOpenChange={setIsAddConsigneeOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant='outline'
                            size='sm'
                            className='h-6 text-[11px] font-bold text-primary border-primary/40 hover:bg-primary/10 gap-1 px-2 shadow-xs'
                          >
                            <Plus className='h-3 w-3' /> New Consignee
                          </Button>
                        </DialogTrigger>
                        <DialogContent className='sm:max-w-md'>
                          <DialogHeader>
                            <DialogTitle className='flex items-center gap-2 text-base font-bold'>
                              <Building2 className='h-5 w-5 text-primary' />
                              Create New Customs Consignee
                            </DialogTitle>
                            <DialogDescription className='text-xs text-muted-foreground'>
                              Add a destination clearing agent for Custom Manifest headers and Chamber
                              certificates.
                            </DialogDescription>
                          </DialogHeader>
                          <div className='space-y-3 py-2 text-sm'>
                            <div>
                              <label className='text-xs font-semibold text-foreground'>
                                Company / Consignee Name *
                              </label>
                              <Input
                                placeholder='e.g. ESHIPPER EXPRESS COURIER'
                                value={newConsigneeName}
                                onChange={(e) => setNewConsigneeName(e.target.value)}
                                className='mt-1 text-sm'
                              />
                            </div>
                            <div>
                              <label className='text-xs font-semibold text-foreground'>Address (Optional)</label>
                              <Input
                                placeholder='e.g. Unit 4, Heathrow Cargo Centre, Cranford Way'
                                value={newConsigneeAddress}
                                onChange={(e) => setNewConsigneeAddress(e.target.value)}
                                className='mt-1 text-sm'
                              />
                            </div>
                            <div>
                              <label className='text-xs font-semibold text-foreground'>
                                Destination Country *
                              </label>
                              <Input
                                placeholder='e.g. UK'
                                value={newConsigneeCountry}
                                onChange={(e) => setNewConsigneeCountry(e.target.value)}
                                className='mt-1 text-sm'
                              />
                            </div>
                          </div>
                          <DialogFooter className='gap-2 sm:gap-0'>
                            <Button variant='outline' size='sm' onClick={() => setIsAddConsigneeOpen(false)}>
                              Cancel
                            </Button>
                            <Button size='sm' onClick={handleAddConsignee} className='gap-1.5 font-bold shadow-sm'>
                              <Plus className='h-3.5 w-3.5' /> Save & Select Consignee
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <select
                      value={selectedConsigneeId}
                      onChange={(e) => setSelectedConsigneeId(Number(e.target.value))}
                      className='w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer'
                    >
                      {consignees.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.country})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground'>Invoice / Clearance Date</label>
                    <Input
                      type='date'
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className='h-8 text-xs mt-1'
                    />
                  </div>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground'>Custom Narration / Remarks</label>
                    <Input
                      value={narrationText}
                      onChange={(e) => setNarrationText(e.target.value)}
                      placeholder='Optional remarks at bottom of sheet'
                      className='h-8 text-xs mt-1'
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Invoices per Part */}
              <Card>
                <CardHeader className='pb-3'>
                  <CardTitle className='text-sm font-bold flex items-center gap-2'>
                    <FileText className='h-4 w-4 text-primary' />
                    Part Invoices ({summary.estParts} Parts)
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Assign sequential invoice numbers per split part.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-2 text-sm max-h-48 overflow-y-auto'>
                  {invoiceNumbers.map((inv, idx) => (
                    <div key={idx} className='flex items-center gap-2'>
                      <span className='w-16 text-xs font-bold text-muted-foreground'>Part {idx + 1}:</span>
                      <Input
                        value={inv}
                        onChange={(e) => handleInvoiceChange(idx, e.target.value)}
                        placeholder={`e.g. DK09${idx}-034/35`}
                        className='h-8 text-xs font-mono font-semibold'
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Action Bar */}
            <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm'>
              <div className='space-y-0.5'>
                <h4 className='text-sm font-bold text-foreground'>Ready to Generate Package</h4>
                <p className='text-xs text-muted-foreground'>
                  Creates multi-part <strong>Sheet 1 (Custom Manifest)</strong>,{' '}
                  <strong>Sheet 2 (Real Itemised Packing List with PCS & HS Codes)</strong> and Chamber Certificates.
                </p>
              </div>
              <div className='flex flex-wrap items-center gap-3 shrink-0'>
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !selectedMawb}
                  className='gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md'
                >
                  <Sparkles className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                  {generating ? 'Generating Documents...' : 'Generate Customs & Chambers Package'}
                </Button>
                {downloadUrls.zip && (
                  <Button
                    variant='outline'
                    onClick={() => downloadFile(downloadUrls.zip.replace('/api/customs/download/', ''))}
                    className='gap-2 border-primary/40 text-primary font-bold hover:bg-primary/10'
                  >
                    <Download className='h-4 w-4' />
                    Download All (.zip)
                  </Button>
                )}
                {downloadUrls.tracking && (
                  <Button
                    variant='secondary'
                    onClick={() =>
                      downloadFile(downloadUrls.tracking.replace('/api/customs/download/', ''))
                    }
                    className='gap-2 font-medium'
                  >
                    <Download className='h-4 w-4' />
                    Tracking Report (.xlsx)
                  </Button>
                )}
              </div>
            </div>

            {/* Generated Parts Cards */}
            {generatedParts.length > 0 && (
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='text-sm font-bold flex items-center gap-2'>
                    <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                    Generated Customs Parts ({generatedParts.length})
                  </h3>
                  <span className='text-xs text-muted-foreground'>
                    Click "Preview On Screen" to review the full spreadsheet matrix below.
                  </span>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {generatedParts.map((p, pIdx) => {
                    const isCurrentActive = activePreviewPartIdx === pIdx
                    return (
                      <Card
                        key={p.partNumber}
                        className={`transition-all ${
                          isCurrentActive
                            ? 'border-primary shadow-md ring-2 ring-primary/20 bg-primary/5'
                            : 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/20'
                        }`}
                      >
                        <CardHeader className='pb-2 pt-4'>
                          <div className='flex items-center justify-between'>
                            <Badge
                              variant='outline'
                              className={
                                isCurrentActive
                                  ? 'bg-primary text-primary-foreground font-bold'
                                  : 'bg-emerald-100 text-emerald-900 font-bold'
                              }
                            >
                              Part {p.partNumber}
                            </Badge>
                            <span className='font-mono font-bold text-xs text-foreground'>
                              {p.invoiceNumber}
                            </span>
                          </div>
                          <CardTitle className='text-base font-bold mt-1'>
                            {p.shipmentCount} Parcels | {p.boxes} Boxes
                          </CardTitle>
                          <CardDescription className='text-xs'>
                            Real Total: <span className='font-bold text-foreground'>{p.pcs} PCS</span> &bull;{' '}
                            Declared ${p.usd} USD
                          </CardDescription>
                        </CardHeader>
                        <CardContent className='pt-2 pb-4 space-y-2'>
                          <Button
                            size='sm'
                            variant={isCurrentActive ? 'default' : 'outline'}
                            onClick={() => {
                              setActivePreviewPartIdx(pIdx)
                              const el = document.getElementById('manifest-document-preview')
                              if (el) el.scrollIntoView({ behavior: 'smooth' })
                            }}
                            className='w-full justify-center gap-1.5 text-xs font-semibold'
                          >
                            <Eye className='h-3.5 w-3.5' />
                            Preview On Screen
                          </Button>
                          <div className='grid grid-cols-2 gap-2'>
                            <Button
                              size='sm'
                              variant='outline'
                              onClick={() => downloadFile(p.manifestFilename)}
                              className='w-full justify-between gap-1 text-[11px] border-emerald-300 hover:bg-emerald-100/50'
                            >
                              <span className='truncate'>Excel (.xlsx)</span>
                              <Download className='h-3 w-3 shrink-0' />
                            </Button>
                            {p.chamberFilename ? (
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => downloadFile(p.chamberFilename!)}
                                className='w-full justify-between gap-1 text-[11px] border-blue-300 hover:bg-blue-100/50'
                              >
                                <span className='truncate'>Chamber (.docx)</span>
                                <Download className='h-3 w-3 shrink-0' />
                              </Button>
                            ) : (
                              <div />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* ── ON-SCREEN DOCUMENT PREVIEW SECTION ────────────────────── */}
                <div id='manifest-document-preview' className='pt-6'>
                  <Card className='border-primary/40 shadow-lg'>
                    <CardHeader className='border-b pb-4'>
                      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
                        <div>
                          <CardTitle className='text-lg font-bold flex items-center gap-2'>
                            <FileSpreadsheet className='h-5 w-5 text-primary' />
                            On-Screen Document Preview
                          </CardTitle>
                          <CardDescription className='text-xs'>
                            WYSIWYG inspection of generated Custom Manifest, Packing List, and Chamber of Commerce certificate.
                          </CardDescription>
                        </div>
                        <div className='flex flex-wrap items-center gap-2'>
                          {currentPart && (
                            <>
                              <Button
                                size='sm'
                                variant='outline'
                                onClick={() => downloadFile(currentPart.manifestFilename)}
                                className='gap-1.5 text-xs border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              >
                                <Download className='h-3.5 w-3.5' />
                                Download Part {currentPart.partNumber} Excel
                              </Button>
                              {currentPart.chamberFilename && (
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() => downloadFile(currentPart.chamberFilename!)}
                                  className='gap-1.5 text-xs border-blue-400 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                                >
                                  <Download className='h-3.5 w-3.5' />
                                  Download Part {currentPart.partNumber} Chamber
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Part Selector Tabs */}
                      <div className='flex flex-wrap gap-2 pt-4'>
                        {generatedParts.map((p, idx) => (
                          <button
                            key={p.partNumber}
                            onClick={() => setActivePreviewPartIdx(idx)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                              activePreviewPartIdx === idx
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'bg-muted hover:bg-muted/80 text-foreground border border-input'
                            }`}
                          >
                            <span>
                              Part {p.partNumber} [{p.invoiceNumber}]
                            </span>
                            <Badge
                              variant='secondary'
                              className={`text-[10px] px-1.5 py-0 ${
                                activePreviewPartIdx === idx
                                  ? 'bg-primary-foreground/20 text-primary-foreground'
                                  : ''
                              }`}
                            >
                              {p.boxes} Boxes &bull; ${p.usd}
                            </Badge>
                          </button>
                        ))}
                      </div>

                      {/* Document Type Switcher */}
                      <div className='flex flex-wrap gap-2 pt-2'>
                        <button
                          onClick={() => setActivePreviewDoc('manifest')}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                            activePreviewDoc === 'manifest'
                              ? 'bg-foreground text-background shadow-xs'
                              : 'bg-muted/60 hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <FileSpreadsheet className='h-3.5 w-3.5' />
                          Sheet 1: Custom Manifest (Landscape)
                        </button>
                        <button
                          onClick={() => setActivePreviewDoc('packing_list')}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                            activePreviewDoc === 'packing_list'
                              ? 'bg-foreground text-background shadow-xs'
                              : 'bg-muted/60 hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <Boxes className='h-3.5 w-3.5' />
                          Sheet 2: Itemised Packing List (REAL Items & HS Codes)
                        </button>
                        <button
                          onClick={() => setActivePreviewDoc('chamber')}
                          className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                            activePreviewDoc === 'chamber'
                              ? 'bg-foreground text-background shadow-xs'
                              : 'bg-muted/60 hover:bg-muted text-muted-foreground'
                          }`}
                        >
                          <FileText className='h-3.5 w-3.5' />
                          Chamber Certificate of Origin
                        </button>
                      </div>
                    </CardHeader>

                    <CardContent className='p-4 sm:p-6 overflow-x-auto min-h-[300px]'>
                      {currentPart ? (
                        activePreviewDoc === 'manifest' || activePreviewDoc === 'packing_list' ? (
                          (() => {
                            const sheetKey =
                              activePreviewDoc === 'manifest' ? 'Custom Manifest' : 'Custom Packing List'
                            const sheetRows = currentPart.sheets?.[sheetKey]

                            if (!sheetRows || sheetRows.length === 0) {
                              return (
                                <div className='p-8 text-center text-xs text-muted-foreground'>
                                  No sheet matrix found for {sheetKey}.
                                </div>
                              )
                            }

                            const headerRow = sheetRows[0] || []
                            const dataRows = sheetRows.slice(1)

                            return (
                              <div className='rounded-lg border shadow-xs overflow-hidden'>
                                <div className='overflow-x-auto max-h-[600px]'>
                                  <table className='w-full text-xs border-collapse'>
                                    <thead className='sticky top-0 bg-[#1F4E79] text-white z-10'>
                                      <tr>
                                        {headerRow.map((col: any, colIdx: number) => (
                                          <th
                                            key={colIdx}
                                            className='px-3 py-2.5 font-bold border-r border-[#2C5D88] last:border-r-0 whitespace-nowrap text-left text-[11px]'
                                          >
                                            {String(col ?? '')}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className='divide-y divide-border/60'>
                                      {dataRows.map((row: any[], rIdx: number) => {
                                        const isTotalRow =
                                          rIdx === dataRows.length - 1 &&
                                          row.some((cell) =>
                                            String(cell || '')
                                              .toLowerCase()
                                              .includes('total')
                                          )
                                        return (
                                          <tr
                                            key={rIdx}
                                            className={`${
                                              isTotalRow
                                                ? 'bg-muted/80 font-bold border-t-2 border-foreground/30'
                                                : rIdx % 2 === 0
                                                ? 'bg-background hover:bg-muted/30'
                                                : 'bg-muted/15 hover:bg-muted/30'
                                            }`}
                                          >
                                            {row.map((val: any, cIdx: number) => (
                                              <td
                                                key={cIdx}
                                                className={`px-3 py-2 border-r last:border-r-0 border-border/40 whitespace-nowrap text-[11px] ${
                                                  typeof val === 'number' ? 'text-right font-mono' : 'text-left'
                                                }`}
                                              >
                                                {String(val ?? '')}
                                              </td>
                                            ))}
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )
                          })()
                        ) : (
                          /* Chamber Certificate Preview */
                          (() => {
                            const chamberData = currentPart.chamber
                            if (!chamberData || (chamberData.paragraphs.length === 0 && chamberData.tables.length === 0)) {
                              return (
                                <div className='p-8 text-center text-xs text-muted-foreground'>
                                  No Chamber Certificate available for Part {currentPart.partNumber}.
                                </div>
                              )
                            }
                            return (
                              <div className='max-w-3xl mx-auto bg-card border rounded-xl p-8 shadow-sm space-y-6'>
                                <div className='text-center space-y-1 border-b pb-4'>
                                  <h2 className='text-lg font-extrabold uppercase tracking-wide text-foreground'>
                                    Nepal Chamber of Commerce
                                  </h2>
                                  <p className='text-xs font-semibold text-muted-foreground'>
                                    Certificate of Origin / Export Verification
                                  </p>
                                  <Badge variant='outline' className='font-mono text-xs mt-1'>
                                    Invoice: {currentPart.invoiceNumber}
                                  </Badge>
                                </div>

                                <div className='space-y-3 text-sm leading-relaxed text-foreground'>
                                  {chamberData.paragraphs.map((para, pIdx) => (
                                    <p key={pIdx} className='text-xs leading-6'>
                                      {para}
                                    </p>
                                  ))}
                                </div>

                                {chamberData.tables.length > 0 && (
                                  <div className='space-y-4 pt-2'>
                                    {chamberData.tables.map((tbl, tIdx) => (
                                      <div key={tIdx} className='rounded-lg border overflow-hidden'>
                                        <table className='w-full text-xs'>
                                          <tbody className='divide-y'>
                                            {tbl.map((tRow, trIdx) => (
                                              <tr key={trIdx} className={trIdx === 0 ? 'bg-muted/60 font-bold' : ''}>
                                                {tRow.map((tCell, tcIdx) => (
                                                  <td key={tcIdx} className='px-3 py-2 border-r last:border-r-0'>
                                                    {tCell}
                                                  </td>
                                                ))}
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })()
                        )
                      ) : (
                        <div className='p-8 text-center text-xs text-muted-foreground'>
                          No generated parts available yet. Click "Generate Customs & Chambers Package".
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>


          {/* ══════════════ TAB 3: CONSIGNEES DIRECTORY ══════════════ */}
          <TabsContent value='consignees' className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
              <Card className='md:col-span-1'>
                <CardHeader>
                  <CardTitle className='text-sm font-bold flex items-center gap-2'>
                    <Plus className='h-4 w-4 text-primary' />
                    Add Customs Consignee
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Save clearing agents for the chamber certificate and customs header.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3 text-sm'>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground'>Company / Consignee Name</label>
                    <Input
                      placeholder='e.g. ESHIPPER EXPRESS COURIER'
                      value={newConsigneeName}
                      onChange={(e) => setNewConsigneeName(e.target.value)}
                      className='h-8 text-xs mt-1'
                    />
                  </div>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground'>Address (Optional)</label>
                    <Input
                      placeholder='e.g. Unit 4, Heathrow Cargo Centre'
                      value={newConsigneeAddress}
                      onChange={(e) => setNewConsigneeAddress(e.target.value)}
                      className='h-8 text-xs mt-1'
                    />
                  </div>
                  <div>
                    <label className='text-xs font-medium text-muted-foreground'>Destination Country</label>
                    <Input
                      placeholder='e.g. UK'
                      value={newConsigneeCountry}
                      onChange={(e) => setNewConsigneeCountry(e.target.value)}
                      className='h-8 text-xs mt-1'
                    />
                  </div>
                  <Button onClick={handleAddConsignee} size='sm' className='w-full gap-1.5'>
                    <Plus className='h-3.5 w-3.5' /> Add Consignee
                  </Button>
                </CardContent>
              </Card>

              <Card className='md:col-span-2'>
                <CardHeader>
                  <CardTitle className='text-sm font-bold flex items-center gap-2'>
                    <Building2 className='h-4 w-4 text-primary' />
                    Saved Consignees ({consignees.length})
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Available in the dropdown when generating manifests.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='divide-y rounded-md border'>
                    {consignees.map((c) => (
                      <div key={c.id} className='flex items-center justify-between p-3'>
                        <div>
                          <div className='font-bold text-sm flex items-center gap-2'>
                            {c.name}
                            {c.isDefault && (
                              <Badge variant='outline' className='text-[10px] bg-primary/10 text-primary'>
                                Default
                              </Badge>
                            )}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {c.address ? `${c.address}, ` : ''}{c.country}
                          </div>
                        </div>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleDeleteConsignee(c.id)}
                          className='text-muted-foreground hover:text-red-600 h-8 w-8'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
