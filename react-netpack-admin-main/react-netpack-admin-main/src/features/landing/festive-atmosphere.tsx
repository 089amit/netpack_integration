'use client'

import { Badge } from '@/components/ui/badge'

export interface FestivalMetadata {
  id: string
  name: string
  nepaliName: string
  tag: string
  defaultGreeting: string
  badgeBg: string
  badgeBorder: string
  badgeText: string
  bannerGradient: string
  emoji: string
}

export const FESTIVAL_METADATA: Record<string, FestivalMetadata> = {
  dashain: {
    id: 'dashain',
    name: 'Dashain Festival',
    nepaliName: 'बडा दशैँ',
    tag: 'Festive Season',
    defaultGreeting: 'बडा दशैँको हार्दिक मङ्गलमय शुभकामना | Happy Vijaya Dashami!',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-800 dark:text-amber-200',
    bannerGradient: 'from-amber-500/15 via-orange-500/10 to-transparent',
    emoji: '🪁',
  },
  tihar: {
    id: 'tihar',
    name: 'Tihar & Deepawali',
    nepaliName: 'शुभ दिपावली तथा तिहार',
    tag: 'Festival of Lights',
    defaultGreeting: 'शुभ दिपावली तथा तिहारको हार्दिक मङ्गलमय शुभकामना | Happy Deepawali & Tihar!',
    badgeBg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    badgeBorder: 'border-yellow-500/30',
    badgeText: 'text-yellow-800 dark:text-yellow-200',
    bannerGradient: 'from-yellow-500/15 via-amber-500/10 to-transparent',
    emoji: '🪔',
  },
  chhath: {
    id: 'chhath',
    name: 'Chhath Puja',
    nepaliName: 'छठ पर्व',
    tag: 'Sun Celebration',
    defaultGreeting: 'छठ पर्वको पावन अवसरमा हार्दिक शुभकामना | Happy Chhath Puja!',
    badgeBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    badgeBorder: 'border-orange-500/30',
    badgeText: 'text-orange-800 dark:text-orange-200',
    bannerGradient: 'from-orange-500/15 via-red-500/10 to-transparent',
    emoji: '🌅',
  },
  christmas: {
    id: 'christmas',
    name: 'Merry Christmas',
    nepaliName: 'क्रिसमस',
    tag: 'Winter Holidays',
    defaultGreeting: 'Merry Christmas & Joyful Season Greetings from Netpack Logistics!',
    badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    badgeBorder: 'border-emerald-500/30',
    badgeText: 'text-emerald-800 dark:text-emerald-200',
    bannerGradient: 'from-emerald-500/15 via-teal-500/10 to-transparent',
    emoji: '❄️',
  },
  new_year: {
    id: 'new_year',
    name: 'English New Year',
    nepaliName: 'नयाँ वर्ष सन् २०२७',
    tag: 'Global Celebration',
    defaultGreeting: 'Happy New Year! Wishing you worldwide speed, prosperity & success.',
    badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    badgeBorder: 'border-indigo-500/30',
    badgeText: 'text-indigo-800 dark:text-indigo-200',
    bannerGradient: 'from-indigo-500/15 via-purple-500/10 to-transparent',
    emoji: '🎉',
  },
  labour_day: {
    id: 'labour_day',
    name: 'International Workers\' Day',
    nepaliName: 'अन्तर्राष्ट्रिय श्रमिक दिवस',
    tag: 'May 1 Tribute',
    defaultGreeting: 'अन्तर्राष्ट्रिय श्रमिक दिवसको शुभकामना | Happy International Workers’ Day!',
    badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    badgeBorder: 'border-rose-500/30',
    badgeText: 'text-rose-800 dark:text-rose-200',
    bannerGradient: 'from-rose-500/15 via-pink-500/10 to-transparent',
    emoji: '⚙️',
  },
  maghe_sankranti: {
    id: 'maghe_sankranti',
    name: 'Maghe Sankranti',
    nepaliName: 'माघे सङ्क्रान्ति',
    tag: 'Winter Solstice',
    defaultGreeting: 'माघे सङ्क्रान्तिको पावन शुभकामना | Happy Maghe Sankranti!',
    badgeBg: 'bg-amber-600/10 dark:bg-amber-600/20',
    badgeBorder: 'border-amber-600/30',
    badgeText: 'text-amber-900 dark:text-amber-100',
    bannerGradient: 'from-amber-600/15 via-yellow-600/10 to-transparent',
    emoji: '☀️',
  },
  lhosar: {
    id: 'lhosar',
    name: 'Lhosar Festival',
    nepaliName: 'ल्होसार (सोनाम / ग्याल्पो / तमु)',
    tag: 'Himalayan New Year',
    defaultGreeting: 'ल्होसारको हार्दिक मङ्गलमय शुभकामना | Tashi Delek & Happy Lhosar!',
    badgeBg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    badgeBorder: 'border-cyan-500/30',
    badgeText: 'text-cyan-800 dark:text-cyan-200',
    bannerGradient: 'from-cyan-500/15 via-blue-500/10 to-transparent',
    emoji: '🚩',
  },
  holi: {
    id: 'holi',
    name: 'Holi / Fagu Purnima',
    nepaliName: 'फागु पूर्णिमा (होली)',
    tag: 'Festival of Colors',
    defaultGreeting: 'रङ्गीन फागु पूर्णिमा तथा होलीको शुभकामना | Happy Holi to All!',
    badgeBg: 'bg-pink-500/10 dark:bg-pink-500/20',
    badgeBorder: 'border-pink-500/30',
    badgeText: 'text-pink-800 dark:text-pink-200',
    bannerGradient: 'from-pink-500/15 via-purple-500/10 to-transparent',
    emoji: '🎨',
  },
  nepali_new_year: {
    id: 'nepali_new_year',
    name: 'Nepali New Year (Baisakh 1)',
    nepaliName: 'नयाँ वर्ष (बैशाख १)',
    tag: 'Bikram Sambat',
    defaultGreeting: 'नयाँ वर्षको हार्दिक मङ्गलमय शुभकामना | Happy Nepali New Year!',
    badgeBg: 'bg-red-500/10 dark:bg-red-500/20',
    badgeBorder: 'border-red-500/30',
    badgeText: 'text-red-800 dark:text-red-200',
    bannerGradient: 'from-red-500/15 via-rose-500/10 to-transparent',
    emoji: '🌸',
  },
  buddha_jayanti: {
    id: 'buddha_jayanti',
    name: 'Buddha Jayanti',
    nepaliName: 'बुद्ध जयन्ती',
    tag: 'Peace from Nepal',
    defaultGreeting: 'बुद्ध जयन्तीको शान्तिमय शुभकामना | Happy Buddha Jayanti - Peace from Nepal!',
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    badgeBorder: 'border-amber-500/30',
    badgeText: 'text-amber-800 dark:text-amber-200',
    bannerGradient: 'from-amber-500/15 via-yellow-500/10 to-transparent',
    emoji: '🪷',
  },
}

