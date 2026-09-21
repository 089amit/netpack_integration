'use client'

import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePolicy } from '../context/policy-context'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, Zap } from 'lucide-react'
import { RichTextEditor } from './rich-text-editor'

const policyFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-_]+$/, 'Slug must be lowercase alphanumeric with hyphens or underscores only'),
  content: z
    .string()
    .min(1, 'Content is required')
    .refine(
      (val) => {
        // Strip HTML tags and check if there's actual text
        const stripped = val.replace(/<[^>]*>/g, '').trim()
        return stripped.length > 0
      },
      { message: 'Content cannot be empty' }
    ),
  isActive: z.boolean(),
})

type PolicyFormValues = z.infer<typeof policyFormSchema>

interface PolicyDialogProps {
  onSuccess?: () => void
}

export function PolicyDialog({ onSuccess }: PolicyDialogProps) {
  const { state, setOpen, createPolicy, updatePolicy } = usePolicy()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [autoGenSlug, setAutoGenSlug] = useState(true)

  const isEdit = state.open === 'update'
  const isOpen = state.open === 'create' || state.open === 'update'

  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      title: '',
      slug: '',
      content: '',
      isActive: true,
    },
  })

  // Format title to a URL-safe slug
  const formatToSlug = (title: string) =>
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-_]/g, '')
      .replace(/[\s]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')

  // Auto-sync slug with title when toggled
  const handleTitleChange = (val: string) => {
    form.setValue('title', val)
    if (autoGenSlug && !isEdit) {
      form.setValue('slug', formatToSlug(val), { shouldValidate: !!val })
    }
  }

  // Reset form on open/close
  useEffect(() => {
    if (isOpen) {
      if (isEdit && state.currentRow) {
        form.reset({
          title: state.currentRow.title,
          slug: state.currentRow.slug,
          content: state.currentRow.content,
          isActive: state.currentRow.isActive,
        })
        setAutoGenSlug(false)
      } else {
        form.reset({ title: '', slug: '', content: '', isActive: true })
        setAutoGenSlug(true)
      }
    }
  }, [isOpen, isEdit, state.currentRow, form])

  const onSubmit = async (formData: PolicyFormValues) => {
    setIsSubmitting(true)
    try {
      let result = false
      if (isEdit && state.currentRow) {
        result = await updatePolicy(state.currentRow.id, formData)
      } else {
        result = await createPolicy(formData)
      }

      if (result) {
        toast.success(isEdit ? 'Terms & policy updated successfully' : 'Terms & policy created successfully')
        setOpen('')
        onSuccess?.()
      } else {
        toast.error('Operation failed. Ensure the slug is unique.')
      }
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const contentValue = form.watch('content')

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setOpen('')}>
      <DialogContent className='max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden gap-0'>

        {/* Header */}
        <DialogHeader className='px-6 py-4 border-b bg-card shrink-0'>
          <div className='flex items-start justify-between gap-4'>
            <div>
              <DialogTitle className='text-xl font-bold flex items-center gap-2'>
                {isEdit ? 'Edit Policy Document' : 'Create Policy Document'}
                {isEdit && state.currentRow?.isActive && (
                  <Badge variant='default' className='text-xs font-normal'>
                    <Zap className='h-3 w-3 mr-1' />
                    Active
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className='mt-0.5'>
                {isEdit
                  ? 'Update the policy title, slug, content, and status below.'
                  : 'Draft a new terms & policy. Use the rich editor — just type or paste from Word/Google Docs.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 flex flex-col min-h-0 overflow-hidden'
          >
            {/* Meta fields */}
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-4 shrink-0 border-b bg-muted/20'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='font-semibold'>Document Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Terms of Service'
                        {...field}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className='h-9'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='slug'
                render={({ field }) => (
                  <FormItem>
                    <div className='flex items-center justify-between'>
                      <FormLabel className='font-semibold'>URL Slug</FormLabel>
                      {!isEdit && (
                        <button
                          type='button'
                          onClick={() => {
                            const newState = !autoGenSlug
                            setAutoGenSlug(newState)
                            if (newState) {
                              form.setValue('slug', formatToSlug(form.getValues('title')), {
                                shouldValidate: true,
                              })
                            }
                          }}
                          className='flex items-center gap-1 text-xs text-primary hover:underline font-medium'
                        >
                          <RefreshCw className={`h-3 w-3 ${autoGenSlug ? 'animate-spin' : ''}`} />
                          {autoGenSlug ? 'Auto' : 'Sync with Title'}
                        </button>
                      )}
                    </div>
                    <FormControl>
                      <div className='relative'>
                        <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none'>
                          /
                        </span>
                        <Input
                          placeholder='terms-of-service'
                          {...field}
                          className='h-9 pl-5 font-mono text-sm'
                          onChange={(e) => {
                            field.onChange(e)
                            setAutoGenSlug(false)
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Rich Text Editor — takes all remaining vertical space */}
            <div className='flex-1 min-h-0 px-6 py-4 overflow-hidden flex flex-col gap-2'>
              <FormField
                control={form.control}
                name='content'
                render={({ field }) => (
                  <FormItem className='flex-1 min-h-0 flex flex-col space-y-1.5'>
                    <FormLabel className='font-semibold shrink-0'>
                      Content
                      <span className='text-muted-foreground font-normal ml-2 text-xs'>
                        (supports rich formatting — paste from Word/Google Docs/web)
                      </span>
                    </FormLabel>
                    <FormControl className='flex-1 min-h-0'>
                      <div className='flex-1 min-h-0 h-full'>
                        <RichTextEditor
                          content={contentValue}
                          onChange={(html) => field.onChange(html)}
                          placeholder='Start typing your policy here... or paste text from Word, Google Docs, or anywhere else — formatting is preserved automatically.'
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Footer */}
            <div className='flex items-center justify-between px-6 py-4 border-t bg-card shrink-0 gap-4'>
              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center space-x-3 space-y-0'>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <FormLabel className='text-sm font-semibold cursor-pointer leading-none'>
                        Publish as Active
                      </FormLabel>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        This will deactivate all other policies.
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter className='gap-2 sm:gap-2 flex-row'>
                <Button type='button' variant='outline' onClick={() => setOpen('')} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type='submit' disabled={isSubmitting} className='min-w-[120px]'>
                  {isSubmitting
                    ? isEdit
                      ? 'Saving...'
                      : 'Creating...'
                    : isEdit
                      ? 'Save Changes'
                      : 'Create Policy'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
