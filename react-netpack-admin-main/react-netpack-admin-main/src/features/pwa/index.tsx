import { useState, useEffect, useMemo } from 'react'
import {
  Package,
  PackageSearch,
  Truck,
  Warehouse,
  PackageOpen,
  CheckCircle2,
  Plane,
  Boxes,
  Bell,
  User,
  PlusCircle,
  Copy,
  Check,
  LogOut,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RefreshCw,
  Scale,
  X,
  Clock,
  AlertTriangle,
  Camera,
  Edit2,
  Sun,
  Moon,
  Laptop,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTheme } from '@/context/theme-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// ─── Constants ──────────────────────────────────────────────────────────────

const COMMODITY_SUGGESTIONS = [
  'Handicrafts & Souvenirs',
  'Pashmina & Woolen Garments',
  'Documents / Business Papers',
  'Himalayan Tea & Spices',
  'Personal Effects & Gifts',
  'Organic Herbal Products',
]

const TIME_SLOT_OPTIONS = [
  'Morning (10:00 AM - 01:00 PM)',
  'Afternoon (01:00 PM - 04:00 PM)',
  'Evening (04:00 PM - 07:00 PM)',
]

const API_BASE = (() => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).replace(/\/api\/?$/, '').replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined') {
    if (window.location.port === '5173') {
      return `${window.location.protocol}//${window.location.hostname}:8000`
    }
    return window.location.origin
  }
  return 'http://localhost:8000'
})()


function formatDateTime(isoStr?: string | null): string {
  if (!isoStr) return ''
  try {
    const d = new Date(isoStr)
    if (isNaN(d.getTime())) return isoStr
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    return isoStr
  }
}

function getProgressPercent(status: string): number {
  const s = (status || '').toUpperCase()
  if (s.includes('DELIVERED')) return 100
  if (s.includes('OUT_FOR_DELIVERY')) return 90
  if (s.includes('CARRIER_SCANNED') || s.includes('CARRIER')) return 78
  if (s.includes('ARRIVED_AT_HUB') || s.includes('HUB') || s.includes('CUSTOMS')) return 60
  if (s.includes('TRANSIT')) return 45
  if (s.includes('SHIPMENT_CREATED')) return 30
  if (s.includes('PICKED_UP') || s.includes('PICKUP')) return 18
  return 8
}

function getStatusConfig(status: string) {
  const s = (status || '').toUpperCase()

  if (s.includes('DELIVERED')) {
    return {
      label: 'Delivered',
      heroTitle: 'Delivered',
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      iconClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500',
      dotClass: 'bg-emerald-500 border-emerald-500',
      icon: <CheckCircle2 className='h-4 w-4' />,
    }
  }
  if (s.includes('OUT_FOR_DELIVERY')) {
    return {
      label: 'Out for Delivery',
      heroTitle: 'Out for delivery',
      badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800',
      iconClass: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/80 border-amber-500',
      dotClass: 'bg-amber-500 border-amber-500',
      icon: <Truck className='h-4 w-4' />,
    }
  }
  if (s.includes('CARRIER_SCANNED') || s.includes('CARRIER')) {
    return {
      label: 'Carrier Scanned',
      heroTitle: 'Carrier Scanned',
      badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
      iconClass: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950/80 border-indigo-500',
      dotClass: 'bg-indigo-500 border-indigo-500',
      icon: <Truck className='h-4 w-4' />,
    }
  }
  if (s.includes('ARRIVED_AT_HUB') || s.includes('HUB') || s.includes('CUSTOMS')) {
    return {
      label: 'Arrived at Hub',
      heroTitle: 'Arrived at hub',
      badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      iconClass: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/80 border-blue-500',
      dotClass: 'bg-blue-500 border-blue-500',
      icon: <Warehouse className='h-4 w-4' />,
    }
  }
  if (s.includes('TRANSIT')) {
    return {
      label: 'In Transit',
      heroTitle: 'In transit',
      badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300 dark:border-sky-800',
      iconClass: 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-950/80 border-sky-500',
      dotClass: 'bg-sky-500 border-sky-500',
      icon: <Plane className='h-4 w-4' />,
    }
  }
  if (s.includes('SHIPMENT_CREATED')) {
    return {
      label: 'Shipment Created',
      heroTitle: 'Shipment Created',
      badgeClass: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-300 dark:border-violet-800',
      iconClass: 'text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/80 border-violet-500',
      dotClass: 'bg-violet-500 border-violet-500',
      icon: <PackageOpen className='h-4 w-4' />,
    }
  }
  if (s.includes('PICKED_UP') || s.includes('PICKUP')) {
    return {
      label: 'Picked Up',
      heroTitle: 'Picked Up by NetPack Courier',
      badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800',
      iconClass: 'text-teal-600 dark:text-teal-400 bg-teal-100 dark:bg-teal-950/80 border-teal-500',
      dotClass: 'bg-teal-500 border-teal-500',
      icon: <Truck className='h-4 w-4' />,
    }
  }
  if (s.includes('ENQUIRY_GENERATED') || s.includes('PENDING')) {
    return {
      label: 'Enquiry Generated',
      heroTitle: 'Enquiry Registered',
      badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
      iconClass: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-400',
      dotClass: 'bg-slate-400 border-slate-400',
      icon: <PackageSearch className='h-4 w-4' />,
    }
  }
  if (s.includes('EXCEPTION') || s.includes('CANCELLED')) {
    return {
      label: 'Exception',
      heroTitle: 'Exception',
      badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800',
      iconClass: 'text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/80 border-rose-500',
      dotClass: 'bg-rose-500 border-rose-500',
      icon: <AlertTriangle className='h-4 w-4' />,
    }
  }
  return {
    label: s.replace(/_/g, ' '),
    heroTitle: s.replace(/_/g, ' '),
    badgeClass: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300',
    iconClass: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-400',
    dotClass: 'bg-slate-400 border-slate-400',
    icon: <Clock className='h-4 w-4' />,
  }
}

function getShortMilestoneLabel(label: string) {
  if (label.includes('Enquiry')) return 'Enquiry'
  if (label.includes('Picked Up') || label.includes('Pickup')) return 'Picked Up'
  if (label.includes('Packed')) return 'Packed'
  if (label.includes('Created')) return 'Created'
  if (label.includes('In Transit') || label.includes('Transit')) return 'In Transit'
  if (label.includes('Hub')) return 'At Hub'
  if (label.includes('Carrier') || label.includes('Delivery')) return 'Carrier'
  if (label.includes('Delivered')) return 'Delivered'
  return label.split(' ')[0]
}

