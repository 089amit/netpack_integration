'use client'

import { useEffect, useState, useCallback } from 'react'
import { TermsAndPolicy } from '@/type/policy'
import http from '@/utils/http'
import { POLICIES_ENDPOINTS } from '@/constants/endpoint'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

import { PolicyProvider, usePolicy } from './context/policy-context'
import { columns } from './components/columns'
import { PolicyTable } from './components/policy-table'
import { PolicyDialog } from './components/policy-dialog'
import { PolicyPreviewDialog } from './components/policy-preview-dialog'
import { PolicyDeleteDialog } from './components/policy-delete-dialog'

export default function TermsAndPoliciesPage() {
  return (
    <PolicyProvider>
      <TermsAndPoliciesContent />
    </PolicyProvider>
  )
}

function TermsAndPoliciesContent() {
  const { setOpen, setCurrentRow } = usePolicy()
  const [data, setData] = useState<TermsAndPolicy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch policies from backend API
  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await http.get<{ policies: TermsAndPolicy[] }>(
        POLICIES_ENDPOINTS.GET_ALL
      )
      if (result && result.policies) {
        setData(result.policies)
      } else {
        setData([])
      }
    } catch (err) {
      console.error('Failed to fetch terms and policies:', err)
      setError('Failed to load terms & policies.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPolicies()
  }, [fetchPolicies])

  const handleCreate = () => {
    setCurrentRow(null)
    setOpen('create')
  }

  return (
    <>
      <Header fixed>
        <Search />
      </Header>

      <Main>
        <div className='mb-4 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Terms & Policies</h2>
            <p className='text-muted-foreground text-sm sm:text-base'>
              Manage your organization's legal policies, service terms, and agreements.
            </p>
          </div>
          <Button onClick={handleCreate} className='h-9 gap-1.5'>
            <Plus className='h-4 w-4' />
            <span>Create Policy</span>
          </Button>
        </div>

        {error ? (
          <div className='rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive'>
            {error}
          </div>
        ) : (
          <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
            <PolicyTable columns={columns} data={data} loading={loading} />
          </div>
        )}
      </Main>

      <PolicyDialog onSuccess={fetchPolicies} />
      <PolicyPreviewDialog />
      <PolicyDeleteDialog onSuccess={fetchPolicies} />
    </>
  )
}
