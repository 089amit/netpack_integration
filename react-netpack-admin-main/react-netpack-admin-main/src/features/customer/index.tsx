import { useEffect, useState } from 'react'
import { useSearch, useNavigate } from '@tanstack/react-router'
import { Customer, CustomerResponse } from '@/type/customer'
import http from '@/utils/http'
import { USER_ENDPOINTS } from '@/constants/endpoint'
// import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { useCustomerColumns } from './components/columns'
import { DataTable } from './components/data-table'
import { TasksDialogs } from './components/tasks-dialogs'
import { CustomerPrimaryButton } from './components/tasks-primary-buttons'
import TasksProvider from './context/tasks-context'

function CustomersContent({ refreshKey }: { refreshKey: number }) {
  const searchParams = useSearch({ from: '/_authenticated/customers/' })
  const navigate = useNavigate()
  const [data, setData] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get values from search params (typed and validated by Route)
  const page = parseInt(searchParams.page ?? '1')
  const limit = parseInt(searchParams.limit ?? '10')
  const search = searchParams.search
  const genders = searchParams.gender || []
  const countryIds = searchParams.countryId || []
  const isOrganization = searchParams.isOrganization

  const [paginationData, setPaginationData] = useState({
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  // Get columns with country name support
  const columns = useCustomerColumns()

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      let url = `${USER_ENDPOINTS.GET_ALL_CUSTOMER}?page=${page}&limit=${limit}`

      if (search) {
        url += `&search=${encodeURIComponent(search)}`
      }
      if (genders.length > 0) {
        url += `&gender=${genders.join(',')}`
      }
      if (countryIds.length > 0) {
        url += `&countryId=${countryIds.join(',')}`
      }
      if (isOrganization === 'true' || isOrganization === 'false') {
        url += `&isOrganization=${isOrganization}`
      }

      const result = await http.get<CustomerResponse>(url)
      setData(result.data)

      // Update pagination data from API response
      if (result.pagination) {
        setPaginationData({
          totalItems: result.pagination.totalItems,
          totalPages: result.pagination.totalPages,
          hasNextPage: result.pagination.hasNextPage,
          hasPreviousPage: result.pagination.hasPreviousPage,
        })
      }
    } catch (err) {
      setError('Failed to load customers')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [
    page, 
    limit, 
    search, 
    genders.join(','), 
    countryIds.join(','), 
    isOrganization, 
    refreshKey
  ])

  const handleUpdateParams = (params: Record<string, any>) => {
    navigate({
      search: ((prev: any) => {
        const next = { ...prev, ...params }

        // Ensure page and limit are strings for router schema
        if (next.page) next.page = String(next.page)
        if (next.limit) next.limit = String(next.limit)

        // Clean up empty values or empty arrays
        Object.keys(next).forEach((key) => {
          if (
            next[key] === undefined ||
            next[key] === '' ||
            (Array.isArray(next[key]) && next[key].length === 0)
          ) {
            delete next[key]
          }
        })
        // Reset to page 1 if search or filters change (unless page is explicitly updated)
        if (
          params.page === undefined &&
          (params.search !== undefined ||
            params.gender !== undefined ||
            params.countryId !== undefined ||
            params.isOrganization !== undefined)
        ) {
          next.page = '1'
        }
        return next
      }) as any,
    })
  }

  const handleReset = () => {
    navigate({ search: {} as any })
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  return (
    <>
      <Header fixed>
        <Search />
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Customers</h2>
            <p className='text-muted-foreground'>
              Here&apos;s a list of your recent customers!
            </p>
          </div>
          <CustomerPrimaryButton />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <DataTable
            data={data}
            columns={columns}
            paginationData={paginationData}
            page={page}
            limit={limit}
            onPageChange={(newPage, newPageSize) => {
              handleUpdateParams({ page: newPage, limit: newPageSize })
            }}
            onFilterChange={(filters) => {
              handleUpdateParams(filters)
            }}
            onReset={handleReset}
          />
        </div>
      </Main>
      <TasksDialogs />
    </>
  )
}

export default function Customers() {
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <TasksProvider refreshCustomers={handleRefresh}>
      <CustomersContent refreshKey={refreshKey} />
    </TasksProvider>
  )
}
