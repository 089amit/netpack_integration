// src/app/agents/page.tsx
import { useEffect, useState } from 'react'
import { AgentTableItem } from '@/type/agent'
import http from '@/utils/http'
import { AGENTS_ENDPOINTS } from '@/constants/endpoint'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { AgentDialogs } from './components/agent-adialogs'
import { EnquiryPrimaryButton } from './components/agent-primary-buttons'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import TasksProvider from './context/tasks-context'

export default function AgentPage() {
  const [data, setData] = useState<AgentTableItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const result = await http.get<{
          message: string
          data: AgentTableItem[]
        }>(AGENTS_ENDPOINTS.GET_ALL_AGENTS)
        const list = Array.isArray(result) ? result : (result?.data || [])
        setData(list)
      } catch (err) {
        setError('Failed to load agents')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
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
            <h2 className='text-2xl font-bold tracking-tight'>Agents</h2>
            <p className='text-muted-foreground'>
              Here&apos;s a list of your agents!
            </p>
          </div>
          <EnquiryPrimaryButton />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <DataTable
            data={data || []}
            columns={columns}
            onSearchChange={(newData) => setData(newData || [])}
          />
        </div>
      </Main>
      <AgentDialogs />
    </TasksProvider>
  )
}
