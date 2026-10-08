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
  // Dynamic UI theme tokens
  rootBg: string
  headerBg: string
  cardGlassBg: string
  heroGlow: string
  accentBorder: string
}

export const FESTIVAL_METADATA: Record<string, FestivalMetadata> = {
  dashain: {
    id: 'dashain',
    name: 'Dashain Festival',
    nepaliName: 'बडा दशैँ',
    tag: 'Festive Season',
    defaultGreeting: 'बडा दशैँको हार्दिक मङ्गलमय शुभकामना | Happy Vijaya Dashami!',
    badgeBg: 'bg-amber-500/15 dark:bg-amber-500/25',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-900 dark:text-amber-200',
    bannerGradient: 'from-amber-500/20 via-orange-500/15 to-transparent',
    emoji: '🪁',
    rootBg: 'bg-gradient-to-b from-[#FFFDF6] via-[#FFF9EE] to-[#FEF3DC]/80 dark:from-[#0B101E] dark:via-[#161208] dark:to-[#1C1306]',
    headerBg: 'backdrop-blur-2xl bg-white/75 dark:bg-[#121828]/80 border-b border-amber-200/60 dark:border-amber-500/20',
    cardGlassBg: 'backdrop-blur-xl bg-white/75 dark:bg-[#141A2E]/80 border border-amber-200/60 dark:border-amber-500/20 shadow-xl shadow-amber-500/5',
    heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(245,158,11,0.22),transparent_70%)]',
    accentBorder: 'border-amber-500/30',
  },
  tihar: {
    id: 'tihar',
    name: 'Tihar & Deepawali',
    nepaliName: 'शुभ दिपावली तथा तिहार',
    tag: 'Festival of Lights',
    defaultGreeting: 'शुभ दिपावली तथा तिहारको हार्दिक मङ्गलमय शुभकामना | Happy Deepawali & Tihar!',
    badgeBg: 'bg-yellow-500/15 dark:bg-yellow-500/25',
    badgeBorder: 'border-yellow-500/40',
    badgeText: 'text-yellow-900 dark:text-yellow-200',
    bannerGradient: 'from-yellow-500/20 via-amber-500/15 to-transparent',
    emoji: '🪔',
    rootBg: 'bg-gradient-to-b from-[#FFFDF5] via-[#FFFBEB] to-[#FEF3C7]/70 dark:from-[#090E1D] dark:via-[#140F04] dark:to-[#1B1102]',
    headerBg: 'backdrop-blur-2xl bg-white/75 dark:bg-[#0E1528]/80 border-b border-yellow-300/60 dark:border-yellow-500/20',
    cardGlassBg: 'backdrop-blur-xl bg-white/75 dark:bg-[#121A30]/80 border border-yellow-200/60 dark:border-yellow-500/20 shadow-xl shadow-yellow-500/5',
    heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(234,179,8,0.24),transparent_70%)]',
    accentBorder: 'border-yellow-500/30',
  },
  chhath: {
    id: 'chhath',
    name: 'Chhath Puja',
    nepaliName: 'छठ पर्व',
    tag: 'Sun Celebration',
    defaultGreeting: 'छठ पर्वको पावन अवसरमा हार्दिक शुभकामना | Happy Chhath Puja!',
    badgeBg: 'bg-orange-500/15 dark:bg-orange-500/25',
    badgeBorder: 'border-orange-500/40',
    badgeText: 'text-orange-900 dark:text-orange-200',
    bannerGradient: 'from-orange-500/20 via-red-500/15 to-transparent',
    emoji: '🌅',
    rootBg: 'bg-gradient-to-b from-[#FFFBF5] via-[#FFF5EB] to-[#FED7AA]/60 dark:from-[#0B101D] dark:via-[#170E07] dark:to-[#1E1108]',
    headerBg: 'backdrop-blur-2xl bg-white/75 dark:bg-[#121626]/80 border-b border-orange-200/60 dark:border-orange-500/20',
    cardGlassBg: 'backdrop-blur-xl bg-white/75 dark:bg-[#15172B]/80 border border-orange-200/60 dark:border-orange-500/20 shadow-xl shadow-orange-500/5',
    heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(249,115,22,0.24),transparent_70%)]',
    accentBorder: 'border-orange-500/30',
  },
  christmas: {
    id: 'christmas',
    name: 'Merry Christmas',
    nepaliName: 'क्रिसमस',
    tag: 'Winter Holidays',
    defaultGreeting: 'Merry Christmas & Joyful Season Greetings from Netpack Logistics!',
    badgeBg: 'bg-emerald-500/15 dark:bg-emerald-500/25',
    badgeBorder: 'border-emerald-500/40',
    badgeText: 'text-emerald-900 dark:text-emerald-200',
    bannerGradient: 'from-emerald-500/20 via-teal-500/15 to-transparent',
    emoji: '❄️',
    rootBg: 'bg-gradient-to-b from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0]/80 dark:from-[#070D18] dark:via-[#09182A] dark:to-[#0C1E34]',
    headerBg: 'backdrop-blur-2xl bg-white/75 dark:bg-[#0A1628]/80 border-b border-sky-200/60 dark:border-sky-500/20',
    cardGlassBg: 'backdrop-blur-xl bg-white/75 dark:bg-[#0E1C32]/80 border border-sky-200/60 dark:border-sky-500/20 shadow-xl shadow-sky-500/5',
    heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(14,165,233,0.22),transparent_70%)]',
    accentBorder: 'border-sky-500/30',
  },
  new_year: {
    id: 'new_year',
    name: 'English New Year',
    nepaliName: 'नयाँ वर्ष सन् २०२७',
    tag: 'Global Celebration',
    defaultGreeting: 'Happy New Year! Wishing you worldwide speed, prosperity & success.',
    badgeBg: 'bg-indigo-500/15 dark:bg-indigo-500/25',
    badgeBorder: 'border-indigo-500/40',
    badgeText: 'text-indigo-900 dark:text-indigo-200',
    bannerGradient: 'from-indigo-500/20 via-purple-500/15 to-transparent',
    emoji: '🎉',
    rootBg: 'bg-gradient-to-b from-[#FAF8FF] via-[#F5F3FF] to-[#EDE9FE]/80 dark:from-[#0A0D1D] dark:via-[#120E28] dark:to-[#191136]',
    headerBg: 'backdrop-blur-2xl bg-white/75 dark:bg-[#0E122A]/80 border-b border-indigo-200/60 dark:border-indigo-500/20',
    cardGlassBg: 'backdrop-blur-xl bg-white/75 dark:bg-[#131735]/80 border border-indigo-200/60 dark:border-indigo-500/20 shadow-xl shadow-indigo-500/5',
    heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(99,102,241,0.22),transparent_70%)]',
    accentBorder: 'border-indigo-500/30',
  },
  labour_day: {
    id: 'labour_day',
    name: 'International Workers\' Day',
    nepaliName: 'अन्तर्राष्ट्रिय श्रमिक दिवस',
    tag: 'May 1 Tribute',
    defaultGreeting: 'अन्तर्राष्ट्रिय श्रमिक दिवसको शुभकामना | Happy International Workers’ Day!',
    badgeBg: 'bg-rose-500/15 dark:bg-rose-500/25',
    badgeBorder: 'border-rose-500/40',
    badgeText: 'text-rose-900 dark:text-rose-200',
    bannerGradient: 'from-rose-500/20 via-pink-500/15 to-transparent',
    emoji: '⚙️',
    rootBg: 'bg-gradient-to-b from-[#FFF8F8] via-[#FFF1F2] to-[#FFE4E6]/70 dark:from-[#0D101C] dark:via-[#190C12] dark:to-[#220E17]',
    headerBg: 'backdrop-blur-2xl bg-white/75 dark:bg-[#111425]/80 border-b border-rose-200/60 dark:border-rose-500/20',
    cardGlassBg: 'backdrop-blur-xl bg-white/75 dark:bg-[#16172D]/80 border border-rose-200/60 dark:border-rose-500/20 shadow-xl shadow-rose-500/5',
    heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(244,63,94,0.2),transparent_70%)]',
    accentBorder: 'border-rose-500/30',
  },
  maghe_sankranti: {
    id: 'maghe_sankranti',
    name: 'Maghe Sankranti',
    nepaliName: 'माघे सङ्क्रान्ति',
    tag: 'Winter Solstice',
    defaultGreeting: 'माघे सङ्क्रान्तिको पावन शुभकामना | Happy Maghe Sankranti!',
    badgeBg: 'bg-amber-600/15 dark:bg-amber-600/25',
    badgeBorder: 'border-amber-600/40',
    badgeText: 'text-amber-950 dark:text-amber-100',
    bannerGradient: 'from-amber-600/20 via-yellow-600/15 to-transparent',
    emoji: '☀️',
    rootBg: 'bg-gradient-to-b from-[#FFFDF7] via-[#FFF8EC] to-[#FEF0D6]/80 dark:from-[#0B101E] dark:via-[#171206] dark:to-[#1E1508]',
    headerBg: 'backdrop-blur-2xl bg-white/75 dark:bg-[#10172A]/80 border-b border-amber-200/60 dark:border-amber-500/20',
    cardGlassBg: 'backdrop-blur-xl bg-white/75 dark:bg-[#151C32]/80 border border-amber-200/60 dark:border-amber-500/20 shadow-xl shadow-amber-500/5',
    heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(217,119,6,0.22),transparent_70%)]',
    accentBorder: 'border-amber-600/30',
  },
  lhosar: {
    id: 'lhosar',
    name: 'Lhosar Festival',
    nepaliName: 'ल्होसार (सोनाम / ग्याल्पो / तमु)',
    tag: 'Himalayan New Year',
    defaultGreeting: 'ल्होसारको हार्दिक मङ्गलमय शुभकामना | Tashi Delek & Happy Lhosar!',
    badgeBg: 'bg-cyan-500/15 dark:bg-cyan-500/25',
    badgeBorder: 'border-cyan-500/40',
    badgeText: 'text-cyan-900 dark:text-cyan-200',
    bannerGradient: 'from-cyan-500/20 via-blue-500/15 to-transparent',
    emoji: '🚩',
    rootBg: 'bg-gradient-to-b from-[#F6FDFF] via-[#ECFEFF] to-[#CFFAFE]/70 dark:from-[#061120] dark:via-[#091D2C] dark:to-[#0C2436]',
    headerBg: 'backdrop-blur-2xl bg-white/75 dark:bg-[#0A1A2E]/80 border-b border-cyan-200/60 dark:border-cyan-500/20',
    cardGlassBg: 'backdrop-blur-xl bg-white/75 dark:bg-[#0E2036]/80 border border-cyan-200/60 dark:border-cyan-500/20 shadow-xl shadow-cyan-500/5',
    heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(6,182,212,0.22),transparent_70%)]',
    accentBorder: 'border-cyan-500/30',
  },
  holi: {
    id: 'holi',
    name: 'Holi / Fagu Purnima',
    nepaliName: 'फागु पूर्णिमा (होली)',
    tag: 'Festival of Colors',
    defaultGreeting: 'रङ्गीन फागु पूर्णिमा तथा होलीको शुभकामना | Happy Holi to All!',
    badgeBg: 'bg-pink-500/15 dark:bg-pink-500/25',
    badgeBorder: 'border-pink-500/40',
    badgeText: 'text-pink-900 dark:text-pink-200',
    bannerGradient: 'from-pink-500/20 via-purple-500/15 to-transparent',
    emoji: '🎨',
    rootBg: 'bg-gradient-to-b from-[#FFF8FD] via-[#FDF2F8] to-[#FCE7F3]/80 dark:from-[#0D1020] dark:via-[#1A0E23] dark:to-[#22102E]',
    headerBg: 'backdrop-blur-2xl bg-white/75 dark:bg-[#12152E]/80 border-b border-pink-200/60 dark:border-pink-500/20',
    cardGlassBg: 'backdrop-blur-xl bg-white/75 dark:bg-[#181938]/80 border border-pink-200/60 dark:border-pink-500/20 shadow-xl shadow-pink-500/5',
    heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(236,72,153,0.22),transparent_70%)]',
    accentBorder: 'border-pink-500/30',
  },
  nepali_new_year: {
    id: 'nepali_new_year',
    name: 'Nepali New Year (Baisakh 1)',
    nepaliName: 'नयाँ वर्ष (बैशाख १)',
    tag: 'Bikram Sambat',
    defaultGreeting: 'नयाँ वर्षको हार्दिक मङ्गलमय शुभकामना | Happy Nepali New Year!',
    badgeBg: 'bg-red-500/15 dark:bg-red-500/25',
    badgeBorder: 'border-red-500/40',
    badgeText: 'text-red-900 dark:text-red-200',
    bannerGradient: 'from-red-500/20 via-rose-500/15 to-transparent',
    emoji: '🌸',
    rootBg: 'bg-gradient-to-b from-[#FFF9FA] via-[#FFF1F2] to-[#FFE4E6]/70 dark:from-[#0D111F] dark:via-[#1B0E17] dark:to-[#24101E]',
    headerBg: 'backdrop-blur-2xl bg-white/75 dark:bg-[#11162A]/80 border-b border-rose-200/60 dark:border-rose-500/20',
    cardGlassBg: 'backdrop-blur-xl bg-white/75 dark:bg-[#171A35]/80 border border-rose-200/60 dark:border-rose-500/20 shadow-xl shadow-rose-500/5',
    heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(244,63,94,0.22),transparent_70%)]',
    accentBorder: 'border-rose-500/30',
  },
  buddha_jayanti: {
    id: 'buddha_jayanti',
    name: 'Buddha Jayanti',
    nepaliName: 'बुद्ध जयन्ती',
    tag: 'Peace from Nepal',
    defaultGreeting: 'बुद्ध जयन्तीको शान्तिमय शुभकामना | Happy Buddha Jayanti - Peace from Nepal!',
    badgeBg: 'bg-amber-500/15 dark:bg-amber-500/25',
    badgeBorder: 'border-amber-500/40',
    badgeText: 'text-amber-900 dark:text-amber-200',
    bannerGradient: 'from-amber-500/20 via-yellow-500/15 to-transparent',
    emoji: '🪷',
    rootBg: 'bg-gradient-to-b from-[#FFFDF6] via-[#FFFBEB] to-[#FEF3C7]/70 dark:from-[#0A1020] dark:via-[#171407] dark:to-[#1F1905]',
    headerBg: 'backdrop-blur-2xl bg-white/75 dark:bg-[#10172C]/80 border-b border-amber-200/60 dark:border-amber-500/20',
    cardGlassBg: 'backdrop-blur-xl bg-white/75 dark:bg-[#151D34]/80 border border-amber-200/60 dark:border-amber-500/20 shadow-xl shadow-amber-500/5',
    heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(245,158,11,0.22),transparent_70%)]',
    accentBorder: 'border-amber-500/30',
  },
}

