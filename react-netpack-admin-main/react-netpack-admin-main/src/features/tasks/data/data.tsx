// src/app/enquiries/data/data.ts

export const STATUS_OPTIONS = [
  { label: 'Enquiry Generated', value: 'ENQUIRY_GENERATED' },
  { label: 'Shipment Created', value: 'SHIPMENT_CREATED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Picked Up', value: 'PICKED_UP' },
  { label: 'In Transit', value: 'IN_TRANSIT' },
  { label: 'Arrived At Hub', value: 'ARRIVED_AT_HUB' },
  { label: 'Carrier Scanned', value: 'CARRIER_SCANNED' },
  { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
  { label: 'Delivered', value: 'DELIVERED' },
]

export const labels = [
  { value: 'Domestic', label: 'Domestic' },
  { value: 'International', label: 'International' },
]
