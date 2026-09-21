import { useEffect, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import http from '@/utils/http'
import { ANALYTICS_ENDPOINTS } from '@/constants/endpoint'

export function Overview() {
  const [data, setData] = useState<{ name: string; total: number }[]>([])

  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const response = await http.get<any>(ANALYTICS_ENDPOINTS.MONTHLY_SHIPMENTS)
        setData(response || [])
      } catch (error) {
        console.error('Error fetching monthly shipments:', error)
        setData([])
      }
    }

    fetchMonthlyData()
  }, [])

  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Bar
          dataKey='total'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-primary'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