/**
 * Automatically calculates effective festive theme based on calendar date or manual override
 */
export function getEffectiveFestiveTheme(themeSetting?: string): string {
  if (themeSetting && themeSetting !== 'auto') {
    return themeSetting
  }

  const now = new Date()
  const month = now.getMonth() + 1 // 1 - 12
  const day = now.getDate() // 1 - 31

  // 1. English New Year (Dec 28 - Jan 5)
  if ((month === 12 && day >= 28) || (month === 1 && day <= 5)) {
    return 'new_year'
  }
  // 2. Maghe Sankranti (Jan 12 - Jan 18)
  if (month === 1 && day >= 12 && day <= 18) {
    return 'maghe_sankranti'
  }
  // 3. Lhosar (Jan 19 - Feb 25)
  if ((month === 1 && day >= 19) || (month === 2 && day <= 25)) {
    return 'lhosar'
  }
  // 4. Holi (Mar 10 - Mar 28)
  if (month === 3 && day >= 10 && day <= 28) {
    return 'holi'
  }
  // 5. Nepali New Year (Apr 11 - Apr 20)
  if (month === 4 && day >= 11 && day <= 20) {
    return 'nepali_new_year'
  }
  // 6. Labour Day (May 1 - May 3)
  if (month === 5 && day >= 1 && day <= 3) {
    return 'labour_day'
  }
  // 7. Buddha Jayanti (May 4 - May 22)
  if (month === 5 && day >= 4 && day <= 22) {
    return 'buddha_jayanti'
  }
  // 8. Dashain (Sep 20 - Oct 22)
  if ((month === 9 && day >= 20) || (month === 10 && day <= 22)) {
    return 'dashain'
  }
  // 9. Tihar & Deepawali (Oct 23 - Nov 15)
  if ((month === 10 && day >= 23) || (month === 11 && day <= 15)) {
    return 'tihar'
  }
  // 10. Chhath Puja (Nov 16 - Nov 23)
  if (month === 11 && day >= 16 && day <= 23) {
    return 'chhath'
  }
  // 11. Christmas (Dec 20 - Dec 27)
  if (month === 12 && day >= 20 && day <= 27) {
    return 'christmas'
  }

  return 'none'
}

