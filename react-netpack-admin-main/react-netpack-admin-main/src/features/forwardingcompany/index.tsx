'use client'

import { useEffect, useState } from 'react'
import {
  ForwardingCompanyItem,
  ForwardingCompanyResponse,
} from '@/type/forwardingCompany'
import http from '@/utils/http'
import { FORWARDING_COMPANY_ENDPOINTS } from '@/constants/endpoint'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { TasksDialogs } from './components/tasks-dialogs'
import { EnquiryPrimaryButton } from './components/tasks-primary-buttons'
import TasksProvider from './context/tasks-context'

export default function ForwardingCompanies() {
  const [data, setData] = useState<ForwardingCompanyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchForwardingCompanies = async () => {
    try {
      const result = await http.get<ForwardingCompanyResponse>(
        FORWARDING_COMPANY_ENDPOINTS.GET_ALL_COMPANIES
      )

      if (result?.data) {
        const mappedData = result.data.map((company) => ({
          id: company.id.toString(),
          name: company.name,
          contactEmail: company.contactEmail || '',
          contactPhone: company.contactPhone || '',
          address: company.address || '',
          createdAt: new Date(company.createdAt).toLocaleDateString(),
          updatedAt: new Date(company.updatedAt).toLocaleDateString(),
        }))

        setData(mappedData)
      }
    } catch (err) {
      setError('Failed to load forwarding companies')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchForwardingCompanies()
  }, [refreshKey])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  return (
    <TasksProvider refreshForwardingCompanies={handleRefresh}>
      <Header fixed>
        <Search />
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              Forwarding Companies
            </h2>
            <p className='text-muted-foreground'>
              Here&apos;s a list of registered forwarding companies!
            </p>
          </div>
          <EnquiryPrimaryButton />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <DataTable
            data={data}
            columns={columns}
            onSearchChange={(newData) => {
              const mappedData = (newData as any[]).map((company) => ({
                id: company.id.toString(),
                name: company.name,
                contactEmail: company.contactEmail || '',
                contactPhone: company.contactPhone || '',
                address: company.address || '',
                createdAt: new Date(company.createdAt).toLocaleDateString(),
                updatedAt: new Date(company.updatedAt).toLocaleDateString(),
              }))
              setData(mappedData)
            }}
          />
        </div>
      </Main>

      <TasksDialogs />
    </TasksProvider>
  )
}
