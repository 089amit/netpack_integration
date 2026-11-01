import React from 'react'
import { LANDING_CONFIG } from '../config'
import { Radio, ShieldCheck, Headphones, ArrowUpRight } from 'lucide-react'

export const SplitReveal: React.FC = () => {
  const featureIcons = [
    <Radio key='1' className='w-7 h-7 text-[#2F6BFF]' />,
    <ShieldCheck key='2' className='w-7 h-7 text-[#10B981]' />,
    <Headphones key='3' className='w-7 h-7 text-[#FF7A1A]' />,
  ]

  return (
    <section className='relative w-full py-20 md:py-28 bg-slate-50 text-slate-900 overflow-hidden border-t border-b border-slate-200'>
      {/* Background ambient glow */}
      <div className='absolute inset-0 bg-radial from-blue-500/5 via-transparent to-transparent pointer-events-none' />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Section Header */}
        <div className='max-w-2xl mb-12'>
          <div className='inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#2F6BFF] uppercase mb-3'>
            <span className='w-2 h-2 rounded-full bg-[#2F6BFF]' />
            <span>ASSURED CUSTODY</span>
          </div>
          <h2 className='text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase font-display tracking-tight leading-none text-slate-900'>
            RELIABILITY AT EVERY MILESTONE.
          </h2>
        </div>

        {/* 3 High-Impact Feature Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8'>
          {LANDING_CONFIG.milestones.map((item, idx) => (
            <div
              key={item.id}
              className='relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 flex flex-col justify-between hover:border-[#2F6BFF]/40 hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-md'
            >
              <div>
                <div className='flex items-center justify-between mb-6'>
                  <div className='p-3 rounded-2xl bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform'>
                    {featureIcons[idx]}
                  </div>
                  <span className='text-[10px] font-mono tracking-widest text-slate-600 uppercase px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200'>
                    {item.tag}
                  </span>
                </div>

                <h3 className='text-xl sm:text-2xl font-bold font-display uppercase tracking-tight text-slate-900 mb-3 group-hover:text-[#2F6BFF] transition-colors'>
                  {item.title}
                </h3>

                <p className='text-sm sm:text-base text-slate-600 leading-relaxed font-sans'>
                  {item.description}
                </p>
              </div>

              <div className='mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500'>
                <span>PROTOCOL 0{idx + 1}</span>
                <ArrowUpRight className='w-4 h-4 text-[#2F6BFF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
