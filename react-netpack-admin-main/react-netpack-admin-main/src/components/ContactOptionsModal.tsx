import { useState } from 'react'
import {
  Phone,
  MessageCircle,
  Copy,
  Check,
  X,
  ExternalLink,
  MessageSquare,
  Globe,
} from 'lucide-react'
import { toast } from 'sonner'

export interface ContactTarget {
  name: string
  phone: string
  role?: 'rider' | 'consignee' | 'sender' | 'support'
  trackingNumber?: string
  destinationCountry?: string
}

interface Props {
  target: ContactTarget | null
  onClose: () => void
}

/**
 * Normalizes phone numbers for WhatsApp international dialing.
 * Handles Nepal local numbers (+977 / 98...) and international formats (+1, +44, +61, etc.)
 */
export function getCleanWhatsAppNumber(rawPhone: string, _defaultCountry = 'Nepal'): string {
  if (!rawPhone) return ''
  // Strip all non-digit characters except leading plus if any
  let cleaned = rawPhone.replace(/[^\d+]/g, '')
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }

  // If local Nepal 10-digit number without country code (e.g. 9841234567, 9801234567, 974...)
  if (cleaned.length === 10 && (cleaned.startsWith('98') || cleaned.startsWith('97') || cleaned.startsWith('96'))) {
    cleaned = '977' + cleaned
  } else if (cleaned.length === 9 && cleaned.startsWith('1')) {
    // Kathmandu landline (e.g. 014xxxxxx -> 97714xxxxxx)
    cleaned = '977' + cleaned
  }

  return cleaned
}

/**
 * Builds direct WhatsApp URL with custom pre-filled message
 */
export function buildWhatsAppUrl(
  phone: string,
  role?: string,
  trackingNumber?: string,
  country?: string
): string {
  const cleanPhone = getCleanWhatsAppNumber(phone, country)
  let message = 'Hello! Contacting you regarding NetPack Logistic.'

  if (role === 'rider') {
    message = trackingNumber
      ? `Hello Rider, I am contacting you regarding my NetPack shipment (Tracking: ${trackingNumber}).`
      : 'Hello Rider, I am contacting you regarding my scheduled NetPack doorstep pickup.'
  } else if (role === 'consignee') {
    message = trackingNumber
      ? `Hello! I am your NetPack Logistic dispatch courier for parcel #${trackingNumber}.`
      : 'Hello! Contacting you regarding your incoming NetPack parcel delivery.'
  } else if (role === 'sender') {
    message = trackingNumber
      ? `Hello, this is NetPack dispatch contacting you for booking #${trackingNumber}.`
      : 'Hello, this is your NetPack rider regarding your doorstep pickup.'
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function ContactOptionsModal({ target, onClose }: Props) {
  const [copied, setCopied] = useState(false)

  if (!target || !target.phone) return null

  const whatsAppUrl = buildWhatsAppUrl(
    target.phone,
    target.role,
    target.trackingNumber,
    target.destinationCountry
  )

  const handleCopy = () => {
    navigator.clipboard.writeText(target.phone)
    setCopied(true)
    toast.success(`Copied phone: ${target.phone}`)
    setTimeout(() => setCopied(false), 2000)
  }

  const getRoleLabel = () => {
    switch (target.role) {
      case 'rider':
        return 'Assigned Delivery Rider'
      case 'consignee':
        return `Overseas Consignee ${target.destinationCountry ? `(${target.destinationCountry})` : ''}`
      case 'sender':
        return 'Shipper / Sender'
      default:
        return 'Contact'
    }
  }

  const isOverseas = Boolean(
    target.destinationCountry &&
    !target.destinationCountry.toLowerCase().includes('nepal')
  )

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-[#0D1B2A] text-white rounded-t-3xl sm:rounded-3xl border border-white/15 shadow-2xl p-5 sm:p-6 overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {getRoleLabel()}
              </span>
              <h3 className="text-base font-bold text-white truncate max-w-[230px]">
                {target.name || 'Contact Person'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phone number display pill */}
        <div className="my-4 p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-emerald-400" />
            <span className="font-mono text-base font-bold text-white tracking-wide">
              {target.phone}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-semibold flex items-center gap-1 text-gray-200 hover:text-white transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {isOverseas && (
          <div className="mb-4 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-2 text-[11px] text-blue-300">
            <Globe className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              Consignee is international (<strong>{target.destinationCountry}</strong>). WhatsApp free internet voice call & chat is recommended.
            </span>
          </div>
        )}

        {/* Action Options */}
        <div className="space-y-2.5">
          {/* 1. WhatsApp Action (Primary Recommended) */}
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold flex items-center gap-1.5">
                  <span>WhatsApp (Call & Chat)</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-white/25 text-white uppercase font-black">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] font-normal text-emerald-100">
                  Free HD internet call & direct messaging
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 opacity-75 group-hover:opacity-100" />
          </a>

          {/* 2. Standard Cellular Call */}
          <a
            href={`tel:${target.phone}`}
            onClick={onClose}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold border border-white/10 transition-all active:scale-[0.98] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-white">Regular Phone Call</div>
                <p className="text-[11px] font-normal text-gray-400">
                  Open default device cellular dialer
                </p>
              </div>
            </div>
            <Phone className="w-4 h-4 text-gray-400 group-hover:text-white" />
          </a>

          {/* 3. Direct SMS */}
          <a
            href={`sms:${target.phone}`}
            onClick={onClose}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/5 transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-gray-200">Send Cellular SMS</span>
              </div>
            </div>
            <span className="text-[11px] text-gray-400">SMS &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  )
}
