// src/app/users/page.tsx
import { useCallback, useState } from 'react'
import http from '@/utils/http'
import { USER_ENDPOINTS } from '@/constants/endpoint'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { columns } from './components/users-columns'
import { UsersDialogs } from './components/users-dialogs'
import { UsersPrimaryButtons } from './components/users-primary-buttons'
import { UsersTable } from './components/users-table'
import UsersProvider from './context/users-context'

interface UserApiResponse {
  id: number
  fullName: string | null
  email: string
  role: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  phoneNumber: string | null
  address1?: string | null
  address2?: string | null
  city?: string | null
  state?: string | null
  postcode?: string | null
  country?: string | null
  countryId?: string | number | null
  isOrganization?: boolean | null
  organizationName?: string | null
}

export default function Users() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalRows, setTotalRows] = useState(0)
  const [pageCount, setPageCount] = useState(0)

  const fetchData = useCallback(
    async (params: { limit: number; page: number; skip: number; search: string }) => {
      try {
        setLoading(true)
        const qs = new URLSearchParams()
        qs.append('limit', params.limit.toString())
        qs.append('page', params.page.toString())
        qs.append('skip', params.skip.toString())
        if (params.search) qs.append('search', params.search)

        const response = await http.get<any>(
          `${USER_ENDPOINTS.GET_ALL_ADMIN}?${qs.toString()}`
        )

        console.log('Admin response:', response)

        const apiResponse =
          response?.admins || (Array.isArray(response) ? response : [])

        // Read total and totalPages from response.pagination
        setTotalRows(response?.pagination?.total ?? apiResponse.length)
        setPageCount(response?.pagination?.totalPages ?? 1)

        const transformedData = apiResponse.map((user: UserApiResponse) => ({
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          isActive: user.isActive,
          role:
            typeof user.role === 'object' && user.role
              ? (user.role as any).name
              : user.role || 'ADMIN',
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
          address1: user.address1,
          address2: user.address2,
          city: user.city,
          state: user.state,
          postcode: user.postcode,
          country: user.country,
          countryId: user.countryId,
          isOrganization: user.isOrganization,
          organizationName: user.organizationName,
        }))

        setData(transformedData)
      } catch (err) {
        console.error('Error fetching users:', err)
        setError('Failed to load users')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  if (error) return <div>{error}</div>

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
      </Header>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              Manage your users and their roles here.
            </p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <UsersTable
            data={data}
            columns={columns}
            onFetchData={fetchData}
            totalRows={totalRows}
            pageCount={pageCount}
            loading={loading}
          />
        </div>
      </Main>
      <UsersDialogs />
    </UsersProvider>
  )
}
