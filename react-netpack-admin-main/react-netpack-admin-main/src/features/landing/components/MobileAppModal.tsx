import React, { useState } from 'react'
import { SERVER_URL } from '@/constants/endpoint'
import {
  Smartphone,
  Download,
  X,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react'

export const MobileAppModal: React.FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  const [selectedApp, setSelectedApp] = useState<'customer' | 'rider'>('customer')

  if (!open) return null

  const customerDownloadUrl = `${SERVER_URL}/download/customer.apk`
  const riderDownloadUrl = `${SERVER_URL}/download/rider.apk`

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200'>
      <div className='relative w-full max-w-lg rounded-3xl bg-[#0D1B2A] border border-white/15 text-white p-6 sm:p-8 shadow-2xl overflow-hidden'>
        {/* Glow backdrop */}
        <div className='absolute -top-12 -right-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none' />

        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition'
        >
          <X className='w-5 h-5' />
        </button>

        {/* Modal Header */}
        <div className='flex items-center gap-3 mb-6'>
          <div className='p-3 rounded-2xl bg-[#FF7A1A]/10 border border-[#FF7A1A]/20'>
            <Smartphone className='w-6 h-6 text-[#FF7A1A]' />
          </div>
          <div>
            <span className='text-[10px] font-mono tracking-widest text-[#FF7A1A] uppercase'>
              ANDROID PRODUCTION APKS
            </span>
            <h3 className='text-2xl font-bold font-display uppercase tracking-tight'>
              Install Mobile Applications
            </h3>
          </div>
        </div>

        {/* App Switcher Tabs */}
        <div className='grid grid-cols-2 gap-3 p-1 rounded-2xl bg-white/5 border border-white/10 mb-6'>
          <button
            type='button'
            onClick={() => setSelectedApp('customer')}
            className={`py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              selectedApp === 'customer'
                ? 'bg-[#2F6BFF] text-white shadow-lg shadow-[#2F6BFF]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className='w-4 h-4' />
            <span>Customer App</span>
          </button>

          <button
            type='button'
            onClick={() => setSelectedApp('rider')}
            className={`py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
              selectedApp === 'rider'
                ? 'bg-[#FF7A1A] text-white shadow-lg shadow-[#FF7A1A]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className='w-4 h-4' />
            <span>Rider / Agent App</span>
          </button>
        </div>

        {/* Tab 1: Customer App */}
        {selectedApp === 'customer' && (
          <div className='space-y-4 animate-in fade-in duration-200'>
            <div className='p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs'>
              <div className='flex justify-between text-slate-400 font-mono'>
                <span>Package: com.netpacklogistic.app</span>
                <span className='text-green-400 font-bold'>Size: ~70 KB</span>
              </div>
              <p className='text-slate-300 font-sans leading-relaxed'>
                Schedule doorstep parcel pickups, check chargeable weights, track verified milestones, and view customs invoices in real time.
              </p>
            </div>

            <a
              href={customerDownloadUrl}
              download='Netpack-Customer.apk'
              className='w-full py-4 rounded-2xl bg-[#2F6BFF] hover:bg-[#2558d6] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-xl shadow-[#2F6BFF]/25'
            >
              <Download className='w-4 h-4' />
              <span>Download Customer APK</span>
            </a>
          </div>
        )}

        {/* Tab 2: Rider App */}
        {selectedApp === 'rider' && (
          <div className='space-y-4 animate-in fade-in duration-200'>
            <div className='p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs'>
              <div className='flex justify-between text-slate-400 font-mono'>
                <span>Package: com.netpacklogistic.rider</span>
                <span className='text-green-400 font-bold'>Size: ~91 KB</span>
              </div>
              <p className='text-slate-300 font-sans leading-relaxed'>
                Equipped with Google Maps navigation turn-by-turn routing, direct native camera scale capture, and station-by-station pickup verification.
              </p>
            </div>

            <a
              href={riderDownloadUrl}
              download='Netpack-Rider.apk'
              className='w-full py-4 rounded-2xl bg-[#FF7A1A] hover:bg-[#e66c14] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-xl shadow-[#FF7A1A]/25'
            >
              <Download className='w-4 h-4' />
              <span>Download Rider APK</span>
            </a>
          </div>
        )}

        {/* Security / Verification Badge */}
        <div className='mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400'>
          <span className='flex items-center gap-1.5'>
            <ShieldCheck className='w-4 h-4 text-[#10B981]' />
            <span>Cryptographically Signed (v1, v2, v3)</span>
          </span>
          <span>Target Android 14+</span>
        </div>
      </div>
    </div>
  )
}
