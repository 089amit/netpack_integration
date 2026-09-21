// src/app/enquiries/page.tsx
import { useEffect, useState } from 'react'
import { Enquiry } from '@/type/enquiry'
import { Pagination } from '@/type/pagination'
import { toast } from 'sonner'
import { getUserRole } from '@/lib/auth'
import http from '@/utils/http'
import { useCheckRole } from '@/utils/role-utils'
import { ENQUIRY_ENDPOINTS, SHIPMENT_ENDPOINT } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
// import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { CustomerMutateDrawer } from '../customer/components/tasks-mutate-drawer'
import CustomerTasksProvider from '../customer/context/tasks-context'
import { EnquiryTableRow } from './components/columns'
import { columns, mapEnquiryToTableRow } from './components/columns'
import { DataTable } from './components/data-table'
import { EnquiryModalForm } from './components/enquiry-create-modal'
import { TasksDialogs } from './components/tasks-dialogs'
import { EnquiryPrimaryButton } from './components/tasks-primary-buttons'
import TasksProvider from './context/tasks-context'

export default function Enquiries() {
  const [data, setData] = useState<EnquiryTableRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEnquiries, setSelectedEnquiries] = useState<EnquiryTableRow[]>(
    []
  )
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false)

  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')

  // Status Filter state — default to ENQUIRY_GENERATED + PENDING for PICKUP role
  const [statusFilter, setStatusFilter] = useState<string[]>(() => {
    const role = getUserRole()
    if ((role || '').toUpperCase() === 'PICKUP') {
      return ['ENQUIRY_GENERATED', 'PENDING', 'PICKED_UP']
    }
    return []
  })

  const handleEnquiryCreated = () => {
    setRefreshKey((prev) => prev + 1) // Increment key to trigger refresh
  }

  const handleCreateCustomer = () => {
    setIsCustomerModalOpen(true)
  }

  const handleCustomerCreated = () => {
    setIsCustomerModalOpen(false)
    // Optionally refresh customer data if needed
  }

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch Data with pagination and search
  useEffect(() => {
    // Optimization: Skip fetching if a search change is currently being debounced
    // to avoid redundant API calls when the page reset is triggered.
    if (searchQuery !== debouncedSearchQuery) return

    const fetchEnquiries = async () => {
      try {
        setLoading(true)

        // Build query parameters
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString(),
        })

        // Add search parameter if provided
        if (debouncedSearchQuery.trim()) {
          params.append('search', debouncedSearchQuery.trim())
        }

        // Add status filter if provided
        if (statusFilter.length > 0) {
          // Send as comma-separated string as per user preference
          params.append('status', statusFilter.join(','))
        }

        const result = await http.get<{
          data: Enquiry[]
          pagination: Pagination
        }>(`${ENQUIRY_ENDPOINTS.ALL_ENQUIRY}?${params.toString()}`)
        if (result?.data && result?.pagination) {
          const mappedData = result.data.map((enquiry: Enquiry) =>
            mapEnquiryToTableRow(enquiry)
          )
          setData(mappedData)
          setPagination(result.pagination)
        }
      } catch (err) {
        setError('Failed to load enquiries')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchEnquiries()
  }, [
    refreshKey,
    pagination.page,
    pagination.limit,
    debouncedSearchQuery,
    statusFilter,
  ])

  const handleRowSelectionChange = (selectedRows: EnquiryTableRow[]) => {
    setSelectedEnquiries(selectedRows)
  }

  // Handle pagination change
  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    // Reset row selection when changing pages
    setSelectedEnquiries([])
    setPagination((prev) => ({
      ...prev,
      page: newPage,
      limit: newPageSize,
    }))
  }

  // Handle search change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    // Reset to first page when searching
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }))
    // Reset row selection when searching
    setSelectedEnquiries([])
  }

  // Handle status change
  const handleStatusChange = (status: string[]) => {
    setStatusFilter(status)
    // Reset to first page when filtering
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }))
    // Reset row selection
    setSelectedEnquiries([])
  }

  // const handleCreateWithMAWB = (selectedMawbId: string) => {
  //   console.log('Selected MAWB ID:', selectedMawbId)
  //   console.log('Selected Enquiries:', selectedEnquiries)
  //   // TODO: Call API to link selectedEnquiries with selectedMawbId
  // }
  const handleCreateManifest = () => {
    setIsModalOpen(true)
  }

  // if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  return (
    <TasksProvider onRefresh={handleEnquiryCreated}>
      <Header fixed>
        <Search />
      </Header>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Enquiries</h2>
            <p className='text-muted-foreground'>
              Here&apos;s a list of your recent enquiries!
            </p>
          </div>
          <EnquiryPrimaryButton onClick={handleCreateManifest} />
        </div>

        {!useCheckRole('Operation', 'PICKUP') &&
          selectedEnquiries.length > 0 && (
            <div className='mr-4 mb-4'>
              <Button
                onClick={async () => {
                  const ids = selectedEnquiries.map((enquiry) => enquiry.id)

                  try {
                    await http.post(
                      SHIPMENT_ENDPOINT.MULTI_ENQUIRIES_TO_SHIPMENTS,
                      {
                        enquiryIds: ids, // 👈 include IDs in payload
                      }
                    )
                    toast.success('Pushed to shipment!', { duration: 3000 })
                    setTimeout(() => {
                      handleEnquiryCreated()
                      setSelectedEnquiries([])
                    }, 500) // optional short delay for smoother UX
                  } catch (err) {
                    toast.error('Failed to push to shipment', {
                      duration: 3000,
                    })
                  }
                }}
              >
                Push To Shipment
              </Button>
              <Button
                onClick={async () => {
                  const ids = selectedEnquiries.map((enquiry) => enquiry.id)

                  try {
                    await http.post(
                      SHIPMENT_ENDPOINT.MULTI_ENQUIRIES_TO_SHIPMENTS,
                      {
                        enquiryIds: ids, // 👈 include IDs in payload
                      }
                    )
                    toast.success('Pushed to shipment!', { duration: 3000 })
                    setTimeout(() => {
                      handleEnquiryCreated()
                      setSelectedEnquiries([])
                    }, 500) // optional short delay for smoother UX
                  } catch (err) {
                    toast.error('Failed to push to shipment', {
                      duration: 3000,
                    })
                  }
                }}
              >
                Add Note
              </Button>
            </div>
          )}

        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <DataTable
            data={data}
            columns={columns}
            onRowSelectionChange={handleRowSelectionChange}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
            loading={loading}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            statusFilter={statusFilter}
            onStatusChange={handleStatusChange}
          />
        </div>
      </Main>
      <TasksDialogs />

      {/* Modal for Manifest Form */}
      <EnquiryModalForm
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedEnquiries={selectedEnquiries.map((enquiry) => ({
          id: enquiry.id.toString(),
          customerName: enquiry.senderName,
          customerPhone: enquiry.senderPhone,
          title: enquiry.destinationLocation,
        }))}
        onEnquiryCreated={handleEnquiryCreated}
        onCreateCustomer={handleCreateCustomer}
      />

      {/* Customer Creation Modal */}
      <CustomerTasksProvider>
        <CustomerMutateDrawer
          open={isCustomerModalOpen}
          onOpenChange={setIsCustomerModalOpen}
          onSuccess={handleCustomerCreated}
        />
      </CustomerTasksProvider>
    </TasksProvider>
  )
}
