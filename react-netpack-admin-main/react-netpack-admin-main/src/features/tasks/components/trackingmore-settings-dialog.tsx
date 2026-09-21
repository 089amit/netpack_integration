import { useState, useEffect } from 'react'
import {
  Key,
  Webhook,
  Check,
  Copy,
  Send,
  Loader2,
  ShieldCheck,
  HelpCircle,
  Eye,
  EyeOff,
  Radio,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SERVER_URL } from '@/constants/endpoint'

const API_ORIGIN = SERVER_URL

interface TrackingMoreSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSettingsSaved?: () => void
}


export function TrackingMoreSettingsDialog({
  open,
  onOpenChange,
  onSettingsSaved,
}: TrackingMoreSettingsDialogProps) {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [maskedKey, setMaskedKey] = useState('')
  const [configured, setConfigured] = useState(false)

  const [webhookSecret, setWebhookSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [hasSecret, setHasSecret] = useState(false)
  const [maskedSecret, setMaskedSecret] = useState('')

  const [webhookUrl, setWebhookUrl] = useState('')
  const [eventsCount, setEventsCount] = useState(0)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_ORIGIN}/api/tracking/trackingmore/status`)
      if (res.ok) {
        const data = await res.json()
        setConfigured(!!data.configured)
        setMaskedKey(data.apiKeyMasked || '')
        setHasSecret(!!data.hasWebhookSecret)
        setMaskedSecret(data.webhookSecretMasked || '')
        setWebhookUrl(data.webhookUrl || `${API_ORIGIN}/api/tracking/webhook/trackingmore`)
        setEventsCount(data.eventsCount || 0)
      }
    } catch (err) {
      console.error('Failed to fetch TrackingMore status:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchStatus()
      setStatusMessage(null)
      setTestResult(null)
    }
  }, [open])

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {}
    if (apiKey.trim()) payload.apiKey = apiKey.trim()
    if (webhookSecret.trim()) payload.webhookSecret = webhookSecret.trim()

    if (!payload.apiKey && !payload.webhookSecret) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid API Key or Webhook Secret to save' })
      return
    }

    setSaving(true)
    setStatusMessage(null)
    try {
      const res = await fetch(`${API_ORIGIN}/api/tracking/trackingmore/save-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setStatusMessage({ type: 'success', text: 'Credentials saved and persisted to .env successfully!' })
        if (data.configured !== undefined) setConfigured(data.configured)
        if (data.apiKeyMasked) setMaskedKey(data.apiKeyMasked)
        if (data.hasWebhookSecret !== undefined) setHasSecret(data.hasWebhookSecret)
        if (data.webhookSecretMasked) setMaskedSecret(data.webhookSecretMasked)
        setApiKey('')
        setWebhookSecret('')
        if (onSettingsSaved) onSettingsSaved()
      } else {
        setStatusMessage({ type: 'error', text: data.detail || 'Failed to save credentials' })
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Network error communicating with backend server' })
    } finally {
      setSaving(false)
    }
  }

  const handleCopyWebhook = () => {
    if (!webhookUrl) return
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSendTestWebhook = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${API_ORIGIN}/api/tracking/trackingmore/test-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'OUT_FOR_DELIVERY',
          location: 'Destination Courier Gateway Hub',
          activity: 'Shipment handed to courier driver - Out for immediate delivery',
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setTestResult(data)
        setEventsCount((prev) => prev + 1)
      } else {
        setTestResult({ error: data.detail || 'Test webhook simulation failed' })
      }
    } catch (err) {
      setTestResult({ error: 'Connection error while executing test webhook' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <Radio className='h-5 w-5 text-primary' />
            <DialogTitle className='text-lg font-semibold'>
              TrackingMore API & Webhooks Setup
            </DialogTitle>
          </div>
          <DialogDescription className='text-xs'>
            Configure unified multi-carrier & airline tracking with TrackingMore and verify live webhooks before deployment.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className='flex items-center justify-center py-10'>
            <Loader2 className='h-6 w-6 animate-spin text-primary' />
            <span className='ml-2 text-sm text-muted-foreground'>Loading configuration...</span>
          </div>
        ) : (
          <div className='space-y-5 pt-2'>
            {/* ── Status Banner ── */}
            <div
              className={`flex items-center justify-between rounded-lg border p-3 ${
                configured
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200'
                  : 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200'
              }`}
            >
              <div className='flex items-center gap-2.5'>
                {configured ? (
                  <ShieldCheck className='h-5 w-5 text-emerald-600 dark:text-emerald-400' />
                ) : (
                  <Key className='h-5 w-5 text-amber-600 dark:text-amber-400' />
                )}
                <div>
                  <p className='text-xs font-bold uppercase tracking-wider'>
                    {configured ? 'TrackingMore Integration Active' : 'API Key Not Set'}
                  </p>
                  <p className='text-xs opacity-90'>
                    API Key: <strong>{maskedKey || 'Not configured'}</strong> • Secret: <strong>{hasSecret ? (maskedSecret || 'Configured') : 'Not set'}</strong> • Events logged: <strong>{eventsCount}</strong>
                  </p>
                </div>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  configured
                    ? 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/80 dark:text-emerald-200'
                    : 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200'
                }`}
              >
                {configured ? 'Connected' : 'Pending'}
              </span>
            </div>

            {/* ── Credentials Form ── */}
            <form onSubmit={handleSaveCredentials} className='space-y-3.5 rounded-lg border p-3.5 bg-background'>
              {/* API Key */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='tm-key' className='text-xs font-semibold flex items-center gap-1.5'>
                    <Key className='h-3.5 w-3.5 text-primary' />
                    TrackingMore API Key
                  </Label>
                  {maskedKey && (
                    <span className='text-[10px] text-muted-foreground font-mono'>
                      Current: {maskedKey}
                    </span>
                  )}
                </div>
                <div className='relative'>
                  <Input
                    id='tm-key'
                    type={showKey ? 'text' : 'password'}
                    placeholder={configured ? 'Enter new API key to update...' : 'e.g. 9a8b7c6d-xxxx-xxxx-xxxx-xxxxxxxxxxxx'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className='pr-9 font-mono text-xs'
                  />
                  <button
                    type='button'
                    onClick={() => setShowKey(!showKey)}
                    className='absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground'
                  >
                    {showKey ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>
              </div>

              {/* Webhook Secret Key */}
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <Label htmlFor='tm-secret' className='text-xs font-semibold flex items-center gap-1.5'>
                    <ShieldCheck className='h-3.5 w-3.5 text-primary' />
                    Webhook Secret Key
                  </Label>
                  <span className='text-[10px] text-muted-foreground'>
                    {hasSecret ? `Current: ${maskedSecret || 'Set'}` : 'Optional / HMAC Verification'}
                  </span>
                </div>
                <div className='relative'>
                  <Input
                    id='tm-secret'
                    type={showSecret ? 'text' : 'password'}
                    placeholder={hasSecret ? 'Enter new secret to update...' : 'TrackingMore Webhook Secret (from TrackingMore Dashboard)'}
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    className='pr-9 font-mono text-xs'
                  />
                  <button
                    type='button'
                    onClick={() => setShowSecret(!showSecret)}
                    className='absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground'
                  >
                    {showSecret ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                  </button>
                </div>
                <p className='text-[11px] text-muted-foreground'>
                  Found in your TrackingMore Dashboard under <strong>Settings &gt; Webhook &gt; Webhook Secret</strong>.
                </p>
              </div>

              <div className='flex items-center justify-between pt-1'>
                <Button
                  type='submit'
                  size='sm'
                  disabled={saving || (!apiKey.trim() && !webhookSecret.trim())}
                  className='gap-1.5 text-xs h-9 px-4'
                >
                  {saving && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
                  Save Credentials
                </Button>

                {statusMessage && (
                  <p
                    className={`text-xs ${
                      statusMessage.type === 'success' ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'
                    }`}
                  >
                    {statusMessage.text}
                  </p>
                )}
              </div>
            </form>

            {/* ── Webhook URL Section ── */}
            <div className='space-y-2.5 rounded-lg border p-3.5 bg-background'>
              <div className='flex items-center justify-between'>
                <Label className='text-xs font-semibold flex items-center gap-1.5'>
                  <Webhook className='h-3.5 w-3.5 text-primary' />
                  TrackingMore Webhook Endpoint URL
                </Label>
                <span className='text-[11px] text-muted-foreground'>POST receiver</span>
              </div>
              <p className='text-xs text-muted-foreground'>
                Copy this URL and paste it into your TrackingMore Dashboard under <strong>Settings &gt; Webhook</strong>.
              </p>
              <div className='flex items-center gap-2'>
                <Input
                  readOnly
                  value={webhookUrl}
                  className='font-mono text-xs select-all bg-muted/50 cursor-pointer'
                  onClick={handleCopyWebhook}
                />
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  onClick={handleCopyWebhook}
                  className='gap-1.5 text-xs h-9 shrink-0'
                >
                  {copied ? <Check className='h-3.5 w-3.5 text-emerald-600' /> : <Copy className='h-3.5 w-3.5' />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>

            {/* ── Webhook Testing Section ── */}
            <div className='space-y-3 rounded-lg border border-primary/20 bg-primary/[0.02] p-3.5'>
              <div className='flex items-center justify-between'>
                <div>
                  <h4 className='text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5'>
                    <Send className='h-3.5 w-3.5' />
                    1-Click Webhook Live Test
                  </h4>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    Sends a simulated TrackingMore webhook event to test database ingestion and status updates.
                  </p>
                </div>
                <Button
                  type='button'
                  size='sm'
                  disabled={testing}
                  onClick={handleSendTestWebhook}
                  className='text-xs gap-1.5 shrink-0'
                >
                  {testing ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Send className='h-3.5 w-3.5' />}
                  {testing ? 'Testing...' : 'Send Test Webhook'}
                </Button>
              </div>

              {testResult && (
                <div className='mt-2 rounded-md border bg-muted/40 p-3 text-xs space-y-1.5'>
                  {testResult.error ? (
                    <p className='text-red-600 font-semibold'>{testResult.error}</p>
                  ) : (
                    <>
                      <div className='flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-semibold'>
                        <span className='flex items-center gap-1.5'>
                          <Check className='h-3.5 w-3.5' /> Webhook Ingested Successfully!
                        </span>
                        <span className='font-mono text-[10px] bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded'>
                          HTTP 200 OK
                        </span>
                      </div>
                      <div className='grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]'>
                        <div>
                          <span className='text-muted-foreground'>Shipment ID:</span> #{testResult.shipmentId}
                        </div>
                        <div>
                          <span className='text-muted-foreground'>HAWB:</span> {testResult.hawbno || 'N/A'}
                        </div>
                        <div>
                          <span className='text-muted-foreground'>New Status:</span>{' '}
                          <span className='font-bold text-primary'>{testResult.newStatus}</span>
                        </div>
                        <div>
                          <span className='text-muted-foreground'>Enquiry Sync:</span>{' '}
                          <span className='font-bold text-emerald-600'>{testResult.enquiryStatus}</span>
                        </div>
                      </div>
                      <div className='text-[10px] text-muted-foreground border-t pt-1.5'>
                        Checkpoint added: &ldquo;{testResult.checkpoint?.activity}&rdquo; at {testResult.checkpoint?.location}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Instructions Footer ── */}
            <div className='flex items-start gap-2 text-xs text-muted-foreground border-t pt-3'>
              <HelpCircle className='h-4 w-4 shrink-0 text-primary mt-0.5' />
              <p>
                TrackingMore API keys can also be directly placed in <code>netpack-backend-python/.env</code> as{' '}
                <code>TRACKINGMORE_API_KEY=your_key</code>. Webhooks automatically synchronize carrier milestones and mark consignments as Arrived at Hub or Delivered.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
