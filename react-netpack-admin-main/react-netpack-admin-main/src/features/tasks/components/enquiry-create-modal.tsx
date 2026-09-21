'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Customer } from '@/type/customer'
import { toast } from 'sonner'
import {
  getUserRole,
  validateTokenWithServer,
  getToken,
  getUserId,
} from '@/lib/auth'
import http from '@/utils/http'
import {
  ENQUIRY_ENDPOINTS,
  LOCATION_ENDPOINT,
  USER_ENDPOINTS,
} from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  IconTruckDelivery,
  IconPackage,
  IconMapPin,
  IconClock,
  IconNotes,
  IconPhone,
} from '@tabler/icons-react'
import { BoxesSection } from './boxes-section'
import { EnquiryFormData } from './enquiry-types'
import {
  buildEnquiryPayload,
  isFormValid,
  createEmptyFormData,
  getFormErrors,
  calculateChargeableWeight,
  FormErrors,
} from './enquiry-utils'
import { ItemTable } from './item-table'
import { ReceiverSection } from './receiver-section'
import { SenderSection } from './sender-section'

interface ItemRow {
  description: string
  weight: string
  value: string
  quantity: string
  unitPrice: string
  hsCode: string
  totalValue: string
  currency: string // Remove the ? to make it required
}

interface Box {
  length: number
  breadth: number
  height: number
  weight: number
  value: number
  quantity: number
  multiplier: number
  itemSelections: { itemId: string; quantity: number }[]
}

interface Props {
  open: boolean
  onClose: () => void
  selectedEnquiries: Array<{ id: string }>
  initialData?: EnquiryFormData | null
  onEnquiryCreated?: () => void
  onCreateCustomer?: () => void
}

