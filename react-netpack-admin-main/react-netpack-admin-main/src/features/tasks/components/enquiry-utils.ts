import { EnquiryFormData } from './enquiry-types'

export const calculateChargeableWeight = (
  length: number,
  breadth: number,
  height: number,
  actualWeight: number
): number => {
  const volWeight = (Number(length) * Number(breadth) * Number(height)) / 5000
  const rawCW = Math.max(volWeight, Number(actualWeight))
  if (rawCW <= 0) return 0
  if (rawCW < 10) {
    return Math.ceil(rawCW * 2) / 2
  }
  return Math.ceil(rawCW)
}

export const buildEnquiryPayload = (data: EnquiryFormData) => {
  const totalWeight =
    data.boxes && data.boxes.length > 0
      ? data.boxes.reduce((sum, box) => {
          const cw = calculateChargeableWeight(
            box.length || 0,
            box.breadth || 0,
            box.height || 0,
            box.weight || 0
          )
          return sum + cw
        }, 0)
      : data.weight || 0

  let pickupLocations: { location: string; phoneNumber?: string; note?: string }[] = []
  if (data.handoverType === 'SELF_DROP') {
    pickupLocations = []
  } else if (data.pickupLocation && data.pickupLocation.trim()) {
    const noteArr = [
      data.pickupTime?.trim() ? `Time: ${data.pickupTime.trim()}` : null,
      data.pickupNote?.trim() || null,
    ].filter(Boolean)

    pickupLocations = [
      {
        location: data.pickupLocation.trim(),
        phoneNumber: data.pickupPhone?.trim() || data.sender?.telephone || '',
        note: noteArr.join(' | ') || undefined,
      },
    ]
  } else if (data.pickupLocations && data.pickupLocations.length > 0) {
    pickupLocations = data.pickupLocations.map((pl) => ({
      location: pl.location,
      phoneNumber: pl.phoneNumber,
      note: pl.note,
    }))
  }

  return {
    sender: {
      name: data.sender.name,
      addressLine1: data.sender.addressLine1,
      addressLine2: data.sender.addressLine2,
      city: data.sender.city,
      postcode: data.sender.postcode,
      country: data.sender.country,
      telephone: data.sender.telephone,
      customerId: data.sender.customerId,
    },
    receiver: {
      companyName: data.receiver.companyName,
      name: data.receiver.name,
      addressLine1: data.receiver.addressLine1,
      addressLine2: data.receiver.addressLine2,
      city: data.receiver.city,
      state: data.receiver.state,
      postcode: data.receiver.postcode,
      location: data.receiver.location,
      country: data.receiver.country,
      telephone: data.receiver.telephone,
      email: data.receiver.email,
    },
    items: data.items.map((item) => ({
      description: item.description,
      weight: parseFloat(item.weight) || 0,
      value: parseFloat(item.value) || 0,
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.unitPrice) || 0,
      hsCode: item.hsCode,
    })),
    destinationCountryId: data.destinationCountryId,
    destinationLocation: data.destinationLocation,
    noOfBox: data.noOfBox,
    weight: totalWeight,
    status: data.status,
    estimatedRate: data.estimatedRate,
    finalRate: data.finalRate,
    boxes: (data.boxes || []).map((box) => ({
      length: box.length,
      breadth: box.breadth,
      height: box.height,
      weight: box.weight,
      value: box.value,
      quantity: box.quantity,
      multiplier: box.multiplier,
      itemSelections: (box.itemSelections || []).map((sel) => ({
        itemId: sel.itemId,
        quantity: sel.quantity,
      })),
    })),
    pickupLocations,
  }
}

export const isFormValid = (formData: EnquiryFormData | null) =>
  formData &&
  // Sender - All required except addressLine2
  formData.sender.name &&
  formData.sender.addressLine1 &&
  formData.sender.city &&
  formData.sender.postcode &&
  formData.sender.country &&
  formData.sender.telephone &&
  // Receiver - All except email & companyName & addressLine2 required
  formData.receiver.name &&
  formData.receiver.addressLine1 &&
  formData.receiver.city &&
  formData.receiver.state &&
  formData.receiver.postcode &&
  formData.receiver.country &&
  formData.receiver.telephone &&
  formData.items.some(
    (item) => item.description && item.unitPrice && item.quantity
  ) &&
  (!formData.boxes ||
    formData.boxes.length === 0 ||
    formData.boxes.every(
      (box) =>
        box.length > 0 &&
        box.breadth > 0 &&
        box.height > 0 &&
        box.weight > 0 &&
        box.itemSelections &&
        box.itemSelections.length > 0
    )) &&
  (formData.handoverType === 'SELF_DROP' || !formData.handoverType || !!formData.pickupLocation?.trim())

export interface FormErrors {
  senderName?: boolean
  senderAddressLine1?: boolean
  senderAddressLine2?: boolean
  senderCity?: boolean
  senderPostcode?: boolean
  senderCountry?: boolean
  senderTelephone?: boolean
  receiverName?: boolean
  receiverAddressLine1?: boolean
  receiverAddressLine2?: boolean
  receiverCity?: boolean
  receiverState?: boolean
  receiverPostcode?: boolean
  receiverCountry?: boolean
  receiverTelephone?: boolean
  pickupLocation?: boolean
  itemErrors: boolean[] // Track which items have errors
  boxErrors?: {
    length?: boolean
    breadth?: boolean
    height?: boolean
    weight?: boolean
    itemSelections?: boolean
  }[]
}

