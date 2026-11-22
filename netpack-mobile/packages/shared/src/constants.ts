export const COLORS = {
  primary: '#0D1B2A',        // NetPack deep midnight blue
  primaryLight: '#1B263B',   // Card background
  accent: '#0284C7',         // Express sky blue
  accentHover: '#0369A1',
  secondary: '#415A77',
  muted: '#778DA9',
  border: '#E2E8F0',
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#64748B',
  success: '#10B981',        // Delivered / Verified green
  warning: '#F59E0B',        // In Transit / Pending amber
  danger: '#EF4444',         // Exception red
  info: '#3B82F6',           // Carrier scanned
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ENQUIRY_GENERATED: { label: 'Enquiry Booked', color: '#6366F1', bg: '#EEF2FF' },
  ASSIGNED_FOR_PICKUP: { label: 'Rider Assigned', color: '#F59E0B', bg: '#FEF3C7' },
  STOP_COLLECTED: { label: 'Stop Collected', color: '#F59E0B', bg: '#FEF3C7' },
  PICKED_UP: { label: 'Cargo Picked Up', color: '#3B82F6', bg: '#DBEAFE' },
  PACKED: { label: 'Cargo Packed', color: '#0284C7', bg: '#E0F2FE' },
  WT_DIMENSION_VERIFIED: { label: 'Weight Verified', color: '#059669', bg: '#D1FAE5' },
  SHIPMENT_CREATED: { label: 'Shipment Created', color: '#0D9488', bg: '#CCFBF1' },
  IN_TRANSIT: { label: 'In Transit', color: '#D97706', bg: '#FEF3C7' },
  ARRIVED_AT_HUB: { label: 'Arrived at Hub', color: '#2563EB', bg: '#DBEAFE' },
  CARRIER_SCANNED: { label: 'Carrier In-Transit', color: '#7C3AED', bg: '#EDE9FE' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: '#EA580C', bg: '#FFEDD5' },
  DELIVERED: { label: 'Delivered', color: '#16A34A', bg: '#DCFCE7' },
  PENDING: { label: 'Pending Processing', color: '#64748B', bg: '#F1F5F9' },
};

export const DEFAULT_API_BASE_URL = 'https://netpackintegration.vercel.app';