// Main Component
export function EnquiryModalForm({
  open,
  onClose,
  selectedEnquiries,
  initialData = null,
  onEnquiryCreated,
  onCreateCustomer,
}: Props) {
  const [formData, setFormData] = useState<EnquiryFormData | null>(null)
  const [countries, setCountries] = useState<any[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [senderSearchOpen, setSenderSearchOpen] = useState(false)
  const [senderSearchValue, setSenderSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  const [errors, setErrors] = useState<FormErrors>({
    itemErrors: [],
    boxErrors: [],
  })
  const [canEdit, setCanEdit] = useState(true)
  const [sameAsSender, setSameAsSender] = useState(false)
  const prevReceiverRef = useRef<any>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    http
      .get<any>(LOCATION_ENDPOINT.GET_ALL_LOCATION)
      .then((data) => setCountries(data.data))
      .catch((error) => console.error('Error fetching countries:', error))

    // Get user role
    const role = getUserRole()
    if (role) {
      setUserRole(role)
    }
  }, [])

  // Fetch customers when modal opens
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      fetchCustomers()
      // Refresh user role when popover opens
      const role = getUserRole()
      setUserRole(role || '')
      document.body.style.overflow = ''
    }
  }, [open])

  // Refresh user role when sender search popover opens
  useEffect(() => {
    const token = getToken()

    if (token) {
      validateTokenWithServer(token)
    }
  })

  const fetchCustomers = async () => {
    try {
      const response = await http.get<{ data: Customer[] }>(
        USER_ENDPOINTS.GET_ALL_CUSTOMER
      )
      if (response?.data) {
        setCustomers(response.data)
        setFilteredCustomers(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error)
    }
  }

  const searchCustomers = async (search: string) => {
    if (!search.trim()) {
      setFilteredCustomers(customers)
      return
    }

    try {
      // Search customers by name, email, or phone
      const response = await http.get<{ data: Customer[] }>(
        `${USER_ENDPOINTS.GET_ALL_CUSTOMER}?search=${encodeURIComponent(search)}`
      )
      if (response?.data) {
        setFilteredCustomers(response.data)
      }
    } catch (error) {
      console.error('Failed to search customers:', error)
      // Fallback to local filtering
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(search.toLowerCase()) ||
          customer.email.toLowerCase().includes(search.toLowerCase()) ||
          (customer.phone &&
            customer.phone.toLowerCase().includes(search.toLowerCase()))
      )
      setFilteredCustomers(filtered)
    } finally {
    }
  }

  const handleSenderSearch = (search: string) => {
    setSenderSearchValue(search)
    // Don't do local filtering here - let searchCustomers handle it via API
    // Only reset to all customers if search is empty
    if (!search) {
      setFilteredCustomers(customers)
    }
  }

  const handleSameAsSenderChange = (checked: boolean) => {
    setSameAsSender(checked)
    if (!formData) return

    if (checked) {
      // Save current receiver to restore if toggled off
      prevReceiverRef.current = { ...formData.receiver }

      // Try finding customer for organizationName or email
      const customer = customers.find(
        (c) =>
          (formData.sender.customerId && c.id === formData.sender.customerId) ||
          (formData.sender.name &&
            c.name.toLowerCase() === formData.sender.name.toLowerCase())
      )

      const senderCountry = formData.sender.country || 'Nepal'
      const countryObj = countries.find(
        (c) => c.name.toLowerCase() === senderCountry.toLowerCase()
      )

      setFormData((prev) => {
        if (!prev) return prev
        const s = prev.sender
        return {
          ...prev,
          destinationCountryId: countryObj
            ? String(countryObj.id)
            : prev.destinationCountryId,
          receiver: {
            ...prev.receiver,
            name: s.name || '',
            companyName:
              customer?.isOrganization && customer.organizationName
                ? customer.organizationName
                : prev.receiver.companyName || s.name || '',
            addressLine1: s.addressLine1 || '',
            addressLine2: s.addressLine2 || '',
            city: s.city || '',
            state: prev.receiver.state || s.city || '',
            postcode: s.postcode || '',
            country: s.country || 'Nepal',
            telephone: s.telephone || '',
            email: customer?.email || prev.receiver.email || '',
          },
        }
      })
    } else {
      if (prevReceiverRef.current) {
        setFormData((prev) =>
          prev ? { ...prev, receiver: prevReceiverRef.current! } : prev
        )
      }
    }
  }

  const handleCustomerSelect = (customer: Customer) => {
    setFormData((prev) => {
      if (!prev) return prev

      const countryName = customer.countryId
        ? getCountryName(customer.countryId)
        : 'Nepal'

      const updatedSender = {
        ...prev.sender,
        name: customer.name,
        addressLine1: customer.address1 || '',
        addressLine2: customer.address2 || '',
        city: customer.city || '',
        postcode: customer.postcode || '',
        country: countryName,
        telephone: customer.phone || '',
        customerId: customer.id,
      }

      let updatedReceiver = prev.receiver
      let destCountryId = prev.destinationCountryId

      if (sameAsSender) {
        updatedReceiver = {
          ...prev.receiver,
          name: updatedSender.name,
          companyName:
            customer.isOrganization && customer.organizationName
              ? customer.organizationName
              : updatedSender.name,
          addressLine1: updatedSender.addressLine1,
          addressLine2: updatedSender.addressLine2,
          city: updatedSender.city,
          state: prev.receiver.state || updatedSender.city || '',
          postcode: updatedSender.postcode,
          country: updatedSender.country,
          telephone: updatedSender.telephone,
          email: customer.email || prev.receiver.email || '',
        }
        if (customer.countryId) {
          destCountryId = String(customer.countryId)
        }
      }

      return {
        ...prev,
        sender: updatedSender,
        receiver: updatedReceiver,
        destinationCountryId: destCountryId,
      }
    })
    setSenderSearchOpen(false)
    setSenderSearchValue('')
  }

  const getCountryName = (countryId: number): string => {
    const country = countries.find((c) => c.id === countryId)
    return country ? country.name : ''
  }

  const handleSelfDetailSelect = useCallback(async () => {
    const userId = getUserId()
    if (!userId) {
      toast.error('User session not found')
      return
    }

    try {
      const res = await http.get<{ admin: any }>(
        USER_ENDPOINTS.GET_USER(userId)
      )
      if (res && res.admin) {
        const admin = res.admin

        // Check if any required sender field is missing
        const isIncomplete =
          !admin.fullName ||
          !admin.phoneNumber ||
          !admin.address1 ||
          !admin.city ||
          !admin.postcode ||
          !admin.countryId

        if (isIncomplete) {
          // Fire a custom event so ProfileDropdown opens the "Complete Profile" dialog
          window.dispatchEvent(
            new CustomEvent('open-profile-settings', {
              detail: { incomplete: true },
            })
          )
          toast.error(
            'Please complete your profile before creating an enquiry.'
          )
          return
        }

        setFormData((prev) => {
          if (!prev) return prev

          const countryName = admin.countryId
            ? getCountryName(admin.countryId)
            : 'Nepal'

          const updatedSender = {
            ...prev.sender,
            name: admin.fullName || '',
            addressLine1: admin.address1 || '',
            addressLine2: admin.address2 || '',
            city: admin.city || '',
            postcode: admin.postcode || '',
            country: countryName,
            telephone: admin.phoneNumber || '',
            customerId: admin.customerId || admin.customer?.id || '',
          }

          let updatedReceiver = prev.receiver
          let destCountryId = prev.destinationCountryId

          if (sameAsSender) {
            updatedReceiver = {
              ...prev.receiver,
              name: updatedSender.name,
              companyName: updatedSender.name,
              addressLine1: updatedSender.addressLine1,
              addressLine2: updatedSender.addressLine2,
              city: updatedSender.city,
              state: prev.receiver.state || updatedSender.city || '',
              postcode: updatedSender.postcode,
              country: updatedSender.country,
              telephone: updatedSender.telephone,
              email: admin.email || prev.receiver.email || '',
            }
            if (admin.countryId) {
              destCountryId = String(admin.countryId)
            }
          }

          return {
            ...prev,
            sender: updatedSender,
            receiver: updatedReceiver,
            destinationCountryId: destCountryId,
          }
        })
        toast.success('Fields filled with your details', { duration: 1000 })
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch your details')
    }
  }, [countries, sameAsSender])

  const handleCreateCustomer = () => {
    setSenderSearchOpen(false)
    if (onCreateCustomer) {
      onCreateCustomer()
    }
  }

  useEffect(() => {
    const fetchEnquiryById = async (id: string) => {
      try {
        const res = await http.get<any>(
          `${ENQUIRY_ENDPOINTS.GET_BY_ID_ENQUIRY}/${id}`
        )
        const data = res

        // Prioritize currency from API: data.currency first, then item.currency, then default to USD
        const apiCurrency = data.currency || data.items?.[0]?.currency || 'USD'

        const parsedItems: ItemRow[] =
          Array.isArray(data.items) && data.items.length > 0
            ? data.items.map((item: any) => ({
                description: item.description || '',
                weight: item.weight?.toString() || '',
                value: item.value?.toString() || '',
                quantity: item.quantity?.toString() || '',
                unitPrice: item.unitPrice?.toString() || '',
                hsCode: item.hsCode || '',
                totalValue: (
                  parseFloat(item.value || 0) * parseFloat(item.quantity || 0)
                ).toFixed(2),
                // Use API currency (data.currency) first, then item currency, then default to USD
                // All items use the same currency from API
                currency: apiCurrency,
              }))
            : [
                {
                  description: '',
                  weight: '',
                  value: '',
                  quantity: '',
                  unitPrice: '',
                  hsCode: '',
                  totalValue: '',
                  currency: apiCurrency, // Use API currency even for empty items
                } as ItemRow,
              ]

        // Parse boxes for edit mode
        const parsedBoxes: Box[] =
          Array.isArray(data.boxes) && data.boxes.length > 0
            ? data.boxes.map((box: any) => ({
                length: box.length || 0,
                breadth: box.breadth || 0,
                height: box.height || 0,
                weight: box.weight || 0,
                value: box.value || 0,
                quantity: box.quantity || 0,
                multiplier: box.multiplier || 1,
                // Map box.items to itemSelections using the index of the item in parsedItems
                itemSelections: Array.isArray(box.items)
                  ? box.items.map((boxItem: any) => {
                      // Find the index of the item in parsedItems that matches boxItem.enquiryItemId
                      const itemId = parsedItems.findIndex(
                        (item: any) =>
                          item.description ===
                            boxItem.enquiryItem?.description &&
                          parseFloat(item.weight) ===
                            boxItem.enquiryItem?.weight &&
                          parseFloat(item.value) ===
                            boxItem.enquiryItem?.value &&
                          parseFloat(item.quantity) ===
                            boxItem.enquiryItem?.quantity &&
                          parseFloat(item.unitPrice) ===
                            boxItem.enquiryItem?.unitPrice &&
                          item.hsCode === boxItem.enquiryItem?.hsCode
                      )
                      return {
                        itemId: itemId !== -1 ? String(itemId) : '0',
                        quantity: boxItem.quantity || 0,
                      }
                    })
                  : [],
              }))
            : []

        setFormData({
          id: data.id || id, // Include the ID for edit mode
          sender: {
            name: data.senderName || '',
            addressLine1: data.senderAddressLine1 || '',
            addressLine2: data.senderAddressLine2 || '',
            city: data.senderCity || '',
            postcode: data.senderPostcode || '',
            country: data.senderCountry || 'Nepal',
            telephone: data.senderPhone || '',
            customerId: data.customerId || '',
          },
          receiver: {
            name: data.receiverName || '',
            companyName: data.receiverCompanyName || '',
            addressLine1: data.receiverAddressLine1 || '',
            addressLine2: data.receiverAddressLine2 || '',
            city: data.receiverCity || '',
            state: data.receiverState || '',
            postcode: data.receiverPostcode || '',
            location: '',
            country: data.receiverCountry || '',
            telephone: data.receiverTelephone || '',
            email: data.receiverEmail || '',
          },
          items: parsedItems as any, // Cast to any to satisfy EnquiryFormData structure from external file
          destinationCountryId: data.destinationCountry?.toString() || '',
          destinationLocation: data.destinationLocation || '',
          noOfBox: data.noOfBox || 0,
          weight: data.weight || 0,
          status: data.status || '',
          estimatedRate: data.estimatedRate || 0,
          finalRate: data.finalRate || 0,
          boxes: parsedBoxes as any, // Cast to any
          handoverType:
            data.pickupLocations && data.pickupLocations.length > 0
              ? 'PICKUP'
              : data.pickupLocations && data.pickupLocations.length === 0 && data.id
                ? 'SELF_DROP'
                : 'PICKUP',
          pickupLocation:
            data.pickupLocations && data.pickupLocations[0]?.location
              ? data.pickupLocations[0].location
              : '',
          pickupPhone:
            data.pickupLocations && data.pickupLocations[0]?.phoneNumber
              ? data.pickupLocations[0].phoneNumber
              : '',
          pickupNote: (() => {
            const rawNote = data.pickupLocations && data.pickupLocations[0]?.note ? data.pickupLocations[0].note : ''
            if (rawNote.includes('Time:')) {
              return rawNote.split('|').filter((p: string) => !p.trim().startsWith('Time:')).join('|').trim()
            }
            return rawNote
          })(),
          pickupTime: (() => {
            const rawNote = data.pickupLocations && data.pickupLocations[0]?.note ? data.pickupLocations[0].note : ''
            if (rawNote.includes('Time:')) {
              const timePart = rawNote.split('|').find((p: string) => p.trim().startsWith('Time:'))
              return timePart ? timePart.replace('Time:', '').trim() : ''
            }
            return ''
          })(),
          pickupLocations: data.pickupLocations || [],
        })
      } catch (err) {
        console.error('Failed to fetch enquiry by ID:', err)
      }
    }

    if (open && selectedEnquiries.length > 0 && !initialData) {
      fetchEnquiryById(selectedEnquiries[0].id)
    }

    if (open && selectedEnquiries.length === 0 && !initialData) {
      // Ensure default state has currency set on the first item
      const emptyData = createEmptyFormData()
      if (emptyData.items.length > 0) {
        emptyData.items[0] = {
          ...emptyData.items[0],
          currency: 'USD',
        } as any
      }
      setFormData(emptyData)
      setCanEdit(true) // Always allow editing on new enquiries
    }

    // Handle initialData if provided directly
    if (open && initialData) {
      const pl =
        initialData.pickupLocations && initialData.pickupLocations.length > 0
          ? initialData.pickupLocations[0]
          : null
      setFormData({
        ...initialData,
        handoverType: initialData.handoverType || (pl ? 'PICKUP' : 'PICKUP'),
        pickupLocation: initialData.pickupLocation || pl?.location || '',
        pickupPhone: initialData.pickupPhone || pl?.phoneNumber || '',
        pickupNote: initialData.pickupNote || pl?.note || '',
        pickupTime: initialData.pickupTime || '',
      })
    }
  }, [open, selectedEnquiries, initialData])

  // Automatically update total weight whenever boxes change
  useEffect(() => {
    if (!formData?.boxes || formData.boxes.length === 0) {
      if (formData && formData.weight !== 0) {
        setFormData((prev) => (prev ? { ...prev, weight: 0 } : null))
      }
      return
    }

    const totalCW = formData.boxes.reduce((sum, box) => {
      const cw = calculateChargeableWeight(
        box.length || 0,
        box.breadth || 0,
        box.height || 0,
        box.weight || 0
      )
      return sum + cw
    }, 0)

    if (formData.weight !== totalCW) {
      setFormData((prev) => (prev ? { ...prev, weight: totalCW } : null))
    }
  }, [formData?.boxes])

  // Reset or detect sameAsSender state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSameAsSender(false)
      prevReceiverRef.current = null
    }
  }, [open])

  useEffect(() => {
    if (formData?.sender && formData?.receiver && open) {
      const isMatch =
        !!formData.sender.name &&
        formData.sender.name === formData.receiver.name &&
        formData.sender.addressLine1 === formData.receiver.addressLine1 &&
        formData.sender.country === formData.receiver.country &&
        formData.sender.telephone === formData.receiver.telephone
      if (isMatch) {
        setSameAsSender(true)
      }
    }
  }, [formData?.id, open])

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } },
    type: 'sender' | 'receiver' | 'items',
    index?: number
  ) => {
    const { name, value } = e.target

    setFormData((prev) => {
      if (!prev) return prev

      if (type === 'sender') {
        const updatedSender = {
          ...prev.sender,
          [name]: value,
        }
        let updatedReceiver = prev.receiver
        let destCountryId = prev.destinationCountryId

        if (sameAsSender) {
          if (name === 'name') {
            updatedReceiver = {
              ...updatedReceiver,
              name: value,
              companyName: updatedReceiver.companyName || value,
            }
          } else if (name === 'addressLine1') {
            updatedReceiver = { ...updatedReceiver, addressLine1: value }
          } else if (name === 'addressLine2') {
            updatedReceiver = { ...updatedReceiver, addressLine2: value }
          } else if (name === 'city') {
            updatedReceiver = {
              ...updatedReceiver,
              city: value,
              state: updatedReceiver.state || value,
            }
          } else if (name === 'postcode') {
            updatedReceiver = { ...updatedReceiver, postcode: value }
          } else if (name === 'country') {
            updatedReceiver = { ...updatedReceiver, country: value }
            const countryObj = countries.find(
              (c) => c.name.toLowerCase() === value.toLowerCase()
            )
            if (countryObj) {
              destCountryId = String(countryObj.id)
            }
          } else if (name === 'telephone') {
            updatedReceiver = { ...updatedReceiver, telephone: value }
          }
        }

        return {
          ...prev,
          sender: updatedSender,
          receiver: updatedReceiver,
          destinationCountryId: destCountryId,
        }
      } else if (type === 'receiver') {
        if (sameAsSender) {
          const syncedSenderFields: Record<string, string | undefined> = {
            name: prev.sender.name,
            addressLine1: prev.sender.addressLine1,
            addressLine2: prev.sender.addressLine2,
            city: prev.sender.city,
            postcode: prev.sender.postcode,
            country: prev.sender.country,
            telephone: prev.sender.telephone,
          }
          if (name in syncedSenderFields && syncedSenderFields[name] !== value) {
            setSameAsSender(false)
          }
        }

        const countryObj =
          name === 'country'
            ? countries.find((c) => c.name.toLowerCase() === value.toLowerCase())
            : null

        return {
          ...prev,
          destinationCountryId: countryObj
            ? String(countryObj.id)
            : prev.destinationCountryId,
          receiver: {
            ...prev.receiver,
            [name]: value,
          },
        }
      } else if (type === 'items' && typeof index === 'number') {
        const newItems = [...prev.items]

        // Preserve currency on the first item if it exists
        const currentCurrency =
          index === 0 ? (newItems[0] as ItemRow).currency : undefined

        newItems[index] = {
          ...newItems[index],
          [name]: value,
        } as ItemRow

        // Re-apply currency if we are modifying the first item
        if (index === 0 && currentCurrency) {
          ;(newItems[0] as ItemRow).currency = currentCurrency
        }

        // Recalculate total value
        const weight = parseFloat(newItems[index].weight) || 0
        const quantity = parseFloat(newItems[index].quantity) || 0
        newItems[index].totalValue = (weight * quantity).toFixed(2)

        return {
          ...prev,
          items: newItems as any,
        }
      }

      return prev
    })
  }

  const handleTotalCurrencyChange = (value: string) => {
    setFormData((prev) => {
      if (!prev || prev.items.length === 0) return prev

      const newItems = [...prev.items]
      // Use the explicit ItemRow type
      newItems[0] = {
        ...(newItems[0] as ItemRow),
        currency: value,
      } as ItemRow
      return {
        ...prev,
        items: newItems as any,
      }
    })
  }

  // Determine if we are editing or creating
  const isEditMode = !!(formData && (formData as any).id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid(formData)) {
      const formErrors = getFormErrors(formData)
      setErrors(formErrors)
      toast.error('Please fill in all required fields', { duration: 3000 })

      // Scroll to first error
      setTimeout(() => {
        const errorIds: string[] = []
        if (formErrors.senderName) errorIds.push('sender-name')
        if (formErrors.senderAddressLine1) errorIds.push('sender-address1')
        if (formErrors.senderAddressLine2) errorIds.push('sender-address2')
        if (formErrors.senderCity) errorIds.push('sender-city')
        if (formErrors.senderPostcode) errorIds.push('sender-postcode')
        if (formErrors.senderCountry) errorIds.push('sender-country')
        if (formErrors.senderTelephone) errorIds.push('sender-telephone')

        if (formErrors.receiverName) errorIds.push('receiver-name')
        if (formErrors.receiverAddressLine1) errorIds.push('receiver-address1')
        if (formErrors.receiverAddressLine2) errorIds.push('receiver-address2')
        if (formErrors.receiverCity) errorIds.push('receiver-city')
        if (formErrors.receiverState) errorIds.push('receiver-state')
        if (formErrors.receiverPostcode) errorIds.push('receiver-postcode')
        if (formErrors.receiverCountry) errorIds.push('receiver-country')
        if (formErrors.receiverTelephone) errorIds.push('receiver-telephone')
        if (formErrors.pickupLocation) errorIds.push('pickup-location')

        formErrors.itemErrors.forEach((hasError, index) => {
          if (hasError) {
            const item = formData?.items[index]
            if (!item?.description?.trim())
              errorIds.push(`item-${index}-description`)
            if (!item?.quantity?.trim()) errorIds.push(`item-${index}-quantity`)
            if (!item?.unitPrice?.trim())
              errorIds.push(`item-${index}-unitPrice`)
          }
        })

        // Add box errors to scroll list
        formErrors.boxErrors?.forEach((boxError, index) => {
          if (
            boxError.length ||
            boxError.breadth ||
            boxError.height ||
            boxError.weight ||
            boxError.itemSelections
          ) {
            // Scroll to the first missing dimension/selection in the box
            if (boxError.length) errorIds.push(`box-${index}-length`)
            else if (boxError.breadth) errorIds.push(`box-${index}-breadth`)
            else if (boxError.height) errorIds.push(`box-${index}-height`)
            else if (boxError.weight) errorIds.push(`box-${index}-weight`)
            // No specific ID for itemSelections but it's in the same box container
          }
        })

        if (errorIds.length > 0) {
          const firstErrorId = errorIds[0]
          const element = document.getElementById(firstErrorId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.focus()
          }
        }
      }, 100)
      return
    }

    setErrors({ itemErrors: [], boxErrors: [] })
    setLoading(true)
    try {
      // 1. Get the base payload from the utility function
      const basePayload = buildEnquiryPayload(formData!)

      // 2. Extract the overall currency from the first item
      const currencyValue = (formData!.items[0] as ItemRow).currency || 'USD'

      // 3. FIX: Create the final payload by adding the currency as a top-level field
      const finalPayload = {
        ...basePayload,
        currency: currencyValue, // 👈 ENSURING CURRENCY IS ADDED HERE
      }

      if (isEditMode) {
        const enquiryId = (formData as any).id
        await http.put(
          `${ENQUIRY_ENDPOINTS.UPDATE_ENQUIRY}/${enquiryId}`,
          finalPayload // Use finalPayload
        )
        toast.success('Enquiry updated successfully!', { duration: 3000 })
      } else {
        await http.post(ENQUIRY_ENDPOINTS.CREATE_ENQUIRY, finalPayload) // Use finalPayload
        toast.success('Enquiry created successfully!', { duration: 3000 })
      }
      // Refetch the data if the getallenquiry query exists
      queryClient.invalidateQueries({ queryKey: ['getallenquiry'] })
      onEnquiryCreated?.()
      onClose()
    } catch (error) {
      console.error('Error creating/updating enquiry:', error)
      toast.error('Failed to submit enquiry. Please try again.', {
        duration: 3000,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteItem = (index: number) => {
    setFormData((prev) => {
      if (!prev) return prev
      const newItems = prev.items.filter((_, i) => i !== index)

      // Preserve currency on the new first item if the original first item was deleted
      let currencyToKeep: string | undefined = undefined
      if (prev.items.length > 0) {
        currencyToKeep = (prev.items[0] as ItemRow).currency
      }

      // If the list is now empty, create a new item with default currency
      if (newItems.length === 0) {
        return {
          ...prev,
          items: [
            {
              description: '',
              weight: '',
              value: '',
              quantity: '',
              unitPrice: '',
              hsCode: '',
              totalValue: '',
              currency: currencyToKeep || 'USD',
            } as ItemRow,
          ] as any,
        }
      }

      // If the first item was deleted, the new first item needs the currency
      if (index === 0 && newItems.length > 0) {
        ;(newItems[0] as ItemRow).currency = currencyToKeep || 'USD'
      }

      return {
        ...prev,
        items: newItems as any,
      }
    })
  }

  const handleAddItem = () => {
    setFormData((prev) => {
      if (!prev) return prev

      // Get the current overall currency from the first item
      const currentCurrency =
        prev.items.length > 0 ? (prev.items[0] as ItemRow).currency : 'USD'

      // Create a new item with currency always set
      const newItem: ItemRow = {
        description: '',
        weight: '',
        value: '',
        quantity: '',
        unitPrice: '',
        hsCode: '',
        totalValue: '',
        currency: currentCurrency, // Always provide a value
      }

      // Add the new item
      const newItems = [...prev.items, newItem] as any

      return {
        ...prev,
        items: newItems,
      }
    })
  }

  const handleDeleteBox = (index: number) => {
    setFormData((prev) => {
      if (!prev) return prev
      const newBoxes = prev.boxes?.filter((_, i) => i !== index) || []
      return {
        ...prev,
        boxes: newBoxes as any,
      }
    })
  }

  const handleNumBoxesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Math.max(0, parseInt(e.target.value) || 0)
    setFormData((prev) => {
      if (!prev) return prev
      let newBoxes = prev.boxes ? [...prev.boxes] : []
      if (num > newBoxes.length) {
        // Add boxes
        for (let i = newBoxes.length; i < num; i++) {
          newBoxes.push({
            itemSelections: [],
            quantity: 1,
            weight: 0,
            value: 0,
            length: 0,
            breadth: 0,
            height: 0,
            multiplier: 1,
          } as Box)
        }
      } else if (num < newBoxes.length) {
        // Remove boxes
        newBoxes = newBoxes.slice(0, num)
      }
      return {
        ...prev,
        boxes: newBoxes as any,
        noOfBox: num,
      }
    })
  }

  const updateBoxDimension = (
    boxIdx: number,
    key: keyof Box,
    value: number
  ) => {
    setFormData((prev) => {
      if (!prev || !prev.boxes) return prev
      const newBoxes = [...prev.boxes]
      newBoxes[boxIdx] = {
        ...newBoxes[boxIdx],
        [key]: value,
      } as Box
      return {
        ...prev,
        boxes: newBoxes as any,
      }
    })
  }

  const handleBoxItemSelectionsChange = (
    boxIdx: number,
    itemSelections: { itemId: string; quantity: number }[]
  ) => {
    setFormData((prev) => {
      if (!prev || !prev.boxes) return prev
      const newBoxes = [...prev.boxes]
      newBoxes[boxIdx] = {
        ...newBoxes[boxIdx],
        itemSelections,
      } as Box
      return {
        ...prev,
        boxes: newBoxes as any,
      }
    })
  }

  const handleHandoverTypeChange = (type: 'PICKUP' | 'SELF_DROP') => {
    setFormData((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        handoverType: type,
        // Auto-fill sender phone if switching to pickup and phone is blank
        pickupPhone:
          type === 'PICKUP'
            ? prev.pickupPhone || prev.sender.telephone || ''
            : prev.pickupPhone,
      }
    })
    if (type === 'SELF_DROP') {
      setErrors((prev) => ({ ...prev, pickupLocation: false }))
    }
  }

  const handleUseSenderAddressForPickup = () => {
    if (!formData) return
    const senderAddr = [
      formData.sender.addressLine1,
      formData.sender.addressLine2,
      formData.sender.city,
    ]
      .filter((s) => s && s.trim())
      .join(', ')
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            pickupLocation: senderAddr || prev.pickupLocation,
            pickupPhone: prev.pickupPhone || prev.sender.telephone || '',
          }
        : null
    )
    if (senderAddr) {
      setErrors((prev) => ({ ...prev, pickupLocation: false }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        aria-label='Enquiry Form'
        className='mx-4 h-[90vh] max-h-[90vh] w-full max-w-[1000px] overflow-auto sm:mx-6 sm:max-w-[720px] md:max-w-[900px] lg:max-w-[1000px]'
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Enquiry' : 'Created Enquiry'}
          </DialogTitle>
          <button
            type='button'
            onClick={onClose}
            className='ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none'
          >
            <svg
              className='h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
            <span className='sr-only'>Close</span>
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='mb-6 grid grid-cols-2 gap-8'>
            <SenderSection
              formData={formData}
              countries={countries}
              filteredCustomers={filteredCustomers}
              senderSearchOpen={senderSearchOpen}
              senderSearchValue={senderSearchValue}
              onSenderSearchChange={handleSenderSearch}
              onCustomerSelect={handleCustomerSelect}
              onSenderSearchOpenChange={setSenderSearchOpen}
              onFormChange={handleChange}
              onCreateCustomer={handleCreateCustomer}
              onSearchCustomers={searchCustomers}
              senderAddressLine1Error={errors.senderAddressLine1 || false}
              senderAddressLine2Error={errors.senderAddressLine2 || false}
              senderCityError={errors.senderCity || false}
              senderPostcodeError={errors.senderPostcode || false}
              senderCountryError={errors.senderCountry || false}
              senderTelephoneError={errors.senderTelephone || false}
              hasError={errors.senderName || false}
              userRole={userRole}
              onSelfDetailSelect={handleSelfDetailSelect}
              canEdit={canEdit}
            />

            <ReceiverSection
              formData={formData}
              countries={countries}
              onFormChange={handleChange}
              sameAsSender={sameAsSender}
              onSameAsSenderChange={handleSameAsSenderChange}
              hasError={errors.receiverName || false}
              receiverAddressLine1Error={errors.receiverAddressLine1 || false}
              receiverAddressLine2Error={errors.receiverAddressLine2 || false}
              receiverCityError={errors.receiverCity || false}
              receiverStateError={errors.receiverState || false}
              receiverPostcodeError={errors.receiverPostcode || false}
              receiverCountryError={errors.receiverCountry || false}
              receiverTelephoneError={errors.receiverTelephone || false}
            />
          </div>

          <ItemTable
            formData={formData}
            onFormChange={handleChange}
            onTotalCurrencyChange={handleTotalCurrencyChange}
            onDeleteItem={handleDeleteItem}
            onAddItem={handleAddItem}
            itemErrors={errors.itemErrors}
          />

          {/* Number of Boxes Input */}
          <div className='mb-4'>
            <label className='mb-1 block font-medium'>Number of Boxes</label>
            <input
              type='number'
              min={0}
              value={formData?.boxes?.length || 0}
              onChange={handleNumBoxesChange}
              onWheel={(e) => e.currentTarget.blur()}
              className='w-40 rounded border px-3 py-2'
            />
          </div>

          <BoxesSection
            formData={formData}
            onDeleteBox={handleDeleteBox}
            updateBoxDimension={updateBoxDimension}
            onBoxItemSelectionsChange={handleBoxItemSelectionsChange}
            boxErrors={errors.boxErrors}
          />

          {/* Handover & Collection Option */}
          <div className='my-6 rounded-lg border bg-card p-4 shadow-sm'>
            <div className='mb-3 flex items-center justify-between border-b pb-2'>
              <div>
                <h3 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
                  <IconTruckDelivery className='h-4 w-4 text-primary' />
                  Handover & Collection Mode
                </h3>
                <p className='text-xs text-muted-foreground'>
                  Choose whether Netpack should dispatch a pickup boy or if the parcel will be dropped off at the hub.
                </p>
              </div>
            </div>

            {/* Handover Type Selector */}
            <div className='mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2'>
              <button
                type='button'
                onClick={() => handleHandoverTypeChange('PICKUP')}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                  formData?.handoverType !== 'SELF_DROP'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div
                  className={`mt-0.5 rounded-full p-1.5 ${
                    formData?.handoverType !== 'SELF_DROP'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <IconTruckDelivery className='h-4 w-4' />
                </div>
                <div className='space-y-0.5'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-semibold'>Pickup from Customer</span>
                    {formData?.handoverType !== 'SELF_DROP' && (
                      <span className='rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary'>
                        Selected
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Our pickup boy visits the sender address to collect and weigh parcel boxes.
                  </p>
                </div>
              </button>

              <button
                type='button'
                onClick={() => handleHandoverTypeChange('SELF_DROP')}
                className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                  formData?.handoverType === 'SELF_DROP'
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:bg-muted/50'
                }`}
              >
                <div
                  className={`mt-0.5 rounded-full p-1.5 ${
                    formData?.handoverType === 'SELF_DROP'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <IconPackage className='h-4 w-4' />
                </div>
                <div className='space-y-0.5'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-semibold'>Self Drop at Office / Hub</span>
                    {formData?.handoverType === 'SELF_DROP' && (
                      <span className='rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary'>
                        Selected
                      </span>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground'>
                    Sender delivers parcel directly to Netpack Cargo Logistics Hub.
                  </p>
                </div>
              </button>
            </div>

            {/* Pickup Details Form */}
            {formData?.handoverType !== 'SELF_DROP' ? (
              <div className='space-y-3 rounded-md border border-blue-200/80 bg-blue-50/40 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/20'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='flex items-center gap-1.5 text-xs font-semibold text-blue-900 dark:text-blue-200'>
                    <IconMapPin className='h-3.5 w-3.5 text-blue-600 dark:text-blue-400' />
                    Pickup Boy Dispatch Information
                  </span>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleUseSenderAddressForPickup}
                    className='h-7 border-blue-300 bg-white/80 px-2.5 text-xs text-blue-700 shadow-none hover:bg-blue-100 hover:text-blue-900 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-slate-800'
                  >
                    Use Sender Address & Phone
                  </Button>
                </div>

                <div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
                  <div className='md:col-span-2'>
                    <label className='mb-1 block text-xs font-medium'>
                      Exact Pickup Location / Landmark{' '}
                      <span className='text-destructive'>*</span>
                    </label>
                    <input
                      id='pickup-location'
                      type='text'
                      value={formData?.pickupLocation || ''}
                      onChange={(e) => {
                        const val = e.target.value
                        setFormData((prev) =>
                          prev ? { ...prev, pickupLocation: val } : null
                        )
                        if (val.trim()) {
                          setErrors((prev) => ({
                            ...prev,
                            pickupLocation: false,
                          }))
                        }
                      }}
                      placeholder='e.g., House No. 42, Near City Center, Kamalpokhari, Kathmandu'
                      className={`w-full rounded border bg-background px-3 py-2 text-sm ${
                        errors.pickupLocation
                          ? 'border-destructive ring-1 ring-destructive'
                          : 'border-input'
                      }`}
                    />
                    {errors.pickupLocation && (
                      <p className='mt-1 text-[11px] text-destructive'>
                        Exact pickup location is required for pickup service
                      </p>
                    )}
                  </div>

                  <div>
                    <label className='mb-1 flex items-center gap-1 text-xs font-medium'>
                      <IconPhone className='h-3.5 w-3.5 text-muted-foreground' />
                      Contact Phone for Pickup
                    </label>
                    <input
                      id='pickup-phone'
                      type='text'
                      value={formData?.pickupPhone || ''}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev ? { ...prev, pickupPhone: e.target.value } : null
                        )
                      }
                      placeholder='e.g., 9841234567'
                      className='w-full rounded border border-input bg-background px-3 py-2 text-sm'
                    />
                  </div>

                  <div>
                    <label className='mb-1 flex items-center gap-1 text-xs font-medium'>
                      <IconClock className='h-3.5 w-3.5 text-muted-foreground' />
                      Preferred Pickup Date & Time
                    </label>
                    <input
                      id='pickup-time'
                      type='text'
                      value={formData?.pickupTime || ''}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev ? { ...prev, pickupTime: e.target.value } : null
                        )
                      }
                      placeholder='e.g., Today 2:00 PM - 4:00 PM / Tomorrow Morning'
                      className='w-full rounded border border-input bg-background px-3 py-2 text-sm'
                    />
                  </div>

                  <div className='md:col-span-2'>
                    <label className='mb-1 flex items-center gap-1 text-xs font-medium'>
                      <IconNotes className='h-3.5 w-3.5 text-muted-foreground' />
                      Pickup Instruction Note for Pickup Boy
                    </label>
                    <input
                      id='pickup-note'
                      type='text'
                      value={formData?.pickupNote || ''}
                      onChange={(e) =>
                        setFormData((prev) =>
                          prev ? { ...prev, pickupNote: e.target.value } : null
                        )
                      }
                      placeholder='e.g., Ring bell #2, 3rd floor flat, please bring carton tape, call gate before arrival'
                      className='w-full rounded border border-input bg-background px-3 py-2 text-sm'
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className='rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300'>
                <p className='mb-1 flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300'>
                  <IconPackage className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
                  Self Drop-off Selected
                </p>
                <p className='text-xs text-emerald-700 dark:text-emerald-400'>
                  Customer will bring shipment directly to Netpack Cargo Logistics Hub. No pickup boy will be dispatched.
                </p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className='flex justify-end space-x-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button
              type='submit'
              onClick={(e) => {
                if (loading) {
                  e.preventDefault()
                }
              }}
              disabled={loading}
            >
              {loading
                ? 'Saving...'
                : isEditMode
                  ? 'Update Enquiry'
                  : 'Create Enquiry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
