'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Globe,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Eye,
  CheckCircle2,
  Radio,
  ExternalLink,
} from 'lucide-react'
import http from '@/utils/http'
import { WEBSITE_CONTENT_ENDPOINTS } from '@/constants/endpoint'
import { WebsiteContent } from '@/type/website-content'

const DEFAULT_CONTENT: WebsiteContent = {
  heroTitle: 'Fast & Reliable Courier Services in Teku, Kathmandu',
  heroSubtitle:
    'Your trusted partner for secure package delivery across Nepal and worldwide. Track your shipment in real-time.',
  heroBadge: 'Teku, Kathmandu Headquarters',
  contactPhone: '015339942',
  contactEmail: 'admin@netpacklogistic.com',
  contactAddress: 'Teku Road, Ward No. 15, Kathmandu, Nepal',
  businessHours: '10:00 am - 5:00 pm (Sun - Fri)',
  tickerItems: [
    'Air Cargo Route: KTM ➔ DXB (Daily Direct)',
    'Kathmandu Valley Pickup: Active (20-30 min dispatch)',
    'TIA Customs Clearance: Operational',
    'Coverage: 75+ Hubs Across Nepal & Worldwide',
  ],
}

export default function WebsiteContentPage() {
  const [formData, setFormData] = useState<WebsiteContent>(DEFAULT_CONTENT)
  const [newTickerInput, setNewTickerInput] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Fetch current website content
  const fetchContent = useCallback(async () => {
    try {
      setLoading(true)
      const res = await http.get<any>(WEBSITE_CONTENT_ENDPOINTS.GET)
      if (res && res.heroTitle) {
        setFormData({
          id: res.id,
          heroTitle: res.heroTitle || DEFAULT_CONTENT.heroTitle,
          heroSubtitle: res.heroSubtitle || DEFAULT_CONTENT.heroSubtitle,
          heroBadge: res.heroBadge || DEFAULT_CONTENT.heroBadge,
          contactPhone: res.contactPhone || DEFAULT_CONTENT.contactPhone,
          contactEmail: res.contactEmail || DEFAULT_CONTENT.contactEmail,
          contactAddress: res.contactAddress || DEFAULT_CONTENT.contactAddress,
          businessHours: res.businessHours || DEFAULT_CONTENT.businessHours,
          tickerItems:
            Array.isArray(res.tickerItems) && res.tickerItems.length > 0
              ? res.tickerItems
              : DEFAULT_CONTENT.tickerItems,
          updatedAt: res.updatedAt,
        })
        if (res.updatedAt) {
          setLastSaved(new Date(res.updatedAt))
        }
      }
    } catch (err) {
      console.warn('Could not fetch website content, using defaults:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  // Save changes
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      setSaving(true)
      const res = await http.put<any>(WEBSITE_CONTENT_ENDPOINTS.UPDATE, formData)
      toast.success('Website content updated successfully! Live on homepage.')
      setLastSaved(new Date())
      if (res && res.content) {
        setFormData((prev) => ({
          ...prev,
          ...res.content,
        }))
      }
    } catch (err: any) {
      console.error('Failed to save website content:', err)
      toast.error(err?.message || 'Failed to save website content.')
    } finally {
      setSaving(false)
    }
  }

  // Ticker management
  const handleAddTickerItem = () => {
    const trimmed = newTickerInput.trim()
    if (!trimmed) return
    setFormData((prev) => ({
      ...prev,
      tickerItems: [...prev.tickerItems, trimmed],
    }))
    setNewTickerInput('')
  }

  const handleRemoveTickerItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tickerItems: prev.tickerItems.filter((_, idx) => idx !== index),
    }))
  }

  const handleUpdateTickerItem = (index: number, val: string) => {
    setFormData((prev) => {
      const updated = [...prev.tickerItems]
      updated[index] = val
      return { ...prev, tickerItems: updated }
    })
  }

  const handleResetDefaults = () => {
    if (window.confirm('Reset all website fields back to system defaults?')) {
      setFormData(DEFAULT_CONTENT)
      toast.info('Restored default values. Click "Save Changes" to publish.')
    }
  }

  return (
    <>
      <Header fixed>
        <Search />
      </Header>

      <Main>
        <div className='max-w-6xl mx-auto space-y-6 pb-12'>
          {/* Header Bar */}
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5'>
            <div>
              <div className='flex items-center gap-2'>
                <div className='h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold'>
                  <Globe className='h-5 w-5' />
                </div>
                <h1 className='text-2xl font-bold tracking-tight text-foreground'>
                  Website Content Management
                </h1>
              </div>
              <p className='text-sm text-muted-foreground mt-1'>
                Dynamically customize the homepage hero headlines, contact information, and moving dispatch ticker.
              </p>
            </div>

            <div className='flex items-center gap-2.5 shrink-0'>
              <a
                href='/'
                target='_blank'
                rel='noreferrer'
                className='inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors'
              >
                <Eye className='h-3.5 w-3.5' />
                <span>View Live Site</span>
                <ExternalLink className='h-3 w-3 text-muted-foreground' />
              </a>

              <Button
                variant='outline'
                size='sm'
                className='h-9 text-xs'
                onClick={handleResetDefaults}
                disabled={saving || loading}
              >
                <RotateCcw className='h-3.5 w-3.5 mr-1.5' />
                Reset Defaults
              </Button>

              <Button
                size='sm'
                className='h-9 text-xs font-bold gap-1.5 shadow-sm'
                onClick={() => handleSave()}
                disabled={saving || loading}
              >
                <Save className='h-3.5 w-3.5' />
                <span>{saving ? 'Publishing...' : 'Save & Publish'}</span>
              </Button>
            </div>
          </div>

          {lastSaved && (
            <div className='flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-3.5 py-2 rounded-lg text-xs'>
              <div className='flex items-center gap-2'>
                <CheckCircle2 className='h-4 w-4 shrink-0' />
                <span>Published to homepage • Last updated: {lastSaved.toLocaleString()}</span>
              </div>
              <Badge variant='outline' className='text-[10px] bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'>
                Live Active
              </Badge>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSave} className='space-y-6'>
            {/* 1. Moving Marquee Ticker */}
            <Card className='border shadow-xs'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className='h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center'>
                      <Radio className='h-4 w-4 animate-pulse' />
                    </div>
                    <div>
                      <CardTitle className='text-base font-bold'>Moving Dispatch Ticker</CardTitle>
                      <CardDescription className='text-xs'>
                        These status bulletins scroll continuously in the live marquee at the top of the homepage.
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant='secondary' className='text-xs'>
                    {formData.tickerItems.length} items
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className='space-y-3 pt-1'>
                <div className='space-y-2.5'>
                  {formData.tickerItems.map((item, idx) => (
                    <div key={idx} className='flex items-center gap-2'>
                      <span className='w-6 text-center text-xs font-mono text-muted-foreground shrink-0'>
                        #{idx + 1}
                      </span>
                      <Input
                        value={item}
                        onChange={(e) => handleUpdateTickerItem(idx, e.target.value)}
                        placeholder='e.g. Kathmandu Valley Pickup: Active (20-30 min dispatch)'
                        className='h-9 text-xs'
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => handleRemoveTickerItem(idx)}
                        className='h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0'
                        title='Remove Item'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className='flex items-center gap-2 pt-2 border-t border-dashed border-border'>
                  <Input
                    value={newTickerInput}
                    onChange={(e) => setNewTickerInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTickerItem()
                      }
                    }}
                    placeholder='Add new live dispatch announcement...'
                    className='h-9 text-xs'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleAddTickerItem}
                    disabled={!newTickerInput.trim()}
                    className='h-9 text-xs shrink-0 gap-1'
                  >
                    <Plus className='h-3.5 w-3.5' />
                    <span>Add Item</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 2. Hero Headline Section */}
            <Card className='border shadow-xs'>
              <CardHeader className='pb-3'>
                <div className='flex items-center gap-2'>
                  <div className='h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center'>
                    <Sparkles className='h-4 w-4' />
                  </div>
                  <div>
                    <CardTitle className='text-base font-bold'>Homepage Hero Section</CardTitle>
                    <CardDescription className='text-xs'>
                      The main attention-grabbing headline, location badge, and subtitle at the top of the homepage.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-4 pt-1'>
                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground'>
                    Hero Badge Label
                  </label>
                  <Input
                    value={formData.heroBadge}
                    onChange={(e) => setFormData({ ...formData, heroBadge: e.target.value })}
                    placeholder='e.g. Teku, Kathmandu Headquarters'
                    className='h-9 text-xs'
                  />
                  <p className='text-[11px] text-muted-foreground'>
                    Displayed in the pill tag above the main headline.
                  </p>
                </div>

                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground'>
                    Main Headline Title
                  </label>
                  <Input
                    value={formData.heroTitle}
                    onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                    placeholder='e.g. Fast & Reliable Courier Services in Teku, Kathmandu'
                    className='h-9 text-xs font-semibold'
                  />
                  <p className='text-[11px] text-muted-foreground'>
                    Primary title in big font size on the landing page hero.
                  </p>
                </div>

                <div className='space-y-1.5'>
                  <label className='text-xs font-semibold text-foreground'>
                    Hero Subtitle / Description
                  </label>
                  <Textarea
                    rows={3}
                    value={formData.heroSubtitle}
                    onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                    placeholder='Your trusted partner for secure package delivery across Nepal and worldwide...'
                    className='text-xs resize-y'
                  />
                  <p className='text-[11px] text-muted-foreground'>
                    Introductory overview paragraph below the headline.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 3. Contact & Business Info */}
            <Card className='border shadow-xs'>
              <CardHeader className='pb-3'>
                <div className='flex items-center gap-2'>
                  <div className='h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center'>
                    <MapPin className='h-4 w-4' />
                  </div>
                  <div>
                    <CardTitle className='text-base font-bold'>Contact &amp; Location Details</CardTitle>
                    <CardDescription className='text-xs'>
                      Update the primary contact numbers, email, physical office address, and business hours.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='space-y-4 pt-1'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                      <Phone className='h-3.5 w-3.5 text-blue-500' />
                      <span>Support Phone / Landline</span>
                    </label>
                    <Input
                      value={formData.contactPhone}
                      onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                      placeholder='015339942'
                      className='h-9 text-xs'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                      <Mail className='h-3.5 w-3.5 text-blue-500' />
                      <span>Official Email Address</span>
                    </label>
                    <Input
                      type='email'
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder='admin@netpacklogistic.com'
                      className='h-9 text-xs'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                      <MapPin className='h-3.5 w-3.5 text-emerald-500' />
                      <span>Physical Office Address</span>
                    </label>
                    <Input
                      value={formData.contactAddress}
                      onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })}
                      placeholder='Teku Road, Ward No. 15, Kathmandu, Nepal'
                      className='h-9 text-xs'
                    />
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-foreground flex items-center gap-1.5'>
                      <Clock className='h-3.5 w-3.5 text-amber-500' />
                      <span>Operating Business Hours</span>
                    </label>
                    <Input
                      value={formData.businessHours}
                      onChange={(e) => setFormData({ ...formData, businessHours: e.target.value })}
                      placeholder='10:00 am - 5:00 pm (Sun - Fri)'
                      className='h-9 text-xs'
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Save Bar */}
            <div className='flex items-center justify-end gap-3 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={handleResetDefaults}
                disabled={saving || loading}
                className='text-xs'
              >
                Reset
              </Button>
              <Button
                type='submit'
                disabled={saving || loading}
                className='font-bold text-xs gap-1.5 px-5 shadow-sm'
              >
                <Save className='h-4 w-4' />
                <span>{saving ? 'Publishing Changes...' : 'Save & Publish Changes'}</span>
              </Button>
            </div>
          </form>
        </div>
      </Main>
    </>
  )
}