export const DEFAULT_CLEAN_THEME: FestivalMetadata = {
  id: 'none',
  name: 'Clean Corporate',
  nepaliName: 'Netpack Standard',
  tag: 'Standard',
  defaultGreeting: '',
  badgeBg: 'bg-blue-50 dark:bg-white/[0.05]',
  badgeBorder: 'border-blue-200/80 dark:border-white/10',
  badgeText: 'text-blue-700 dark:text-sky-300',
  bannerGradient: 'from-blue-500/10 via-sky-500/5 to-transparent',
  emoji: '📦',
  rootBg: 'bg-[#FBFBFD] dark:bg-[#070D18]',
  headerBg: 'backdrop-blur-xl bg-white/80 dark:bg-[#0A1128]/85 border-b border-slate-200/70 dark:border-white/[0.08]',
  cardGlassBg: 'backdrop-blur-xl bg-white/90 dark:bg-[#0A1128]/90 border border-slate-200/80 dark:border-white/10 shadow-xl',
  heroGlow: 'bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(37,99,235,0.1),transparent_70%)]',
  accentBorder: 'border-slate-200 dark:border-white/10',
}

/**
 * Returns dynamic UI theme classes for the active festival
 */
export function getFestivalTheme(theme?: string): FestivalMetadata {
  if (theme && FESTIVAL_METADATA[theme]) {
    return FESTIVAL_METADATA[theme]
  }
  return DEFAULT_CLEAN_THEME
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
 * Large, High-Fidelity Ambient Background Visuals & Lighting Meshes
 */
export function FestiveAtmosphereBackground({ theme }: { theme: string }) {
  if (!theme || theme === 'none' || !FESTIVAL_METADATA[theme]) {
    return null
  }

  return (
    <div className='pointer-events-none fixed inset-0 overflow-hidden z-10 select-none'>
      <style>{`
        @keyframes floatKiteA {
          0% { transform: translate3d(0, 0, 0) rotate(-6deg); }
          50% { transform: translate3d(45px, -35px, 0) rotate(5deg); }
          100% { transform: translate3d(0, 0, 0) rotate(-6deg); }
        }
        @keyframes floatKiteB {
          0% { transform: translate3d(0, 0, 0) rotate(6deg); }
          50% { transform: translate3d(-40px, -28px, 0) rotate(-4deg); }
          100% { transform: translate3d(0, 0, 0) rotate(6deg); }
        }
        @keyframes floatKiteC {
          0% { transform: translate3d(0, 0, 0) rotate(-4deg) scale(0.9); }
          50% { transform: translate3d(30px, -20px, 0) rotate(6deg) scale(0.95); }
          100% { transform: translate3d(0, 0, 0) rotate(-4deg) scale(0.9); }
        }
        @keyframes tailSway {
          0%, 100% { transform: rotate(-8deg); }
          50% { transform: rotate(12deg); }
        }
        @keyframes fallJamara {
          0% { transform: translate3d(0, -60px, 0) rotate(0deg); opacity: 0; }
          15% { opacity: 0.85; }
          85% { opacity: 0.85; }
          100% { transform: translate3d(60px, 105vh, 0) rotate(360deg); opacity: 0; }
        }
        @keyframes fallSnowLarge {
          0% { transform: translate3d(0, -30px, 0) rotate(0deg); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.9; }
          100% { transform: translate3d(50px, 105vh, 0) rotate(180deg); opacity: 0; }
        }
        @keyframes fairyLightBlink {
          0%, 100% { opacity: 0.55; transform: scale(0.96); filter: drop-shadow(0 0 4px currentColor); }
          50% { opacity: 1; transform: scale(1.08); filter: drop-shadow(0 0 14px currentColor); }
        }
        @keyframes diyaFlicker {
          0%, 100% { transform: scale(1) skewX(0deg); opacity: 0.92; filter: drop-shadow(0 0 12px #F59E0B); }
          25% { transform: scale(1.06, 0.97) skewX(2deg); opacity: 1; filter: drop-shadow(0 0 18px #EA580C); }
          50% { transform: scale(0.95, 1.05) skewX(-1.5deg); opacity: 0.88; filter: drop-shadow(0 0 10px #F59E0B); }
          75% { transform: scale(1.04, 1.02) skewX(1deg); opacity: 0.98; filter: drop-shadow(0 0 16px #D97706); }
        }
        @keyframes prayerFlagBreeze {
          0%, 100% { transform: skewX(0deg) rotate(0deg); }
          50% { transform: skewX(10deg) rotate(4deg); }
        }
        @keyframes gulalCloudFloat {
          0% { transform: translate3d(0, 0, 0) scale(0.9); opacity: 0.25; }
          50% { transform: translate3d(30px, -20px, 0) scale(1.1); opacity: 0.45; }
          100% { transform: translate3d(0, 0, 0) scale(0.9); opacity: 0.25; }
        }
        @keyframes lotusFloatSacred {
          0% { transform: translate3d(0, 40px, 0) scale(0.85); opacity: 0; }
          25% { opacity: 0.8; }
          75% { opacity: 0.8; }
          100% { transform: translate3d(20px, -60px, 0) scale(1.1); opacity: 0; }
        }
      `}</style>

      {/* ── 1. DASHAIN (बडा दशैँ): Prominent Kites, Golden Harvest Rays & Jamara Petals ── */}
      {theme === 'dashain' && (
        <>
          {/* Top Warm Autumn Sunburst & Sky Atmosphere */}
          <div className='absolute top-0 left-0 right-0 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(245,158,11,0.18),transparent_75%)] pointer-events-none' />

          {/* Large Primary Flying Kite (Top-Right) */}
          <div
            className='absolute top-16 right-[10%] opacity-90'
            style={{ animation: 'floatKiteA 8s ease-in-out infinite' }}
          >
            <svg width='84' height='120' viewBox='0 0 84 120' fill='none' className='drop-shadow-lg'>
              {/* Main Diamond Canvas with 4 Quadrants */}
              <polygon points='42,0 80,44 42,88 4,44' fill='#EA580C' stroke='#C2410C' strokeWidth='2' />
              <polygon points='42,0 80,44 42,44' fill='#F97316' />
              <polygon points='4,44 42,44 42,88' fill='#F59E0B' />
              {/* Curved Bamboo Spine & Cross Strut */}
              <line x1='42' y1='0' x2='42' y2='88' stroke='#FEF08A' strokeWidth='2' />
              <path d='M4,44 Q42,56 80,44' stroke='#FEF08A' strokeWidth='2' fill='none' />
              {/* Fluttering Tail & Ribbon Ties */}
              <g style={{ transformOrigin: '42px 88px', animation: 'tailSway 3s ease-in-out infinite' }}>
                <path d='M42,88 Q48,98 38,108 Q46,116 40,126' stroke='#EA580C' strokeWidth='2.5' fill='none' />
                <polygon points='34,102 44,102 39,108' fill='#EAB308' />
                <polygon points='36,120 46,120 41,126' fill='#DC2626' />
              </g>
            </svg>
          </div>

          {/* Second Soaring Kite (Left Sky) */}
          <div
            className='absolute top-32 left-[6%] opacity-85 hidden md:block'
            style={{ animation: 'floatKiteB 10s ease-in-out infinite' }}
          >
            <svg width='72' height='100' viewBox='0 0 72 100' fill='none' className='drop-shadow-md'>
              <polygon points='36,0 68,38 36,76 4,38' fill='#2563EB' stroke='#1D4ED8' strokeWidth='1.8' />
              <polygon points='36,0 68,38 36,38' fill='#3B82F6' />
              <polygon points='4,38 36,38 36,76' fill='#06B6D4' />
              <line x1='36' y1='0' x2='36' y2='76' stroke='#BFDBFE' strokeWidth='1.8' />
              <path d='M4,38 Q36,48 68,38' stroke='#BFDBFE' strokeWidth='1.8' fill='none' />
              <g style={{ transformOrigin: '36px 76px', animation: 'tailSway 2.5s ease-in-out infinite' }}>
                <path d='M36,76 Q30,86 40,94 Q32,102 38,110' stroke='#2563EB' strokeWidth='2' fill='none' />
                <polygon points='32,90 40,90 36,95' fill='#F59E0B' />
              </g>
            </svg>
          </div>

          {/* Third High-Altitude Kite (Mid Sky) */}
          <div
            className='absolute top-20 left-[48%] opacity-70 hidden lg:block'
            style={{ animation: 'floatKiteC 12s ease-in-out infinite' }}
          >
            <svg width='54' height='76' viewBox='0 0 54 76' fill='none' className='drop-shadow-xs'>
              <polygon points='27,0 52,28 27,56 2,28' fill='#10B981' stroke='#059669' strokeWidth='1.5' />
              <polygon points='27,0 52,28 27,28' fill='#34D399' />
              <line x1='27' y1='0' x2='27' y2='56' stroke='#D1FAE5' strokeWidth='1.5' />
              <path d='M2,28 Q27,36 52,28' stroke='#D1FAE5' strokeWidth='1.5' fill='none' />
              <path d='M27,56 Q32,64 24,72' stroke='#10B981' strokeWidth='1.8' fill='none' />
            </svg>
          </div>

          {/* Drifting Golden Barley (Jamara) & Saffron Marigold Petals */}
          {[10, 24, 40, 58, 72, 88].map((leftPos, i) => (
            <div
              key={i}
              className='absolute top-0 text-amber-500/80 dark:text-amber-300/75'
              style={{
                left: `${leftPos}%`,
                animation: `fallJamara ${11 + (i % 4) * 3}s linear infinite`,
                animationDelay: `${i * 2}s`,
              }}
            >
              {i % 2 === 0 ? (
                // Golden Jamara Stalk
                <svg width='28' height='36' viewBox='0 0 28 36' fill='none'>
                  <path d='M14,0 Q18,12 14,36' stroke='#EAB308' strokeWidth='2.2' />
                  <path d='M14,6 Q24,4 20,12' stroke='#F59E0B' strokeWidth='2' />
                  <path d='M14,12 Q4,10 8,18' stroke='#EAB308' strokeWidth='2' />
                  <path d='M14,20 Q24,18 19,26' stroke='#F59E0B' strokeWidth='2' />
                </svg>
              ) : (
                // Saffron Marigold Blossom Petal
                <svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
                  <circle cx='12' cy='12' r='5' fill='#F97316' />
                  <circle cx='12' cy='7' r='3.5' fill='#FBBF24' />
                  <circle cx='12' cy='17' r='3.5' fill='#FBBF24' />
                  <circle cx='7' cy='12' r='3.5' fill='#FBBF24' />
                  <circle cx='17' cy='12' r='3.5' fill='#FBBF24' />
                </svg>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── 2. TIHAR & DEEPAWALI (तिहार): Glowing Fairy Lights & Ornate Brass Diyas ── */}
      {theme === 'tihar' && (
        <>
          {/* Top Twilight Deepawali Lighting Wash */}
          <div className='absolute top-0 left-0 right-0 h-[450px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(234,179,8,0.2),transparent_75%)] pointer-events-none' />

          {/* Full-Width Fairy Lights Garland along the Header */}
          <div className='absolute top-0 left-0 right-0 h-14 flex items-center justify-between px-2 sm:px-6 z-20 pointer-events-none'>
            {Array.from({ length: 30 }).map((_, i) => {
              const palette = [
                { color: '#F59E0B', glow: 'rgba(245, 158, 11, 0.7)' },
                { color: '#EF4444', glow: 'rgba(239, 68, 68, 0.7)' },
                { color: '#10B981', glow: 'rgba(16, 185, 129, 0.7)' },
                { color: '#3B82F6', glow: 'rgba(59, 130, 246, 0.7)' },
                { color: '#FBBF24', glow: 'rgba(251, 191, 36, 0.7)' },
              ]
              const p = palette[i % palette.length]
              return (
                <div key={i} className='flex flex-col items-center'>
                  {/* Garland Wire Swag */}
                  <div className='w-0.5 h-3 bg-slate-500/40 dark:bg-slate-300/30' />
                  {/* Glowing Teardrop Bulb */}
                  <div
                    className='w-3 h-4.5 rounded-full'
                    style={{
                      backgroundColor: p.color,
                      color: p.color,
                      boxShadow: `0 0 10px ${p.glow}, 0 0 20px ${p.glow}`,
                      animation: `fairyLightBlink ${1.4 + (i % 4) * 0.3}s ease-in-out infinite`,
                      animationDelay: `${(i % 6) * 0.25}s`,
                    }}
                  />
                </div>
              )
            })}
          </div>

          {/* Prominent Glowing Brass Diya (Bottom-Left) */}
          <div className='absolute bottom-6 left-6 z-20 hidden sm:block'>
            <div className='relative flex flex-col items-center'>
              {/* Flame Halos */}
              <div
                className='w-6 h-10 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-200'
                style={{
                  clipPath: 'polygon(50% 0%, 85% 60%, 50% 100%, 15% 60%)',
                  animation: 'diyaFlicker 1.8s ease-in-out infinite',
                }}
              />
              {/* Brass Diya Lamp Body */}
              <svg width='76' height='36' viewBox='0 0 76 36' fill='none' className='-mt-2 drop-shadow-xl'>
                <path d='M4,8 Q38,36 72,8 Q74,18 64,28 Q38,36 12,28 Q2,18 4,8 Z' fill='#D97706' stroke='#B45309' strokeWidth='1.5' />
                <ellipse cx='38' cy='8' rx='34' ry='6' fill='#F59E0B' />
                <ellipse cx='38' cy='7' rx='28' ry='4' fill='#78350F' />
              </svg>
              <div className='text-[11px] font-bold text-amber-900 dark:text-amber-200 tracking-wider mt-1'>
                शुभ दिपावली
              </div>
            </div>
          </div>

          {/* Prominent Glowing Brass Diya (Bottom-Right) */}
          <div className='absolute bottom-6 right-6 z-20 hidden md:block'>
            <div className='relative flex flex-col items-center'>
              <div
                className='w-6 h-10 rounded-full bg-gradient-to-t from-orange-500 via-amber-400 to-yellow-200'
                style={{
                  clipPath: 'polygon(50% 0%, 85% 60%, 50% 100%, 15% 60%)',
                  animation: 'diyaFlicker 2.1s ease-in-out infinite 0.4s',
                }}
              />
              <svg width='76' height='36' viewBox='0 0 76 36' fill='none' className='-mt-2 drop-shadow-xl'>
                <path d='M4,8 Q38,36 72,8 Q74,18 64,28 Q38,36 12,28 Q2,18 4,8 Z' fill='#D97706' stroke='#B45309' strokeWidth='1.5' />
                <ellipse cx='38' cy='8' rx='34' ry='6' fill='#F59E0B' />
                <ellipse cx='38' cy='7' rx='28' ry='4' fill='#78350F' />
              </svg>
            </div>
          </div>
        </>
      )}

      {/* ── 3. CHHATH PUJA: Radiant Morning Sunburst & Holy River Shimmer ── */}
      {theme === 'chhath' && (
        <>
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1100px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.22),rgba(234,88,12,0.1)_40%,transparent_75%)] pointer-events-none' />
          {/* Majestic Rising Sun Disc in top sky */}
          <div className='absolute top-8 left-1/2 -translate-x-1/2 flex items-center justify-center opacity-85'>
            <div className='w-24 h-24 rounded-full bg-gradient-to-b from-yellow-300 via-orange-400 to-red-500 shadow-[0_0_60px_rgba(249,115,22,0.6)] animate-pulse' />
          </div>
        </>
      )}

      {/* ── 4. CHRISTMAS: Multi-Depth Crystalline Snowflakes & Frosted Vignette ── */}
      {theme === 'christmas' && (
        <>
          <div className='absolute top-0 left-0 right-0 h-[420px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(14,165,233,0.18),transparent_75%)] pointer-events-none' />
          {/* Crystalline SVG Snowflakes */}
          {[6, 16, 28, 42, 56, 68, 80, 92].map((xPos, idx) => (
            <div
              key={idx}
              className='absolute top-0 text-sky-400/80 dark:text-sky-200/90'
              style={{
                left: `${xPos}%`,
                animation: `fallSnowLarge ${8 + (idx % 4) * 3}s linear infinite`,
                animationDelay: `${idx * 1.5}s`,
              }}
            >
              <svg
                width={idx % 2 === 0 ? '28' : '20'}
                height={idx % 2 === 0 ? '28' : '20'}
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='1.8'
                strokeLinecap='round'
                className='drop-shadow-xs'
              >
                <line x1='12' y1='2' x2='12' y2='22' />
                <line x1='2' y1='12' x2='22' y2='12' />
                <line x1='5' y1='5' x2='19' y2='19' />
                <line x1='5' y1='19' x2='19' y2='5' />
                <path d='M10,4 L12,2 L14,4' />
                <path d='M10,20 L12,22 L14,20' />
                <path d='M4,10 L2,12 L4,14' />
                <path d='M20,10 L22,12 L20,14' />
              </svg>
            </div>
          ))}
        </>
      )}

      {/* ── 5. ENGLISH NEW YEAR: Midnight Fireworks Sparks & Starry Trails ── */}
      {theme === 'new_year' && (
        <>
          <div className='absolute top-0 left-0 right-0 h-[450px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.22),transparent_75%)] pointer-events-none' />
          {[12, 30, 50, 72, 88].map((x, i) => (
            <div
              key={i}
              className='absolute top-16 text-indigo-400 dark:text-indigo-300 drop-shadow-md'
              style={{
                left: `${x}%`,
                animation: `fairyLightBlink ${2 + (i % 3) * 0.5}s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <svg width='36' height='36' viewBox='0 0 36 36' fill='none'>
                <path d='M18,0 L20,14 L36,18 L20,22 L18,36 L16,22 L0,18 L16,14 Z' fill='#FBBF24' />
              </svg>
            </div>
          ))}
        </>
      )}

      {/* ── 6. LABOUR DAY: May 1 Dignity of Labour Laurel & Gear Emblem ── */}
      {theme === 'labour_day' && (
        <>
          <div className='absolute top-0 left-0 right-0 h-[380px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,63,94,0.18),transparent_75%)] pointer-events-none' />
          <div className='absolute bottom-8 right-8 opacity-75 hidden sm:flex items-center gap-3 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 p-3 rounded-2xl border border-rose-500/30 shadow-lg'>
            <svg width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#E11D48' strokeWidth='2'>
              <circle cx='12' cy='12' r='3' />
              <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' />
            </svg>
            <div className='text-xs font-bold text-rose-950 dark:text-rose-100'>
              Honoring Workers Worldwide
            </div>
          </div>
        </>
      )}

      {/* ── 7. MAGHE SANKRANTI: Winter Solstice Kites & Dawn Amber Rays ── */}
      {theme === 'maghe_sankranti' && (
        <>
          <div className='absolute top-0 left-0 right-0 h-[450px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(217,119,6,0.2),transparent_75%)] pointer-events-none' />
          <div
            className='absolute top-20 right-[15%] opacity-90'
            style={{ animation: 'floatKiteA 9s ease-in-out infinite' }}
          >
            <svg width='76' height='108' viewBox='0 0 76 108' fill='none' className='drop-shadow-lg'>
              <polygon points='38,0 72,40 38,80 4,40' fill='#D97706' stroke='#B45309' strokeWidth='2' />
              <line x1='38' y1='0' x2='38' y2='80' stroke='#FEF3C7' strokeWidth='2' />
              <path d='M4,40 Q38,50 72,40' stroke='#FEF3C7' strokeWidth='2' fill='none' />
              <path d='M38,80 Q44,90 34,100' stroke='#D97706' strokeWidth='2.2' fill='none' />
            </svg>
          </div>
        </>
      )}

      {/* ── 8. LHOSAR: Authentic 5-Color Himalayan Tibetan Prayer Flags (Lungta) ── */}
      {theme === 'lhosar' && (
        <>
          <div className='absolute top-0 left-0 right-0 h-[420px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(6,182,212,0.18),transparent_75%)] pointer-events-none' />
          {/* Prominent Prayer Flags String across Top Edge */}
          <div className='absolute top-0 left-0 right-0 flex items-start justify-around px-1 z-20 pointer-events-none'>
            {Array.from({ length: 22 }).map((_, idx) => {
              const flags = [
                { bg: '#2563EB', text: 'Blue (Sky)' },
                { bg: '#F8FAFC', border: '#CBD5E1', text: 'White (Air)' },
                { bg: '#DC2626', text: 'Red (Fire)' },
                { bg: '#10B981', text: 'Green (Water)' },
                { bg: '#EAB308', text: 'Yellow (Earth)' },
              ]
              const f = flags[idx % flags.length]
              return (
                <div
                  key={idx}
                  className='w-6 sm:w-8 h-9 sm:h-12 shadow-sm rounded-b-xs origin-top'
                  style={{
                    backgroundColor: f.bg,
                    border: f.border ? `1px solid ${f.border}` : 'none',
                    animation: `prayerFlagBreeze ${2.4 + (idx % 3) * 0.4}s ease-in-out infinite`,
                    animationDelay: `${idx * 0.12}s`,
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 85%, 0 100%)',
                  }}
                />
              )
            })}
          </div>
        </>
      )}

      {/* ── 9. HOLI: Painterly Translucent Gulal Clouds & Splashes ── */}
      {theme === 'holi' && (
        <>
          <div className='absolute top-0 left-0 right-0 h-[460px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(236,72,153,0.18),transparent_75%)] pointer-events-none' />
          {/* Floating Vibrant Pastel Powder Clouds */}
          {[
            { color: '#EC4899', top: '12%', left: '8%', size: 'w-44 h-44' },
            { color: '#06B6D4', top: '22%', right: '12%', size: 'w-48 h-48' },
            { color: '#EAB308', top: '35%', left: '42%', size: 'w-40 h-40' },
            { color: '#8B5CF6', top: '18%', right: '35%', size: 'w-44 h-44' },
          ].map((c, i) => (
            <div
              key={i}
              className={`absolute rounded-full blur-3xl opacity-35 ${c.size}`}
              style={{
                backgroundColor: c.color,
                top: c.top,
                left: c.left,
                right: c.right,
                animation: 'gulalCloudFloat 7s ease-in-out infinite',
                animationDelay: `${i * 1.5}s`,
              }}
            />
          ))}
        </>
      )}

      {/* ── 10. NEPALI NEW YEAR: Falling Pink & Crimson Rhododendron (Laligurans) Petals ── */}
      {theme === 'nepali_new_year' && (
        <>
          <div className='absolute top-0 left-0 right-0 h-[450px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,63,94,0.18),transparent_75%)] pointer-events-none' />
          {[8, 22, 38, 54, 70, 86].map((pos, idx) => (
            <div
              key={idx}
              className='absolute top-0 text-rose-500/80 dark:text-rose-400/80'
              style={{
                left: `${pos}%`,
                animation: `fallJamara ${10 + (idx % 3) * 3}s linear infinite`,
                animationDelay: `${idx * 1.8}s`,
              }}
            >
              <svg width='26' height='26' viewBox='0 0 24 24' fill='none'>
                <path d='M12,2 C15,6 18,10 18,14 C18,18 15,22 12,22 C9,22 6,18 6,14 C6,10 9,6 12,2 Z' fill='#E11D48' />
                <path d='M12,6 C14,9 15,12 15,15 C15,17 13.5,19 12,19 C10.5,19 9,17 9,15 C9,12 10,9 12,6 Z' fill='#FB7185' />
              </svg>
            </div>
          ))}
        </>
      )}

      {/* ── 11. BUDDHA JAYANTI: Sacred Ascending Lotus Blooms & Serene Halo ── */}
      {theme === 'buddha_jayanti' && (
        <>
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.18),transparent_75%)] pointer-events-none' />
          {[16, 42, 68, 88].map((leftVal, i) => (
            <div
              key={i}
              className='absolute bottom-12 opacity-80'
              style={{
                left: `${leftVal}%`,
                animation: `lotusFloatSacred ${9 + (i % 2) * 3}s ease-in-out infinite`,
                animationDelay: `${i * 2.2}s`,
              }}
            >
              <svg width='44' height='36' viewBox='0 0 44 36' fill='none' className='drop-shadow-md'>
                <path d='M22,2 C28,12 36,18 36,26 C36,32 30,34 22,34 C14,34 8,32 8,26 C8,18 16,12 22,2 Z' fill='#F59E0B' />
                <path d='M22,10 C26,16 30,22 30,27 C30,31 26,32 22,32 C18,32 14,31 14,27 C14,22 18,16 22,10 Z' fill='#FEF08A' />
                <path d='M4,22 C10,22 16,26 18,32 C12,34 6,32 4,22 Z' fill='#D97706' />
                <path d='M40,22 C34,22 28,26 26,32 C32,34 38,32 40,22 Z' fill='#D97706' />
              </svg>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

/**
 * Beside-the-Logo Festive Cultural Adornment
 * Adds Dashain Rato Tika & Jamara, Tihar Diya, Christmas Holly, etc. right next to the Netpack logo
 */
export function FestiveLogoAdornment({ theme }: { theme: string }) {
  if (!theme || theme === 'none' || !FESTIVAL_METADATA[theme]) {
    return null
  }

  return (
    <div className='inline-flex items-center shrink-0 select-none pointer-events-none transition-transform duration-300 group-hover:scale-105'>
      {/* ── DASHAIN: Authentic Rato Tika with Akshata Rice & Golden Jamara Sprigs ── */}
      {theme === 'dashain' && (
        <div className='relative flex items-center -ml-0.5' title='शुभ विजया दशमी | Rato Tika & Jamara'>
          <svg width='36' height='36' viewBox='0 0 36 36' fill='none' className='overflow-visible drop-shadow-sm'>
            {/* Lush Golden-Green Jamara (Barley Sprout blades fanning out from behind tika) */}
            <g strokeLinecap='round'>
              {/* Outer Left Blade */}
              <path d='M18 27 C14 18 7 12 2 7' stroke='#EAB308' strokeWidth='2.2' />
              {/* Mid Left Blade */}
              <path d='M18 27 C15 17 10 10 6 3' stroke='#84CC16' strokeWidth='2' />
              {/* Central Tall Sprout Blade */}
              <path d='M18 27 C18 14 16 6 14 1' stroke='#EAB308' strokeWidth='2.4' />
              {/* Mid Right Blade */}
              <path d='M18 27 C21 16 24 9 27 2' stroke='#84CC16' strokeWidth='2' />
              {/* Outer Right Blade */}
              <path d='M18 27 C22 18 28 12 34 6' stroke='#EAB308' strokeWidth='2.2' />
              {/* Fresh Tender Young Stalks */}
              <path d='M18 27 C20 20 26 15 32 13' stroke='#FACC15' strokeWidth='1.6' />
              <path d='M18 27 C15 21 11 16 4 14' stroke='#A3E635' strokeWidth='1.6' />
            </g>

            {/* Sacred Crimson Rato Tika with Akshata Rice */}
            <circle cx='18' cy='27' r='7.8' fill='#991B1B' opacity='0.25' />
            <circle cx='18' cy='27' r='7.2' fill='#DC2626' stroke='#991B1B' strokeWidth='0.8' />
            <circle cx='17' cy='26' r='5.2' fill='#EF4444' />

            {/* Textured Akshata Rice Grains (चामलको अक्षता) embedded on Tika */}
            <ellipse cx='15' cy='25' rx='1.1' ry='2.1' transform='rotate(-25 15 25)' fill='#FFFFFE' stroke='#FEF08A' strokeWidth='0.4' />
            <ellipse cx='19.5' cy='25.5' rx='1.1' ry='1.9' transform='rotate(25 19.5 25.5)' fill='#FFFFFE' stroke='#FEF08A' strokeWidth='0.4' />
            <ellipse cx='17.5' cy='28.5' rx='1' ry='2' transform='rotate(-5 17.5 28.5)' fill='#FFFFFE' stroke='#FEF08A' strokeWidth='0.4' />
            <ellipse cx='14.5' cy='28' rx='0.9' ry='1.7' transform='rotate(40 14.5 28)' fill='#FFFFFE' stroke='#FEF08A' strokeWidth='0.4' />
            <ellipse cx='20.5' cy='28.5' rx='0.9' ry='1.6' transform='rotate(-35 20.5 28.5)' fill='#FFFFFE' stroke='#FEF08A' strokeWidth='0.4' />
          </svg>
        </div>
      )}

      {/* ── TIHAR: Glowing Traditional Brass Diya with Flickering Flame ── */}
      {theme === 'tihar' && (
        <div className='relative flex items-center -ml-0.5' title='शुभ दिपावली | Glowing Diya'>
          <svg width='36' height='36' viewBox='0 0 36 36' fill='none' className='overflow-visible drop-shadow-md'>
            {/* Flickering Flame with Ambient Halos */}
            <g style={{ transformOrigin: '18px 16px', animation: 'diyaFlicker 1.8s ease-in-out infinite' }}>
              <circle cx='18' cy='11' r='8' fill='rgba(245, 158, 11, 0.28)' filter='blur(2px)' />
              <path d='M18 3 C21.5 7.5 22.5 12 18 16 C13.5 12 14.5 7.5 18 3 Z' fill='#EA580C' />
              <path d='M18 5 C20.5 8.5 21 12 18 15 C15 12 15.5 8.5 18 5 Z' fill='#F59E0B' />
              <path d='M18 7.5 C19.5 10 20 12.5 18 14.5 C16 12.5 16.5 10 18 7.5 Z' fill='#FEF08A' />
            </g>

            {/* Ornate Brass Diya Bowl */}
            <path d='M6 16 C7 24 13 30 18 30 C23 30 29 24 30 16 Z' fill='#D97706' stroke='#B45309' strokeWidth='1.2' />
            <ellipse cx='18' cy='16' rx='12' ry='3.5' fill='#F59E0B' />
            <ellipse cx='18' cy='15.5' rx='9.5' ry='2.2' fill='#78350F' />
            <path d='M14 30 L22 30 L20 33 L16 33 Z' fill='#B45309' />
          </svg>
        </div>
      )}

      {/* ── CHRISTMAS: Winter Holly Leaves & Crimson Berries ── */}
      {theme === 'christmas' && (
        <div className='relative flex items-center -ml-0.5' title='Merry Christmas'>
          <svg width='34' height='34' viewBox='0 0 34 34' fill='none' className='drop-shadow-xs'>
            <path d='M12 24 C8 21 6 15 10 12 C13 14 15 17 17 21 Z' fill='#059669' stroke='#047857' strokeWidth='0.8' />
            <path d='M22 24 C26 21 28 15 24 12 C21 14 19 17 17 21 Z' fill='#10B981' stroke='#059669' strokeWidth='0.8' />
            <circle cx='15' cy='23' r='3.5' fill='#DC2626' stroke='#991B1B' strokeWidth='0.6' />
            <circle cx='19' cy='23' r='3.5' fill='#EF4444' stroke='#991B1B' strokeWidth='0.6' />
            <circle cx='17' cy='20' r='3.2' fill='#B91C1C' stroke='#7F1D1D' strokeWidth='0.6' />
            <circle cx='14.2' cy='22' r='0.8' fill='white' />
            <circle cx='18.2' cy='22' r='0.8' fill='white' />
          </svg>
        </div>
      )}

      {/* ── CHHATH: Sacred Rising Surya ── */}
      {theme === 'chhath' && (
        <div className='relative flex items-center -ml-0.5' title='छठ पर्व | Surya Arghya'>
          <svg width='34' height='34' viewBox='0 0 34 34' fill='none'>
            <circle cx='17' cy='17' r='7' fill='#F97316' />
            <circle cx='17' cy='17' r='5' fill='#FBBF24' />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, k) => (
              <line
                key={k}
                x1='17'
                y1='7'
                x2='17'
                y2='4'
                stroke='#EA580C'
                strokeWidth='1.8'
                strokeLinecap='round'
                transform={`rotate(${angle} 17 17)`}
              />
            ))}
          </svg>
        </div>
      )}

      {/* ── LHOSAR: Himalayan Sacred Prayer Ribbons ── */}
      {theme === 'lhosar' && (
        <div className='relative flex items-center -ml-0.5' title='Tashi Delek | Lhosar'>
          <svg width='34' height='34' viewBox='0 0 34 34' fill='none'>
            <path d='M6 6 Q12 18 10 28' stroke='#2563EB' strokeWidth='2.2' strokeLinecap='round' />
            <path d='M14 4 Q20 16 18 29' stroke='#DC2626' strokeWidth='2.2' strokeLinecap='round' />
            <path d='M22 6 Q28 18 26 28' stroke='#EAB308' strokeWidth='2.2' strokeLinecap='round' />
            <circle cx='10' cy='8' r='2' fill='#10B981' />
            <circle cx='18' cy='6' r='2' fill='#06B6D4' />
            <circle cx='26' cy='8' r='2' fill='#F8FAFC' stroke='#94A3B8' strokeWidth='0.6' />
          </svg>
        </div>
      )}

      {/* ── HOLI: Vibrant Gulal Color Splashes ── */}
      {theme === 'holi' && (
        <div className='relative flex items-center -ml-0.5' title='Happy Holi'>
          <svg width='34' height='34' viewBox='0 0 34 34' fill='none'>
            <circle cx='13' cy='16' r='5.5' fill='#EC4899' />
            <circle cx='21' cy='14' r='4.5' fill='#06B6D4' />
            <circle cx='17' cy='22' r='5' fill='#EAB308' />
            <circle cx='10' cy='22' r='2' fill='#8B5CF6' />
            <circle cx='24' cy='22' r='2.2' fill='#10B981' />
          </svg>
        </div>
      )}

      {/* ── NEPALI NEW YEAR: Blooming Rhododendron Laligurans ── */}
      {theme === 'nepali_new_year' && (
        <div className='relative flex items-center -ml-0.5' title='नयाँ वर्ष | Laligurans'>
          <svg width='34' height='34' viewBox='0 0 34 34' fill='none'>
            <circle cx='17' cy='17' r='3.5' fill='#991B1B' />
            <circle cx='17' cy='11' r='4.5' fill='#E11D48' />
            <circle cx='23' cy='15' r='4.5' fill='#E11D48' />
            <circle cx='21' cy='22' r='4.5' fill='#BE123C' />
            <circle cx='13' cy='22' r='4.5' fill='#BE123C' />
            <circle cx='11' cy='15' r='4.5' fill='#E11D48' />
            <circle cx='17' cy='17' r='2' fill='#FEF08A' />
          </svg>
        </div>
      )}

      {/* ── BUDDHA JAYANTI: Sacred Golden Lotus ── */}
      {theme === 'buddha_jayanti' && (
        <div className='relative flex items-center -ml-0.5' title='बुद्ध जयन्ती | Sacred Lotus'>
          <svg width='34' height='34' viewBox='0 0 34 34' fill='none'>
            <path d='M17 5 C21 13 27 18 27 24 C27 29 22 30 17 30 C12 30 7 29 7 24 C7 18 13 13 17 5 Z' fill='#F59E0B' />
            <path d='M17 11 C20 16 23 21 23 25 C23 28 20 29 17 29 C14 29 11 28 11 25 C11 21 14 16 17 11 Z' fill='#FEF08A' />
            <path d='M4 22 C9 22 13 25 15 29 C10 30 5 29 4 22 Z' fill='#D97706' />
            <path d='M30 22 C25 22 21 25 19 29 C24 30 29 29 30 22 Z' fill='#D97706' />
          </svg>
        </div>
      )}

      {/* ── MAGHE SANKRANTI: Winter Solstice Diamond Motif ── */}
      {theme === 'maghe_sankranti' && (
        <div className='relative flex items-center -ml-0.5' title='माघे सङ्क्रान्ति'>
          <svg width='34' height='34' viewBox='0 0 34 34' fill='none'>
            <polygon points='17,4 27,15 17,26 7,15' fill='#D97706' stroke='#B45309' strokeWidth='1' />
            <line x1='17' y1='4' x2='17' y2='26' stroke='#FEF3C7' strokeWidth='1.2' />
            <path d='M7,15 Q17,20 27,15' stroke='#FEF3C7' strokeWidth='1.2' fill='none' />
            <path d='M17,26 Q20,30 16,33' stroke='#D97706' strokeWidth='1.5' fill='none' />
          </svg>
        </div>
      )}

      {/* ── ENGLISH NEW YEAR: Golden Starburst Sparkle ── */}
      {theme === 'new_year' && (
        <div className='relative flex items-center -ml-0.5' title='Happy New Year'>
          <svg width='34' height='34' viewBox='0 0 34 34' fill='none'>
            <path d='M17 2 L19 13 L30 17 L19 21 L17 32 L15 21 L4 17 L15 13 Z' fill='#FBBF24' />
            <circle cx='17' cy='17' r='2' fill='#FFF' />
          </svg>
        </div>
      )}

      {/* ── LABOUR DAY: Laurel & Solidarity Emblem ── */}
      {theme === 'labour_day' && (
        <div className='relative flex items-center -ml-0.5' title='International Workers’ Day'>
          <svg width='34' height='34' viewBox='0 0 34 34' fill='none' stroke='#E11D48' strokeWidth='1.8'>
            <circle cx='17' cy='17' r='4' />
            <path d='M17 7 V11 M17 23 V27 M7 17 H11 M23 17 H27' strokeLinecap='round' />
          </svg>
        </div>
      )}
    </div>
  )
}

/**
 * Top Festive Greeting Ribbon (Optional)
 */
export function FestiveGreetingRibbon({
  theme,
  customGreeting,
}: {
  theme: string
  customGreeting?: string
}) {
  if (!theme || theme === 'none' || !FESTIVAL_METADATA[theme]) {
    return null
  }

  const meta = FESTIVAL_METADATA[theme]
  const greetingText = customGreeting?.trim() || meta.defaultGreeting

  return (
    <div className='relative z-30 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 backdrop-blur-xl py-2 px-4 shadow-xs'>
      <div className='max-w-[1440px] 2xl:max-w-[1536px] mx-auto flex items-center justify-between gap-2 text-xs'>
        <div className='flex items-center gap-2 text-left'>
          <span className='inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/25 text-amber-900 dark:text-amber-200 font-bold shrink-0 text-sm'>
            {meta.emoji}
          </span>
          <span className='font-semibold text-slate-900 dark:text-slate-100 tracking-wide'>
            {greetingText}
          </span>
        </div>

        <Badge
          variant='outline'
          className='text-[10px] px-2 py-0.5 border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold'
        >
          {meta.nepaliName}
        </Badge>
      </div>
    </div>
  )
}

/**
 * Subtle Floating Toggle Pill (Optional)
 */
export function FestiveFloatingToggle({
  theme,
}: {
  theme: string
}) {
  if (!theme || theme === 'none' || !FESTIVAL_METADATA[theme]) {
    return null
  }

  const meta = FESTIVAL_METADATA[theme]

  return (
    <div className='fixed bottom-5 right-5 z-40 print:hidden'>
      <div
        className='inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold backdrop-blur-xl bg-white/80 dark:bg-[#0A1128]/80 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-slate-200 shadow-xl'
      >
        <span>{meta.emoji}</span>
        <span>{meta.name}</span>
      </div>
    </div>
  )
}
