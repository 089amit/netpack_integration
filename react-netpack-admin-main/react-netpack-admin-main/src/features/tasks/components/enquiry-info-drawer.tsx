import { useEffect, useState } from 'react'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { Scale, Camera } from 'lucide-react'
import { toast } from 'sonner'
import http from '@/utils/http'
import { useCheckRole } from '@/utils/role-utils'
import { ENQUIRY_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: { id: number } | null
}

export function GetEnquiryInfoDrawer({
  open,
  onOpenChange,
  currentRow,
}: Props) {
  const [enquiryData, setEnquiryData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [pickupLocations, setPickupLocations] = useState<any[]>([])
  const [updating, setUpdating] = useState(false)
  const isPickup = useCheckRole('Pickup')

  useEffect(() => {
    if (open && currentRow?.id) {
      setLoading(true)
      http
        .get(`${ENQUIRY_ENDPOINTS.GET_BY_ID_ENQUIRY}/${currentRow.id}`)
        .then((res: any) => {
          setEnquiryData(res)
          setPickupLocations(res.pickupLocations || [])
        })
        .catch(() => {
          setEnquiryData(null)
          setPickupLocations([])
        })
        .finally(() => setLoading(false))
    } else {
      setEnquiryData(null)
      setPickupLocations([])
    }
  }, [open, currentRow])

  const isEditableStatus = ['ENQUIRY_GENERATED', 'PENDING', ''].includes(
    (enquiryData?.status || '').toUpperCase()
  )

  const handleAddLocation = () => {
    if (!isEditableStatus || isPickup) return
    setPickupLocations([
      ...pickupLocations,
      { id: Date.now(), location: '', phoneNumber: '', note: '' },
    ])
  }

  const handleUpdateLocation = (id: any, field: string, value: string) => {
    if (!isEditableStatus || isPickup) return
    setPickupLocations(
      pickupLocations.map((loc) =>
        loc.id === id ? { ...loc, [field]: value } : loc
      )
    )
  }

  const handleRemoveLocation = (id: any) => {
    if (!isEditableStatus || isPickup) return
    setPickupLocations(pickupLocations.filter((loc) => loc.id !== id))
  }

  const handleSaveChanges = async () => {
    if (!currentRow?.id || !isEditableStatus || isPickup) return
    setUpdating(true)
    try {
      await http.post(
        ENQUIRY_ENDPOINTS.UPDATE_PICKUP_LOCATIONS(currentRow.id),
        {
          pickupLocations,
        }
      )
      toast.success('Pickup locations updated successfully')
    } catch (error) {
      toast.error('Failed to update pickup locations')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex max-w-lg flex-col'>
        <SheetHeader className='text-left'>
          <SheetTitle className='text-xl font-bold'>Enquiry Details</SheetTitle>
          <SheetDescription className='text-muted-foreground'>
            Review the full information of this enquiry.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className='flex-1 space-y-6 overflow-y-auto px-1 pt-2'>
          {loading && (
            <div className='space-y-4'>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className='h-6 w-full' />
              ))}
            </div>
          )}

          {!loading && enquiryData && (
            <div className='space-y-6'>
              {/* Basic Info */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='bg-primary/5 border-primary/10 col-span-2 rounded-md border p-2'>
                  <Label className='text-primary font-semibold'>
                    Tracking Number
                  </Label>
                  <p className='text-primary text-base font-bold tracking-wider'>
                    {enquiryData.trackingNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className='text-sm font-medium'>{enquiryData.status}</p>
                </div>
                <div>
                  <Label>Destination Location</Label>
                  <p className='text-sm'>{enquiryData.destinationLocation}</p>
                </div>
                <div>
                  <Label>No. of Boxes</Label>
                  <p className='text-sm'>{enquiryData.noOfBox}</p>
                </div>
                <div>
                  <Label>Weight</Label>
                  <p className='text-sm'>{enquiryData.weight} kg</p>
                </div>
              </div>

              {/* Sender Details */}
              <div className='rounded-lg border p-4 shadow-sm'>
                <Label className='text-muted-foreground mb-2 block'>
                  Sender Information
                </Label>
                <p>
                  <strong>Name:</strong> {enquiryData.senderName}
                </p>
                <p>
                  <strong>Phone:</strong> {enquiryData.senderPhone}
                </p>
                <p>
                  <strong>Email:</strong> {enquiryData.senderEmail}
                </p>
                <p>
                  <strong>Address:</strong> {enquiryData.senderAddressLine1},{' '}
                  {enquiryData.senderAddressLine2},{' '}
                  {enquiryData.senderPostcodeCity}
                </p>
                <p>
                  <strong>Country:</strong> {enquiryData.senderCountry}
                </p>
              </div>

              {/* Receiver Details */}
              <div className='rounded-lg border p-4 shadow-sm'>
                <Label className='text-muted-foreground mb-2 block'>
                  Receiver Information
                </Label>
                <p>
                  <strong>Name:</strong> {enquiryData.receiverName}
                </p>
                <p>
                  <strong>Phone:</strong> {enquiryData.receiverTelephone}
                </p>
                <p>
                  <strong>Email:</strong> {enquiryData.receiverEmail}
                </p>
                <p>
                  <strong>Address:</strong> {enquiryData.receiverAddressLine1},{' '}
                  {enquiryData.receiverAddressLine2},{' '}
                  {enquiryData.receiverPostcodeCity}
                </p>
                <p>
                  <strong>Country:</strong> {enquiryData.receiverCountry}
                </p>
              </div>

              {/* Forwarding & Overseas Dispatch Information */}
              {(enquiryData.forwardingCompanyName ||
                enquiryData.forwardingNumber ||
                enquiryData.hawbNumber ||
                enquiryData.agent) && (
                <div className='rounded-lg border border-blue-200 bg-blue-50/40 p-4 shadow-sm dark:border-blue-900 dark:bg-blue-950/20'>
                  <Label className='mb-2 block font-semibold text-blue-800 dark:text-blue-300'>
                    Forwarding & Overseas Dispatch
                  </Label>
                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    {enquiryData.forwardingCompanyName && (
                      <p>
                        <strong>Forwarding Company:</strong>{' '}
                        {enquiryData.forwardingCompanyName}
                      </p>
                    )}
                    {enquiryData.forwardingNumber && (
                      <p>
                        <strong>Forwarding #:</strong>{' '}
                        <span className='font-mono font-medium'>
                          {enquiryData.forwardingNumber}
                        </span>
                      </p>
                    )}
                    {enquiryData.hawbNumber && (
                      <p>
                        <strong>HAWB #:</strong>{' '}
                        <span className='text-primary font-mono font-bold'>
                          {enquiryData.hawbNumber}
                        </span>
                      </p>
                    )}
                    {enquiryData.agent && (
                      <p>
                        <strong>Clearing Agent:</strong> {enquiryData.agent}
                      </p>
                    )}
                    {enquiryData.forwardingServiceName && (
                      <p className='text-muted-foreground col-span-2 truncate text-xs'>
                        <strong>Service / URL:</strong>{' '}
                        {enquiryData.forwardingServiceName}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Warehouse Verification & Weight Proof */}
              {(enquiryData.weightProofImageUrl || enquiryData.status === 'PICKED_UP' || enquiryData.volumetricWeight) && (
                <div className='rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20'>
                  <div className='flex items-center justify-between mb-2'>
                    <Label className='font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5'>
                      <Scale className='h-4 w-4' />
                      Warehouse Intake & Weight Verification
                    </Label>
                    <Badge variant='outline' className='bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'>
                      PICKED UP
                    </Badge>
                  </div>
                  <div className='grid grid-cols-2 gap-2 text-sm'>
                    <p>
                      <strong>Verified Weight:</strong>{' '}
                      <span className='font-bold text-emerald-600 dark:text-emerald-400'>
                        {enquiryData.weight ? `${enquiryData.weight} kg` : '-'}
                      </span>
                    </p>
                    <p>
                      <strong>Volumetric Weight:</strong>{' '}
                      <span className='font-bold text-blue-600 dark:text-blue-400'>
                        {enquiryData.volumetricWeight ? `${enquiryData.volumetricWeight} kg` : '-'}
                      </span>
                    </p>
                    {enquiryData.chargeableWeight && (
                      <p>
                        <strong>Chargeable Weight:</strong>{' '}
                        <span className='font-bold text-violet-600 dark:text-violet-400'>
                          {enquiryData.chargeableWeight} kg
                        </span>
                      </p>
                    )}
                    {enquiryData.pickupStaffName && (
                      <p>
                        <strong>Rider / Staff:</strong> {enquiryData.pickupStaffName}
                      </p>
                    )}
                    {enquiryData.pickedUpAt && (
                      <p className='col-span-2 text-xs text-muted-foreground'>
                        <strong>Intake Date:</strong>{' '}
                        {new Date(enquiryData.pickedUpAt).toLocaleString()}
                      </p>
                    )}
                    {enquiryData.pickupNotes && (
                      <p className='col-span-2 text-xs text-muted-foreground bg-background/80 p-2 rounded border'>
                        <strong>Rider Note:</strong> {enquiryData.pickupNotes}
                      </p>
                    )}
                  </div>

                  {enquiryData.weightProofImageUrl && (
                    <div className='mt-3 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/60'>
                      <div className='text-xs font-semibold text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center gap-1'>
                        <Camera className='h-3.5 w-3.5' />
                        <span>Weighing Scale Proof Photo</span>
                      </div>
                      <a
                        href={enquiryData.weightProofImageUrl}
                        target='_blank'
                        rel='noreferrer'
                        className='block overflow-hidden rounded-md border border-emerald-300 max-w-xs hover:opacity-90 transition-opacity'
                      >
                        <img
                          src={enquiryData.weightProofImageUrl}
                          alt='Scale Proof'
                          className='h-36 w-auto object-cover rounded'
                        />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Pickup Locations */}
              <div className='bg-muted/10 rounded-lg border p-4 shadow-sm'>
                <div className='mb-4 flex items-center justify-between'>
                  <Label className='text-primary text-base font-bold'>
                    Pickup Locations
                  </Label>
                  {isEditableStatus && !isPickup && (
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={handleAddLocation}
                      className='border-primary text-primary hover:bg-primary/5 h-8 px-2'
                    >
                      <IconPlus size={16} className='mr-1' /> Add Location
                    </Button>
                  )}
                </div>
                <div className='space-y-4'>
                  {pickupLocations.map((loc) => (
                    <div
                      key={loc.id}
                      className='bg-background border-border flex items-start gap-2 rounded-md border p-3 shadow-sm'
                    >
                      <div className='flex-1 space-y-2'>
                        <div>
                          <Label className='text-muted-foreground ml-1 text-[10px] uppercase'>
                            Location
                          </Label>
                          <Input
                            placeholder='Enter pickup address'
                            value={loc.location}
                            readOnly={!isEditableStatus || isPickup}
                            onChange={(e) =>
                              handleUpdateLocation(
                                loc.id,
                                'location',
                                e.target.value
                              )
                            }
                            className='h-9 text-sm'
                          />
                        </div>
                        <div>
                          <Label className='text-muted-foreground ml-1 text-[10px] uppercase'>
                            Phone Number
                          </Label>
                          <Input
                            placeholder='Enter contact number'
                            value={loc.phoneNumber}
                            readOnly={!isEditableStatus || isPickup}
                            onChange={(e) =>
                              handleUpdateLocation(
                                loc.id,
                                'phoneNumber',
                                e.target.value
                              )
                            }
                            className='h-9 text-sm'
                          />
                        </div>
                        <div>
                          <Label className='text-muted-foreground ml-1 text-[10px] uppercase'>
                            Note
                          </Label>
                          <Input
                            placeholder='Enter pickup note'
                            value={loc.note || ''}
                            readOnly={!isEditableStatus || isPickup}
                            onChange={(e) =>
                              handleUpdateLocation(
                                loc.id,
                                'note',
                                e.target.value
                              )
                            }
                            className='h-9 text-sm'
                          />
                        </div>
                      </div>
                      {isEditableStatus && !isPickup && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => handleRemoveLocation(loc.id)}
                          className='text-destructive hover:text-destructive hover:bg-destructive/10 mt-6 h-9 w-9'
                        >
                          <IconTrash size={18} />
                        </Button>
                      )}
                    </div>
                  ))}
                  {pickupLocations.length === 0 && (
                    <p className='text-muted-foreground bg-background rounded-md border border-dashed py-4 text-center text-sm italic'>
                      No pickup locations assigned.
                    </p>
                  )}

                  {pickupLocations.length > 0 &&
                    isEditableStatus &&
                    !isPickup && (
                      <div className='pt-2'>
                        <Button
                          onClick={handleSaveChanges}
                          disabled={updating}
                          className='bg-primary hover:bg-primary/90 w-full'
                        >
                          {updating
                            ? 'Updating Pickup Details...'
                            : 'Update Pickup Locations'}
                        </Button>
                      </div>
                    )}
                </div>
              </div>

              {/* Items */}
              {enquiryData.items && enquiryData.items.length > 0 && (
                <div className='rounded-lg border p-4 shadow-sm'>
                  <Label className='text-muted-foreground mb-2 block'>
                    Items
                  </Label>
                  <ul className='list-disc space-y-1 pl-5 text-sm'>
                    {enquiryData.items.map((item: any) => (
                      <li key={item.id || item.description}>
                        <strong>{item.description}</strong> | Qty:{' '}
                        {item.quantity} | Weight: {item.weight} | Value:{' '}
                        {item.value} | Unit Price: {item.unitPrice} | HS Code:{' '}
                        {item.hsCode}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Boxes */}
              {enquiryData.boxes && enquiryData.boxes.length > 0 && (
                <div className='rounded-lg border p-4 shadow-sm'>
                  <Label className='text-muted-foreground mb-2 block'>
                    Boxes
                  </Label>
                  <ul className='space-y-3 pl-0 text-sm'>
                    {enquiryData.boxes.map((box: any, idx: number) => (
                      <li
                        key={box.id || idx}
                        className='mb-2 border-b pb-2 last:mb-0 last:border-b-0 last:pb-0'
                      >
                        <div>
                          <strong>Box {idx + 1}</strong>
                        </div>
                        <div>
                          Dimensions: {box.length} x {box.breadth} x{' '}
                          {box.height}
                        </div>
                        <div>Weight: {box.weight}</div>
                        <div>Value: {box.value}</div>
                        <div>Quantity: {box.quantity}</div>
                        <div>Multiplier: {box.multiplier}</div>
                        {box.items && box.items.length > 0 && (
                          <div className='mt-1'>
                            <span className='font-medium'>
                              Items in this box:
                            </span>
                            <ul className='list-disc pl-5'>
                              {box.items.map((boxItem: any) => (
                                <li key={boxItem.id}>
                                  {boxItem.enquiryItem?.description || 'Item'} |
                                  Qty: {boxItem.quantity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className='mt-4 flex justify-end px-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