export const getFormErrors = (formData: EnquiryFormData | null): FormErrors => {
  const errors: FormErrors = {
    itemErrors: [],
    boxErrors: [],
  }

  if (!formData) return errors

  // Sender Validation
  if (!formData.sender.name?.trim()) errors.senderName = true
  if (!formData.sender.addressLine1?.trim()) errors.senderAddressLine1 = true
  // Address Line 2 is optional for sender
  if (!formData.sender.city?.trim()) errors.senderCity = true
  if (!formData.sender.postcode?.trim()) errors.senderPostcode = true
  if (!formData.sender.country?.trim()) errors.senderCountry = true
  if (!formData.sender.telephone?.trim()) errors.senderTelephone = true

  // Receiver Validation
  if (!formData.receiver.name?.trim()) errors.receiverName = true
  if (!formData.receiver.addressLine1?.trim())
    errors.receiverAddressLine1 = true
  // Address Line 2 is optional for receiver
  if (!formData.receiver.city?.trim()) errors.receiverCity = true
  if (!formData.receiver.state?.trim()) errors.receiverState = true
  if (!formData.receiver.postcode?.trim()) errors.receiverPostcode = true
  if (!formData.receiver.country?.trim()) errors.receiverCountry = true
  if (!formData.receiver.telephone?.trim()) errors.receiverTelephone = true

  // Pickup Location Validation (if pickup is selected)
  if (formData.handoverType !== 'SELF_DROP' && !formData.pickupLocation?.trim()) {
    errors.pickupLocation = true
  }

  // Check items - each item needs description, unitPrice, and quantity
  errors.itemErrors = formData.items.map(
    (item) =>
      !item.description?.trim() ||
      !item.unitPrice?.toString().trim() ||
      !item.quantity?.toString().trim()
  )

  // Validate boxes
  if (formData.boxes && formData.boxes.length > 0) {
    errors.boxErrors = formData.boxes.map((box) => ({
      length: !box.length,
      breadth: !box.breadth,
      height: !box.height,
      weight: !box.weight,
      itemSelections: !box.itemSelections || box.itemSelections.length === 0,
    }))
  }

  return errors
}

export const createEmptyItem = () => ({
  description: '',
  weight: '',
  value: '',
  quantity: '',
  unitPrice: '',
  currency: '',
  hsCode: '',
  totalValue: '',
})

export const createEmptyBox = () => ({
  itemSelections: [],
  quantity: 1,
  weight: 0,
  value: 0,
  length: 0,
  breadth: 0,
  height: 0,
  multiplier: 1,
})

export const createEmptyFormData = (): EnquiryFormData => ({
  sender: {
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postcode: '',
    country: 'Nepal',
    telephone: '',
  },
  receiver: {
    companyName: '',
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postcode: '',
    location: '',
    country: '',
    telephone: '',
    email: '',
  },
  items: [createEmptyItem()],
  destinationCountryId: '',
  destinationLocation: '',
  noOfBox: 0,
  weight: 0,
  status: '',
  estimatedRate: 0,
  finalRate: 0,
  boxes: [],
  handoverType: 'PICKUP',
  pickupLocation: '',
  pickupPhone: '',
  pickupTime: '',
  pickupNote: '',
  pickupLocations: [],
})

export interface AddressValidationResult {
  isValid: boolean
  warning?: string
  suggestion?: string
}

export const validateAddressDetails = (info: {
  addressLine1?: string
  city?: string
  state?: string
  postcode?: string
  country?: string
}): AddressValidationResult => {
  const addr1 = (info.addressLine1 || '').trim()
  const postcode = (info.postcode || '').trim()
  const country = (info.country || '').trim().toLowerCase()

  // 1. Street Address Completeness
  if (addr1 && addr1.length > 0 && addr1.length < 5) {
    return {
      isValid: false,
      warning: 'Address Line 1 appears incomplete or too short.',
      suggestion: 'Please provide full street name and house/building number.',
    }
  }

  // 2. Postal Code formats based on destination country
  if (postcode && country) {
    if (country.includes('united states') || country === 'usa' || country === 'us') {
      const usZipRegex = /^\d{5}(-\d{4})?$/
      if (!usZipRegex.test(postcode)) {
        return {
          isValid: false,
          warning: `Invalid US ZIP Code format: "${postcode}".`,
          suggestion: 'Expected 5-digit ZIP (e.g., 90210) or ZIP+4 (e.g., 90210-1234).',
        }
      }
    } else if (country.includes('united kingdom') || country === 'uk' || country === 'great britain') {
      const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i
      if (!ukPostcodeRegex.test(postcode)) {
        return {
          isValid: false,
          warning: `Invalid UK Postal Code format: "${postcode}".`,
          suggestion: 'Expected standard UK format (e.g., SW1A 1AA or EC1A 1BB).',
        }
      }
    } else if (country.includes('australia')) {
      const auPostcodeRegex = /^\d{4}$/
      if (!auPostcodeRegex.test(postcode)) {
        return {
          isValid: false,
          warning: `Invalid Australian Postcode: "${postcode}".`,
          suggestion: 'Expected exactly 4 numeric digits (e.g., 2000, 3000).',
        }
      }
    } else if (country.includes('canada')) {
      const caPostcodeRegex = /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i
      if (!caPostcodeRegex.test(postcode)) {
        return {
          isValid: false,
          warning: `Invalid Canadian Postal Code: "${postcode}".`,
          suggestion: 'Expected Canadian format A1A 1A1 (e.g., K1A 0B1).',
        }
      }
    } else if (country.includes('india')) {
      const inPinRegex = /^\d{6}$/
      if (!inPinRegex.test(postcode)) {
        return {
          isValid: false,
          warning: `Invalid Indian PIN code: "${postcode}".`,
          suggestion: 'Expected exactly 6 numeric digits (e.g., 110001).',
        }
      }
    }
  }

  return { isValid: true }
}

