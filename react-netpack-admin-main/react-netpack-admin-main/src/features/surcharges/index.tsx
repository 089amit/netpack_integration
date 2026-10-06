import { useState, useEffect, useRef } from 'react'
import {
  Upload,
  FileSpreadsheet,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Download,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { toast } from 'sonner'
import http from '@/utils/http'
import { SURCHARGE_ENDPOINTS } from '@/constants/endpoint'

interface SurchargeRuleItem {
  id: number
  zipCode?: string
  service?: string
  city?: string
  country?: string
  amount?: number
  currency?: string
  description?: string
  isActive?: boolean
  createdAt?: string
}

export default function SurchargesPage() {
  const [rules, setRules] = useState<SurchargeRuleItem[]>([])
  const [total, setTotal] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [uploading, setUploading] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Live tester state
  const [testZip, setTestZip] = useState<string>('')
  const [testCity, setTestCity] = useState<string>('')
  const [testService, setTestService] = useState<string>('')
  const [testResult, setTestResult] = useState<any>(null)
  const [testing, setTesting] = useState<boolean>(false)

  const fetchRules = async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (search.trim()) q.append('search', search.trim())
      q.append('page', String(page))
      q.append('limit', '50')

      const res = await http.get<any>(`${SURCHARGE_ENDPOINTS.LIST}?${q.toString()}`)
      if (res && res.data) {
        setRules(res.data)
        setTotal(res.total || res.data.length)
      } else if (Array.isArray(res)) {
        setRules(res)
        setTotal(res.length)
      }
    } catch (err: any) {
      console.error('Failed to load surcharges:', err)
      toast.error('Failed to load surcharge rules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [page, search])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const toastId = toast.loading('Uploading and processing surcharge file...')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('token')
      const res = await fetch(SURCHARGE_ENDPOINTS.UPLOAD, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Upload failed')
      }

      toast.success(data.message || 'Surcharge file uploaded successfully!', { id: toastId })
      if (fileInputRef.current) fileInputRef.current.value = ''
      setPage(1)
      fetchRules()
    } catch (err: any) {
      console.error('Upload error:', err)
      toast.error(err.message || 'Failed to upload surcharge file', { id: toastId })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteRule = async (id: number) => {
    try {
      await http.delete(SURCHARGE_ENDPOINTS.DELETE(id))
      toast.success('Surcharge rule deleted')
      fetchRules()
    } catch (err) {
      toast.error('Failed to delete rule')
    }
  }

  const handleClearAll = async () => {
    try {
      await http.delete(SURCHARGE_ENDPOINTS.CLEAR_ALL)
      toast.success('All surcharge rules cleared')
      setRules([])
      setTotal(0)
    } catch (err) {
      toast.error('Failed to clear rules')
    }
  }

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testZip.trim() && !testCity.trim()) {
      toast.error('Please enter at least a postal code or city to test')
      return
    }

    setTesting(true)
    setTestResult(null)
    try {
      const res = await http.post<any>(SURCHARGE_ENDPOINTS.CHECK, {
        postalCode: testZip.trim(),
        city: testCity.trim(),
        service: testService.trim() || undefined,
      })
      setTestResult(res)
    } catch (err) {
      toast.error('Failed to check surcharge')
    } finally {
      setTesting(false)
    }
  }

  const downloadSampleCsv = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Zip code,Service,City,Country,Amount\n' +
      '90210,DHL,Beverly Hills,United States,25.00\n' +
      'EC1A 1BB,FedEx,London,United Kingdom,30.00\n' +
      'M5V 2T6,UPS,Toronto,Canada,20.00\n' +
      '2000,DHL,Sydney,Australia,25.00\n' +
      '400001,Aramex,Mumbai,India,15.00\n'
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'surcharge_sample_template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <Header>
        <div className='flex items-center gap-2'>
          <ShieldAlert className='h-5 w-5 text-primary' />
          <h1 className='text-lg font-semibold tracking-tight'>
            Remote Area & Service Surcharges
          </h1>
        </div>
        <div className='ml-auto flex items-center space-x-3'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='space-y-6 p-4 sm:p-6'>
        {/* Top Overview & Upload Card */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader className='pb-3'>
              <div className='flex flex-wrap items-center justify-between gap-2'>
                <div>
                  <CardTitle className='text-base font-bold'>
                    Upload Surcharge Matrix (Excel / CSV)
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Supports files containing columns: <span className='font-semibold'>Zip code, Service, City</span> (e.g. DHL / FedEx Remote Area Lists).
                  </CardDescription>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={downloadSampleCsv}
                  className='h-8 text-xs gap-1.5'
                >
                  <Download className='h-3.5 w-3.5' />
                  <span>Sample CSV</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='rounded-xl border-2 border-dashed border-primary/20 bg-muted/20 p-6 text-center hover:bg-muted/30 transition-colors'>
                <FileSpreadsheet className='mx-auto h-10 w-10 text-primary/70' />
                <p className='mt-2 text-sm font-semibold'>
                  Select or drag & drop CSV or Excel spreadsheet
                </p>
                <p className='text-xs text-muted-foreground mt-1'>
                  Supported formats: .xlsx, .xls, .csv, .txt
                </p>

                <div className='mt-4 flex justify-center'>
                  <label>
                    <input
                      ref={fileInputRef}
                      type='file'
                      accept='.csv,.xlsx,.xls,.txt'
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className='hidden'
                    />
                    <Button
                      type='button'
                      asChild
                      disabled={uploading}
                      className='cursor-pointer gap-2'
                    >
                      <span>
                        <Upload className='h-4 w-4' />
                        {uploading ? 'Processing File...' : 'Choose File to Upload'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Surcharge Live Tester Card */}
          <Card className='border-blue-200/60 bg-blue-50/20 dark:border-blue-900/40 dark:bg-blue-950/10'>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-bold flex items-center gap-1.5 text-blue-900 dark:text-blue-300'>
                <Filter className='h-4 w-4 text-blue-600' />
                Surcharge Live Match Tester
              </CardTitle>
              <CardDescription className='text-xs'>
                Quickly test how destination postal code or city responds.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRunTest} className='space-y-3'>
                <div>
                  <label className='text-[11px] font-semibold text-muted-foreground'>
                    Postal Code / Zip
                  </label>
                  <Input
                    placeholder='e.g., 90210'
                    value={testZip}
                    onChange={(e) => setTestZip(e.target.value)}
                    className='h-8 text-xs bg-background'
                  />
                </div>
                <div>
                  <label className='text-[11px] font-semibold text-muted-foreground'>
                    City (Optional)
                  </label>
                  <Input
                    placeholder='e.g., Beverly Hills'
                    value={testCity}
                    onChange={(e) => setTestCity(e.target.value)}
                    className='h-8 text-xs bg-background'
                  />
                </div>
                <div>
                  <label className='text-[11px] font-semibold text-muted-foreground'>
                    Service (Optional)
                  </label>
                  <Input
                    placeholder='e.g., DHL / FedEx'
                    value={testService}
                    onChange={(e) => setTestService(e.target.value)}
                    className='h-8 text-xs bg-background'
                  />
                </div>
                <Button
                  type='submit'
                  size='sm'
                  disabled={testing}
                  className='w-full h-8 text-xs gap-1.5'
                >
                  <ArrowRight className='h-3.5 w-3.5' />
                  <span>{testing ? 'Checking...' : 'Test Surcharge'}</span>
                </Button>
              </form>

              {testResult && (
                <div
                  className={`mt-3 rounded-md p-2.5 text-xs ${
                    testResult.hasSurcharge
                      ? 'border border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
                      : 'border border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
                  }`}
                >
                  {testResult.hasSurcharge ? (
                    <div className='flex items-start gap-1.5'>
                      <AlertCircle className='h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5' />
                      <div>
                        <p className='font-bold'>{testResult.message}</p>
                        {testResult.amount && (
                          <p className='text-[11px] mt-0.5'>
                            Amount: ${testResult.amount}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className='flex items-center gap-1.5'>
                      <CheckCircle2 className='h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0' />
                      <p className='font-medium'>No remote area surcharge detected for this destination.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Rules Table Card */}
        <Card>
          <CardHeader className='p-4 pb-3'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <CardTitle className='text-base font-bold'>
                  Configured Surcharge Rules ({total})
                </CardTitle>
                <CardDescription className='text-xs'>
                  Active remote area and delivery area surcharge definitions.
                </CardDescription>
              </div>

              <div className='flex items-center gap-2'>
                <div className='relative w-64'>
                  <Search className='absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground' />
                  <Input
                    placeholder='Search zip, city, service...'
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value)
                      setPage(1)
                    }}
                    className='h-8 pl-8 text-xs'
                  />
                </div>

                <Button
                  variant='outline'
                  size='icon'
                  onClick={fetchRules}
                  disabled={loading}
                  className='h-8 w-8 shrink-0'
                  title='Refresh rules'
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                </Button>

                {total > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant='destructive'
                        size='sm'
                        className='h-8 text-xs gap-1'
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                        <span>Clear All</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear All Surcharge Rules?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all {total} uploaded surcharge rules. You can upload a new sheet anytime.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleClearAll}
                          className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                        >
                          Clear All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className='p-0'>
            <div className='border-t overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[140px]'>Zip / Postal Code</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Amount / Currency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className='h-24 text-center text-xs text-muted-foreground'>
                        Loading surcharge rules...
                      </TableCell>
                    </TableRow>
                  ) : rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className='h-32 text-center'>
                        <div className='flex flex-col items-center justify-center text-muted-foreground'>
                          <ShieldAlert className='h-8 w-8 mb-2 opacity-40' />
                          <p className='text-sm font-semibold'>No Surcharge Rules Found</p>
                          <p className='text-xs mt-0.5'>
                            {search
                              ? 'No rules match your search query.'
                              : 'Upload a CSV or Excel sheet with Zip code, Service, and City columns.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className='font-mono font-bold text-xs'>
                          {rule.zipCode || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline' className='text-xs font-semibold'>
                            {rule.service || 'Express'}
                          </Badge>
                        </TableCell>
                        <TableCell className='text-xs font-medium'>
                          {rule.city || '-'}
                        </TableCell>
                        <TableCell className='text-xs text-muted-foreground'>
                          {rule.country || '-'}
                        </TableCell>
                        <TableCell className='text-xs font-semibold'>
                          {rule.amount ? `${rule.currency || 'USD'} ${rule.amount}` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge className='bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px]'>
                            ACTIVE
                          </Badge>
                        </TableCell>
                        <TableCell className='text-right'>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => handleDeleteRule(rule.id)}
                            className='h-7 w-7 text-destructive hover:bg-destructive/10'
                            title='Delete rule'
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </Main>
    </>
  )
}