/**
 * Ambient Festive Background Particles & Overlays
 */
export function FestiveAtmosphereBackground({ theme }: { theme: string }) {
  if (!theme || theme === 'none' || !FESTIVAL_METADATA[theme]) {
    return null
  }

  return (
    <div className='pointer-events-none fixed inset-0 overflow-hidden z-20 select-none'>
      <style>{`
        @keyframes floatKite1 {
          0% { transform: translate(0, 0) rotate(-6deg); }
          50% { transform: translate(30px, -20px) rotate(4deg); }
          100% { transform: translate(0, 0) rotate(-6deg); }
        }
        @keyframes floatKite2 {
          0% { transform: translate(0, 0) rotate(5deg); }
          50% { transform: translate(-25px, -15px) rotate(-5deg); }
          100% { transform: translate(0, 0) rotate(5deg); }
        }
        @keyframes fallPetal {
          0% { transform: translateY(-50px) rotate(0deg); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.8; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
        }
        @keyframes fallSnow {
          0% { transform: translateY(-20px) translateX(0); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { transform: translateY(105vh) translateX(40px); opacity: 0; }
        }
        @keyframes twinkleGlow {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes prayerFlagWave {
          0%, 100% { transform: skewX(0deg) rotate(0deg); }
          50% { transform: skewX(6deg) rotate(3deg); }
        }
        @keyframes lotusDrift {
          0% { transform: translateY(30px) scale(0.9); opacity: 0; }
          30% { opacity: 0.7; }
          70% { opacity: 0.7; }
          100% { transform: translateY(-40px) scale(1.05); opacity: 0; }
        }
      `}</style>

      {/* ── 1. DASHAIN (बडा दशैँ) ── */}
      {theme === 'dashain' && (
        <>
          {/* Top subtle golden autumn sky wash */}
          <div className='absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-amber-500/[0.06] to-transparent' />

          {/* Soaring Kites (चङ्गा) in sky */}
          <div
            className='absolute top-20 right-[12%] opacity-85 dark:opacity-75'
            style={{ animation: 'floatKite1 8s ease-in-out infinite' }}
          >
            <svg width='54' height='68' viewBox='0 0 60 80' fill='none'>
              <path d='M30 0 L56 32 L30 64 L4 32 Z' fill='#EA580C' stroke='#C2410C' strokeWidth='1.5' />
              <path d='M30 0 L30 64' stroke='#FED7AA' strokeWidth='1.5' />
              <path d='M4 32 Q30 42 56 32' stroke='#FED7AA' strokeWidth='1.5' fill='none' />
              {/* Kite Tail */}
              <path d='M30 64 Q34 72 28 80 Q22 88 30 96' stroke='#EA580C' strokeWidth='2' fill='none' strokeDasharray='2 2' />
              <polygon points='26,82 32,82 29,86' fill='#F59E0B' />
            </svg>
          </div>

          <div
            className='absolute top-36 left-[8%] opacity-70 hidden md:block'
            style={{ animation: 'floatKite2 10s ease-in-out infinite' }}
          >
            <svg width='44' height='58' viewBox='0 0 60 80' fill='none'>
              <path d='M30 0 L56 32 L30 64 L4 32 Z' fill='#2563EB' stroke='#1D4ED8' strokeWidth='1.5' />
              <path d='M30 0 L30 64' stroke='#BFDBFE' strokeWidth='1.5' />
              <path d='M4 32 Q30 42 56 32' stroke='#BFDBFE' strokeWidth='1.5' fill='none' />
              <path d='M30 64 Q26 72 32 80' stroke='#2563EB' strokeWidth='1.5' fill='none' />
            </svg>
          </div>

          {/* Gentle floating golden barley / jamara leaves */}
          {[15, 35, 55, 75, 90].map((left, idx) => (
            <div
              key={idx}
              className='absolute top-0 text-amber-500/60 dark:text-amber-400/50 text-xs'
              style={{
                left: `${left}%`,
                animation: `fallPetal ${12 + (idx % 4) * 3}s linear infinite`,
                animationDelay: `${idx * 2.5}s`,
              }}
            >
              🌾
            </div>
          ))}
        </>
      )}

      {/* ── 2. TIHAR & DEEPAWALI (तिहार) ── */}
      {theme === 'tihar' && (
        <>
          {/* Twinkling fairy lights garland along header */}
          <div className='absolute top-0 left-0 right-0 h-10 flex items-center justify-around px-4 pointer-events-none z-10'>
            {Array.from({ length: 24 }).map((_, i) => {
              const colors = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#EAB308']
              const color = colors[i % colors.length]
              return (
                <div key={i} className='flex flex-col items-center'>
                  <div className='w-0.5 h-3 bg-slate-400/40 dark:bg-white/20' />
                  <div
                    className='w-2.5 h-3.5 rounded-full shadow-sm'
                    style={{
                      backgroundColor: color,
                      boxShadow: `0 0 8px ${color}`,
                      animation: `twinkleGlow ${1.5 + (i % 3) * 0.4}s ease-in-out infinite`,
                      animationDelay: `${(i % 5) * 0.3}s`,
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Warm floating glowing diya embers in lower atmosphere */}
          <div className='absolute bottom-6 left-6 opacity-80 hidden sm:flex items-center gap-2 bg-amber-500/10 backdrop-blur-xs p-2 rounded-2xl border border-amber-500/20'>
            <span className='text-2xl animate-pulse'>🪔</span>
            <span className='text-[11px] font-semibold text-amber-800 dark:text-amber-200'>
              शुभ दिपावली
            </span>
          </div>
        </>
      )}

      {/* ── 3. CHHATH PUJA (छठ पर्व) ── */}
      {theme === 'chhath' && (
        <>
          {/* Saffron sunrise aura from top center */}
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.18),transparent_70%)]' />
          {/* Subtle rising golden sunbeams */}
          <div className='absolute top-4 right-1/4 opacity-60 animate-pulse text-amber-500 text-3xl'>
            ☀️
          </div>
        </>
      )}

      {/* ── 4. CHRISTMAS (क्रिसमस) ── */}
      {theme === 'christmas' && (
        <>
          {/* Crystalline snowfall particles */}
          {[5, 18, 32, 45, 60, 72, 85, 95].map((pos, i) => (
            <div
              key={i}
              className='absolute top-0 text-sky-400/70 dark:text-white/80'
              style={{
                left: `${pos}%`,
                fontSize: `${12 + (i % 3) * 5}px`,
                animation: `fallSnow ${9 + (i % 4) * 2.5}s linear infinite`,
                animationDelay: `${i * 1.8}s`,
              }}
            >
              ❄
            </div>
          ))}
          {/* Subtle holiday pine wash */}
          <div className='absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-emerald-500/[0.04] to-transparent' />
        </>
      )}

      {/* ── 5. ENGLISH NEW YEAR ── */}
      {theme === 'new_year' && (
        <>
          {/* Celebration sparks in sky */}
          {[12, 28, 48, 68, 88].map((x, i) => (
            <div
              key={i}
              className='absolute top-14 text-indigo-400 dark:text-indigo-300'
              style={{
                left: `${x}%`,
                animation: `twinkleGlow ${2 + (i % 3) * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.6}s`,
              }}
            >
              ✨
            </div>
          ))}
          <div className='absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-indigo-500/[0.07] to-transparent' />
        </>
      )}

      {/* ── 6. LABOUR DAY (श्रमिक दिवस) ── */}
      {theme === 'labour_day' && (
        <>
          <div className='absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-rose-500/[0.05] to-transparent' />
          <div className='absolute bottom-6 right-6 opacity-60 hidden sm:flex items-center gap-2 bg-rose-500/10 p-2 rounded-2xl border border-rose-500/20'>
            <span className='text-lg'>⚙️</span>
            <span className='text-[10px] font-semibold text-rose-800 dark:text-rose-200'>
              Honoring Workers Worldwide
            </span>
          </div>
        </>
      )}

      {/* ── 7. MAGHE SANKRANTI (माघे सङ्क्रान्ति) ── */}
      {theme === 'maghe_sankranti' && (
        <>
          <div className='absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-amber-600/[0.06] to-transparent' />
          <div
            className='absolute top-24 right-[15%] opacity-75'
            style={{ animation: 'floatKite1 9s ease-in-out infinite' }}
          >
            <span className='text-3xl'>🪁</span>
          </div>
        </>
      )}

      {/* ── 8. LHOSAR (ल्होसार) ── */}
      {theme === 'lhosar' && (
        <>
          {/* 5-Color Tibetan Prayer Flags (Lungta) along top edge */}
          <div className='absolute top-0 left-0 right-0 flex items-start justify-around px-2 z-10'>
            {Array.from({ length: 20 }).map((_, idx) => {
              const flagColors = [
                'bg-blue-600', // Blue (Sky)
                'bg-slate-100 dark:bg-slate-200 border border-slate-300', // White (Air)
                'bg-red-600', // Red (Fire)
                'bg-emerald-600', // Green (Water)
                'bg-yellow-500', // Yellow (Earth)
              ]
              const c = flagColors[idx % flagColors.length]
              return (
                <div
                  key={idx}
                  className={`w-5 sm:w-7 h-7 sm:h-9 ${c} shadow-xs rounded-b-xs origin-top`}
                  style={{
                    animation: `prayerFlagWave ${2.5 + (idx % 3) * 0.4}s ease-in-out infinite`,
                    animationDelay: `${idx * 0.15}s`,
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
                  }}
                />
              )
            })}
          </div>
        </>
      )}

      {/* ── 9. HOLI (फागु पूर्णिमा) ── */}
      {theme === 'holi' && (
        <>
          {/* Floating pastel gulal dust particles */}
          {[10, 25, 45, 65, 80, 92].map((x, i) => {
            const powders = ['🌸', '💛', '💠', '💜', '🟠']
            const powder = powders[i % powders.length]
            return (
              <div
                key={i}
                className='absolute top-0 opacity-70'
                style={{
                  left: `${x}%`,
                  fontSize: `${14 + (i % 3) * 4}px`,
                  animation: `fallPetal ${10 + (i % 4) * 2}s linear infinite`,
                  animationDelay: `${i * 1.5}s`,
                }}
              >
                {powder}
              </div>
            )
          })}
        </>
      )}

      {/* ── 10. NEPALI NEW YEAR (नव वर्ष बैशाख १) ── */}
      {theme === 'nepali_new_year' && (
        <>
          {/* Falling pink rhododendron petals */}
          {[8, 22, 38, 56, 74, 88].map((left, idx) => (
            <div
              key={idx}
              className='absolute top-0 text-rose-500/70 dark:text-rose-400/60'
              style={{
                left: `${left}%`,
                fontSize: `${13 + (idx % 3) * 4}px`,
                animation: `fallPetal ${11 + (idx % 3) * 3}s linear infinite`,
                animationDelay: `${idx * 2}s`,
              }}
            >
              🌸
            </div>
          ))}
          <div className='absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-rose-500/[0.05] to-transparent' />
        </>
      )}

      {/* ── 11. BUDDHA JAYANTI (बुद्ध जयन्ती) ── */}
      {theme === 'buddha_jayanti' && (
        <>
          {/* Sacred lotus blossoms drifting upwards */}
          {[15, 40, 65, 85].map((pos, i) => (
            <div
              key={i}
              className='absolute bottom-10 text-amber-500/70 dark:text-amber-400/70'
              style={{
                left: `${pos}%`,
                fontSize: `${18 + (i % 2) * 6}px`,
                animation: `lotusDrift ${8 + (i % 3) * 2}s ease-in-out infinite`,
                animationDelay: `${i * 2.2}s`,
              }}
            >
              🪷
            </div>
          ))}
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.12),transparent_70%)]' />
        </>
      )}
    </div>
  )
}

