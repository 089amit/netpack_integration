import React, { useState } from 'react'
import { LANDING_CONFIG, ServiceItem } from '../config'
import {
  Zap,
  Globe,
  FileCheck,
  Truck,
  Boxes,
  Warehouse,
  ArrowRight,
  CheckCircle2,
  X,
} from 'lucide-react'

export const ServicesSection: React.FC<{ onSelectServiceForQuote?: (title: string) => void }> = ({
  onSelectServiceForQuote,
}) => {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)

  const getServiceIcon = (name: string) => {
    switch (name) {
      case 'Zap':
        return <Zap className='w-6 h-6 text-[#FF7A1A]' />
      case 'Globe':
        return <Globe className='w-6 h-6 text-[#2F6BFF]' />
      case 'FileCheck':
        return <FileCheck className='w-6 h-6 text-[#10B981]' />
      case 'Truck':
        return <Truck className='w-6 h-6 text-[#38BDF8]' />
      case 'Boxes':
        return <Boxes className='w-6 h-6 text-[#F59E0B]' />
      case 'Warehouse':
        return <Warehouse className='w-6 h-6 text-[#8B5CF6]' />
      default:
        return <Globe className='w-6 h-6 text-[#2F6BFF]' />
    }
  }

  return (
    <section id='services' className='relative w-full py-24 md:py-36 bg-[#F5F7FA] text-slate-900 overflow-hidden'>
      {/* Huge Kinetic Marquee Text scrolling behind the cards */}
      <div className='absolute top-12 left-0 right-0 select-none pointer-events-none opacity-[0.04] overflow-hidden whitespace-nowrap z-0'>
        <div className='text-[10rem] sm:text-[14rem] md:text-[18rem] font-extrabold uppercase font-display tracking-tighter leading-none text-slate-900'>
          OUR SERVICES • GLOBAL LOGISTICS • DOOR TO DOOR • AIR CARGO •
        </div>
      </div>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Section Header */}
        <div className='max-w-3xl mb-16'>
          <div className='inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-[#2F6BFF] uppercase mb-3'>
            <span>CAPABILITIES</span>
            <span>•</span>
            <span>FULL SUITE CARRIER SERVICES</span>
          </div>
          <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase font-display tracking-tight leading-none'>
            ENGINEERED FOR EVERY FREIGHT PROFILE.
          </h2>
          <p className='mt-4 text-base sm:text-lg text-slate-600'>
            From time-critical medical supplies to commercial handicraft export pallets, we configure optimal transit routing with zero administrative friction.
          </p>
        </div>

        {/* 6-Card Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
          {LANDING_CONFIG.services.map((service) => (
            <div
              key={service.id}
              className='group relative p-8 rounded-3xl bg-white border border-slate-200/80 shadow-md shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between'
            >
              <div>
                <div className='flex items-center justify-between mb-6'>
                  <div className='p-3.5 rounded-2xl bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform'>
                    {getServiceIcon(service.iconName)}
                  </div>
                  <span className='text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-600'>
                    {service.tag}
                  </span>
                </div>

                <h3 className='text-2xl font-bold font-display uppercase tracking-tight text-slate-900 mb-3 group-hover:text-[#2F6BFF] transition-colors'>
                  {service.title}
                </h3>

                <p className='text-sm sm:text-base text-slate-600 leading-relaxed mb-6'>
                  {service.description}
                </p>

                {/* Feature Bullet List */}
                <ul className='space-y-2 mb-8'>
                  {service.features.map((feat, fidx) => (
                    <li key={fidx} className='flex items-center gap-2 text-xs font-medium text-slate-700'>
                      <CheckCircle2 className='w-3.5 h-3.5 text-[#10B981] shrink-0' />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Card Footer Button */}
              <div className='pt-4 border-t border-slate-100 flex items-center justify-between'>
                <button
                  onClick={() => setSelectedService(service)}
                  className='text-xs font-mono font-bold uppercase tracking-wider text-[#2F6BFF] hover:text-[#FF7A1A] transition-colors flex items-center gap-1.5'
                >
                  <span>Learn Details</span>
                  <ArrowRight className='w-3.5 h-3.5 group-hover:translate-x-1 transition-transform' />
                </button>

                <button
                  onClick={() => {
                    if (onSelectServiceForQuote) onSelectServiceForQuote(service.title)
                    const quoteEl = document.getElementById('quote')
                    if (quoteEl) quoteEl.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className='text-[11px] font-mono px-3 py-1 rounded-full border border-slate-200 hover:border-slate-400 text-slate-600 transition'
                >
                  Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learn More Details Modal */}
      {selectedService && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm'>
          <div className='relative w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white text-slate-900 border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200'>
            <button
              onClick={() => setSelectedService(null)}
              className='absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition'
            >
              <X className='w-5 h-5' />
            </button>

            <div className='flex items-center gap-3 mb-4'>
              <div className='p-3 rounded-2xl bg-slate-50 border border-slate-100'>
                {getServiceIcon(selectedService.iconName)}
              </div>
              <div>
                <span className='text-[10px] font-mono font-bold tracking-wider uppercase text-[#2F6BFF]'>
                  {selectedService.tag}
                </span>
                <h3 className='text-2xl font-bold font-display uppercase tracking-tight'>
                  {selectedService.title}
                </h3>
              </div>
            </div>

            <p className='text-sm sm:text-base text-slate-600 leading-relaxed mb-6'>
              {selectedService.description}
            </p>

            <div className='mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100'>
              <h4 className='text-xs font-mono font-bold uppercase tracking-wider text-slate-500 mb-3'>
                SERVICE HIGHLIGHTS & SLA
              </h4>
              <ul className='space-y-2'>
                {selectedService.features.map((feat, fidx) => (
                  <li key={fidx} className='flex items-center gap-2 text-sm text-slate-700'>
                    <CheckCircle2 className='w-4 h-4 text-[#10B981]' />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='flex items-center gap-3'>
              <button
                onClick={() => {
                  setSelectedService(null)
                  if (onSelectServiceForQuote) onSelectServiceForQuote(selectedService.title)
                  const quoteEl = document.getElementById('quote')
                  if (quoteEl) quoteEl.scrollIntoView({ behavior: 'smooth' })
                }}
                className='flex-1 py-3 px-4 rounded-xl bg-[#FF7A1A] hover:bg-[#e66c14] text-white font-bold text-sm tracking-wide transition shadow-lg shadow-[#FF7A1A]/20'
              >
                Book This Service
              </button>
              <button
                onClick={() => setSelectedService(null)}
                className='py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium transition'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
