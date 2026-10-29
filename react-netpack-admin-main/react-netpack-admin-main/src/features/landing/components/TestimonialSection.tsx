import React from 'react'
import { LANDING_CONFIG } from '../config'
import { Quote, Award, MapPin } from 'lucide-react'

export const TestimonialSection: React.FC = () => {
  const { about } = LANDING_CONFIG

  return (
    <section id='about' className='relative w-full py-24 md:py-36 bg-[#F5F7FA] text-slate-900 border-t border-slate-200/80'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center'>
          {/* LEFT COLUMN: Editorial Portrait / Branded Emblem */}
          <div className='lg:col-span-5'>
            <div className='relative aspect-[4/5] max-w-md mx-auto rounded-3xl overflow-hidden bg-gradient-to-br from-[#0D1B2A] to-[#1E293B] p-8 sm:p-10 text-white flex flex-col justify-between shadow-2xl border border-slate-300'>
              {/* Decorative Watermark Silhouette */}
              <div className='absolute top-0 right-0 -mr-12 -mt-12 w-64 h-64 rounded-full bg-blue-600/10 blur-2xl pointer-events-none' />

              {/* Top Crest */}
              <div className='flex items-center justify-between relative z-10'>
                <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-mono tracking-widest text-[#FF7A1A] border border-white/10 uppercase'>
                  <Award className='w-3.5 h-3.5' />
                  <span>FOUNDED IN KATHMANDU</span>
                </div>
                <span className='font-mono text-xs opacity-50'>EST. 2024</span>
              </div>

              {/* Minimalist Editorial Illustration of Global Network Hub */}
              <div className='relative z-10 my-auto py-8 text-center'>
                <div className='w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-[#2F6BFF] to-[#FF7A1A] p-0.5 shadow-xl shadow-blue-500/20 mb-6'>
                  <div className='w-full h-full rounded-full bg-[#0D1B2A] flex items-center justify-center font-display font-extrabold text-3xl text-white'>
                    NP
                  </div>
                </div>

                <div className='space-y-1'>
                  <h4 className='text-2xl font-bold font-display tracking-tight text-white'>
                    {about.author}
                  </h4>
                  <p className='text-xs font-mono text-slate-400 uppercase tracking-widest'>
                    {about.role}
                  </p>
                  <p className='text-xs font-mono text-[#38BDF8] flex items-center justify-center gap-1 mt-2'>
                    <MapPin className='w-3 h-3' />
                    <span>{about.location}</span>
                  </p>
                </div>
              </div>

              {/* Bottom Credential Bar */}
              <div className='relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400'>
                <span>LICENSED CARRIER</span>
                <span className='text-green-400 font-bold'>VERIFIED AIR OPS</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Long-Form Leadership Statement */}
          <div className='lg:col-span-7 space-y-6'>
            <div className='inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-[#2F6BFF] uppercase'>
              <span>ABOUT NETPACK LOGISTIC</span>
              <span>•</span>
              <span>OUR CONVICTION</span>
            </div>

            <h2 className='text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase font-display tracking-tight leading-tight text-slate-900'>
              {about.headline}
            </h2>

            <div className='relative pl-6 sm:pl-8 border-l-2 border-[#2F6BFF] my-6'>
              <Quote className='w-8 h-8 text-[#2F6BFF]/30 absolute -top-4 -left-4 fill-current' />
              <p className='text-lg sm:text-xl text-slate-700 leading-relaxed font-sans italic'>
                "{about.quote}"
              </p>
            </div>

            <div className='grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200'>
              <div>
                <span className='text-2xl sm:text-3xl font-extrabold font-display text-slate-900 block'>
                  100%
                </span>
                <span className='text-xs font-mono text-slate-500 uppercase mt-1 block'>
                  Customs Compliant
                </span>
              </div>
              <div>
                <span className='text-2xl sm:text-3xl font-extrabold font-display text-[#2F6BFF] block'>
                  45+
                </span>
                <span className='text-xs font-mono text-slate-500 uppercase mt-1 block'>
                  Direct Countries
                </span>
              </div>
              <div className='col-span-2 sm:col-span-1'>
                <span className='text-2xl sm:text-3xl font-extrabold font-display text-[#FF7A1A] block'>
                  Zero
                </span>
                <span className='text-xs font-mono text-slate-500 uppercase mt-1 block'>
                  Untracked Legs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