/**
 * Top Festive Greeting Ribbon (Displayed cleanly right below Header / above Hero)
 */
export function FestiveGreetingRibbon({
  theme,
  customGreeting,
  effectsEnabled,
  onToggleEffects,
}: {
  theme: string
  customGreeting?: string
  effectsEnabled: boolean
  onToggleEffects: () => void
}) {
  if (!theme || theme === 'none' || !FESTIVAL_METADATA[theme]) {
    return null
  }

  const meta = FESTIVAL_METADATA[theme]
  const greetingText = customGreeting?.trim() || meta.defaultGreeting

  return (
    <div className='relative z-30 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 backdrop-blur-md py-2 px-4'>
      <div className='max-w-[1440px] 2xl:max-w-[1536px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs'>
        <div className='flex items-center gap-2 text-center sm:text-left'>
          <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold shrink-0 text-sm'>
            {meta.emoji}
          </span>
          <span className='font-semibold text-slate-800 dark:text-slate-100 tracking-wide'>
            {greetingText}
          </span>
        </div>

        <div className='flex items-center gap-2.5 shrink-0'>
          <Badge
            variant='outline'
            className='text-[10px] px-2 py-0.5 border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200 font-bold'
          >
            {meta.nepaliName}
          </Badge>
          <button
            type='button'
            onClick={onToggleEffects}
            className='text-[11px] text-muted-foreground hover:text-foreground underline transition-colors cursor-pointer'
            title='Toggle festive background animations'
          >
            {effectsEnabled ? 'Animations: On' : 'Animations: Off'}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Subtle Floating Toggle Pill at bottom right corner
 */
export function FestiveFloatingToggle({
  theme,
  enabled,
  onToggle,
}: {
  theme: string
  enabled: boolean
  onToggle: () => void
}) {
  if (!theme || theme === 'none' || !FESTIVAL_METADATA[theme]) {
    return null
  }

  const meta = FESTIVAL_METADATA[theme]

  return (
    <div className='fixed bottom-5 right-5 z-40 print:hidden'>
      <button
        type='button'
        onClick={onToggle}
        className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-white/85 dark:bg-[#0A1128]/85 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-200 shadow-lg hover:bg-slate-50 dark:hover:bg-white/10 transition-all cursor-pointer'
        title={`Toggle ${meta.name} animations`}
      >
        <span>{meta.emoji}</span>
        <span>{meta.name}: {enabled ? 'Active' : 'Muted'}</span>
      </button>
    </div>
  )
}
