/**
 * NETPACK LOGISTIC - Landing Page Central Configuration
 * Edit company details, colors, transport mode, and stats here.
 */

export interface StageConfig {
  id: number
  key: string
  title: string
  shortLabel: string
  badge: string
  description: string
  eta: string
  theme: 'light' | 'grey' | 'dark'
}

export interface ServiceItem {
  id: string
  title: string
  tag: string
  description: string
  iconName: string
  features: string[]
}

export const LANDING_CONFIG = {
  // Brand identity
  brandName: 'NETPACK LOGISTIC',
  legalName: 'Netpack Logistic Pvt. Ltd.',
  tagline: 'EVERY LEG OF THE JOURNEY.',
  subheadline: 'Door-to-door courier and international shipping, tracked end to end.',

  // Global Transport Mode: 'air' (cargo plane) or 'sea' (container ship)
  transportMode: 'air' as 'air' | 'sea',

  // Color Tokens
  colors: {
    navyDark: '#0D1B2A',      // Deep navy background for dark scenes, hero, footer
    navySurface: '#132238',   // Slightly lighter navy for cards in dark mode
    offWhite: '#F5F7FA',      // Clean day/light background
    whiteSurface: '#FFFFFF',  // Crisp card background in light mode
    electricBlue: '#2F6BFF',  // Primary accent for lasers, arcs, badges
    warmOrange: '#FF7A1A',    // High-visibility CTA highlight
    borderDark: 'rgba(255, 255, 255, 0.08)',
    borderLight: 'rgba(13, 27, 42, 0.08)',
    textMutedDark: '#8A99AD',
    textMutedLight: '#64748B',
  },

  // Proof Stats
  stats: [
    { value: '2,500+', numeric: 2500, suffix: '+', label: 'Shipments Delivered', detail: 'Door-to-door verified' },
    { value: '98.2%', numeric: 98.2, suffix: '%', label: 'On-Time Delivery', detail: 'Guaranteed dispatch' },
    { value: '45+', numeric: 45, suffix: '+', label: 'Countries Served', detail: 'Worldwide clearance hubs' },
  ],

  // 6 Journey Stages
  stages: [
    {
      id: 1,
      key: 'packing',
      title: 'PACKING',
      shortLabel: 'Packing',
      badge: 'Hub Inspection',
      description: 'Packed with care. Every parcel is inspected, sealed and labelled.',
      eta: 'Day 1 • 09:30 AM',
      theme: 'light',
    },
    {
      id: 2,
      key: 'customs_export',
      title: 'CUSTOMS CLEARANCE',
      shortLabel: 'Export Customs',
      badge: 'TIA Customs Port',
      description: 'Export paperwork handled. Documents verified, duties calculated, cleared to fly.',
      eta: 'Day 1 • 03:45 PM',
      theme: 'grey',
    },
    {
      id: 3,
      key: 'departure',
      title: 'SHIPMENT DEPARTURE',
      shortLabel: 'In Flight',
      badge: 'Transit Corridor',
      description: 'Wheels up. Your shipment is on its way. Live status, every mile.',
      eta: 'Day 2 • 01:15 AM',
      theme: 'dark',
    },
    {
      id: 4,
      key: 'destination_customs',
      title: 'CLEARANCE AT DESTINATION',
      shortLabel: 'Arrival Customs',
      badge: 'Global Gateway',
      description: 'Smooth arrival. Import clearance completed with local partners.',
      eta: 'Day 3 • 11:00 AM',
      theme: 'dark',
    },
    {
      id: 5,
      key: 'out_for_delivery',
      title: 'OUT FOR DELIVERY',
      shortLabel: 'Final Mile',
      badge: 'Local Dispatch',
      description: 'On the road. Our delivery partner is heading to your door.',
      eta: 'Day 4 • 08:30 AM',
      theme: 'light',
    },
    {
      id: 6,
      key: 'delivered',
      title: 'DELIVERED',
      shortLabel: 'Completed',
      badge: 'Direct Handover',
      description: 'Delivered. Signed, sealed, done.',
      eta: 'Day 4 • 02:40 PM',
      theme: 'light',
    },
  ] as StageConfig[],

  // Split Reveal Cards
  milestones: [
    {
      id: 'realtime_telemetry',
      title: 'Real-Time Telemetry',
      tag: 'PRECISION',
      description: 'Continuous barcode scanning, GPS checkpoint tracking, and instant automated milestone pings to consignee.',
    },
    {
      id: 'customs_expertise',
      title: 'Customs Mastery',
      tag: 'COMPLIANCE',
      description: 'Zero-delay HAWB classification, duty harmonization, and verified export/import manifests in 45+ jurisdictions.',
    },
    {
      id: 'dedicated_support',
      title: 'Dedicated Ops Desk',
      tag: '24/7 PRIORITY',
      description: 'Direct communication line with real logistics officers in Kathmandu & destination partner hubs.',
    },
  ],

  // 6 Core Services
  services: [
    {
      id: 'express-courier',
      title: 'Express Courier',
      tag: 'TIME-CRITICAL',
      description: 'Urgent document and lightweight parcel delivery worldwide with guaranteed priority flight boarding.',
      iconName: 'Zap',
      features: ['24-72h transit times', 'Signature handover', 'Real-time SMS alerts'],
    },
    {
      id: 'international-shipping',
      title: 'International Shipping',
      tag: 'GLOBAL REACH',
      description: 'Cost-effective consolidated air freight and direct connections across North America, Europe, Asia, and Gulf.',
      iconName: 'Globe',
      features: ['Tiered volume rates', 'Door-to-door tracking', 'Consolidated HAWBs'],
    },
    {
      id: 'customs-brokerage',
      title: 'Customs Brokerage',
      tag: 'ZERO DELAY',
      description: 'Comprehensive import & export documentation, duty clearance, and certified customs manifest filing.',
      iconName: 'FileCheck',
      features: ['Duty pre-assessment', 'Document harmonization', 'Regulatory compliance'],
    },
    {
      id: 'door-to-door',
      title: 'Door-to-Door Pickup',
      tag: 'CONVENIENCE',
      description: 'Free doorstep pickup across Kathmandu Valley with electronic digital scales and instant receipt issue.',
      iconName: 'Truck',
      features: ['Rider on-demand', 'On-spot box weighting', 'Instant tracking code'],
    },
    {
      id: 'cargo-freight',
      title: 'Cargo & Air Freight',
      tag: 'HEAVYWEIGHT',
      description: 'Palletized commercial shipments, handicraft exports, and high-volume cargo chartered safely.',
      iconName: 'Boxes',
      features: ['Commercial invoicing', 'Pallet wrapping & fumigation', 'Airline containerization'],
    },
    {
      id: 'warehousing',
      title: 'Warehousing & Sort',
      tag: 'SECURE STORAGE',
      description: 'Temperature-controlled storage, pick-and-pack fulfillment, and automated barcode sortation at Teku Hub.',
      iconName: 'Warehouse',
      features: ['Barcode location tracking', 'CCTV 24/7 security', 'Inventory management'],
    },
  ] as ServiceItem[],

  // Editorial Testimonial / About
  about: {
    badge: 'LEADERSHIP STATEMENT',
    headline: 'Reliability is not a metric. It is our entire business.',
    quote:
      'When an artisan in Patan ships handwoven pashmina to Paris, or a business in Kathmandu exports vital machinery spares, failure is never an option. We engineered NETPACK LOGISTIC to eliminate the blind spots between handover and destination. We treat every package as if our own name is stamped on the manifest.',
    author: 'Sunil Shakya',
    role: 'Founder & Managing Director',
    company: 'Netpack Logistic',
    location: 'Kathmandu, Nepal',
  },

  // Contact Info & Headquarters
  contact: {
    address: 'Teku-12, Kathmandu, Nepal (Opposite Customs Post)',
    phone: '+977 15339942',
    mobile: '+977 9851000000',
    email: 'info@netpacklogistic.com',
    supportEmail: 'support@netpacklogistic.com',
    operatingHours: 'Sun – Fri: 08:00 AM – 07:00 PM (NPT)',
  },

  // Floating WhatsApp Quick Support
  whatsapp: {
    phone: '9779800000000', // Replace with your company WhatsApp number
    displayNumber: '+977 9800-000000',
    defaultMessage: 'Hi NETPACK LOGISTIC, I need assistance with a courier / shipment booking.',
  },

  // Social Links
  socials: [
    { name: 'Facebook', url: 'https://facebook.com/netpacklogistic' },
    { name: 'Instagram', url: 'https://instagram.com/netpacklogistic' },
    { name: 'LinkedIn', url: 'https://linkedin.com/company/netpacklogistic' },
  ],
} as const
