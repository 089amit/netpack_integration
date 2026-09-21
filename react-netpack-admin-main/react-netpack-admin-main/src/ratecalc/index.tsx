'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/authStore'
import http from '@/utils/http'
import { LOCATION_ENDPOINT, RATE_ENDPOINT } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type RateResponse = {
  weight: number
  chargeableWeight: number
  volumetricWeight: number
  ceilingWeight: number
  destination: string
  numberOfBoxes: number
  totalRate: number
  ratePerKg: number | string
  breakdown: {
    baseRate: number
    tiaCharge: number
    customCharge: number
    additionalBoxRate: number
  }
  overweightFee?: number
  oversizedFee?: number
  isOverweight?: boolean
  isOversized?: boolean
}

type Country = {
  id: number
  name: string
  isActive: boolean
}

export default function RateCalculatorPage() {
  const [weight, setWeight] = useState<string>('')
  const [destination, setDestination] = useState<string>('')
  const [countries, setCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<RateResponse | null>(null)
  const [countryLoading, setCountryLoading] = useState(true)

  // Admin Rates & Excel Upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingExcel, setUploadingExcel] = useState(false)
  const [tiaRate, setTiaRate] = useState<number | null>(null)
  const [customRate, setCustomRate] = useState<number | null>(null)
  const [packingRate, setPackingRate] = useState<number | null>(null)
  const [ratesLoading, setRatesLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<
    'TIA' | 'CUSTOM' | 'PACKING' | null
  >(null)
  const [modalValue, setModalValue] = useState<number>(0)
  const [modalLoading, setModalLoading] = useState(false)

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingExcel(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await http.post<{ message: string; data: any }>(
        RATE_ENDPOINT.IMPORT_EXCEL,
        formData
      )

      alert(res.message || 'Rates successfully imported from Excel!')

      // Refresh destinations and charges
      const countryRes = await http.get<any>(
        LOCATION_ENDPOINT.GET_COUNTRIES_WITH_RATES
      )
      const countryList = countryRes?.data || (Array.isArray(countryRes) ? countryRes : [])
      setCountries(countryList)
      if (countryList.length > 0) setDestination(countryList[0].name)

      const [tiaRes, customRes, packingRes] = await Promise.all([
        http.get<{ rate: string }>(RATE_ENDPOINT.GET_TIA_RATE),
        http.get<{ rate: string }>(RATE_ENDPOINT.GET_CUSTOM_RATE),
        http.get<{ rate: string }>(RATE_ENDPOINT.GET_PACKING_RATE),
      ])
      setTiaRate(parseFloat(tiaRes.rate))
      setCustomRate(parseFloat(customRes.rate))
      setPackingRate(parseFloat(packingRes.rate))
    } catch (err: any) {
      console.error('Excel Import Error:', err)
      alert(`Failed to import Excel file: ${err.message || 'Unknown error'}`)
    } finally {
      setUploadingExcel(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const localRole =
    typeof window !== 'undefined' ? localStorage.getItem('role') : null
  const userRole =
    localRole || useAuthStore((state) => state.auth.user?.role?.[0] || '')

  // Fetch destinations
  useEffect(() => {
    const fetchCountries = async () => {
      setCountryLoading(true)
      try {
        const res = await http.get<any>(
          LOCATION_ENDPOINT.GET_COUNTRIES_WITH_RATES
        )
        const list = res?.data || (Array.isArray(res) ? res : [])
        setCountries(list)
        if (list.length > 0) setDestination(list[0].name)
      } catch {
        alert('Failed to fetch destinations')
      } finally {
        setCountryLoading(false)
      }
    }
    fetchCountries()
  }, [])

  // Fetch all rates
  useEffect(() => {
    const fetchRates = async () => {
      setRatesLoading(true)
      try {
        const [tiaRes, customRes, packingRes] = await Promise.all([
          http.get<{ rate: string }>(RATE_ENDPOINT.GET_TIA_RATE),
          http.get<{ rate: string }>(RATE_ENDPOINT.GET_CUSTOM_RATE),
          http.get<{ rate: string }>(RATE_ENDPOINT.GET_PACKING_RATE),
        ])
        setTiaRate(parseFloat(tiaRes.rate))
        setCustomRate(parseFloat(customRes.rate))
        setPackingRate(parseFloat(packingRes.rate))
      } catch {
        console.error('Failed to fetch rates')
      } finally {
        setRatesLoading(false)
      }
    }
    fetchRates()
  }, [])

  const openModal = (type: 'TIA' | 'CUSTOM' | 'PACKING') => {
    setModalType(type)
    const currentValue =
      type === 'TIA'
        ? (tiaRate ?? 0)
        : type === 'CUSTOM'
          ? (customRate ?? 0)
          : (packingRate ?? 0)
    setModalValue(currentValue)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalType(null)
    setModalValue(0)
  }

  const handleRateUpdate = async () => {
    if (!modalType) return
    setModalLoading(true)
    try {
      const endpoint =
        modalType === 'TIA'
          ? RATE_ENDPOINT.UPDATE_TIA_CHARGE
          : modalType === 'CUSTOM'
            ? RATE_ENDPOINT.UPDATE_CUSTOM_CHARGE
            : RATE_ENDPOINT.UPDATE_PACKING_CHARGE

      await http.post(endpoint, { rate: modalValue })
      alert(`${modalType} rate updated successfully.`)

      // Refresh rates
      const [tiaRes, customRes, packingRes] = await Promise.all([
        http.get<{ rate: string }>(RATE_ENDPOINT.GET_TIA_RATE),
        http.get<{ rate: string }>(RATE_ENDPOINT.GET_CUSTOM_RATE),
        http.get<{ rate: string }>(RATE_ENDPOINT.GET_PACKING_RATE),
      ])
      setTiaRate(parseFloat(tiaRes.rate))
      setCustomRate(parseFloat(customRes.rate))
      setPackingRate(parseFloat(packingRes.rate))

      closeModal()
    } catch {
      alert('Failed to update rate')
    } finally {
      setModalLoading(false)
    }
  }

  const handleSubmit = async () => {
    const numWeight = parseFloat(weight)
    if (!weight || isNaN(numWeight) || numWeight <= 0) {
      alert('Please enter a valid weight')
      return
    }
    if (!destination) {
      alert('Please select a destination')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const payload = { weight: numWeight, destination }
      const response = await http.post<RateResponse>(
        RATE_ENDPOINT.CALCULATE,
        payload
      )
      setResult(response)
    } catch (error) {
      console.error(error)
      alert('Failed to calculate rate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='container mx-auto max-w-lg py-10'>
      {/* Admin Controls */}
      {userRole === 'ADMIN' && (
        <div className='mb-6 flex flex-wrap justify-center gap-3'>
          <input
            type='file'
            ref={fileInputRef}
            onChange={handleExcelUpload}
            accept='.xlsx, .xls'
            className='hidden'
          />

          <Button
            className='bg-emerald-600 hover:bg-emerald-700 text-white'
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingExcel}
          >
            {uploadingExcel ? 'Importing Excel...' : '📊 Import Tariff Excel'}
          </Button>

          <Button
            variant='outline'
            onClick={() => openModal('TIA')}
            disabled={ratesLoading}
          >
            Change TIA Rate{' '}
            {tiaRate !== null ? `: Rs ${tiaRate.toFixed(2)}` : ''}
          </Button>

          <Button
            variant='outline'
            onClick={() => openModal('CUSTOM')}
            disabled={ratesLoading}
          >
            Change Custom Rate{' '}
            {customRate !== null ? `: Rs ${customRate.toFixed(2)}` : ''}
          </Button>

          <Button
            variant='outline'
            onClick={() => openModal('PACKING')}
            disabled={ratesLoading}
          >
            Change Packing Rate{' '}
            {packingRate !== null ? `: Rs ${packingRate.toFixed(2)}` : ''}
          </Button>
        </div>
      )}

      {/* Calculator */}
      <Card className='border-0 shadow-lg'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-center text-xl font-semibold'>
            Shipping Rate Calculator
          </CardTitle>
        </CardHeader>

        <CardContent className='space-y-5'>
          {/* Weight Input */}
          <div>
            <label className='mb-1 block text-sm font-medium'>
              Weight (kg)
            </label>
            <Input
              type='number'
              min={0.1}
              step='0.1'
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder='Enter package weight'
            />
          </div>

          {/* Destination Select */}
          <div>
            <label className='mb-1 block text-sm font-medium'>
              Destination
            </label>
            <Select
              value={destination}
              onValueChange={setDestination}
              disabled={countryLoading}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={countryLoading ? 'Loading...' : 'Select country'}
                />
              </SelectTrigger>
              <SelectContent>
                {(countries || []).map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className='mt-4 w-full'
          >
            {loading ? 'Calculating...' : 'Calculate Rate'}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <div className='mt-8'>
          <Card className='border-t-4 border-blue-500 shadow-xl transition-all hover:shadow-2xl'>
            <CardHeader>
              <CardTitle className='text-lg font-bold text-blue-600'>
                Rate Summary — {result.destination}
              </CardTitle>
            </CardHeader>

            <CardContent className='space-y-2 text-sm'>
              <div className='grid grid-cols-2 gap-2'>
                <p className='text-gray-600'>Actual Weight:</p>
                <p className='font-medium'>{result.weight} kg</p>

                <p className='text-gray-600'>Chargeable Weight:</p>
                <p className='font-medium'>{result.ceilingWeight} kg</p>

                <p className='text-gray-600'>Rate per Kg:</p>
                <p className='font-medium'>
                  Rs{' '}
                  {typeof result.ratePerKg === 'number'
                    ? result.ratePerKg.toFixed(2)
                    : !isNaN(Number(result.ratePerKg)) && result.ratePerKg !== ''
                      ? Number(result.ratePerKg).toFixed(2)
                      : result.ratePerKg}
                </p>

                <p className='text-gray-600'>Total Rate:</p>
                <p className='font-semibold text-green-600'>
                  Rs {result.totalRate}
                </p>
              </div>

              <hr className='my-3' />

              <p className='font-semibold'>Breakdown:</p>
              <ul className='ml-2 list-inside list-disc space-y-1 text-xs text-gray-700'>
                <li>
                  Freight Charge: Rs {result.breakdown.baseRate} (
                  {result.ceilingWeight
                    ? (result.breakdown.baseRate / result.ceilingWeight).toFixed(2)
                    : '0.00'}{' '}
                  /kg)
                </li>
                <li>TIA Charge: Rs {result.breakdown.tiaCharge}</li>
                <li>Custom Charge: Rs {result.breakdown.customCharge}</li>
                <li>
                  Packing Charge: Rs{' '}
                  {(result.breakdown.additionalBoxRate ?? 0).toFixed(2)}
                </li>
              </ul>

              <p className='mt-4 text-[10px] font-medium text-red-500 italic'>
                * Warning: These rates are indicative and may vary based on
                actual shipment details, fuel surcharges, and current market
                conditions.
              </p>

              {(result.isOverweight || result.isOversized) && (
                <div className='mt-3 space-y-1'>
                  {result.isOverweight && (
                    <p className='text-xs text-orange-600'>
                      Overweight Fee: Rs {(result.overweightFee ?? 0).toFixed(2)}
                    </p>
                  )}
                  {result.isOversized && (
                    <p className='text-xs text-red-600'>
                      Oversized Fee: Rs {(result.oversizedFee ?? 0).toFixed(2)}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Rate Modal */}
      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalType === 'TIA'
                ? 'Update TIA Rate'
                : modalType === 'CUSTOM'
                  ? 'Update Custom Rate'
                  : 'Update Packing Rate'}
            </DialogTitle>
          </DialogHeader>
          <Input
            type='number'
            step='0.01'
            value={modalValue}
            onChange={(e) => setModalValue(Number(e.target.value))}
            placeholder='Enter new rate'
          />
          <DialogFooter>
            <Button variant='ghost' onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleRateUpdate} disabled={modalLoading}>
              {modalLoading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
