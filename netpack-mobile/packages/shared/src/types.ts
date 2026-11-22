export interface CustomerUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  city?: string | null;
  state?: string | null;
  postcode?: string | null;
  countryId?: number | null;
  country?: string | null;
  countryName?: string | null;
  photoUrl?: string | null;
  role: string;
  organizationName?: string | null;
  isOrganization?: boolean;
  isIncomplete?: boolean;
}

export interface RiderUser {
  id: number;
  name: string;
  email: string;
  username?: string | null;
  phone?: string | null;
  role: string;
}

export interface TrackingCheckpoint {
  timestamp: string;
  location: string;
  status: string;
  activity: string;
  country: string;
  source: string;
}

export interface TrackingBoxItem {
  item: string;
  pieces: number;
}

export interface TrackingBox {
  id?: number;
  boxNumber: number;
  pieceNumber: string;
  trackingNumber: string;
  hawbNumber?: string;
  forwardingNumber?: string;
  status: string;
  isTargeted?: boolean;
  weight: number;
  actualWeight?: number;
  chargeableWeight?: number | null;
  dimensions?: string;
  length?: number;
  breadth?: number;
  height?: number;
  volumetricWeight?: number | null;
  items: TrackingBoxItem[];
}

export interface TrackingResponse {
  found: boolean;
  message?: string;
  shipmentId?: number | null;
  enquiryId?: number | null;
  trackingNumber: string;
  masterTrackingNumber?: string;
  hawbNumber?: string | null;
  status: string;
  currentStatus: string;
  trackingMode: 'MANUAL' | 'API';
  origin: string;
  destination: string;
  senderName: string;
  receiverName: string;
  receiverCountry?: string | null;
  pieces: number;
  weight: number;
  volumetricWeight?: number | null;
  chargeableWeight?: number | null;
  forwardingCompany?: string | null;
  forwardingNumber?: string | null;
  carrierCode?: string | null;
  carrierTrackingUrl?: string | null;
  boxes: TrackingBox[];
  checkpoints: TrackingCheckpoint[];
  weightProofImageUrl?: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
}

export interface PickupLocation {
  id: number;
  location: string;
  phoneNumber?: string | null;
  note?: string | null;
  isPickedUp?: boolean;
  pickedUpAt?: string | null;
}

export interface EnquiryItem {
  id?: number;
  description: string;
  quantity: number;
  unitPrice?: number;
  totalValue?: number;
  weight?: number;
  value?: number;
  hsCode?: string;
}

export interface EnquiryBooking {
  id: number;
  trackingNumber: string;
  senderName: string;
  senderPhone?: string | null;
  senderEmail?: string | null;
  receiverName: string;
  receiverPhone: string;
  receiverEmail?: string | null;
  receiverCountry: string;
  receiverCity: string;
  receiverAddressLine1?: string | null;
  status: string;
  noOfBox?: number | null;
  weight?: number | null;
  chargeableWeight?: number | null;
  volumetricWeight?: number | null;
  estimatedRate?: number | null;
  currency?: string | null;
  createdAt: string;
  items?: EnquiryItem[];
  pickupLocations?: PickupLocation[];
}

export interface NotificationItem {
  id: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  scope?: string;
}

export interface PickupTask {
  id: number;
  trackingNumber: string;
  status: string;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  senderCity?: string;
  destinationCountry?: string;
  destinationLocation?: string;
  receiverName?: string;
  receiverPhone?: string;
  weight?: number;
  noOfBox?: number;
  pickupNotes?: string | null;
  pickedUpAt?: string | null;
  weightProofImageUrl?: string | null;
  stops: PickupLocation[];
}
