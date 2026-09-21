'use client'

import { useEffect, useState } from 'react'
import { Pagination } from '@/type/pagination'
import { ShipmentItem, Shipment } from '@/type/shipment'
import http from '@/utils/http'
import { SHIPMENT_ENDPOINT } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { BulkNoteDialog } from './components/bulk-note-dialog'
import { BulkStatusChangeDialog } from './components/bulk-shipment-status'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { ShipmentMAWBModal } from './components/mawb-controller-dialog'
import { TasksDialogs } from './components/tasks-dialogs'
import TasksProvider from './context/shipments-context'

export default function Shipments() {
  const [data, setData] = useState<ShipmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedShipments, setSelectedShipments] = useState<ShipmentItem[]>([])
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)

  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string[]>([])

  const handleBulkStatusApply = async (status: string) => {
    try {
      const ids = selectedShipments.map((s) => Number(s.id))
      await http.post(SHIPMENT_ENDPOINT.BULK_STATUS_CHANGE, { id: ids, status }) // adjust endpoint
      fetchShipments(pagination.page, pagination.limit) // refresh table
    } catch (err) {
      console.error('Bulk status change failed:', err)
    }
  }

  const handleBulkNoteApply = async (note: string) => {
    try {
      const ids = selectedShipments.map((s) => Number(s.id))
      await http.post(SHIPMENT_ENDPOINT.BATCH_ADD_NOTE, { id: ids, note })
      fetchShipments(pagination.page, pagination.limit) // refresh table
      setSelectedShipments([])
    } catch (err) {
      console.error('Bulk note add failed:', err)
    }
  }

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchShipments = async (
    currentPage = pagination.page,
    currentLimit = pagination.limit,
    search = debouncedSearchQuery,
    status = statusFilter
  ) => {
    setLoading(true)
    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: currentLimit.toString(),
      })

      // Add search parameter if provided
      if (search.trim()) {
        params.append('search', search.trim())
      }

      // Add status parameter if provided
      if (status.length > 0) {
        params.append('status', status.join(','))
      }

      const result = await http.get<{
        data: Shipment[]
        pagination: Pagination
      }>(`${SHIPMENT_ENDPOINT.ALL_SHIPMENTS}?${params.toString()}`)

      if (result?.data && result?.pagination) {
        const mappedData: ShipmentItem[] = result.data.map((shipment: any) => ({
          id: shipment.id.toString(),
          status: shipment.status,
          customerPhone: shipment.customerPhone || 'N/A',
          destinationCountryName: shipment.destinationCountryName || 'N/A',
          forwardingCompanyName: shipment.forwardingCompanyName || 'N/A',
          serviceName: shipment.serviceName || 'N/A',
          reciverName: shipment.reciverName,
          customerId: shipment.customerId,
          enquiryId: shipment.enquiryId,
          mawbId: shipment.mawbId,
          forwardingCompanyId: shipment.forwardingCompanyId,
          serviceId: shipment.serviceId,
          countryId: shipment.countryId,
          senderName:
            shipment.senderName || shipment.enquiryDetails?.senderName || 'N/A',
          senderPhone:
            shipment.senderPhone ||
            shipment.enquiryDetails?.senderPhone ||
            'N/A',
          senderOrganization:
            shipment.senderOrganization ||
            shipment.enquiryDetails?.senderOrganization ||
            shipment.enquiryDetails?.customer?.organizationName ||
            '',
          mawbNumber: shipment.mawb?.mawbNumber || 'N/A',
          hawbno: shipment.hawbno,
          agentId: shipment.agentId || 0,
          agent: shipment.agent,
          agentCode: shipment.agentCode,
          hawbNumber: shipment.hawbno || shipment.hawbNumber || 'N/A',
          forwardingNumber: shipment.forwardingNumber || '',
          note: shipment.note || '',
        }))
        setData(mappedData)
        setPagination(result.pagination)
      }
    } catch (err) {
      setError('Failed to load shipments')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Optimization: Skip fetching if a search change is currently being debounced
    // to avoid redundant API calls when the page reset is triggered.
    if (searchQuery !== debouncedSearchQuery) return

    fetchShipments()
  }, [pagination.page, pagination.limit, debouncedSearchQuery, statusFilter]) // fetch when these change

  const handleRowSelectionChange = (selectedRows: ShipmentItem[]) => {
    setSelectedShipments(selectedRows)
  }

  const handleMAWBSelect = (selectedMawb: any) => {
    console.log('Selected MAWB:', selectedMawb)
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
    setSelectedShipments([])
  }

  // Handle status filter change
  const handleStatusChange = (status: string[]) => {
    setStatusFilter(status)
    // Reset to first page when filtering
    setPagination((prev) => ({
      ...prev,
      page: 1,
    }))
    // Reset row selection
    setSelectedShipments([])
  }

  // Handle pagination change
  const handlePaginationChange = (newPage: number, newPageSize: number) => {
    setSelectedShipments([])
    setPagination((prev) => ({
      ...prev,
      page: newPage,
      limit: newPageSize,
    }))
    // fetchShipments is triggered by useEffect dependency on pagination
  }

  // if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  return (
    <TasksProvider>
      <Header fixed>
        <Search />
      </Header>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Shipments</h2>
            <p className='text-muted-foreground'>
              Here's a list of your recent shipments!
            </p>
          </div>
        </div>

        {selectedShipments.length > 0 && (
          <div className='mb-4 flex gap-2'>
            <ShipmentMAWBModal
              selectedShipments={selectedShipments}
              onCreate={handleMAWBSelect}
            />
            <Button onClick={() => setBulkDialogOpen(true)}>
              Bulk Status Change
            </Button>
            <Button onClick={() => setNoteDialogOpen(true)}>Add Note</Button>
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

      <BulkStatusChangeDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        onApply={handleBulkStatusApply}
      />

      <BulkNoteDialog
        open={noteDialogOpen}
        onClose={() => setNoteDialogOpen(false)}
        onApply={handleBulkNoteApply}
      />

      <TasksDialogs
        onRefetch={() => fetchShipments(pagination.page, pagination.limit)}
      />
    </TasksProvider>
  )
}
