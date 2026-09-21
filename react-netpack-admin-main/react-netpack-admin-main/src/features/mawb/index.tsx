import { useEffect, useState } from 'react'
import { MAWBTableItem, MAWBResponse } from '@/type/mawb'
import http from '@/utils/http'
import { MAWB_ENDPOINTS } from '@/constants/endpoint'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { TasksDialogs } from './components/tasks-dialogs'
import { EnquiryPrimaryButton } from './components/tasks-primary-buttons'
import TasksProvider from './context/tasks-context'

export default function MAWB() {
  const [data, setData] = useState<MAWBTableItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMAWB = async () => {
    setLoading(true)
    try {
      const result = await http.get<MAWBResponse>(MAWB_ENDPOINTS.GET_ALL_MAWBS)

      if (result?.data) {
        const mappedData = result.data.map((mawb: any) => ({
          id: mawb.id.toString(),
          mawbNumber: mawb.mawbNumber,
          departureDate: new Date(mawb.departureDate).toLocaleDateString(),
          departureDateRaw: mawb.departureDate ?? '',
          airlineName: mawb.airlineName || 'N/A',
          destination: mawb.destination ?? 'N/A',
          hasShipment: mawb.hasShipment ?? false,
          documentUrl: mawb.documentUrl ?? '',
          agentId: mawb.agentId ?? null,
          flightNumber: mawb.flightNumber ?? '',
          dateOfArrival: mawb.dateOfArrival ?? '',
          timeOfArrival: mawb.timeOfArrival ?? '',
        }))

        setData(mappedData)
      }
    } catch (err) {
      setError('Failed to load MAWB')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMAWB()
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>{error}</div>

  return (
    <TasksProvider>
      <Header fixed>
        <Search />
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>MAWB</h2>
            <p className='text-muted-foreground'>
              Here&apos;s a list of your recent MAWB!
            </p>
          </div>
          <EnquiryPrimaryButton />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <DataTable data={data} columns={columns} />
        </div>
      </Main>

      <TasksDialogs onRefetch={fetchMAWB} />
    </TasksProvider>
  )
}
