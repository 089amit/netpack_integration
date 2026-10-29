import React, { useState } from 'react'
import { LANDING_CONFIG } from '../config'
import { Eye, EyeOff, Radio, ShieldCheck, Headphones, ArrowUpRight } from 'lucide-react'

export const SplitReveal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true)

  const featureIcons = [
    <Radio key='1' className='w-8 h-8 text-[#2F6BFF]' />,
    <ShieldCheck key='2' className='w-8 h-8 text-[#10B981]' />,
    <Headphones key='3' className='w-8 h-8 text-[#FF7A1A]' />,
  ]

  return (
    <section className='relative w-full py-24 md:py-32 bg-[#0D1B2A] text-white overflow-hidden border-t border-b border-white/10'>
      {/* Background ambient lighting */}
      <div className='absolute inset-0 bg-radial from-blue-900/10 via-transparent to-transparent pointer-events-none' />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
        {/* Section Header */}
        <div className='flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6'>
          <div>
            <div className='inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#2F6BFF] uppercase mb-3'>
              <span className='w-2 h-2 rounded-full bg-[#2F6BFF]' />
              <span>THE ARCHITECTURE OF CERTAINTY</span>
            </div>
            <h2 className='text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase font-display tracking-tight leading-none'>
              RELIABILITY AT EVERY MILESTONE.
            </h2>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className='inline-flex items-center gap-2 self-start md:self-auto px-4 py-2 rounded-full text-xs font-mono tracking-wider uppercase border border-white/20 bg-white/5 hover:bg-white/10 transition-colors'
          >
            {isOpen ? <EyeOff className='w-3.5 h-3.5' /> : <Eye className='w-3.5 h-3.5' />}
            <span>{isOpen ? 'Close Vault Doors' : 'Split Doors Reveal'}</span>
          </button>
        </div>

        {/* Split Doors Container */}
        <div className='relative min-h-[380px] rounded-3xl overflow-hidden border border-white/10 bg-[#09131E] p-6 sm:p-10 flex items-center justify-center'>
          {/* BEHIND DOORS: 3 High-Impact Feature Cards */}
          <div className='w-full grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8'>
            {LANDING_CONFIG.milestones.map((item, idx) => (
              <div
                key={item.id}
                className='relative p-6 sm:p-8 rounded-2xl bg-[#132238]/90 border border-white/10 backdrop-blur-xl flex flex-col justify-between hover:border-[#2F6BFF]/40 transition-all duration-300 group'
              >
                <div>
                  <div className='flex items-center justify-between mb-6'>
                    <div className='p-3 rounded-xl bg-white/5 border border-white/10'>
                      {featureIcons[idx]}
                    </div>
                    <span className='text-[10px] font-mono tracking-widest text-slate-400 uppercase px-2.5 py-1 rounded bg-white/5 border border-white/10'>
                      {item.tag}
                    </span>
                  </div>

                  <h3 className='text-xl sm:text-2xl font-bold font-display uppercase tracking-tight text-white mb-3 group-hover:text-[#2F6BFF] transition-colors'>
                    {item.title}
                  </h3>

                  <p className='text-sm sm:text-base text-slate-300 leading-relaxed'>
                    {item.description}
                  </p>
                </div>

                <div className='mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400'>
                  <span>PROTOCOL 0{idx + 1}</span>
                  <ArrowUpRight className='w-4 h-4 text-[#2F6BFF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform' />
                </div>
              </div>
            ))}
          </div>

          {/* LEFT DOOR PANEL */}
          <div
            className={`absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-[#0E1F33] to-[#0A1624] border-r border-[#2F6BFF]/30 z-20 transition-transform duration-700 ease-in-out flex flex-col justify-between p-8 ${
              isOpen ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className='text-xs font-mono tracking-widest text-[#2F6BFF]'>SECURE SECTOR // 01</div>
            <div className='text-center text-slate-400 text-xs font-mono uppercase tracking-widest'>
              [NETPACK VAULT SHIELD]
            </div>
            <div className='text-[11px] font-mono text-slate-500'>STATUS: ARMORED</div>
          </div>

          {/* RIGHT DOOR PANEL */}
          <div
            className={`absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#0E1F33] to-[#0A1624] border-l border-[#2F6BFF]/30 z-20 transition-transform duration-700 ease-in-out flex flex-col justify-between p-8 ${
              isOpen ? 'translate-x-full' : 'translate-x-0'
            }`}
          >
            <div className='text-xs font-mono tracking-widest text-[#FF7A1A] text-right'>SECURE SECTOR // 02</div>
            <div className='text-center text-slate-400 text-xs font-mono uppercase tracking-widest'>
              [CLICK TO SPLIT & REVEAL]
            </div>
            <div className='text-[11px] font-mono text-slate-500 text-right'>HASH: SHA-256</div>
          </div>
        </div>
      </div>
    </section>
  )
}
