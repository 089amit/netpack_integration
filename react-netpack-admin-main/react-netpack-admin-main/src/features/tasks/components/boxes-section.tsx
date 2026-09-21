import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EnquiryFormData, Box } from './enquiry-types'
import { calculateChargeableWeight } from './enquiry-utils'
import { MultiSelectDropdownWithQuantity } from './multi-select-dropdown'

interface BoxesSectionProps {
  formData: EnquiryFormData | null
  onDeleteBox: (index: number) => void
  updateBoxDimension: (boxIdx: number, key: keyof Box, value: number) => void
  onBoxItemSelectionsChange: (
    boxIdx: number,
    itemSelections: { itemId: string; quantity: number }[]
  ) => void
  boxErrors?: {
    length?: boolean
    breadth?: boolean
    height?: boolean
    weight?: boolean
    itemSelections?: boolean
  }[]
}

const isBoxComplete = (box: Box): boolean => {
  return (
    box.length > 0 &&
    box.breadth > 0 &&
    box.height > 0 &&
    box.weight > 0 &&
    box.itemSelections.length > 0
  )
}

export function BoxesSection({
  formData,
  onDeleteBox,
  updateBoxDimension,
  onBoxItemSelectionsChange,
  boxErrors,
}: BoxesSectionProps) {
  /* ===== CW BREAKDOWN & TOTAL (same logic reused) ===== */
  const cwBreakdown =
    formData?.boxes?.map((box, idx) => {
      const volWeight =
        ((box.length || 0) * (box.breadth || 0) * (box.height || 0)) / 5000

      const chareableweight = calculateChargeableWeight(
        box.length || 0,
        box.breadth || 0,
        box.height || 0,
        box.weight || 0
      )

      return {
        boxNo: idx + 1,
        volWeight,
        actualWeight: box.weight || 0,
        chareableweight,
      }
    }) || []

  const totalChargeableWeight = cwBreakdown.reduce(
    (sum, b) => sum + b.chareableweight,
    0
  )

  return (
    <div className='mb-6'>
      <h3 className='mb-4 text-lg font-semibold'>Boxes</h3>

      {/* ===== TOP CW BREAKDOWN (Native Accordion) ===== */}
      {cwBreakdown.length > 0 && (
        <details className='bg-muted/30 mb-4 rounded-lg border'>
          {/* SUMMARY (collapsed view) */}
          <summary className='flex cursor-pointer items-center justify-between px-3 py-2 text-sm font-semibold'>
            <span>Chargeable Weight Summary</span>

            <span>{totalChargeableWeight} kg</span>
          </summary>

          {/* DETAILS (expanded view) */}
          <div className='px-3 pt-2 pb-3'>
            <div className='space-y-1 text-sm'>
              {cwBreakdown.map((b) => (
                <div key={b.boxNo} className='flex justify-between'>
                  <span>
                    Box {b.boxNo}
                    <span className='text-muted-foreground'>
                      {' '}
                      (A: {b.actualWeight}kg · V: {b.volWeight.toFixed(2)}kg)
                    </span>
                  </span>

                  <span
                    className={cn(
                      'font-medium',
                      b.chareableweight > 30 ? 'text-red-600' : 'text-green-700'
                    )}
                  >
                    {b.chareableweight} kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {/* ===== BOX LIST ===== */}
      {formData?.boxes && formData.boxes.length > 0 && (
        <div className='space-y-2'>
          {formData.boxes.map((box, boxIdx) => {
            const isComplete = isBoxComplete(box)
            const volWeight =
              ((box.length || 0) * (box.breadth || 0) * (box.height || 0)) /
              5000
            const lps =
              (box.length || 0) + 2 * (box.breadth || 0) + 2 * (box.height || 0)
            const isVolWarning = volWeight > 30
            const isLpsWarning = lps > 300
            const volHighlight = volWeight > (box.weight || 0)
            const chareableweight = calculateChargeableWeight(
              box.length || 0,
              box.breadth || 0,
              box.height || 0,
              box.weight || 0
            )

            const currentBoxErrors = boxErrors?.[boxIdx]

            return (
              <div
                key={boxIdx}
                className={cn('rounded border p-3', !isComplete && 'bg-red-50')}
              >
                {/* CW badge aligned with dropdown */}
                <div className='mb-2 flex items-center gap-2'>
                  <div
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors',
                      chareableweight > 30
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-800'
                    )}
                  >
                    CW: {chareableweight}
                    {chareableweight > 30 && (
                      <span className='ml-1 text-xs font-normal'>
                        (Overweight)
                      </span>
                    )}
                  </div>
                </div>

                <div className='flex flex-wrap items-end gap-1'>
                  <span className='min-w-12 text-sm font-medium'>
                    Box {boxIdx + 1}
                  </span>

                  <div className='w-16'>
                    <label className='block text-xs font-medium'>L</label>
                    <Input
                      id={`box-${boxIdx}-length`}
                      type='number'
                      placeholder='cm'
                      size={1}
                      value={box.length}
                      onFocus={(e) =>
                        e.target.value === '0' && (e.target.value = '')
                      }
                      onChange={(e) =>
                        updateBoxDimension(
                          boxIdx,
                          'length',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={cn(
                        'h-8',
                        currentBoxErrors?.length &&
                          'border-red-500 ring-1 ring-red-500'
                      )}
                    />
                  </div>

                  <div className='w-16'>
                    <label className='block text-xs font-medium'>B</label>
                    <Input
                      id={`box-${boxIdx}-breadth`}
                      type='number'
                      placeholder='cm'
                      size={1}
                      value={box.breadth}
                      onFocus={(e) =>
                        e.target.value === '0' && (e.target.value = '')
                      }
                      onChange={(e) =>
                        updateBoxDimension(
                          boxIdx,
                          'breadth',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={cn(
                        'h-8',
                        currentBoxErrors?.breadth &&
                          'border-red-500 ring-1 ring-red-500'
                      )}
                    />
                  </div>

                  <div className='w-16'>
                    <label className='block text-xs font-medium'>H</label>
                    <Input
                      id={`box-${boxIdx}-height`}
                      type='number'
                      placeholder='cm'
                      size={1}
                      value={box.height}
                      onFocus={(e) =>
                        e.target.value === '0' && (e.target.value = '')
                      }
                      onChange={(e) =>
                        updateBoxDimension(
                          boxIdx,
                          'height',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={cn(
                        'h-8',
                        currentBoxErrors?.height &&
                          'border-red-500 ring-1 ring-red-500'
                      )}
                    />
                  </div>

                  <div className='w-16'>
                    <label className='block text-xs font-medium'>W</label>
                    <Input
                      id={`box-${boxIdx}-weight`}
                      type='number'
                      placeholder='kg'
                      size={1}
                      value={box.weight}
                      onFocus={(e) =>
                        e.target.value === '0' && (e.target.value = '')
                      }
                      onChange={(e) =>
                        updateBoxDimension(
                          boxIdx,
                          'weight',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={cn(
                        'h-8',
                        currentBoxErrors?.weight &&
                          'border-red-500 ring-1 ring-red-500'
                      )}
                    />
                  </div>

                  <div
                    className={cn(
                      'w-24 rounded px-2 py-1 text-xs',
                      isVolWarning
                        ? 'border border-red-400 bg-red-100'
                        : volHighlight
                          ? 'font-bold text-red-600'
                          : 'bg-muted/40'
                    )}
                  >
                    <div className='font-medium'>
                      Vol: {volWeight.toFixed(2)} kg
                    </div>
                    {isVolWarning && (
                      <div className='text-red-600'>Exceeds 30!</div>
                    )}
                  </div>

                  <div
                    className={cn(
                      'w-20 rounded px-2 py-1 text-xs',
                      isLpsWarning
                        ? 'border border-red-400 bg-red-100'
                        : 'bg-muted/40'
                    )}
                  >
                    <div className='font-medium'>LPS: {lps}</div>
                    {isLpsWarning && (
                      <div className='text-red-600'>Exceeds 300!</div>
                    )}
                  </div>

                  {/* Dropdown aligned with CW */}
                  <div
                    className={cn(
                      'min-w-64 flex-1 rounded-md',
                      currentBoxErrors?.itemSelections &&
                        'ring-2 ring-red-500 ring-offset-2'
                    )}
                  >
                    <MultiSelectDropdownWithQuantity
                      items={formData.items}
                      selectedItems={box.itemSelections}
                      boxIdx={boxIdx}
                      allBoxes={formData.boxes || []}
                      onChange={(itemSelections) =>
                        onBoxItemSelectionsChange(boxIdx, itemSelections)
                      }
                    />
                    {currentBoxErrors?.itemSelections && (
                      <p className='mt-1 text-[10px] font-medium text-red-500'>
                        At least one item required
                      </p>
                    )}
                  </div>

                  <Button
                    type='button'
                    variant='destructive'
                    size='sm'
                    onClick={() => onDeleteBox(boxIdx)}
                    className='h-8 w-8 p-0'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
