import { useState, useEffect } from 'react'
import {
  Mail,
  Send,
  Inbox,
  Eye,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Server,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { SERVER_URL } from '@/constants/endpoint'

const API_BASE = SERVER_URL

interface EmailItem {
  id: number
  sender: string | null
  recipient: string
  subject: string
  status: 'SENT' | 'SIMULATED' | 'FAILED' | 'RECEIVED' | string
  provider: string | null
  direction: 'OUTBOUND' | 'INBOUND' | string
  errorMessage: string | null
  preview: string
  createdAt: string
}

interface SmtpStatus {
  configured: boolean
  host: string
  port: number
  user: string
  fromEmail: string
  useTls: boolean
  useSsl: boolean
  mode: string
}

export function EmailMailbox() {
  const [smtpStatus, setSmtpStatus] = useState<SmtpStatus | null>(null)
  const [emails, setEmails] = useState<EmailItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)

  // Simulation of inbound message
  const [inboundSender, setInboundSender] = useState('')
  const [inboundSubject, setInboundSubject] = useState('')
  const [inboundBody, setInboundBody] = useState('')
  const [showInboundModal, setShowInboundModal] = useState(false)
  const [sendingInbound, setSendingInbound] = useState(false)

  // Preview dialog
  const [previewEmail, setPreviewEmail] = useState<EmailItem | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const fetchStatus = () => {
    fetch(`${API_BASE}/api/sendEmail/smtp-status`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSmtpStatus(data)
      })
      .catch(() => {})
  }

  const fetchEmails = () => {
    setLoading(true)
    fetch(`${API_BASE}/api/sendEmail/history?limit=30`)
      .then((res) => (res.ok ? res.json() : { total: 0, emails: [] }))
      .then((data) => {
        setEmails(data.emails || [])
        setTotalCount(data.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchStatus()
    fetchEmails()
  }, [])

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid target email address')
      return
    }

    setSendingTest(true)
    try {
      const res = await fetch(`${API_BASE}/api/sendEmail/test-smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testEmail.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Diagnostic ping sent to ${testEmail}!`)
        fetchEmails()
        fetchStatus()
      } else {
        toast.error(data.detail || 'SMTP diagnostic ping failed.')
        fetchEmails()
      }
    } catch (err: any) {
      toast.error(`Error sending test email: ${err.message || 'Network error'}`)
    } finally {
      setSendingTest(false)
    }
  }

  const handleSimulateInbound = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inboundSender || !inboundSubject || !inboundBody) {
      toast.error('Please fill in sender email, subject, and message body')
      return
    }

    setSendingInbound(true)
    try {
      const res = await fetch(`${API_BASE}/api/sendEmail/inbound`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: inboundSender.trim(),
          subject: inboundSubject.trim(),
          body: inboundBody.trim(),
        }),
      })
      if (res.ok) {
        toast.success('Inbound message simulated and saved into mailbox!')
        setShowInboundModal(false)
        setInboundSender('')
        setInboundSubject('')
        setInboundBody('')
        fetchEmails()
      } else {
        toast.error('Failed simulating inbound message')
      }
    } catch {
      toast.error('Network error simulating inbound message')
    } finally {
      setSendingInbound(false)
    }
  }

  const handleClearHistory = async () => {
    if (!confirm('Clear all logged email messages?')) return
    try {
      await fetch(`${API_BASE}/api/sendEmail/clear-history`, {
        method: 'DELETE',
      })
      toast.success('Email history cleared')
      fetchEmails()
    } catch {
      toast.error('Failed to clear email history')
    }
  }

  return (
    <div className='space-y-6 pt-4'>
      {/* ─── SMTP Server Configuration Status ─────────────────────── */}
      <div className='rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-xs'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400'>
              <Server className='w-5 h-5' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h3 className='font-bold text-sm text-slate-900 dark:text-white'>
                  Email Server Dispatch Engine
                </h3>
                {smtpStatus?.configured ? (
                  <Badge className='bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] gap-1'>
                    <CheckCircle2 className='w-3 h-3' /> Live SMTP Active
                  </Badge>
                ) : (
                  <Badge variant='secondary' className='text-[11px] gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'>
                    <Clock className='w-3 h-3' /> In-App Mailbox Mode (Simulated)
                  </Badge>
                )}
              </div>
              <p className='text-xs text-muted-foreground mt-0.5'>
                {smtpStatus?.configured
                  ? `Configured via ${smtpStatus.host}:${smtpStatus.port} • From: ${smtpStatus.fromEmail}`
                  : 'Live SMTP credentials not set in .env. All outgoing emails are logged below with full HTML layout for inspection!'}
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                fetchStatus()
                fetchEmails()
              }}
              className='gap-1.5 text-xs'
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant='default'
              size='sm'
              onClick={() => setShowInboundModal(true)}
              className='gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700'
            >
              <Inbox className='w-3.5 h-3.5' />
              Simulate Inbound
            </Button>
          </div>
        </div>

        {/* Diagnostic ping form */}
        <form onSubmit={handleSendTestEmail} className='mt-4 flex flex-col sm:flex-row items-center gap-2.5'>
          <div className='relative flex-1 w-full'>
            <Mail className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
            <Input
              type='email'
              placeholder='Enter your email address to test dispatch (e.g. you@gmail.com)'
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className='pl-9 text-xs h-9'
            />
          </div>
          <Button
            type='submit'
            size='sm'
            disabled={sendingTest}
            className='w-full sm:w-auto h-9 gap-1.5 text-xs font-semibold shrink-0 bg-blue-600 hover:bg-blue-700'
          >
            <Send className='w-3.5 h-3.5' />
            {sendingTest ? 'Sending Ping...' : 'Send Test Email'}
          </Button>
        </form>
      </div>

      {/* ─── Live In-App Mailbox Log ─────────────────────────────────── */}
      <div className='rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-xs'>
        <div className='p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Inbox className='w-4 h-4 text-blue-600' />
            <h4 className='font-bold text-sm text-slate-900 dark:text-white'>
              Recent Email Activity & Inspect Log
            </h4>
            <span className='text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'>
              {totalCount} messages
            </span>
          </div>

          {emails.length > 0 && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleClearHistory}
              className='text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 gap-1 h-7'
            >
              <Trash2 className='w-3 h-3' />
              Clear Log
            </Button>
          )}
        </div>

        {emails.length === 0 ? (
          <div className='p-12 text-center'>
            <div className='w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-3'>
              <Mail className='w-6 h-6' />
            </div>
            <h5 className='font-bold text-sm text-slate-800 dark:text-white'>No Emails Recorded Yet</h5>
            <p className='text-xs text-muted-foreground mt-1 max-w-sm mx-auto'>
              Book a shipment from the customer portal, register a new account, or send a diagnostic ping to see logged emails here in full HTML.
            </p>
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-xs text-left'>
              <thead className='bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800'>
                <tr>
                  <th className='py-3 px-4'>Date / Time</th>
                  <th className='py-3 px-4'>Direction</th>
                  <th className='py-3 px-4'>To / From</th>
                  <th className='py-3 px-4'>Subject</th>
                  <th className='py-3 px-4'>Status</th>
                  <th className='py-3 px-4 text-right'>Action</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100 dark:divide-slate-800'>
                {emails.map((m) => {
                  const isOutbound = m.direction !== 'INBOUND'
                  return (
                    <tr key={m.id} className='hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors'>
                      <td className='py-3 px-4 whitespace-nowrap text-muted-foreground'>
                        {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }) : 'Just now'}
                      </td>
                      <td className='py-3 px-4 whitespace-nowrap'>
                        {isOutbound ? (
                          <span className='inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400'>
                            <ArrowUpRight className='w-3 h-3' /> Outbound
                          </span>
                        ) : (
                          <span className='inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400'>
                            <ArrowDownLeft className='w-3 h-3' /> Inbound
                          </span>
                        )}
                      </td>
                      <td className='py-3 px-4'>
                        <div className='font-medium text-slate-900 dark:text-white truncate max-w-[180px]'>
                          {isOutbound ? m.recipient : m.sender}
                        </div>
                        <div className='text-[10px] text-muted-foreground truncate max-w-[180px]'>
                          {m.provider || 'Internal'}
                        </div>
                      </td>
                      <td className='py-3 px-4'>
                        <div className='font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[220px]'>
                          {m.subject}
                        </div>
                        <div className='text-[10px] text-muted-foreground truncate max-w-[220px]'>
                          {m.preview}
                        </div>
                      </td>
                      <td className='py-3 px-4 whitespace-nowrap'>
                        {m.status === 'SENT' ? (
                          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800'>
                            <CheckCircle2 className='w-2.5 h-2.5' /> Sent
                          </span>
                        ) : m.status === 'SIMULATED' ? (
                          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-[10px] font-bold border border-blue-200 dark:border-blue-800'>
                            <Clock className='w-2.5 h-2.5' /> Simulated
                          </span>
                        ) : m.status === 'RECEIVED' ? (
                          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold border border-indigo-200 dark:border-indigo-800'>
                            <Inbox className='w-2.5 h-2.5' /> Received
                          </span>
                        ) : (
                          <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-[10px] font-bold border border-rose-200 dark:border-rose-800'>
                            <AlertCircle className='w-2.5 h-2.5' /> Failed
                          </span>
                        )}
                      </td>
                      <td className='py-3 px-4 text-right whitespace-nowrap'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => {
                            setPreviewEmail(m)
                            setPreviewOpen(true)
                          }}
                          className='h-7 text-xs gap-1 cursor-pointer'
                        >
                          <Eye className='w-3 h-3' />
                          View Email
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Preview Modal ─────────────────────────────────────────── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className='max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden'>
          <DialogHeader className='p-4 border-b border-slate-100 dark:border-slate-800 shrink-0'>
            <div className='flex items-center justify-between'>
              <div>
                <DialogTitle className='text-sm font-bold text-slate-900 dark:text-white truncate max-w-md'>
                  {previewEmail?.subject}
                </DialogTitle>
                <p className='text-xs text-muted-foreground mt-0.5'>
                  To: {previewEmail?.recipient} • Status: {previewEmail?.status}
                </p>
              </div>
              <a
                href={`${API_BASE}/api/sendEmail/view/${previewEmail?.id}`}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold'
              >
                <span>Full Tab</span>
                <ExternalLink className='w-3.5 h-3.5' />
              </a>
            </div>
          </DialogHeader>
          <div className='flex-1 bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4'>
            {previewEmail && (
              <iframe
                src={`${API_BASE}/api/sendEmail/view/${previewEmail.id}`}
                title='Email Preview'
                className='w-full min-h-[460px] bg-white rounded-xl shadow-xs border border-slate-200 dark:border-slate-800'
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Simulate Inbound Modal ─────────────────────────────────── */}
      <Dialog open={showInboundModal} onOpenChange={setShowInboundModal}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-base font-bold flex items-center gap-2'>
              <Inbox className='w-4 h-4 text-indigo-600' />
              Simulate Inbound Customer Message
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSimulateInbound} className='space-y-3 pt-2 text-xs'>
            <div>
              <label className='font-semibold text-slate-700 dark:text-slate-300 block mb-1'>
                Sender Email
              </label>
              <Input
                type='email'
                placeholder='customer@example.com'
                value={inboundSender}
                onChange={(e) => setInboundSender(e.target.value)}
                className='h-8 text-xs'
              />
            </div>
            <div>
              <label className='font-semibold text-slate-700 dark:text-slate-300 block mb-1'>
                Subject
              </label>
              <Input
                placeholder='Urgent: Delivery status for Consignment NP-104921'
                value={inboundSubject}
                onChange={(e) => setInboundSubject(e.target.value)}
                className='h-8 text-xs'
              />
            </div>
            <div>
              <label className='font-semibold text-slate-700 dark:text-slate-300 block mb-1'>
                Message Content
              </label>
              <textarea
                rows={4}
                placeholder='Hello NetPack, please confirm if my cargo has reached Dubai Hub...'
                value={inboundBody}
                onChange={(e) => setInboundBody(e.target.value)}
                className='w-full rounded-md border border-slate-200 dark:border-slate-800 p-2 text-xs bg-transparent dark:text-white'
              />
            </div>
            <div className='flex justify-end gap-2 pt-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setShowInboundModal(false)}
                className='text-xs'
              >
                Cancel
              </Button>
              <Button
                type='submit'
                size='sm'
                disabled={sendingInbound}
                className='text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold'
              >
                {sendingInbound ? 'Receiving...' : 'Simulate Receive'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
