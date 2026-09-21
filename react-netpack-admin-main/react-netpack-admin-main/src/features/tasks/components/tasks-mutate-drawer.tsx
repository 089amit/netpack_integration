'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
// import { showSubmittedData } from '@/utils/show-submitted-data'
import { Trash2 } from 'lucide-react'
import http from '@/utils/http'
import { ENQUIRY_ENDPOINTS } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

// 🧠 Schema allowing multiple selected item IDs per box
const formSchema = z.object({
  enquiryId: z.string(),
  boxes: z.array(
    z.object({
      itemIds: z.array(z.string().min(1)).min(1, 'Select at least one item'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      weight: z.number().min(0, 'Weight cannot be negative'),
      value: z.number().min(0, 'Value cannot be negative'),
    })
  ),
})

type EnquiryForm = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: { id: number | string } | null
}

// 🧩 Multi-select checkbox component
function MultiSelectCheckbox({
  items,
  values,
  onChange,
}: {
  items: { label: string; value: string }[]
  values: string[]
  onChange: (values: string[]) => void
}) {
  const toggle = (val: string) => {
    if (values.includes(val)) {
      onChange(values.filter((v) => v !== val))
    } else {
      onChange([...values, val])
    }
  }

  return (
    <div className='max-h-40 space-y-2 overflow-y-auto rounded border p-2'>
      {items.map((item) => (
        <div key={item.value} className='flex items-center space-x-2'>
          <Checkbox
            checked={values.includes(item.value)}
            onCheckedChange={() => toggle(item.value)}
          />
          <Label>{item.label}</Label>
        </div>
      ))}
    </div>
  )
}

export function EnquiryMutateDrawer({ open, onOpenChange, currentRow }: Props) {
  const form = useForm<EnquiryForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { boxes: [] },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'boxes',
  })

  const [itemOptions, setItemOptions] = useState<
    { label: string; value: string }[]
  >([])

  useEffect(() => {
    if (open && currentRow?.id) {
      const enquiryId = String(currentRow.id)
      form.setValue('enquiryId', enquiryId)

      http
        .get<any>(`${ENQUIRY_ENDPOINTS.GET_ENQUIRY_ITEM}/${enquiryId}`)
        .then((res) => {
          const options = res.map((item: { description: any; id: any }) => ({
            label: item.description || `Item ${item.id}`,
            value: String(item.id),
          }))
          setItemOptions(options)
        })
        .catch(() => setItemOptions([]))
    } else {
      setItemOptions([])
      replace([])
    }
  }, [open, currentRow, replace])

  const onSubmit = (data: EnquiryForm) => {
    console.log('Submit form data:', data)
    http.post(ENQUIRY_ENDPOINTS.ADD_BOX_ITEM, data)
    // TODO: API call here
    form.reset()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-left'>
          <SheetTitle>Assign Items to Boxes</SheetTitle>
          <SheetDescription>
            Select one or more items for each box and provide quantity, weight,
            and value.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            id='enquiry-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 space-y-5 overflow-y-auto px-4'
          >
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-md font-semibold'>Boxes</h3>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    append({ itemIds: [], quantity: 1, weight: 0, value: 0 })
                  }
                >
                  Add Box
                </Button>
              </div>

              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='relative space-y-3 rounded-md border p-3'
                >
                  <Button
                    type='button'
                    size='icon'
                    variant='ghost'
                    className='absolute top-2 right-2 text-red-600'
                    onClick={() => remove(index)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>

                  <FormField
                    control={form.control}
                    name={`boxes.${index}.itemIds`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Items</FormLabel>
                        <FormControl>
                          <MultiSelectCheckbox
                            items={itemOptions}
                            values={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='grid grid-cols-3 gap-2'>
                    <FormField
                      control={form.control}
                      name={`boxes.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`boxes.${index}.weight`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`boxes.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Value</FormLabel>
                          <FormControl>
                            <Input
                              type='number'
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          </form>
        </Form>

        <SheetFooter className='mt-4 gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
          <Button form='enquiry-form' type='submit'>
            Save changes
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
