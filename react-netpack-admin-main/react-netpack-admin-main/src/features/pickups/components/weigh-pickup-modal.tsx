import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  Upload,
  Plus,
  Trash2,
  Scale,
  Box as BoxIcon,
  CheckCircle2,
  FileImage,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { PICKUP_ENDPOINTS } from '@/constants/endpoint'

interface BoxItem {
  id?: number
  length: number | string
  breadth: number | string
  height: number | string
  weight: number | string
  quantity: number | string
  multiplier?: number | string
}

interface WeighPickupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pickupItem: any
  onSuccess: () => void
}

export function WeighPickupModal({
  open,
  onOpenChange,
  pickupItem,
  onSuccess,
}: WeighPickupModalProps) {
  const [actualWeight, setActualWeight] = useState<string>('')
  const [boxes, setBoxes] = useState<BoxItem[]>([
    { length: 30, breadth: 20, height: 20, weight: '', quantity: 1 },
  ])
  const [notes, setNotes] = useState<string>('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (pickupItem) {
      setActualWeight(
        pickupItem.weight ? String(pickupItem.weight) : ''
      )
      setNotes(pickupItem.pickupNotes || '')

      if (pickupItem.boxes && pickupItem.boxes.length > 0) {
        setBoxes(
          pickupItem.boxes.map((b: any) => ({
            id: b.id,
            length: b.length || 30,
            breadth: b.breadth || 20,
            height: b.height || 20,
            weight: b.weight || '',
            quantity: b.quantity || 1,
            multiplier: b.multiplier || 1,
          }))
        )
      } else {
        const initialCount = Number(pickupItem.noOfBox) || 1
        const initialBoxes: BoxItem[] = []
        for (let i = 0; i < initialCount; i++) {
          initialBoxes.push({
            length: 30,
            breadth: 20,
            height: 20,
            weight: pickupItem.weight ? String(pickupItem.weight / initialCount) : '',
            quantity: 1,
          })
        }
        setBoxes(initialBoxes)
      }

      const existingList: string[] = pickupItem.weightProofImages?.length
        ? pickupItem.weightProofImages
        : pickupItem.weightProofImageUrl
        ? pickupItem.weightProofImageUrl.split(',').map((u: string) => u.trim()).filter(Boolean)
        : []
      setExistingImages(existingList)
      setSelectedImages([])
      setImagePreviews([])
    }
  }, [pickupItem, open])

  // Compute live volumetric & chargeable weight
  const grossWeightNum = parseFloat(actualWeight) || 0.0

  const totalVolumetricWeight = boxes.reduce((acc, b) => {
    const l = parseFloat(String(b.length)) || 0.0
    const w = parseFloat(String(b.breadth)) || 0.0
    const h = parseFloat(String(b.height)) || 0.0
    const qty = parseInt(String(b.quantity)) || 1
    const mult = parseFloat(String(b.multiplier)) || 1.0
    const boxVol = ((l * w * h) / 5000.0) * qty * mult
    return acc + boxVol
  }, 0.0)

  const chargeableWeight = Math.max(grossWeightNum, totalVolumetricWeight)

  const handleAddBox = () => {
    setBoxes([
      ...boxes,
      {
        length: 30,
        breadth: 20,
        height: 20,
        weight: '',
        quantity: 1,
      },
    ])
  }

  const handleRemoveBox = (index: number) => {
    if (boxes.length === 1) {
      toast.warning('At least 1 box is required')
      return
    }
    setBoxes(boxes.filter((_, idx) => idx !== index))
  }

  const handleBoxChange = (index: number, field: keyof BoxItem, value: string) => {
    const updated = [...boxes]
    updated[index] = { ...updated[index], [field]: value }
    setBoxes(updated)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setSelectedImages((prev) => [...prev, ...newFiles])
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
      setImagePreviews((prev) => [...prev, ...newPreviews])
    }
  }

  const handleRemoveNewImage = (idx: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx))
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!grossWeightNum || grossWeightNum <= 0) {
      toast.error('Please enter a valid actual gross weight (kg)')
      return
    }

    if (!pickupItem?.id) return

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('actualWeight', String(grossWeightNum))
      formData.append('pickupNotes', notes)

      // Box JSON
      const boxesPayload = boxes.map((b, idx) => ({
        id: b.id,
        length: parseFloat(String(b.length)) || 0,
        breadth: parseFloat(String(b.breadth)) || 0,
        height: parseFloat(String(b.height)) || 0,
        weight: parseFloat(String(b.weight)) || (grossWeightNum / boxes.length),
        quantity: parseInt(String(b.quantity)) || 1,
        multiplier: parseFloat(String(b.multiplier)) || 1.0,
        trackingNumber: `${pickupItem.trackingNumber || 'BOX'}-${idx + 1}`,
      }))
      formData.append('boxesJson', JSON.stringify(boxesPayload))

      // Multiple scale and box photos
      selectedImages.forEach((file) => {
        formData.append('scaleImages', file)
      })
      if (selectedImages.length > 0) {
        formData.append('scaleImage', selectedImages[0])
      }

      const token = localStorage.getItem('token')
      const res = await fetch(
        PICKUP_ENDPOINTS.PICKUP_AND_WEIGH(pickupItem.id),
        {
          method: 'POST',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        }
      )

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to update pickup verification')
      }

      toast.success(
        'Cargo verified & marked as Picked Up successfully!'
      )
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast.error(err.message || 'Error updating pickup details')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[92vh] max-w-2xl overflow-y-auto sm:rounded-xl'>
        <DialogHeader>
          <div className='flex items-center gap-2'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary'>
              <Scale className='h-5 w-5' />
            </div>
            <div>
              <DialogTitle className='text-lg font-bold'>
                Warehouse Intake & Weight Verification
              </DialogTitle>
              <DialogDescription className='text-xs'>
                Tracking: <span className='font-mono font-bold text-foreground'>{pickupItem?.trackingNumber}</span> | Shipper: {pickupItem?.senderName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-5 pt-2'>
          {/* Summary Weights Banner */}
          <div className='grid grid-cols-3 gap-3 rounded-lg border bg-muted/40 p-3 text-center'>
            <div className='rounded-md border bg-background p-2.5 shadow-xs'>
              <div className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider'>
                Actual Gross Wt
              </div>
              <div className='mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400'>
                {grossWeightNum ? `${grossWeightNum.toFixed(2)} kg` : '0.00 kg'}
              </div>
            </div>
            <div className='rounded-md border bg-background p-2.5 shadow-xs'>
              <div className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider'>
                Volumetric Wt
              </div>
              <div className='mt-1 text-lg font-bold text-blue-600 dark:text-blue-400'>
                {totalVolumetricWeight ? `${totalVolumetricWeight.toFixed(2)} kg` : '0.00 kg'}
              </div>
              <div className='text-[10px] text-muted-foreground'>L×W×H / 5000</div>
            </div>
            <div className='rounded-md border bg-background p-2.5 shadow-xs'>
              <div className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wider'>
                Chargeable Wt
              </div>
              <div className='mt-1 text-lg font-bold text-violet-600 dark:text-violet-400'>
                {chargeableWeight ? `${chargeableWeight.toFixed(2)} kg` : '0.00 kg'}
              </div>
              <div className='text-[10px] text-muted-foreground'>max(Gross, Vol)</div>
            </div>
          </div>

          {/* Section 1: Actual Gross Weight Input */}
          <div className='space-y-1.5'>
            <Label htmlFor='actualWeight' className='text-sm font-semibold flex items-center justify-between'>
              <span>Actual Gross Weight from Weighing Scale (kg) *</span>
              {pickupItem?.weight && (
                <span className='text-xs font-normal text-muted-foreground'>
                  Previously declared: {pickupItem.weight} kg
                </span>
              )}
            </Label>
            <div className='relative'>
              <Input
                id='actualWeight'
                type='number'
                step='0.01'
                min='0.05'
                placeholder='e.g. 14.50'
                value={actualWeight}
                onChange={(e) => setActualWeight(e.target.value)}
                required
                className='h-11 text-base font-semibold pl-9'
              />
              <Scale className='absolute left-3 top-3 h-5 w-5 text-muted-foreground' />
            </div>
          </div>

          {/* Section 2: Box Dimensions Breakdown */}
          <div className='space-y-3 rounded-lg border p-3.5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <BoxIcon className='h-4 w-4 text-primary' />
                <span className='text-sm font-semibold'>
                  Box Dimensions ({boxes.length} {boxes.length === 1 ? 'Box' : 'Boxes'})
                </span>
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={handleAddBox}
                className='h-8 gap-1 text-xs'
              >
                <Plus className='h-3.5 w-3.5' />
                Add Box
              </Button>
            </div>

            <div className='space-y-2.5'>
              {boxes.map((box, idx) => {
                const l = parseFloat(String(box.length)) || 0
                const w = parseFloat(String(box.breadth)) || 0
                const h = parseFloat(String(box.height)) || 0
                const boxVol = ((l * w * h) / 5000.0) * (parseInt(String(box.quantity)) || 1)

                return (
                  <div
                    key={idx}
                    className='relative rounded-md border bg-background p-2.5 shadow-xs transition-colors hover:border-primary/50'
                  >
                    <div className='mb-2 flex items-center justify-between text-xs font-semibold'>
                      <Badge variant='outline' className='text-[11px] font-mono'>
                        Box #{idx + 1}
                      </Badge>
                      <div className='flex items-center gap-3'>
                        <span className='text-muted-foreground'>
                          Vol: <strong className='text-foreground'>{boxVol.toFixed(2)} kg</strong>
                        </span>
                        {boxes.length > 1 && (
                          <Button
                            type='button'
                            variant='ghost'
                            size='icon'
                            onClick={() => handleRemoveBox(idx)}
                            className='h-6 w-6 text-destructive hover:bg-destructive/10'
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                      <div>
                        <Label className='text-[11px] text-muted-foreground'>Length (cm)</Label>
                        <Input
                          type='number'
                          step='0.1'
                          value={box.length}
                          onChange={(e) => handleBoxChange(idx, 'length', e.target.value)}
                          className='h-8 text-xs font-medium'
                        />
                      </div>
                      <div>
                        <Label className='text-[11px] text-muted-foreground'>Width (cm)</Label>
                        <Input
                          type='number'
                          step='0.1'
                          value={box.breadth}
                          onChange={(e) => handleBoxChange(idx, 'breadth', e.target.value)}
                          className='h-8 text-xs font-medium'
                        />
                      </div>
                      <div>
                        <Label className='text-[11px] text-muted-foreground'>Height (cm)</Label>
                        <Input
                          type='number'
                          step='0.1'
                          value={box.height}
                          onChange={(e) => handleBoxChange(idx, 'height', e.target.value)}
                          className='h-8 text-xs font-medium'
                        />
                      </div>
                      <div>
                        <Label className='text-[11px] text-muted-foreground'>Box Weight (kg)</Label>
                        <Input
                          type='number'
                          step='0.01'
                          placeholder='Optional'
                          value={box.weight}
                          onChange={(e) => handleBoxChange(idx, 'weight', e.target.value)}
                          className='h-8 text-xs font-medium'
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 3: Weighing Scale & Box Proof Photos */}
          <div className='space-y-3 rounded-lg border p-3.5'>
            <Label className='text-sm font-semibold flex items-center justify-between'>
              <span className='flex items-center gap-1.5'>
                <Camera className='h-4 w-4 text-primary' />
                Weighing Scale & Box Photos
              </span>
              <span className='text-[11px] font-normal text-muted-foreground'>
                Upload scale readings & box pictures (Multiple photos supported)
              </span>
            </Label>

            {/* Gallery of existing and new photos */}
            {(existingImages.length > 0 || imagePreviews.length > 0) ? (
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1'>
                {/* Existing uploaded photos */}
                {existingImages.map((url, idx) => (
                  <div key={`existing-${idx}`} className='relative group h-24 rounded-lg border overflow-hidden bg-muted/30'>
                    <img
                      src={url}
                      alt={`Box Proof ${idx + 1}`}
                      className='h-full w-full object-cover'
                    />
                    <div className='absolute top-1 left-1 bg-black/60 text-[10px] text-white px-1.5 py-0.5 rounded font-medium'>
                      Saved #{idx + 1}
                    </div>
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2'>
                      <a
                        href={url}
                        target='_blank'
                        rel='noreferrer'
                        className='p-1.5 bg-white/90 text-foreground rounded-full hover:bg-white'
                      >
                        <ExternalLink className='h-3.5 w-3.5' />
                      </a>
                    </div>
                  </div>
                ))}

                {/* Newly selected photos */}
                {imagePreviews.map((previewUrl, idx) => (
                  <div key={`new-${idx}`} className='relative group h-24 rounded-lg border border-primary/40 overflow-hidden bg-muted/30'>
                    <img
                      src={previewUrl}
                      alt={`New Box Photo ${idx + 1}`}
                      className='h-full w-full object-cover'
                    />
                    <div className='absolute top-1 left-1 bg-primary/90 text-[10px] text-white px-1.5 py-0.5 rounded font-medium'>
                      New #{idx + 1}
                    </div>
                    <button
                      type='button'
                      onClick={() => handleRemoveNewImage(idx)}
                      className='absolute top-1 right-1 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-transform active:scale-95 shadow-xs'
                      title='Remove photo'
                    >
                      <Trash2 className='h-3 w-3' />
                    </button>
                    <div className='absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none'>
                      <span className='text-[10px] text-white font-medium px-2 py-1 bg-black/60 rounded'>
                        {selectedImages[idx]?.name ? (selectedImages[idx].name.length > 12 ? selectedImages[idx].name.slice(0, 10) + '...' : selectedImages[idx].name) : 'Photo'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className='flex h-20 w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/10 text-muted-foreground text-xs gap-2'>
                <FileImage className='h-5 w-5 stroke-[1.5]' />
                <span>No photos added yet. You can capture scale and multi-box pictures below.</span>
              </div>
            )}

            {/* Upload multi-photo drop zone */}
            <div className='space-y-1.5'>
              <label className='flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 text-center transition-colors hover:bg-primary/10'>
                <div className='flex items-center gap-2 text-xs font-semibold text-primary'>
                  <Upload className='h-4 w-4' />
                  <span>Add Scale & Box Photos (Multi-box supported)</span>
                </div>
                <span className='text-[10px] text-muted-foreground mt-0.5'>
                  Select multiple JPG, PNG, WebP photos or capture from camera
                </span>
                <input
                  type='file'
                  multiple
                  accept='image/*'
                  capture='environment'
                  onChange={handleImageChange}
                  className='hidden'
                />
              </label>
              {selectedImages.length > 0 && (
                <p className='text-xs text-emerald-600 dark:text-emerald-400 font-medium'>
                  {selectedImages.length} new photo{selectedImages.length > 1 ? 's' : ''} ready to upload
                </p>
              )}
            </div>
          </div>

          {/* Section 4: Pickup & Warehouse Intake Notes */}
          <div className='space-y-1.5'>
            <Label htmlFor='notes' className='text-sm font-semibold'>
              Pickup Notes / Remarks
            </Label>
            <textarea
              id='notes'
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='e.g. Received 2 cartons sealed in good condition from customer shop in Thamel.'
              className='w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring'
            />
          </div>

          <DialogFooter className='gap-2 sm:gap-0'>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              disabled={submitting}
              className='gap-1.5'
            >
              {submitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className='h-4 w-4' />
                  <span>Confirm Pickup & Save Weight</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