export default function CustomerPWA() {
  const { theme, setTheme } = useTheme()
  const [activeTab, setActiveTab] = useState<'book' | 'track' | 'shipments' | 'notifications' | 'account'>(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('netpack_customer_token')
      return token ? 'shipments' : 'account'
    }
    return 'account'
  })

  // Auth state
  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('netpack_customer_token') : null
  })
  const [customerUser, setCustomerUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('netpack_customer_user')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return null
        }
      }
    }
    return null
  })

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authConfirmPassword, setAuthConfirmPassword] = useState('')
  const [authName, setAuthName] = useState('')
  const [authPhone, setAuthPhone] = useState('')
  const [authAddress1, setAuthAddress1] = useState('')
  const [authAddress2, setAuthAddress2] = useState('')
  const [authCity, setAuthCity] = useState('Kathmandu')
  const [authPostcode, setAuthPostcode] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // PWA Install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handlePrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handlePrompt)
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt)
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
          toast.success('Netpack app successfully installed to your home screen!')
        }
        setDeferredPrompt(null)
        return
      } catch (err) {
        console.warn('Install prompt error:', err)
      }
    } else {
      toast.info('To install: tap your browser menu (⋮) and choose "Install app"')
    }
  }

  // Google Signup Modal state
  const [googleModalOpen, setGoogleModalOpen] = useState(false)
  const [googleStep, setGoogleStep] = useState<'verify' | 'details'>('verify')
  const [googleInputEmail, setGoogleInputEmail] = useState('')
  const [googleVerifying, setGoogleVerifying] = useState(false)
  const [googleProfileData, setGoogleProfileData] = useState<{
    email: string
    name: string
    photoUrl?: string
    phone: string
    address1: string
    address2: string
    city: string
    state: string
    postcode: string
    countryId?: number
  }>({
    email: '',
    name: '',
    photoUrl: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
    phone: '',
    address1: '',
    address2: '',
    city: 'Kathmandu',
    state: 'Bagmati Province',
    postcode: '',
    countryId: 1,
  })

  // Profile photo upload & edit state
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editAddress1, setEditAddress1] = useState('')
  const [editAddress2, setEditAddress2] = useState('')
  const [editCity, setEditCity] = useState('')
  const [editState, setEditState] = useState('')
  const [editPostcode, setEditPostcode] = useState('')
  const [editCountryId, setEditCountryId] = useState<number>(1)

  // Booking form state
  const [commodity, setCommodity] = useState('')
  const [approximateWeight, setApproximateWeight] = useState('')
  const [useMyAddress, setUseMyAddress] = useState(false)
  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [receiverCountry, setReceiverCountry] = useState('')
  const [receiverCity, setReceiverCity] = useState('')
  const [receiverAddress, setReceiverAddress] = useState('')
  const [receiverPostcode, setReceiverPostcode] = useState('')
  const [isPickupRequired, setIsPickupRequired] = useState(true)
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupPhone, setPickupPhone] = useState('')
  const [pickupTimeSlot, setPickupTimeSlot] = useState(TIME_SLOT_OPTIONS[0])
  const [pickupNotes, setPickupNotes] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [lastBookedBooking, setLastBookedBooking] = useState<any>(null)

  // Countries list
  const [countries, setCountries] = useState<Array<{ id: number; name: string }>>([])

  // Tracking state
  const [trackingInput, setTrackingInput] = useState('')
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [trackingData, setTrackingData] = useState<any>(null)
  const [trackingCopied, setTrackingCopied] = useState(false)
  const [selectedPhotoUrls, setSelectedPhotoUrls] = useState<string[]>([])
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number>(0)
  const [isMilestonesFolded, setIsMilestonesFolded] = useState<boolean>(true)
  const [isCheckpointsExpanded, setIsCheckpointsExpanded] = useState<boolean>(false)
  const [isPackageDetailsOpen, setIsPackageDetailsOpen] = useState<boolean>(false)

  // Shipments state
  const [myShipments, setMyShipments] = useState<any[]>([])
  const [shipmentsLoading, setShipmentsLoading] = useState(false)
  const [shipmentFilter, setShipmentFilter] = useState<'ALL' | 'ACTIVE' | 'DELIVERED'>('ALL')

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([])
  const [notifsLoading, setNotifsLoading] = useState(false)

  // ─── Fetch Countries & Fresh Profile ────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/location/getCountry`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setCountries(data)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (customerToken) {
      fetch(`${API_BASE}/api/customer/profile`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.id) {
            setCustomerUser(data)
            localStorage.setItem('netpack_customer_user', JSON.stringify(data))
          }
        })
        .catch(() => {})
    }
  }, [customerToken])

  // ─── Save / Load Auth ──────────────────────────────────────────────────────
  const saveAuthSession = (token: string, user: any) => {
    setCustomerToken(token)
    setCustomerUser(user)
    localStorage.setItem('netpack_customer_token', token)
    localStorage.setItem('netpack_customer_user', JSON.stringify(user))
    if (user.address1 && !pickupAddress) setPickupAddress(user.address1)
    if (user.phone && !pickupPhone) setPickupPhone(user.phone)
  }

  const handleLogout = () => {
    setCustomerToken(null)
    setCustomerUser(null)
    localStorage.removeItem('netpack_customer_token')
    localStorage.removeItem('netpack_customer_user')
    setMyShipments([])
    setNotifications([])
    setActiveTab('account')
    toast.info('You have logged out.')
  }

  // ─── Handle Email/Password Login ──────────────────────────────────────────
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authEmail || !authPassword) {
      toast.error('Please provide both email and password.')
      return
    }
    setAuthLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/customer/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Login failed')
      }
      saveAuthSession(data.token, data.customer)
      toast.success(`Welcome back, ${data.customer.name}!`)
      setActiveTab('shipments')
    } catch (err: any) {
      toast.error(err.message || 'Login failed. Please check credentials.')
    } finally {
      setAuthLoading(false)
    }
  }

  // ─── Handle Customer Signup with Confirm Password ─────────────────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!authName || !authEmail || !authPhone || !authPassword) {
      toast.error('Please fill in all required registration fields.')
      return
    }
    if (authPassword !== authConfirmPassword) {
      toast.error('Passwords do not match. Please verify your password.')
      return
    }
    if (authPassword.length < 6) {
      toast.error('Password must be at least 6 characters long.')
      return
    }
    setAuthLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/customer/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authName.trim(),
          email: authEmail.trim(),
          phone: authPhone.trim(),
          password: authPassword,
          address1: authAddress1.trim(),
          address2: authAddress2.trim() || undefined,
          city: authCity.trim() || 'Kathmandu',
          postcode: authPostcode.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Signup failed')
      }
      saveAuthSession(data.token, data.customer)
      toast.success(`Welcome to NetPack Logistics, ${data.customer.name}!`)
      setActiveTab('shipments')
    } catch (err: any) {
      toast.error(err.message || 'Registration failed.')
    } finally {
      setAuthLoading(false)
    }
  }

  // ─── Handle Google Sign-in Verification & Completion ───────────────────────
  const handleGoogleSignInClick = () => {
    setGoogleStep('verify')
    setGoogleInputEmail(authEmail || (customerUser?.email || ''))
    setGoogleModalOpen(true)
  }

  const handleVerifyGoogleAccount = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const cleanEmail = googleInputEmail.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Please enter a valid Google email address.')
      return
    }
    setGoogleVerifying(true)
    try {
      const rawName = cleanEmail.split('@')[0].replace(/[._]/g, ' ')
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
      const googleId = `google-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`
      const photo = 'https://lh3.googleusercontent.com/a/default-user=s96-c'

      // Check if user exists with profile already
      const res = await fetch(`${API_BASE}/api/customer/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          name: formattedName,
          photoUrl: photo,
          googleId: googleId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Google account verification failed')
      }

      const cust = data.customer
      // If customer has already saved real contact and address, sign in immediately!
      if (cust && cust.phone && cust.phone !== '+977-9800000000' && cust.address1) {
        saveAuthSession(data.token, cust)
        setGoogleModalOpen(false)
        toast.success(`Welcome back, ${cust.name}!`)
        setActiveTab('shipments')
        return
      }

      // First-time or incomplete profile: Proceed to details step
      setGoogleProfileData({
        email: cleanEmail,
        name: cust?.name || formattedName,
        photoUrl: cust?.photoUrl || photo,
        phone: cust?.phone && cust.phone !== '+977-9800000000' ? cust.phone : '',
        address1: cust?.address1 || '',
        address2: cust?.address2 || '',
        city: cust?.city || 'Kathmandu',
        state: cust?.state || 'Bagmati Province',
        postcode: cust?.postcode || '',
        countryId: cust?.countryId || 1,
      })
      setGoogleStep('details')
      toast.success('Google account verified! Please enter your delivery details.')
    } catch (err: any) {
      toast.error(err.message || 'Error verifying Google account.')
    } finally {
      setGoogleVerifying(false)
    }
  }

  const handleGoogleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!googleProfileData.phone || !googleProfileData.address1 || !googleProfileData.city) {
      toast.error('Please fill in required fields (Phone, Address Line 1, City).')
      return
    }
    setAuthLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/customer/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleProfileData.email.trim(),
          name: googleProfileData.name.trim(),
          photoUrl: googleProfileData.photoUrl || 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          phone: googleProfileData.phone.trim(),
          address1: googleProfileData.address1.trim(),
          address2: googleProfileData.address2.trim() || undefined,
          city: googleProfileData.city.trim(),
          state: googleProfileData.state.trim() || undefined,
          postcode: googleProfileData.postcode.trim() || undefined,
          countryId: googleProfileData.countryId || 1,
          googleId: `google-${googleProfileData.email.replace(/[^a-zA-Z0-9]/g, '')}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Google sign-in failed')
      }
      saveAuthSession(data.token, data.customer)
      setGoogleModalOpen(false)
      toast.success(`Welcome to NetPack Logistics, ${data.customer.name}!`)
      setActiveTab('shipments')
    } catch (err: any) {
      toast.error(err.message || 'Error saving delivery details.')
    } finally {
      setAuthLoading(false)
    }
  }

  // ─── Profile Photo Upload Handler ──────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !customerToken) return
    const file = e.target.files[0]
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const res = await fetch(`${API_BASE}/api/customer/profile/upload-photo`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${customerToken}`,
        },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to upload profile photo')
      }
      const updatedCustomer = {
        ...customerUser,
        photoUrl: data.photoUrl,
      }
      setCustomerUser(updatedCustomer)
      localStorage.setItem('netpack_customer_user', JSON.stringify(updatedCustomer))
      toast.success('Profile photo updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Error uploading photo.')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // ─── Profile Update Handler ────────────────────────────────────────────────
  const startEditProfile = () => {
    if (!customerUser) return
    setEditName(customerUser.name || '')
    setEditPhone(customerUser.phone || '')
    setEditAddress1(customerUser.address1 || '')
    setEditAddress2(customerUser.address2 || '')
    setEditCity(customerUser.city || 'Kathmandu')
    setEditState(customerUser.state || '')
    setEditPostcode(customerUser.postcode || '')
    setEditCountryId(
      typeof customerUser.countryId === 'number'
        ? customerUser.countryId
        : (customerUser.country?.id || 1)
    )
    setEditingProfile(true)
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerToken) return
    try {
      const res = await fetch(`${API_BASE}/api/customer/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
          address1: editAddress1.trim(),
          address2: editAddress2.trim() || undefined,
          city: editCity.trim(),
          state: editState.trim() || undefined,
          postcode: editPostcode.trim() || undefined,
          countryId: Number(editCountryId) || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to update profile')
      }
      setCustomerUser(data.customer)
      localStorage.setItem('netpack_customer_user', JSON.stringify(data.customer))
      setEditingProfile(false)
      toast.success('Profile updated successfully!')
    } catch (err: any) {
      toast.error(err.message || 'Error updating profile')
    }
  }

  // ─── Fetch My Shipments ───────────────────────────────────────────────────
  const fetchMyShipments = () => {
    if (!customerToken) return
    setShipmentsLoading(true)
    fetch(`${API_BASE}/api/customer/my-shipments`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setMyShipments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setShipmentsLoading(false))
  }

  // ─── Fetch Notifications ──────────────────────────────────────────────────
  const fetchNotifications = () => {
    if (!customerToken) return
    setNotifsLoading(true)
    fetch(`${API_BASE}/api/customer/notifications`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setNotifications(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setNotifsLoading(false))
  }

  useEffect(() => {
    if (customerToken) {
      fetchMyShipments()
      fetchNotifications()
    }
  }, [customerToken])

  const unreadNotifsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length
  }, [notifications])

  // ─── Handle New Booking ───────────────────────────────────────────────────
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerToken) {
      toast.error('Please sign in or create an account to submit a booking.')
      setActiveTab('account')
      return
    }

    if (!commodity.trim()) {
      toast.error('Please specify the commodity description.')
      return
    }

    const wt = parseFloat(approximateWeight)
    if (isNaN(wt) || wt <= 0) {
      toast.error('Please enter a valid approximate weight in kg.')
      return
    }

    if (!receiverName || !receiverPhone || !receiverCountry || !receiverCity || !receiverAddress) {
      toast.error('Please complete receiver and destination details.')
      return
    }

    setBookingSubmitting(true)
    try {
      const payload = {
        commodity: commodity.trim(),
        approximateWeight: wt,
        senderName: customerUser?.name,
        senderPhone: customerUser?.phone,
        senderEmail: customerUser?.email,
        senderAddress: pickupAddress || customerUser?.address1 || 'Kathmandu',
        senderCity: customerUser?.city || 'Kathmandu',
        receiverName: receiverName.trim(),
        receiverPhone: receiverPhone.trim(),
        receiverCountry: receiverCountry.trim(),
        receiverCity: receiverCity.trim(),
        receiverAddress: receiverAddress.trim(),
        receiverPostcode: receiverPostcode.trim(),
        isPickupRequired,
        pickupAddress: isPickupRequired ? (pickupAddress || customerUser?.address1 || 'Kathmandu') : null,
        pickupPhone: isPickupRequired ? (pickupPhone || customerUser?.phone) : null,
        pickupPreferredTime: isPickupRequired ? pickupTimeSlot : null,
        pickupNote: isPickupRequired ? pickupNotes : null,
      }

      const res = await fetch(`${API_BASE}/api/customer/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Booking failed')
      }

      toast.success('Shipment booking submitted successfully!')
      setLastBookedBooking(data)
      // Reset form fields
      setCommodity('')
      setApproximateWeight('')
      setReceiverName('')
      setReceiverPhone('')
      setReceiverCountry('')
      setReceiverCity('')
      setReceiverAddress('')
      setReceiverPostcode('')
      setPickupNotes('')

      // Refresh list & notifications
      fetchMyShipments()
      fetchNotifications()
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit booking.')
    } finally {
      setBookingSubmitting(false)
    }
  }

  // ─── Handle Track Query ───────────────────────────────────────────────────
  const handleTrackSubmit = (queryToUse?: string) => {
    const q = (queryToUse || trackingInput).trim()
    if (!q) {
      toast.error('Please enter a tracking or consignment number.')
      return
    }

    setTrackingLoading(true)
    fetch(`${API_BASE}/api/tracking/${encodeURIComponent(q)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.found) {
          setTrackingData(data)
        } else {
          setTrackingData(null)
          toast.error(data?.message || `No active shipment found for "${q}"`)
        }
      })
      .catch(() => {
        setTrackingData(null)
        toast.error('Network error checking tracking status.')
      })
      .finally(() => setTrackingLoading(false))
  }

  const handleCopyText = (txt: string) => {
    if (!txt) return
    navigator.clipboard.writeText(txt)
    setTrackingCopied(true)
    setTimeout(() => setTrackingCopied(false), 2000)
    toast.success('Copied to clipboard!')
  }

  // ─── Milestone Stepper Resolver (7 Primary Lifecycle Stages) ────────────────
  const trackingMilestones = useMemo(() => {
    if (!trackingData) return []
    const checkpoints = trackingData.checkpoints || []

    const enquiryCp = checkpoints.find((cp: any) => (cp.status || '').toUpperCase() === 'ENQUIRY_GENERATED')
    const pickupCp = checkpoints.find((cp: any) => (cp.status || '').toUpperCase() === 'PICKED_UP')
    const createdCp = checkpoints.find((cp: any) => (cp.status || '').toUpperCase() === 'SHIPMENT_CREATED')
    const transitCp = checkpoints.find(
      (cp: any) => (cp.status || '').toUpperCase() === 'IN_TRANSIT' && (!cp.source || cp.source.includes('AIRLINE') || cp.source.includes('INTERNAL') || cp.source.includes('MAWB'))
    )
    const hubCp = checkpoints.find((cp: any) => (cp.status || '').toUpperCase() === 'ARRIVED_AT_HUB')
    const carrierCp = checkpoints.find(
      (cp: any) => (cp.status || '').toUpperCase() === 'CARRIER_SCANNED' ||
                   (cp.status || '').toUpperCase() === 'OUT_FOR_DELIVERY' ||
                   (cp.source || '').includes('CARRIER') ||
                   (cp.source || '').includes('TRACKINGMORE')
    )
    const deliveredCp = checkpoints.find((cp: any) => (cp.status || '').toUpperCase() === 'DELIVERED')

    const dest = trackingData.destination || 'Overseas'
    const displayHawb = trackingData.hawbNumber || 'Assigned'
    const isSelfDrop = trackingData.isSelfDrop || trackingData.pickupRequired === false

    const stages: any[] = [
      {
        id: 'ENQUIRY_GENERATED',
        label: 'Enquiry Generated',
        description: 'Consignment booking registered with NetPack Logistics',
        timestamp: enquiryCp?.timestamp,
        icon: <PackageSearch className='h-4 w-4' />,
      },
      {
        id: 'PICKED_UP',
        label: isSelfDrop ? 'Counter Drop-off (Self Drop)' : 'Cargo Picked Up',
        description: isSelfDrop
          ? 'Consignment dropped off at counter by customer'
          : (pickupCp?.activity || 'Picked up by NetPack courier & safely received at warehouse'),
        timestamp: pickupCp?.timestamp || trackingData.pickedUpAt,
        icon: <Truck className='h-4 w-4' />,
        badge: isSelfDrop ? 'Self Drop' : undefined,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
      },
      {
        id: 'SHIPMENT_CREATED',
        label: 'Shipment Created',
        description: `HAWB allocated (${displayHawb}) & export documents prepared`,
        timestamp: createdCp?.timestamp,
        icon: <PackageOpen className='h-4 w-4' />,
      },
      {
        id: 'IN_TRANSIT',
        label: 'In Transit',
        description: transitCp?.activity || `Air cargo departed Kathmandu (KTM) on scheduled route to ${dest}`,
        timestamp: transitCp?.timestamp || trackingData.departureDate,
        icon: <Plane className='h-4 w-4' />,
      },
      {
        id: 'ARRIVED_AT_HUB',
        label: 'Arrived at Hub',
        description: hubCp?.activity || `Landed & cleared destination cargo hub terminal`,
        timestamp: hubCp?.timestamp || trackingData.arrivalDate,
        icon: <Warehouse className='h-4 w-4' />,
      },
      {
        id: 'CARRIER_SCANNED',
        label: 'Carrier Scanned',
        description: carrierCp?.activity || `Scanned by ${trackingData.forwardingCompany || 'express courier'} for final delivery`,
        timestamp: carrierCp?.timestamp,
        icon: <Truck className='h-4 w-4' />,
      },
      {
        id: 'DELIVERED',
        label: 'Delivered',
        description: deliveredCp?.activity || `Successfully delivered to ${trackingData.receiverName || 'Consignee'}`,
        timestamp: deliveredCp?.timestamp,
        icon: <CheckCircle2 className='h-4 w-4' />,
      },
    ]

    return stages
  }, [trackingData])

  const trackingStageIndex = useMemo(() => {
    if (!trackingData || !trackingMilestones.length) return 0
    const s = (trackingData.currentStatus || '').toUpperCase()
    let highest = 0
    trackingMilestones.forEach((stg, i) => {
      if (stg.id === 'CARRIER_SCANNED' && (s.includes('CARRIER') || s.includes('OUT_FOR_DELIVERY'))) highest = i
      else if (stg.id === 'ARRIVED_AT_HUB' && (s.includes('ARRIVED_AT_HUB') || s.includes('HUB'))) highest = i
      else if (stg.id === 'IN_TRANSIT' && s.includes('TRANSIT')) highest = i
      else if (stg.id === 'SHIPMENT_CREATED' && s.includes('SHIPMENT_CREATED')) highest = i
      else if (stg.id === 'PICKED_UP' && (s.includes('PICKED_UP') || s.includes('PICKUP'))) highest = i
      else if (stg.id === 'DELIVERED' && s.includes('DELIVERED')) highest = i
    })
    return highest
  }, [trackingData, trackingMilestones])

  const trackingCheckpoints = useMemo(() => {
    return trackingData?.checkpoints || []
  }, [trackingData])

  const canCollapse = trackingCheckpoints.length > 3

  const displayedCheckpoints = useMemo(() => {
    if (!canCollapse || isCheckpointsExpanded) {
      return trackingCheckpoints.map((cp: any, i: number) => ({ cp, originalIdx: i, isBottomSummary: false }))
    }
    // Collapsed: Top 2, and bottom 1
    const topTwo = trackingCheckpoints.slice(0, 2).map((cp: any, i: number) => ({ cp, originalIdx: i, isBottomSummary: false }))
    const bottomOne = { cp: trackingCheckpoints[trackingCheckpoints.length - 1], originalIdx: trackingCheckpoints.length - 1, isBottomSummary: true }
    return [...topTwo, bottomOne]
  }, [trackingCheckpoints, canCollapse, isCheckpointsExpanded])

  const latestCheckpoint = trackingCheckpoints[0]
  const statusCfg = useMemo(() => getStatusConfig(trackingData?.currentStatus || ''), [trackingData?.currentStatus])
  const progressPercent = useMemo(() => getProgressPercent(trackingData?.currentStatus || ''), [trackingData?.currentStatus])
  const displayForwardingCompany = trackingData?.forwardingCompany || 'UPS'
  const displayForwardingNumber = trackingData?.forwardingNumber
  const carrierUrl =
    trackingData?.carrierTrackingUrl ||
    (displayForwardingNumber ? `https://www.ups.com/track?tracknum=${displayForwardingNumber}` : null)

  // Filtered shipments
  const displayedShipments = useMemo(() => {
    if (shipmentFilter === 'DELIVERED') {
      return myShipments.filter((s) => (s.status || '').toUpperCase() === 'DELIVERED')
    }
    if (shipmentFilter === 'ACTIVE') {
      return myShipments.filter((s) => (s.status || '').toUpperCase() !== 'DELIVERED')
    }
    return myShipments
  }, [myShipments, shipmentFilter])

  return (
    <div className='min-h-screen bg-slate-50 dark:bg-slate-950 text-foreground pb-24 md:pb-12 flex flex-col'>
      {/* ── Top PWA Brand Bar ── */}
      <header className='sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md px-4 py-3 sm:px-6 shadow-xs'>
        <div className='max-w-4xl mx-auto flex items-center justify-between'>
          <div className='flex items-center gap-2.5'>
            <img
              src='/images/netpack-icon-192.png'
              alt='Netpack'
              className='h-9 w-9 rounded-xl border border-border bg-white p-0.5 shadow-sm object-contain shrink-0'
            />
            <div>
              <div className='font-bold text-base leading-tight tracking-tight flex items-center gap-1.5'>
                Netpack
                <Badge variant='outline' className='text-[10px] py-0 px-1.5 bg-primary/10 text-primary border-primary/30'>
                  Customer App
                </Badge>
              </div>
              <div className='text-[11px] text-muted-foreground'>Global Express & Courier Services</div>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            {/* Install App on Phone */}
            <button
              type='button'
              onClick={handleInstallClick}
              className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/20 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-all cursor-pointer'
              title='Install Netpack App on Phone'
            >
              <Download className='h-3.5 w-3.5' />
              <span className='hidden sm:inline'>Install App</span>
            </button>
            <ThemeSwitch />
            {customerToken ? (
              <>
                <button
                  type='button'
                  onClick={() => setActiveTab('notifications')}
                  className='relative p-2 rounded-lg border hover:bg-muted transition-colors'
                  title='Notifications'
                >
                  <Bell className='h-4 w-4' />
                  {unreadNotifsCount > 0 && (
                    <span className='absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse'>
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>
                <button
                  type='button'
                  onClick={() => setActiveTab('account')}
                  className='flex items-center gap-1.5 p-0.5 rounded-full hover:ring-2 hover:ring-primary/40 transition-all ml-1'
                  title='My Profile'
                >
                  {customerUser?.photoUrl ? (
                    <img
                      src={customerUser.photoUrl.startsWith('http') ? customerUser.photoUrl : `${API_BASE}${customerUser.photoUrl}`}
                      alt={customerUser.name || 'Profile'}
                      className='h-8 w-8 rounded-full object-cover border border-primary/40 shadow-xs'
                    />
                  ) : (
                    <div className='h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20'>
                      {customerUser?.name ? customerUser.name.charAt(0).toUpperCase() : <User className='h-4 w-4' />}
                    </div>
                  )}
                </button>
                <button
                  type='button'
                  onClick={handleLogout}
                  className='text-xs text-muted-foreground hover:text-rose-600 p-1.5 rounded-lg border hover:bg-muted transition-colors'
                  title='Sign Out'
                >
                  <LogOut className='h-4 w-4' />
                </button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className='flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6'>
        {/* ── TAB: BOOK NEW SHIPMENT ── */}
        {activeTab === 'book' && (
          <div className='space-y-5 animate-in fade-in-50 duration-200'>
            {/* Success Banner if booking just made */}
            {lastBookedBooking && (
              <Card className='border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800 shadow-sm'>
                <CardContent className='p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
                  <div className='flex items-start gap-3'>
                    <CheckCircle2 className='h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5' />
                    <div>
                      <h4 className='font-bold text-sm text-emerald-950 dark:text-emerald-200'>
                        Booking Successful!
                      </h4>
                      <p className='text-xs text-emerald-800 dark:text-emerald-300 mt-0.5'>
                        Tracking Number: <strong className='font-mono'>{lastBookedBooking.trackingNumber}</strong>
                      </p>
                      <p className='text-[11px] text-muted-foreground mt-1'>
                        NetPack Logistics Central Warehouse will handle secure packing upon receipt.
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2 self-end sm:self-center'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='text-xs border-emerald-400 text-emerald-800 dark:text-emerald-200'
                      onClick={() => handleCopyText(lastBookedBooking.trackingNumber)}
                    >
                      <Copy className='h-3.5 w-3.5 mr-1.5' />
                      Copy No.
                    </Button>
                    <Button
                      size='sm'
                      className='text-xs bg-emerald-600 hover:bg-emerald-700 text-white'
                      onClick={() => {
                        setTrackingInput(lastBookedBooking.trackingNumber)
                        handleTrackSubmit(lastBookedBooking.trackingNumber)
                        setActiveTab('track')
                      }}
                    >
                      Track Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Packaging Notice Rule */}
            <div className='rounded-xl border border-sky-300/80 bg-sky-50/80 dark:bg-sky-950/40 dark:border-sky-800 p-4 shadow-xs'>
              <div className='flex items-start gap-3'>
                <div className='p-2 rounded-lg bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 shrink-0'>
                  <Package className='h-5 w-5' />
                </div>
                <div className='text-xs space-y-1'>
                  <div className='font-bold text-sm text-sky-950 dark:text-sky-200'>
                    Professional Packaging by NetPack Logistics
                  </div>
                  <p className='text-sky-800 dark:text-sky-300 leading-relaxed'>
                    As our customer, you only need to specify your <strong>commodity</strong> and <strong>approximate weight</strong>. 
                    You do not need to measure boxes or worry about packaging—our Central Warehouse team packs, cushions, and labels all cargo to international airline specifications.
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Form Card */}
            <Card className='shadow-sm'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg font-bold flex items-center gap-2'>
                  <PlusCircle className='h-5 w-5 text-primary' />
                  Create Consignment Booking
                </CardTitle>
                <CardDescription className='text-xs'>
                  Fill in your cargo details and request a rider for doorstep pickup.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateBooking} className='space-y-5'>
                  {/* Cargo Specifications */}
                  <div className='space-y-3'>
                    <div className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                      <Sparkles className='h-3.5 w-3.5 text-primary' />
                      1. Cargo Details
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold text-foreground'>
                          Commodity Description <span className='text-rose-500'>*</span>
                        </label>
                        <Input
                          placeholder='e.g., Handicrafts, Woolen Garments, Documents'
                          value={commodity}
                          onChange={(e) => setCommodity(e.target.value)}
                          required
                          className='h-9 text-xs'
                        />
                        {/* Quick Chips */}
                        <div className='flex flex-wrap gap-1.5 pt-1'>
                          {COMMODITY_SUGGESTIONS.map((item) => (
                            <button
                              key={item}
                              type='button'
                              onClick={() => setCommodity(item)}
                              className='text-[10px] font-medium px-2 py-0.5 rounded-full border bg-muted/40 hover:bg-primary/10 hover:text-primary transition-colors'
                            >
                              + {item}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold text-foreground'>
                          Approximate Weight (kg) <span className='text-rose-500'>*</span>
                        </label>
                        <Input
                          type='number'
                          step='0.1'
                          min='0.1'
                          placeholder='e.g., 2.5'
                          value={approximateWeight}
                          onChange={(e) => setApproximateWeight(e.target.value)}
                          required
                          className='h-9 text-xs'
                        />
                        <p className='text-[10px] text-muted-foreground'>
                          Estimated gross weight. Exact chargeable weight will be verified at our warehouse.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='border-t pt-4 space-y-3'>
                    <div className='flex items-center justify-between'>
                      <div className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                        <MapPin className='h-3.5 w-3.5 text-primary' />
                        2. Destination & Receiver
                      </div>
                      {customerUser && (
                        <div className='flex items-center gap-2'>
                          <label htmlFor='use-my-addr' className='text-xs font-semibold text-foreground cursor-pointer select-none'>
                            Use my address as delivery address
                          </label>
                          <Switch
                            id='use-my-addr'
                            checked={useMyAddress}
                            onCheckedChange={(checked) => {
                              setUseMyAddress(checked)
                              if (checked && customerUser) {
                                setReceiverName(customerUser.name || '')
                                setReceiverPhone(customerUser.phone && customerUser.phone !== '+977-9800000000' ? customerUser.phone : '')
                                const combinedAddr = [customerUser.address1, customerUser.address2].filter(Boolean).join(', ')
                                setReceiverAddress(combinedAddr || customerUser.address1 || '')
                                setReceiverCity(customerUser.city || 'Kathmandu')
                                setReceiverPostcode(customerUser.postcode || '')
                                if (customerUser.country?.name) {
                                  setReceiverCountry(customerUser.country.name)
                                } else {
                                  setReceiverCountry('Nepal')
                                }
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-3.5'>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold'>Receiver Full Name <span className='text-rose-500'>*</span></label>
                        <Input
                          placeholder='Full name of consignee'
                          value={receiverName}
                          onChange={(e) => setReceiverName(e.target.value)}
                          required
                          className='h-9 text-xs'
                        />
                      </div>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold'>Receiver Contact Phone <span className='text-rose-500'>*</span></label>
                        <Input
                          placeholder='+1 234 567 8900'
                          value={receiverPhone}
                          onChange={(e) => setReceiverPhone(e.target.value)}
                          required
                          className='h-9 text-xs'
                        />
                      </div>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold'>Destination Country <span className='text-rose-500'>*</span></label>
                        <Input
                          list='country-list'
                          placeholder='Select or type destination country'
                          value={receiverCountry}
                          onChange={(e) => setReceiverCountry(e.target.value)}
                          required
                          className='h-9 text-xs'
                        />
                        <datalist id='country-list'>
                          {countries.map((c) => (
                            <option key={c.id} value={c.name} />
                          ))}
                        </datalist>
                      </div>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold'>Destination City <span className='text-rose-500'>*</span></label>
                        <Input
                          placeholder='e.g., London, New York, Tokyo, Sydney'
                          value={receiverCity}
                          onChange={(e) => setReceiverCity(e.target.value)}
                          required
                          className='h-9 text-xs'
                        />
                      </div>
                      <div className='space-y-1.5 sm:col-span-2'>
                        <label className='text-xs font-semibold'>Delivery Street Address <span className='text-rose-500'>*</span></label>
                        <Input
                          placeholder='Street, Building, Apartment / Suite number'
                          value={receiverAddress}
                          onChange={(e) => setReceiverAddress(e.target.value)}
                          required
                          className='h-9 text-xs'
                        />
                      </div>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold'>Postal / Zip Code</label>
                        <Input
                          placeholder='e.g., SW1A 1AA / 10001'
                          value={receiverPostcode}
                          onChange={(e) => setReceiverPostcode(e.target.value)}
                          className='h-9 text-xs'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pickup Request Section */}
                  <div className='border-t pt-4 space-y-3.5'>
                    <div className='flex items-center justify-between bg-muted/40 p-3 rounded-lg border'>
                      <div className='flex items-center gap-2.5'>
                        <Truck className='h-5 w-5 text-primary' />
                        <div>
                          <div className='text-xs font-bold'>Doorstep Pickup by Rider</div>
                          <div className='text-[11px] text-muted-foreground'>
                            {isPickupRequired
                              ? 'A NetPack courier driver will collect cargo from your location.'
                              : 'You will drop off cargo at our Kathmandu Central Warehouse.'}
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={isPickupRequired}
                        onCheckedChange={setIsPickupRequired}
                      />
                    </div>

                    {isPickupRequired && (
                      <div className='p-3.5 rounded-lg border bg-card space-y-3 animate-in fade-in-50 duration-150'>
                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                          <div className='space-y-1.5'>
                            <label className='text-xs font-semibold'>Pickup Address in Kathmandu</label>
                            <Input
                              placeholder='House/Office address for rider collection'
                              value={pickupAddress}
                              onChange={(e) => setPickupAddress(e.target.value)}
                              className='h-9 text-xs'
                            />
                          </div>
                          <div className='space-y-1.5'>
                            <label className='text-xs font-semibold'>Pickup Contact Phone</label>
                            <Input
                              placeholder='Rider contact number'
                              value={pickupPhone}
                              onChange={(e) => setPickupPhone(e.target.value)}
                              className='h-9 text-xs'
                            />
                          </div>
                          <div className='space-y-1.5'>
                            <label className='text-xs font-semibold'>Preferred Time Slot</label>
                            <select
                              value={pickupTimeSlot}
                              onChange={(e) => setPickupTimeSlot(e.target.value)}
                              className='w-full h-9 rounded-md border bg-background px-3 text-xs'
                            >
                              {TIME_SLOT_OPTIONS.map((slot) => (
                                <option key={slot} value={slot}>{slot}</option>
                              ))}
                            </select>
                          </div>
                          <div className='space-y-1.5'>
                            <label className='text-xs font-semibold'>Pickup Notes for Driver</label>
                            <Input
                              placeholder='e.g., Near landmark, call before arrival'
                              value={pickupNotes}
                              onChange={(e) => setPickupNotes(e.target.value)}
                              className='h-9 text-xs'
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className='pt-2'>
                    <Button
                      type='submit'
                      disabled={bookingSubmitting}
                      className='w-full h-10 text-sm font-bold shadow-md'
                    >
                      {bookingSubmitting ? (
                        <>
                          <RefreshCw className='h-4 w-4 mr-2 animate-spin' />
                          Submitting Booking...
                        </>
                      ) : (
                        <>
                          Confirm Booking & Request Pickup
                          <ArrowRight className='h-4 w-4 ml-2' />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── TAB: TRACK SHIPMENT ── */}
        {activeTab === 'track' && (
          <div className='space-y-5 animate-in fade-in-50 duration-200'>
            {trackingLoading && (
              <Card className='border shadow-xs text-center p-12'>
                <RefreshCw className='h-8 w-8 mx-auto text-primary animate-spin mb-3' />
                <p className='font-semibold text-sm'>Loading shipment tracking...</p>
                <p className='text-xs text-muted-foreground mt-1'>Connecting to live airway and courier tracking logs...</p>
              </Card>
            )}

            {!trackingLoading && !trackingData && (
              <Card className='border shadow-xs text-center p-8'>
                <PackageSearch className='h-12 w-12 mx-auto text-muted-foreground/50 mb-2' />
                <p className='font-semibold text-sm'>No shipment selected for tracking</p>
                <p className='text-xs text-muted-foreground mt-1'>
                  Select any shipment from your Shipments tab to view live tracking milestones and checkpoints.
                </p>
                <Button
                  size='sm'
                  onClick={() => setActiveTab('shipments')}
                  className='mt-4 text-xs font-semibold'
                >
                  View My Shipments
                </Button>
              </Card>
            )}

            {/* Tracking Result View */}
            {!trackingLoading && trackingData && (
              <Card className='border shadow-md overflow-hidden'>
                {/* ── Tracking Header Action Bar ── */}
                <div className='flex items-center justify-between px-4 sm:px-6 pt-4 pb-3 border-b bg-background'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-bold text-foreground'>
                      {trackingData.receiverName || 'Consignment Tracking'}
                    </span>
                    <span className='text-xs font-bold text-foreground uppercase tracking-wide px-2 py-0.5 rounded bg-muted'>
                      {displayForwardingCompany}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className={`text-xs font-semibold px-2.5 py-0.5 border ${statusCfg.badgeClass}`}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                </div>

                <CardContent className='p-4 sm:p-6 space-y-6'>
                  {/* ── HERO STATUS & LATEST UPDATE SECTION ── */}
                  <div className='space-y-3'>
                    <div>
                      <h2 className='text-2xl font-bold tracking-tight text-foreground'>
                        {statusCfg.heroTitle}
                      </h2>
                      <p className='text-xs text-muted-foreground font-medium mt-1'>
                        {latestCheckpoint?.activity ? (
                          <span className='text-foreground font-semibold'>
                            {latestCheckpoint.activity}
                            {latestCheckpoint.location ? ` • ${latestCheckpoint.location}` : ''}
                            {latestCheckpoint.timestamp ? ` • ${formatDateTime(latestCheckpoint.timestamp)}` : ''}
                          </span>
                        ) : (
                          `Latest status updated for ${trackingData.destination || 'cargo destination'}`
                        )}
                      </p>
                    </div>

                    {/* Horizontal Progress Bar */}
                    <div className='relative w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden'>
                      <div
                        className='h-full bg-sky-500 dark:bg-sky-400 rounded-full transition-all duration-500 ease-out'
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* ── MILESTONES LIFECYCLE SECTION (With Folding Format) ── */}
                  <div className='rounded-xl border bg-card p-4 space-y-3 shadow-xs'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                          Milestones & Lifecycle
                        </span>
                        <Badge variant='outline' className='text-[10px] font-bold py-0 h-5'>
                          Stage {trackingStageIndex + 1} of {trackingMilestones.length}: {trackingMilestones[trackingStageIndex]?.label}
                        </Badge>
                      </div>
                      <button
                        type='button'
                        onClick={() => setIsMilestonesFolded(!isMilestonesFolded)}
                        className='inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer'
                      >
                        <span>{isMilestonesFolded ? 'Expand Milestones' : 'Fold Milestones'}</span>
                        {isMilestonesFolded ? (
                          <ChevronDown className='h-3.5 w-3.5' />
                        ) : (
                          <ChevronUp className='h-3.5 w-3.5' />
                        )}
                      </button>
                    </div>

                    {/* Folded View: Single Horizontal Line Stepper (Picture 5) */}
                    {isMilestonesFolded ? (
                      <div className='w-full overflow-x-auto py-3 px-1 scrollbar-none'>
                        <div className='flex items-center justify-between min-w-[560px] sm:min-w-full relative px-2'>
                          {/* Background connecting line */}
                          <div className='absolute left-6 right-6 top-4 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0' />
                          {/* Completed progress line */}
                          <div
                            className='absolute left-6 top-4 h-0.5 bg-emerald-500 -z-0 transition-all duration-300'
                            style={{
                              width:
                                trackingMilestones.length > 1
                                  ? `${Math.min(100, Math.max(0, (trackingStageIndex / (trackingMilestones.length - 1)) * 100))}%`
                                  : '0%',
                            }}
                          />

                          {trackingMilestones.map((stg: any, sIdx: number) => {
                            const isCompleted =
                              sIdx < trackingStageIndex ||
                              (sIdx === trackingStageIndex && trackingStageIndex === trackingMilestones.length - 1)
                            const isActive =
                              sIdx === trackingStageIndex && trackingStageIndex < trackingMilestones.length - 1

                            return (
                              <div
                                key={stg.id}
                                className='flex flex-col items-center relative z-10 min-w-[62px] text-center'
                              >
                                <div
                                  className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${
                                    isCompleted
                                      ? 'bg-emerald-500 text-white shadow-xs'
                                      : isActive
                                      ? 'bg-sky-600 text-white shadow-md ring-4 ring-sky-200 dark:ring-sky-900 animate-pulse'
                                      : 'bg-muted border border-slate-300 dark:border-slate-700 text-muted-foreground'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <Check className='h-4 w-4 stroke-[2.5]' />
                                  ) : (
                                    <span className='scale-85'>{stg.icon}</span>
                                  )}
                                </div>
                                <span
                                  className={`text-[10px] mt-1.5 font-semibold text-center whitespace-nowrap leading-none ${
                                    isActive
                                      ? 'text-sky-600 dark:text-sky-400 font-bold'
                                      : isCompleted
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-muted-foreground'
                                  }`}
                                >
                                  {getShortMilestoneLabel(stg.label)}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Expanded View: Full Authentic Stepper */
                      <div className='relative pl-6 pt-2 before:absolute before:left-[11px] before:top-3.5 before:bottom-3.5 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800'>
                        {trackingMilestones.map((stg: any, sIdx: number) => {
                          const isCompleted = sIdx < trackingStageIndex || (sIdx === trackingStageIndex && trackingStageIndex === trackingMilestones.length - 1)
                          const isActive = sIdx === trackingStageIndex && trackingStageIndex < trackingMilestones.length - 1

                          return (
                            <div key={stg.id} className='relative pb-4 last:pb-1 group'>
                              {/* Node Dot */}
                              <div
                                className={`absolute -left-6 top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                                  isCompleted
                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                    : isActive
                                    ? 'border-sky-500 bg-sky-100 dark:bg-sky-950 text-sky-600 ring-2 ring-sky-200 dark:ring-sky-900'
                                    : 'border-slate-300 dark:border-slate-700 bg-muted text-muted-foreground'
                                }`}
                              >
                                {isCompleted ? <Check className='h-3.5 w-3.5 stroke-[3]' /> : stg.icon}
                              </div>

                              {/* Milestone Details */}
                              <div className='space-y-0.5 text-left ml-2'>
                                <div className='flex items-center justify-between'>
                                  <div className='flex items-center gap-1.5 flex-wrap'>
                                    <span
                                      className={`text-xs font-bold leading-tight ${
                                        isActive
                                          ? 'text-sky-600 dark:text-sky-400'
                                          : isCompleted
                                          ? 'text-foreground'
                                          : 'text-muted-foreground'
                                      }`}
                                    >
                                      {stg.label}
                                    </span>
                                    {stg.badge && (
                                      <Badge variant='outline' className={`text-[9px] font-bold px-1.5 py-0 h-4 border ${stg.badgeClass || ''}`}>
                                        {stg.badge}
                                      </Badge>
                                    )}
                                  </div>
                                  {stg.timestamp && (
                                    <span className='text-[10px] text-muted-foreground font-mono'>
                                      {formatDateTime(stg.timestamp)}
                                    </span>
                                  )}
                                </div>
                                <p className='text-xs text-muted-foreground leading-snug'>
                                  {stg.description}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── OVERSEAS COURIER LEG CARD ── */}
                  {(displayForwardingNumber || trackingData.forwardingCompany) && (
                    <div className='rounded-xl border bg-card p-4 space-y-3 shadow-xs'>
                      <div className='flex items-center justify-between border-b pb-2.5'>
                        <div className='flex items-center gap-2'>
                          <Truck className='h-4 w-4 text-indigo-500' />
                          <span className='text-xs font-bold uppercase tracking-wider text-foreground'>
                            Overseas Courier Delivery Leg
                          </span>
                        </div>
                        <Badge variant='outline' className='bg-indigo-50 dark:bg-indigo-950 font-bold text-xs text-indigo-700 dark:text-indigo-300'>
                          {displayForwardingCompany}
                        </Badge>
                      </div>
                      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1'>
                        <div>
                          <span className='text-muted-foreground text-[11px] block'>Carrier Tracking / Forwarding No:</span>
                          <div className='flex items-center gap-1.5 mt-0.5'>
                            <span className='font-mono font-bold text-sm text-foreground'>{displayForwardingNumber || 'Assigned'}</span>
                            {displayForwardingNumber && (
                              <button
                                type='button'
                                onClick={() => handleCopyText(displayForwardingNumber)}
                                className='text-muted-foreground hover:text-primary'
                                title='Copy carrier number'
                              >
                                <Copy className='h-3.5 w-3.5' />
                              </button>
                            )}
                          </div>
                        </div>
                        {carrierUrl && (
                          <a
                            href={carrierUrl}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary hover:bg-primary/90 px-3.5 py-2 rounded-lg transition-colors'
                          >
                            Track on Carrier Website
                            <ExternalLink className='h-3.5 w-3.5' />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── TRANSIT CHECKPOINTS SECTION (Descending Order: Freshest at Top) ── */}
                  <div className='space-y-2 pt-1'>
                    <div className='flex items-center justify-between'>
                      <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                        Transit Checkpoints & Scans ({trackingCheckpoints.length})
                      </span>
                      <span className='text-[11px] text-muted-foreground'>Newest First</span>
                    </div>

                    {trackingCheckpoints.length > 0 ? (
                      <div className='relative pl-6 before:absolute before:left-[7px] before:top-2.5 before:bottom-2.5 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-800'>
                        {displayedCheckpoints.map(({ cp, originalIdx }: any, loopIdx: number) => {
                          const isTopItem = originalIdx === 0
                          const isManualNoteEvent = cp.source === 'MANUAL_NOTE' || (cp.source && cp.source.includes('MANUAL'))
                          const isSelfDropEvent = cp.source === 'COUNTER_DROPOFF'

                          return (
                            <div key={originalIdx} className='relative group pb-5 last:pb-1'>
                              {/* Node Dot */}
                              <div
                                className={`absolute -left-6 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-background transition-all ${
                                  isTopItem
                                    ? 'border-sky-500 dark:border-sky-400 ring-2 ring-sky-200 dark:ring-sky-950'
                                    : 'border-slate-300 dark:border-slate-600'
                                }`}
                              >
                                {isTopItem && (
                                  <div className='h-1.5 w-1.5 rounded-full bg-sky-500 dark:bg-sky-400' />
                                )}
                              </div>

                              {/* Checkpoint Detail Block */}
                              <div className='space-y-1 text-left'>
                                <div className='flex flex-wrap items-center gap-1.5'>
                                  <span className='font-bold text-sm text-foreground leading-snug'>
                                    {cp.activity}
                                  </span>
                                  {isManualNoteEvent && (
                                    <Badge variant='outline' className='text-[9px] font-bold px-1.5 py-0 h-4 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300'>
                                      Manual Operator Note
                                    </Badge>
                                  )}
                                  {isSelfDropEvent && (
                                    <Badge variant='outline' className='text-[9px] font-bold px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'>
                                      Self Drop
                                    </Badge>
                                  )}
                                </div>
                                <div className='text-xs text-muted-foreground font-medium'>
                                  {cp.location || 'Kathmandu, Nepal'}
                                </div>
                                <div className='text-xs text-muted-foreground/80 font-normal'>
                                  {formatDateTime(cp.timestamp)}
                                </div>
                              </div>

                              {/* "SEE ALL UPDATES (N)" Button inserted between Top 2 and Bottom 1 when collapsed */}
                              {!isCheckpointsExpanded && canCollapse && loopIdx === 1 && (
                                <div className='my-3 -ml-1'>
                                  <button
                                    type='button'
                                    onClick={() => setIsCheckpointsExpanded(true)}
                                    className='inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer py-1'
                                  >
                                    <span>SEE ALL UPDATES ({trackingCheckpoints.length})</span>
                                    <ChevronDown className='h-3.5 w-3.5' />
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {/* "COLLAPSE UPDATES" Button at bottom when expanded */}
                        {isCheckpointsExpanded && canCollapse && (
                          <div className='pt-1 pb-3 -ml-1'>
                            <button
                              type='button'
                              onClick={() => setIsCheckpointsExpanded(false)}
                              className='inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer py-1'
                            >
                              <span>COLLAPSE UPDATES</span>
                              <ChevronUp className='h-3.5 w-3.5' />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className='rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground space-y-2'>
                        <PackageSearch className='h-8 w-8 mx-auto text-muted-foreground/50' />
                        <p className='font-medium text-foreground'>No transit checkpoints logged yet</p>
                        <p>Live checkpoints will record automatically upon carrier or airline dispatch.</p>
                      </div>
                    )}
                  </div>

                  {/* ── PACKAGE SPECIFICATIONS & PACKING LIST (Expandable Button & Details) ── */}
                  <div className='rounded-xl border bg-card overflow-hidden shadow-xs'>
                    <div className='p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20'>
                      <div className='flex items-center gap-3'>
                        <div className='h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0'>
                          <Boxes className='h-5 w-5' />
                        </div>
                        <div>
                          <div className='text-xs font-bold text-foreground flex items-center gap-2'>
                            <span>Package Specifications & Packing List</span>
                            {trackingData.boxes && trackingData.boxes.length > 0 && (
                              <Badge variant='outline' className='text-[10px] font-semibold py-0 h-4 px-1.5 bg-background'>
                                {trackingData.boxes.length} {trackingData.boxes.length === 1 ? 'Box' : 'Boxes'}
                              </Badge>
                            )}
                            {trackingData.weight && (
                              <Badge variant='outline' className='text-[10px] font-semibold py-0 h-4 px-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'>
                                {trackingData.weight} kg
                              </Badge>
                            )}
                          </div>
                          <div className='text-[11px] text-muted-foreground mt-0.5'>
                            View box dimensions, verified weights, scale photo & itemized packing list
                          </div>
                        </div>
                      </div>

                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => setIsPackageDetailsOpen(!isPackageDetailsOpen)}
                        className='h-8 text-xs font-semibold gap-1.5 shrink-0 bg-background hover:bg-muted'
                      >
                        <Scale className='h-3.5 w-3.5 text-primary' />
                        <span>{isPackageDetailsOpen ? 'Hide Package Details' : 'View Package & Items'}</span>
                        {isPackageDetailsOpen ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
                      </Button>
                    </div>

                    {/* Expandable Content Body */}
                    {isPackageDetailsOpen && (
                      <div className='border-t p-4 sm:p-5 space-y-5 animate-in fade-in-50 duration-150'>
                        {/* 1. Warehouse Verified Scale & Intake Details */}
                        {(trackingData.weightProofImageUrl || trackingData.weight || trackingData.pickedUpAt) && (
                          <div className='rounded-lg border bg-muted/20 p-3.5 space-y-3'>
                            <div className='flex items-center justify-between'>
                              <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                                <Scale className='h-3.5 w-3.5 text-primary' />
                                Warehouse Verified Weight & Scale Photo
                              </span>
                              <Badge variant='outline' className='text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'>
                                Verified at Intake
                              </Badge>
                            </div>

                              {((trackingData.weightProofImages && trackingData.weightProofImages.length > 0) || trackingData.weightProofImageUrl) && (
                                <div className='flex flex-wrap items-center gap-2'>
                                  {(trackingData.weightProofImages?.length
                                    ? trackingData.weightProofImages
                                    : [trackingData.weightProofImageUrl]
                                  ).map((imgUrl: string, imgIdx: number) => {
                                    const fullUrl = imgUrl.startsWith('http') ? imgUrl : `${API_BASE}${imgUrl}`
                                    return (
                                      <button
                                        key={imgIdx}
                                        type='button'
                                        onClick={() => {
                                          const allImgs = (trackingData.weightProofImages?.length
                                            ? trackingData.weightProofImages
                                            : [trackingData.weightProofImageUrl]
                                          ).map((u: string) => (u.startsWith('http') ? u : `${API_BASE}${u}`))
                                          setSelectedPhotoUrls(allImgs)
                                          setSelectedPhotoIndex(imgIdx)
                                        }}
                                        className='relative group overflow-hidden rounded-lg border border-border shadow-xs hover:border-primary shrink-0 cursor-pointer text-left'
                                      >
                                        <img
                                          src={fullUrl}
                                          alt={`Proof ${imgIdx + 1}`}
                                          className='h-20 w-24 object-cover transition-transform group-hover:scale-105'
                                        />
                                        <div className='absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 rounded font-medium'>
                                          #{imgIdx + 1}
                                        </div>
                                        <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-medium'>
                                          View
                                        </div>
                                      </button>
                                    )
                                  })}
                                </div>
                              )}

                              <div className='space-y-1.5 text-xs flex-1'>
                                <div className='grid grid-cols-2 sm:grid-cols-3 gap-2'>
                                  <div>
                                    <span className='text-muted-foreground block text-[11px]'>Actual Gross Weight:</span>
                                    <span className='font-bold text-foreground text-sm'>{trackingData.weight || 'N/A'} kg</span>
                                  </div>
                                  {trackingData.volumetricWeight && (
                                    <div>
                                      <span className='text-muted-foreground block text-[11px]'>Volumetric Weight:</span>
                                      <span className='font-medium text-foreground text-sm'>{trackingData.volumetricWeight} kg</span>
                                    </div>
                                  )}
                                  {trackingData.chargeableWeight && (
                                    <div>
                                      <span className='text-muted-foreground block text-[11px]'>Chargeable Weight:</span>
                                      <span className='font-bold text-primary text-sm'>{trackingData.chargeableWeight} kg</span>
                                    </div>
                                  )}
                                </div>
                                {trackingData.pickedUpAt && (
                                  <div className='text-[11px] text-muted-foreground pt-1.5 border-t'>
                                    Intake Time: {formatDateTime(trackingData.pickedUpAt)}
                                  </div>
                                )}
                              </div>
                            </div>
                        )}

                        {/* 2. Box Specifications & Items in Boxes (Packing List without values) */}
                        <div className='space-y-3'>
                          <div className='flex items-center justify-between'>
                            <span className='text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5'>
                              <Boxes className='h-3.5 w-3.5 text-primary' />
                              Box Weights, Dimensions & Item Packing List
                            </span>
                            <span className='text-[11px] text-muted-foreground'>
                              {trackingData.boxes?.length || 1} {(trackingData.boxes?.length || 1) === 1 ? 'Box' : 'Boxes'} Total
                            </span>
                          </div>

                          <div className='space-y-3'>
                            {(trackingData.boxes && trackingData.boxes.length > 0 ? trackingData.boxes : [
                              {
                                boxNumber: 1,
                                trackingNumber: 'BOX-1',
                                weight: trackingData.weight || 10.0,
                                dimensions: 'Standard Cargo Box',
                                items: [{ item: trackingData.commodity || 'General Cargo', pieces: 1 }]
                              }
                            ]).map((box: any, bIdx: number) => (
                              <div key={bIdx} className='rounded-lg border bg-muted/10 p-3.5 space-y-2.5 shadow-2xs'>
                                {/* Box Header: Weight & Dims */}
                                <div className='flex flex-wrap items-center justify-between gap-2 border-b pb-2 text-xs'>
                                  <div className='flex items-center gap-2'>
                                    <span className='font-bold text-foreground'>Box #{box.boxNumber || bIdx + 1}</span>
                                    {box.trackingNumber && (
                                      <span className='font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded'>
                                        {box.trackingNumber}
                                      </span>
                                    )}
                                  </div>
                                  <div className='flex items-center gap-3 text-[11px]'>
                                    <span>
                                      <strong className='text-foreground'>Weight:</strong> {box.weight || '-'} kg
                                    </span>
                                    <span>
                                      <strong className='text-foreground'>Dims:</strong> {box.dimensions || (box.length && box.breadth && box.height ? `${box.length} x ${box.breadth} x ${box.height} cm` : 'Standard Box')}
                                    </span>
                                    {box.volumetricWeight && (
                                      <span className='text-muted-foreground'>
                                        (Vol: {box.volumetricWeight} kg)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Items in this Box (Packing List - Items & Pcs only) */}
                                <div className='pt-0.5'>
                                  <div className='text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5'>
                                    Items in this Box (Packing List):
                                  </div>
                                  {box.items && box.items.length > 0 ? (
                                    <div className='divide-y rounded-md border bg-background'>
                                      {box.items.map((itm: any, itmIdx: number) => (
                                        <div key={itmIdx} className='flex items-center justify-between px-3 py-1.5 text-xs'>
                                          <span className='font-medium text-foreground'>{itm.item || 'Item'}</span>
                                          <span className='font-bold text-primary bg-primary/10 px-2 py-0.5 rounded text-[11px]'>
                                            {itm.pieces || 1} {(itm.pieces || 1) === 1 ? 'pc' : 'pcs'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className='text-xs text-muted-foreground italic px-2 py-1 bg-background rounded border'>
                                      {trackingData.commodity || 'General Cargo Goods'} — 1 pc
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── FOOTER METADATA / CONSIGNMENT SUMMARY CARD ── */}
                  <div className='rounded-xl border bg-muted/30 p-4 space-y-3.5 text-xs'>
                    {/* Tracking Number Row with Copy Button */}
                    <div className='flex items-center justify-between pb-3 border-b border-border/60'>
                      <span className='font-medium text-muted-foreground'>Tracking number</span>
                      <div className='flex items-center gap-2'>
                        <span className='font-mono font-bold text-sm text-foreground'>
                          {trackingData.trackingNumber || displayForwardingNumber || 'N/A'}
                        </span>
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => handleCopyText(trackingData.trackingNumber || displayForwardingNumber)}
                          className='h-6 w-6 text-muted-foreground hover:text-foreground'
                          title='Copy tracking number'
                        >
                          {trackingCopied ? <Check className='h-3.5 w-3.5 text-emerald-600' /> : <Copy className='h-3.5 w-3.5' />}
                        </Button>
                      </div>
                    </div>

                    {/* Carrier Row with External Link */}
                    <div className='flex items-center justify-between pb-3 border-b border-border/60'>
                      <span className='font-medium text-muted-foreground'>Carrier</span>
                      <div className='flex items-center gap-1.5 font-bold text-foreground'>
                        <span>{displayForwardingCompany}</span>
                        {carrierUrl && (
                          <a
                            href={carrierUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-primary hover:underline inline-flex items-center gap-0.5'
                          >
                            <ExternalLink className='h-3 w-3' />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Route & Cargo Specs */}
                    <div className='grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-0.5'>
                      <div>
                        <span className='font-medium text-foreground'>Route:</span>{' '}
                        {trackingData.origin || 'Kathmandu, NP'} ➔ {trackingData.destination || 'Overseas'}
                      </div>
                      <div>
                        <span className='font-medium text-foreground'>Cargo:</span>{' '}
                        {trackingData.commodity || 'General Cargo'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── TAB: MY SHIPMENTS ── */}
        {activeTab === 'shipments' && (
          <div className='space-y-4 animate-in fade-in-50 duration-200'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-base font-bold tracking-tight'>My Consignments</h3>
                <p className='text-xs text-muted-foreground'>Review your active bookings and cargo history.</p>
              </div>
              <Button size='sm' variant='outline' onClick={fetchMyShipments} className='h-8 text-xs gap-1'>
                <RefreshCw className={`h-3 w-3 ${shipmentsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className='flex gap-1.5 p-1 rounded-lg bg-muted/40 border w-fit text-xs font-semibold'>
              <button
                type='button'
                onClick={() => setShipmentFilter('ALL')}
                className={`px-3 py-1 rounded-md transition-colors ${shipmentFilter === 'ALL' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                All ({myShipments.length})
              </button>
              <button
                type='button'
                onClick={() => setShipmentFilter('ACTIVE')}
                className={`px-3 py-1 rounded-md transition-colors ${shipmentFilter === 'ACTIVE' ? 'bg-background shadow-xs text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                In Progress
              </button>
              <button
                type='button'
                onClick={() => setShipmentFilter('DELIVERED')}
                className={`px-3 py-1 rounded-md transition-colors ${shipmentFilter === 'DELIVERED' ? 'bg-background shadow-xs text-emerald-600' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Delivered
              </button>
            </div>

            {/* Shipments List */}
            {displayedShipments.length === 0 ? (
              <Card className='p-8 text-center text-muted-foreground'>
                <PackageSearch className='h-10 w-10 mx-auto text-muted-foreground/50 mb-2' />
                <p className='text-xs font-medium'>No consignments found under this view.</p>
                <Button size='sm' onClick={() => setActiveTab('book')} className='mt-3 text-xs font-semibold'>
                  Book a Consignment
                </Button>
              </Card>
            ) : (
              <div className='grid grid-cols-1 gap-3'>
                {displayedShipments.map((s) => (
                  <Card key={s.id} className='hover:border-primary/40 transition-colors shadow-xs'>
                    <CardContent className='p-4 space-y-3'>
                      <div className='flex items-start justify-between gap-2'>
                        <div>
                          <div className='font-mono font-bold text-xs text-foreground flex items-center gap-1.5'>
                            {s.trackingNumber}
                            <button
                              type='button'
                              onClick={() => handleCopyText(s.trackingNumber)}
                              className='text-muted-foreground hover:text-primary'
                              title='Copy Tracking Number'
                            >
                              <Copy className='h-3 w-3' />
                            </button>
                          </div>
                          <div className='text-xs font-semibold text-foreground mt-0.5'>
                            {s.commodity}
                          </div>
                        </div>
                        <Badge variant='outline' className='text-[10px] font-bold py-0.5 px-2 bg-muted/60'>
                          {s.status}
                        </Badge>
                      </div>

                      <div className='grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1 border-t'>
                        <div>
                          <span className='font-medium text-foreground'>Destination:</span> {s.destination}
                        </div>
                        <div>
                          <span className='font-medium text-foreground'>
                            {s.isPacked || (s.status && s.status !== 'PENDING' && s.status !== 'ENQUIRY_GENERATED')
                              ? 'Weight:'
                              : 'Approx Wt:'}
                          </span>{' '}
                          {s.weight || s.approximateWeight} kg
                        </div>
                        <div>
                          <span className='font-medium text-foreground'>Booked:</span>{' '}
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '-'}
                        </div>
                      </div>

                      {/* Scale photo button if weightProofImages exists */}
                      {((s.weightProofImages && s.weightProofImages.length > 0) || s.weightProofImageUrl) && (
                        <div className='flex items-center justify-between pt-2 border-t border-dashed'>
                          <button
                            type='button'
                            onClick={() => {
                              const imgs = s.weightProofImages?.length
                                ? s.weightProofImages.map((u: string) => (u.startsWith('http') ? u : `${API_BASE}${u}`))
                                : [s.weightProofImageUrl.startsWith('http') ? s.weightProofImageUrl : `${API_BASE}${s.weightProofImageUrl}`]
                              setSelectedPhotoUrls(imgs)
                              setSelectedPhotoIndex(0)
                            }}
                            className='inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline'
                          >
                            <Scale className='h-3.5 w-3.5 text-primary' />
                            <span>
                              View {s.weightProofImages && s.weightProofImages.length > 1 ? `${s.weightProofImages.length} Scale/Box Photos` : 'Scale Photo Proof'}
                            </span>
                          </button>
                          <span className='text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded'>
                            Warehouse Verified
                          </span>
                        </div>
                      )}

                      <div className='pt-1 flex items-center justify-between'>
                        <div className='text-[10px] text-muted-foreground flex items-center gap-1'>
                          <MapPin className='h-3 w-3 text-primary' />
                          To: {s.receiverName || 'Consignee'} ({s.receiverCity})
                        </div>
                        <Button
                          size='sm'
                          variant='ghost'
                          className='h-7 text-xs font-bold text-primary hover:bg-primary/10 gap-1'
                          onClick={() => {
                            setTrackingInput(s.trackingNumber)
                            handleTrackSubmit(s.trackingNumber)
                            setActiveTab('track')
                          }}
                        >
                          View Tracking
                          <ChevronRight className='h-3.5 w-3.5' />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: NOTIFICATIONS ── */}
        {activeTab === 'notifications' && (
          <div className='space-y-4 animate-in fade-in-50 duration-200'>
            <div className='flex items-center justify-between'>
              <div>
                <h3 className='text-base font-bold tracking-tight'>Notifications & Alerts</h3>
                <p className='text-xs text-muted-foreground'>Stay updated on your cargo milestones and alerts.</p>
              </div>
              <Button size='sm' variant='outline' onClick={fetchNotifications} className='h-8 text-xs gap-1'>
                <RefreshCw className={`h-3 w-3 ${notifsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {notifications.length === 0 ? (
              <Card className='p-8 text-center text-muted-foreground'>
                <Bell className='h-10 w-10 mx-auto text-muted-foreground/50 mb-2' />
                <p className='text-xs font-medium'>You have no notifications at this time.</p>
              </Card>
            ) : (
              <div className='space-y-2.5'>
                {notifications.map((n) => (
                  <Card key={n.id} className={`shadow-xs transition-colors ${n.isRead ? 'bg-card opacity-80' : 'bg-primary/5 border-primary/30'}`}>
                    <CardContent className='p-4 space-y-1.5'>
                      <div className='flex items-center justify-between'>
                        <span className='font-bold text-xs text-foreground flex items-center gap-1.5'>
                          <Sparkles className='h-3.5 w-3.5 text-primary' />
                          {n.title}
                        </span>
                        {n.createdAt && (
                          <span className='text-[10px] text-muted-foreground'>
                            {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground leading-relaxed'>
                        {n.body}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: ACCOUNT / SIGN IN ── */}
        {activeTab === 'account' && (
          <div className='max-w-md mx-auto space-y-5 animate-in fade-in-50 duration-200 pb-12'>
            {customerToken ? (
              <div className='space-y-4'>
                {/* Greeting Banner */}
                <div className='rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-4 border border-primary/20 flex items-center justify-between'>
                  <div>
                    <h2 className='text-lg font-extrabold text-foreground'>
                      Hello, {customerUser?.name?.trim() ? customerUser.name.trim().split(/\s+/)[0] : 'Customer'}! 👋
                    </h2>
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      Welcome to your NetPack logistics profile
                    </p>
                  </div>
                  <div className='h-12 w-12 rounded-full border-2 border-primary/30 overflow-hidden relative shadow-sm shrink-0 bg-primary/10 flex items-center justify-center'>
                    {customerUser?.photoUrl ? (
                      <img
                        src={customerUser.photoUrl.startsWith('http') ? customerUser.photoUrl : `${API_BASE}${customerUser.photoUrl}`}
                        alt={customerUser?.name || 'User'}
                        className='h-full w-full object-cover'
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    ) : (
                      <span className='font-black text-base text-primary'>
                        {customerUser?.name ? customerUser.name.slice(0, 2).toUpperCase() : 'NP'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Card with Photo Change & Details */}
                <Card className='shadow-md border'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-sm font-bold flex items-center gap-2'>
                        <User className='h-4 w-4 text-primary' />
                        Account Details
                      </CardTitle>
                      {!editingProfile && (
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={startEditProfile}
                          className='h-7 text-xs font-semibold gap-1 text-primary hover:text-primary hover:bg-primary/10'
                        >
                          <Edit2 className='h-3 w-3' />
                          Edit
                        </Button>
                      )}
                    </div>
                    <CardDescription className='text-xs'>
                      Manage your contact and delivery addresses
                    </CardDescription>
                  </CardHeader>
                  <CardContent className='space-y-4 text-xs'>
                    {/* User Avatar with Upload Trigger */}
                    <div className='flex flex-col items-center justify-center py-2'>
                      <div className='relative group'>
                        <div className='h-20 w-20 rounded-full border-2 border-primary overflow-hidden shadow-md bg-muted flex items-center justify-center'>
                          {customerUser?.photoUrl ? (
                            <img
                              src={customerUser.photoUrl.startsWith('http') ? customerUser.photoUrl : `${API_BASE}${customerUser.photoUrl}`}
                              alt={customerUser?.name || 'User'}
                              className='h-full w-full object-cover'
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <span className='font-black text-2xl text-primary'>
                              {customerUser?.name ? customerUser.name.slice(0, 2).toUpperCase() : 'NP'}
                            </span>
                          )}
                        </div>
                        <label className='absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground shadow cursor-pointer hover:bg-primary/90 transition-transform active:scale-95'>
                          <Camera className='h-3.5 w-3.5' />
                          <input
                            type='file'
                            accept='image/*'
                            className='hidden'
                            onChange={handlePhotoUpload}
                            disabled={uploadingPhoto}
                          />
                        </label>
                      </div>
                      {uploadingPhoto && (
                        <p className='text-[10px] text-primary animate-pulse mt-1 font-medium'>
                          Uploading photo...
                        </p>
                      )}
                      <span className='text-[10px] text-muted-foreground mt-1'>
                        Tap camera to update photo
                      </span>
                    </div>

                    {editingProfile ? (
                      <form onSubmit={handleUpdateProfile} className='space-y-3 pt-2'>
                        <div className='space-y-1'>
                          <label className='text-[11px] font-semibold text-muted-foreground'>Full Name</label>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            required
                            className='h-8 text-xs'
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-[11px] font-semibold text-muted-foreground'>Phone Number</label>
                          <Input
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            required
                            className='h-8 text-xs'
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-[11px] font-semibold text-muted-foreground'>Address Line 1</label>
                          <Input
                            value={editAddress1}
                            onChange={(e) => setEditAddress1(e.target.value)}
                            required
                            placeholder='Street / House No'
                            className='h-8 text-xs'
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-[11px] font-semibold text-muted-foreground'>Address Line 2 (Optional)</label>
                          <Input
                            value={editAddress2}
                            onChange={(e) => setEditAddress2(e.target.value)}
                            placeholder='Apartment, suite, unit'
                            className='h-8 text-xs'
                          />
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                          <div className='space-y-1'>
                            <label className='text-[11px] font-semibold text-muted-foreground'>City</label>
                            <Input
                              value={editCity}
                              onChange={(e) => setEditCity(e.target.value)}
                              className='h-8 text-xs'
                            />
                          </div>
                          <div className='space-y-1'>
                            <label className='text-[11px] font-semibold text-muted-foreground'>State / Province</label>
                            <Input
                              value={editState}
                              onChange={(e) => setEditState(e.target.value)}
                              placeholder='e.g., Bagmati'
                              className='h-8 text-xs'
                            />
                          </div>
                        </div>
                        <div className='grid grid-cols-2 gap-2'>
                          <div className='space-y-1'>
                            <label className='text-[11px] font-semibold text-muted-foreground'>Postcode</label>
                            <Input
                              value={editPostcode}
                              onChange={(e) => setEditPostcode(e.target.value)}
                              placeholder='e.g., 44600'
                              className='h-8 text-xs'
                            />
                          </div>
                          <div className='space-y-1'>
                            <label className='text-[11px] font-semibold text-muted-foreground'>Country</label>
                            <select
                              value={editCountryId}
                              onChange={(e) => setEditCountryId(Number(e.target.value))}
                              className='h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-primary'
                            >
                              {countries.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className='flex gap-2 pt-2'>
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setEditingProfile(false)}
                            className='flex-1 h-8 text-xs'
                          >
                            Cancel
                          </Button>
                          <Button
                            type='submit'
                            size='sm'
                            className='flex-1 h-8 text-xs font-bold'
                          >
                            Save Changes
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className='rounded-lg border p-3.5 space-y-2.5 bg-muted/30'>
                        <div className='flex justify-between items-center py-0.5 border-b border-border/40'>
                          <span className='text-muted-foreground'>Full Name</span>
                          <strong className='text-foreground'>{customerUser?.name || '—'}</strong>
                        </div>
                        <div className='flex justify-between items-center py-0.5 border-b border-border/40'>
                          <span className='text-muted-foreground'>Email Address</span>
                          <strong className='text-foreground font-mono'>{customerUser?.email || '—'}</strong>
                        </div>
                        <div className='flex justify-between items-center py-0.5 border-b border-border/40'>
                          <span className='text-muted-foreground'>Phone</span>
                          <strong className='text-foreground font-mono'>{customerUser?.phone || '—'}</strong>
                        </div>
                        <div className='flex justify-between items-center py-0.5 border-b border-border/40'>
                          <span className='text-muted-foreground'>Address Line 1</span>
                          <strong className='text-foreground'>{customerUser?.address1 || '—'}</strong>
                        </div>
                        {customerUser?.address2 && (
                          <div className='flex justify-between items-center py-0.5 border-b border-border/40'>
                            <span className='text-muted-foreground'>Address Line 2</span>
                            <strong className='text-foreground'>{customerUser.address2}</strong>
                          </div>
                        )}
                        <div className='flex justify-between items-center py-0.5 border-b border-border/40'>
                          <span className='text-muted-foreground'>City</span>
                          <strong className='text-foreground'>{customerUser?.city || 'Kathmandu'}</strong>
                        </div>
                        {customerUser?.state && (
                          <div className='flex justify-between items-center py-0.5 border-b border-border/40'>
                            <span className='text-muted-foreground'>State / Province</span>
                            <strong className='text-foreground'>{customerUser.state}</strong>
                          </div>
                        )}
                        <div className='flex justify-between items-center py-0.5 border-b border-border/40'>
                          <span className='text-muted-foreground'>Postcode</span>
                          <strong className='text-foreground'>{customerUser?.postcode || '—'}</strong>
                        </div>
                        <div className='flex justify-between items-center py-0.5'>
                          <span className='text-muted-foreground'>Country</span>
                          <strong className='text-foreground'>
                            {typeof customerUser?.country === 'object' && customerUser?.country?.name
                              ? customerUser.country.name
                              : (typeof customerUser?.country === 'string' ? customerUser.country : 'Nepal')}
                          </strong>
                        </div>
                      </div>
                    )}

                    {/* ── Theme Appearance Preference ── */}
                    <div className='pt-3 border-t space-y-2'>
                      <div className='flex items-center justify-between'>
                        <span className='font-bold text-[11px] text-muted-foreground uppercase tracking-wider'>
                          App Theme
                        </span>
                        <span className='text-[10px] text-primary font-bold capitalize'>{theme} Mode</span>
                      </div>
                      <div className='grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border'>
                        <button
                          type='button'
                          onClick={() => setTheme('light')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            theme === 'light'
                              ? 'bg-background text-foreground shadow-xs font-bold border'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Sun className='h-3.5 w-3.5 text-amber-500' />
                          <span>Light</span>
                        </button>
                        <button
                          type='button'
                          onClick={() => setTheme('dark')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            theme === 'dark'
                              ? 'bg-background text-foreground shadow-xs font-bold border'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Moon className='h-3.5 w-3.5 text-sky-400' />
                          <span>Dark</span>
                        </button>
                        <button
                          type='button'
                          onClick={() => setTheme('system')}
                          className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                            theme === 'system'
                              ? 'bg-background text-foreground shadow-xs font-bold border'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Laptop className='h-3.5 w-3.5 text-slate-400' />
                          <span>System</span>
                        </button>
                      </div>
                    </div>

                    <div className='pt-2'>
                      <Button
                        variant='destructive'
                        onClick={handleLogout}
                        className='w-full h-9 text-xs font-bold gap-1.5'
                      >
                        <LogOut className='h-3.5 w-3.5' />
                        Sign Out
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className='shadow-lg border'>
                <CardHeader className='text-center pb-3'>
                  <div className='h-12 w-12 rounded-2xl bg-primary mx-auto flex items-center justify-center text-primary-foreground font-black text-lg mb-2 shadow-md'>
                    NP
                  </div>
                  <CardTitle className='text-lg font-bold'>
                    {authMode === 'login' ? 'Welcome to NetPack' : 'Create Customer Account'}
                  </CardTitle>
                  <CardDescription className='text-xs'>
                    Book consignments, schedule doorstep pickups, and track your global air freight.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  {/* Google 1-Click Sign-in Button */}
                  <Button
                    type='button'
                    variant='outline'
                    onClick={handleGoogleSignInClick}
                    disabled={authLoading}
                    className='w-full h-10 text-xs font-semibold flex items-center justify-center gap-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  >
                    <svg className='h-4 w-4' viewBox='0 0 24 24'>
                      <path
                        fill='#4285F4'
                        d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                      />
                      <path
                        fill='#34A853'
                        d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                      />
                      <path
                        fill='#FBBC05'
                        d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z'
                      />
                      <path
                        fill='#EA4335'
                        d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
                      />
                    </svg>
                    Continue with Google
                  </Button>

                  <div className='relative flex items-center justify-center'>
                    <div className='border-t w-full' />
                    <span className='bg-card px-2 text-[10px] text-muted-foreground uppercase tracking-wider relative'>
                      Or with email
                    </span>
                  </div>

                  {authMode === 'login' ? (
                    <form onSubmit={handleEmailLogin} className='space-y-3.5'>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold'>Email Address</label>
                        <Input
                          type='email'
                          placeholder='customer@example.com'
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          required
                          className='h-9 text-xs'
                        />
                      </div>
                      <div className='space-y-1.5'>
                        <label className='text-xs font-semibold'>Password</label>
                        <Input
                          type='password'
                          placeholder='••••••••'
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          required
                          className='h-9 text-xs'
                        />
                      </div>
                      <Button
                        type='submit'
                        disabled={authLoading}
                        className='w-full h-9 text-xs font-bold'
                      >
                        {authLoading ? <RefreshCw className='h-4 w-4 animate-spin' /> : 'Sign In'}
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleSignup} className='space-y-2.5'>
                      <div className='space-y-1'>
                        <label className='text-xs font-semibold'>Full Name *</label>
                        <Input
                          placeholder='Your full name'
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          required
                          className='h-8 text-xs'
                        />
                      </div>
                      <div className='space-y-1'>
                        <label className='text-xs font-semibold'>Email Address *</label>
                        <Input
                          type='email'
                          placeholder='name@domain.com'
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          required
                          className='h-8 text-xs'
                        />
                      </div>
                      <div className='space-y-1'>
                        <label className='text-xs font-semibold'>Phone Number *</label>
                        <Input
                          placeholder='+977 98...'
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value)}
                          required
                          className='h-8 text-xs'
                        />
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        <div className='space-y-1'>
                          <label className='text-xs font-semibold'>Password *</label>
                          <Input
                            type='password'
                            placeholder='Create password'
                            value={authPassword}
                            onChange={(e) => setAuthPassword(e.target.value)}
                            required
                            className='h-8 text-xs'
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-semibold'>Confirm Password *</label>
                          <Input
                            type='password'
                            placeholder='Confirm password'
                            value={authConfirmPassword}
                            onChange={(e) => setAuthConfirmPassword(e.target.value)}
                            required
                            className='h-8 text-xs'
                          />
                        </div>
                      </div>
                      <div className='space-y-1'>
                        <label className='text-xs font-semibold'>Pickup Address Line 1</label>
                        <Input
                          placeholder='Street, Ward, Area (e.g. Thamel)'
                          value={authAddress1}
                          onChange={(e) => setAuthAddress1(e.target.value)}
                          className='h-8 text-xs'
                        />
                      </div>
                      <div className='space-y-1'>
                        <label className='text-xs font-semibold'>Address Line 2 (Optional)</label>
                        <Input
                          placeholder='Apartment, landmark, suite'
                          value={authAddress2}
                          onChange={(e) => setAuthAddress2(e.target.value)}
                          className='h-8 text-xs'
                        />
                      </div>
                      <div className='grid grid-cols-2 gap-2'>
                        <div className='space-y-1'>
                          <label className='text-xs font-semibold'>City</label>
                          <Input
                            placeholder='Kathmandu'
                            value={authCity}
                            onChange={(e) => setAuthCity(e.target.value)}
                            className='h-8 text-xs'
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-semibold'>Postcode</label>
                          <Input
                            placeholder='44600'
                            value={authPostcode}
                            onChange={(e) => setAuthPostcode(e.target.value)}
                            className='h-8 text-xs'
                          />
                        </div>
                      </div>
                      <Button
                        type='submit'
                        disabled={authLoading}
                        className='w-full h-9 text-xs font-bold mt-2'
                      >
                        {authLoading ? <RefreshCw className='h-4 w-4 animate-spin' /> : 'Create Account'}
                      </Button>
                    </form>
                  )}

                  <div className='text-center pt-2'>
                    {authMode === 'login' ? (
                      <button
                        type='button'
                        onClick={() => setAuthMode('signup')}
                        className='text-xs text-primary font-semibold hover:underline'
                      >
                        Don't have an account? Sign Up
                      </button>
                    ) : (
                      <button
                        type='button'
                        onClick={() => setAuthMode('login')}
                        className='text-xs text-primary font-semibold hover:underline'
                      >
                        Already have an account? Sign In
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* ── Fixed Mobile-First Bottom Navigation Bar (3 Buttons - Logged-in Only) ── */}
      {customerToken && (
        <nav className='fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border px-4 py-2 shadow-lg max-w-md mx-auto'>
        <div className='flex items-center justify-around'>
          {/* Tab 1: Shipments */}
          <button
            type='button'
            onClick={() => setActiveTab('shipments')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'shipments' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className='h-5 w-5' />
            <span className='text-[10px] mt-0.5'>Shipments</span>
          </button>

          {/* Tab 2: Book / Create Consignment (Elevated Center Button) */}
          <button
            type='button'
            onClick={() => setActiveTab('book')}
            className='relative -top-3 flex flex-col items-center group'
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
              activeTab === 'book'
                ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}>
              <PlusCircle className='h-6 w-6' />
            </div>
            <span className={`text-[10px] font-bold mt-1 ${activeTab === 'book' ? 'text-primary' : 'text-muted-foreground'}`}>
              Book
            </span>
          </button>

          {/* Tab 3: Profile */}
          <button
            type='button'
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-colors ${
              activeTab === 'account' ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {customerToken && customerUser?.photoUrl ? (
              <div className={`h-5 w-5 rounded-full overflow-hidden border ${activeTab === 'account' ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
                <img
                  src={customerUser.photoUrl.startsWith('http') ? customerUser.photoUrl : `${API_BASE}${customerUser.photoUrl}`}
                  alt='Profile'
                  className='h-full w-full object-cover'
                />
              </div>
            ) : (
              <User className='h-5 w-5' />
            )}
            <span className='text-[10px] mt-0.5'>{customerToken ? 'Profile' : 'Login'}</span>
          </button>
        </div>
      </nav>
      )}

      {/* ── Google Verification & Profile Details Modal ── */}
      <Dialog open={googleModalOpen} onOpenChange={setGoogleModalOpen}>
        <DialogContent className='max-w-md'>
          {googleStep === 'verify' ? (
            <div>
              <DialogHeader className='text-center pb-2'>
                <div className='h-11 w-11 rounded-full border shadow-sm flex items-center justify-center mx-auto mb-2 bg-white'>
                  <svg className='h-6 w-6' viewBox='0 0 24 24'>
                    <path
                      fill='#4285F4'
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    />
                    <path
                      fill='#34A853'
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    />
                    <path
                      fill='#FBBC05'
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z'
                    />
                    <path
                      fill='#EA4335'
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
                    />
                  </svg>
                </div>
                <DialogTitle className='text-base font-bold'>Verify Google Account</DialogTitle>
                <DialogDescription className='text-xs'>
                  Enter your Google email to authenticate and link with NetPack Logistics.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleVerifyGoogleAccount} className='space-y-4 pt-2'>
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground'>Google Email Address</label>
                  <Input
                    type='email'
                    placeholder='yourname@gmail.com'
                    value={googleInputEmail}
                    onChange={(e) => setGoogleInputEmail(e.target.value)}
                    required
                    className='h-9 text-xs font-mono'
                    autoFocus
                  />
                  <p className='text-[10px] text-muted-foreground'>
                    We will verify this account with Google security services before proceeding.
                  </p>
                </div>

                <DialogFooter className='gap-2 sm:gap-0 pt-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setGoogleModalOpen(false)}
                    className='h-9 text-xs'
                  >
                    Cancel
                  </Button>
                  <Button
                    type='submit'
                    size='sm'
                    disabled={googleVerifying}
                    className='h-9 text-xs font-bold'
                  >
                    {googleVerifying ? <RefreshCw className='h-3.5 w-3.5 animate-spin mr-1.5' /> : null}
                    Verify Account
                  </Button>
                </DialogFooter>
              </form>
            </div>
          ) : (
            <div>
              <DialogHeader>
                <DialogTitle className='text-base font-bold flex items-center gap-2'>
                  Complete Delivery Profile
                </DialogTitle>
                <DialogDescription className='text-xs'>
                  Your Google account is verified. Please add your contact and address details for doorstep pickups.
                </DialogDescription>
              </DialogHeader>

              {/* Verified Account Card */}
              <div className='flex items-center gap-3 p-3 my-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs'>
                <div className='h-10 w-10 rounded-full overflow-hidden border-2 border-emerald-500 shrink-0 bg-white'>
                  <img
                    src={googleProfileData.photoUrl || 'https://lh3.googleusercontent.com/a/default-user=s96-c'}
                    alt='Google Avatar'
                    className='h-full w-full object-cover'
                  />
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-1.5'>
                    <span className='font-bold text-foreground truncate'>{googleProfileData.name}</span>
                    <span className='inline-flex items-center gap-0.5 text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full shrink-0'>
                      <Check className='h-2.5 w-2.5 stroke-[3]' /> Verified
                    </span>
                  </div>
                  <span className='text-[11px] text-muted-foreground font-mono truncate block'>
                    {googleProfileData.email}
                  </span>
                </div>
              </div>

              <form onSubmit={handleGoogleSubmit} className='space-y-3 text-xs'>
                <div className='space-y-1'>
                  <label className='font-semibold text-muted-foreground'>Phone Number *</label>
                  <Input
                    value={googleProfileData.phone}
                    onChange={(e) =>
                      setGoogleProfileData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    required
                    placeholder='+977 98...'
                    className='h-8 text-xs'
                  />
                </div>
                <div className='space-y-1'>
                  <label className='font-semibold text-muted-foreground'>Address Line 1 *</label>
                  <Input
                    value={googleProfileData.address1}
                    onChange={(e) =>
                      setGoogleProfileData((prev) => ({ ...prev, address1: e.target.value }))
                    }
                    required
                    placeholder='Street, Ward (e.g. Thamel, Ward 26)'
                    className='h-8 text-xs'
                  />
                </div>
                <div className='space-y-1'>
                  <label className='font-semibold text-muted-foreground'>Address Line 2 (Optional)</label>
                  <Input
                    value={googleProfileData.address2}
                    onChange={(e) =>
                      setGoogleProfileData((prev) => ({ ...prev, address2: e.target.value }))
                    }
                    placeholder='Apartment, suite, landmark'
                    className='h-8 text-xs'
                  />
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='space-y-1'>
                    <label className='font-semibold text-muted-foreground'>City *</label>
                    <Input
                      value={googleProfileData.city}
                      onChange={(e) =>
                        setGoogleProfileData((prev) => ({ ...prev, city: e.target.value }))
                      }
                      required
                      className='h-8 text-xs'
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='font-semibold text-muted-foreground'>State / Province</label>
                    <Input
                      value={googleProfileData.state}
                      onChange={(e) =>
                        setGoogleProfileData((prev) => ({ ...prev, state: e.target.value }))
                      }
                      placeholder='Bagmati Province'
                      className='h-8 text-xs'
                    />
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-2'>
                  <div className='space-y-1'>
                    <label className='font-semibold text-muted-foreground'>Postcode</label>
                    <Input
                      value={googleProfileData.postcode}
                      onChange={(e) =>
                        setGoogleProfileData((prev) => ({ ...prev, postcode: e.target.value }))
                      }
                      placeholder='44600'
                      className='h-8 text-xs'
                    />
                  </div>
                  <div className='space-y-1'>
                    <label className='font-semibold text-muted-foreground'>Country</label>
                    <select
                      value={googleProfileData.countryId || 1}
                      onChange={(e) =>
                        setGoogleProfileData((prev) => ({ ...prev, countryId: Number(e.target.value) }))
                      }
                      className='h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-xs focus:outline-none focus:ring-1 focus:ring-ring'
                    >
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <DialogFooter className='pt-2 gap-2 sm:gap-0'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setGoogleStep('verify')}
                    className='h-8 text-xs'
                  >
                    Back
                  </Button>
                  <Button
                    type='submit'
                    size='sm'
                    disabled={authLoading}
                    className='h-8 text-xs font-bold'
                  >
                    {authLoading ? <RefreshCw className='h-3.5 w-3.5 animate-spin mr-1' /> : null}
                    Complete & Continue
                  </Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Multi-Photo Lightbox Modal ── */}
      {selectedPhotoUrls.length > 0 && (
        <div
          className='fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in-50 duration-200'
          onClick={() => setSelectedPhotoUrls([])}
        >
          <div
            className='relative max-w-2xl w-full bg-background rounded-xl p-3 shadow-2xl overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex items-center justify-between pb-2 mb-2 border-b'>
              <div className='flex items-center gap-2'>
                <Scale className='h-4 w-4 text-primary' />
                <span className='text-xs font-bold text-foreground'>
                  Warehouse Weighing & Box Photo Proof ({selectedPhotoIndex + 1} of {selectedPhotoUrls.length})
                </span>
              </div>
              <Button
                size='icon'
                variant='ghost'
                className='h-7 w-7 rounded-full'
                onClick={() => setSelectedPhotoUrls([])}
              >
                <X className='h-4 w-4' />
              </Button>
            </div>

            {/* Main Active Image with Prev / Next Navigation */}
            <div className='relative overflow-hidden rounded-lg bg-black flex items-center justify-center max-h-[65vh] min-h-[250px]'>
              <img
                src={selectedPhotoUrls[selectedPhotoIndex]}
                alt={`Photo Proof ${selectedPhotoIndex + 1}`}
                className='max-h-[65vh] max-w-full object-contain'
              />

              {selectedPhotoUrls.length > 1 && (
                <>
                  <button
                    type='button'
                    onClick={() =>
                      setSelectedPhotoIndex((prev) =>
                        prev > 0 ? prev - 1 : selectedPhotoUrls.length - 1
                      )
                    }
                    className='absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors'
                  >
                    <ArrowLeft className='h-4 w-4' />
                  </button>
                  <button
                    type='button'
                    onClick={() =>
                      setSelectedPhotoIndex((prev) =>
                        prev < selectedPhotoUrls.length - 1 ? prev + 1 : 0
                      )
                    }
                    className='absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors'
                  >
                    <ArrowRight className='h-4 w-4' />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip for Multi-Photo Box Proofs */}
            {selectedPhotoUrls.length > 1 && (
              <div className='flex gap-2 pt-2 overflow-x-auto pb-1'>
                {selectedPhotoUrls.map((url, idx) => (
                  <button
                    key={idx}
                    type='button'
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative h-12 w-12 shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                      selectedPhotoIndex === idx
                        ? 'border-primary ring-2 ring-primary/40'
                        : 'border-border/50 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Thumb ${idx + 1}`}
                      className='h-full w-full object-cover'
                    />
                  </button>
                ))}
              </div>
            )}

            <div className='pt-2 flex justify-between items-center text-xs'>
              <span className='text-[10px] text-muted-foreground'>
                {selectedPhotoUrls.length > 1 ? `${selectedPhotoUrls.length} photos captured for boxes & scale` : '1 photo proof'}
              </span>
              <a
                href={selectedPhotoUrls[selectedPhotoIndex]}
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline'
              >
                Open Original Image
                <ExternalLink className='h-3.5 w-3.5' />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
