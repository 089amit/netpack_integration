import { useEffect, useState } from 'react'
import { getUserRole } from '@/lib/auth'
import http from '@/utils/http'
import { ANALYTICS_ENDPOINTS } from '@/constants/endpoint'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Overview } from './components/overview'
import { RecentEnquiry } from './components/recent-sales'

export default function Dashboard() {
  const [metrics, setMetrics] = useState<{ title: string; value: number }[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await http.get<any>(ANALYTICS_ENDPOINTS.DASHBOARD)
        const role = getUserRole()
        let data = response || []

        if (role === 'ADMIN') {
          data = data.filter(
            (item: any) =>
              item.title.toLowerCase() !== 'in-delivery' &&
              item.title.toLowerCase() !== 'in delivery'
          )
        }

        setMetrics(data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setMetrics([])
      }
    }

    fetchDashboardData()
  }, [])

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header />

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-2 flex items-center justify-between space-y-2'>
          <h1 className='text-2xl font-bold tracking-tight'>Dashboard</h1>
        </div>
        <Tabs
          orientation='vertical'
          defaultValue='overview'
          className='space-y-4'
        >
          <TabsContent value='overview' className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {metrics.map((metric) => (
                <Card key={metric.title}>
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      {metric.title}
                    </CardTitle>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      className='text-muted-foreground h-4 w-4'
                    >
                      <path d='M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className='text-2xl font-bold'>{metric.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>Shipment Overview</CardTitle>
                </CardHeader>
                <CardContent className='pl-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>Recent Shipments</CardTitle>
                  <CardDescription>Latest shipment activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentEnquiry />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}
