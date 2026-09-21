import { useEffect, useState } from 'react'
import { Country } from '@/type/country'
import { Zone } from '@/type/zone'
import http from '@/utils/http'
import { COUNTRY_ENDPOINT, ZONE_ENDPOINT } from '@/constants/endpoint'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { columns } from './components/columns'
import { DataTable } from './components/data-table'
import { zoneColumns } from './components/zone-columns'
import { ZoneDrawer } from './components/zone-drawer'
import { useZone } from './context/zone-context'

export default function CountryZoneTabs() {
  const [countryData, setCountryData] = useState<Country[]>([])
  const [zoneData, setZoneData] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const {
    state: zoneState,
    setOpen: setZoneOpen,
    setCurrentRow: setZoneCurrentRow,
  } = useZone()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch countries
        const result = await http.get<any>(
          COUNTRY_ENDPOINT.GET_ALL_COUNTRY
        )
        setCountryData(result?.data || (Array.isArray(result) ? result : []))

        // Fetch zones using the new API
        const zoneRes = await http.get<any>(
          ZONE_ENDPOINT.GET_ALL_ZONES
        )
        setZoneData(zoneRes?.data || (Array.isArray(zoneRes) ? zoneRes : []))
      } catch (err) {
        setError('Failed to load data.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleZoneEdit = (zone: Zone) => {
    setZoneCurrentRow(zone)
    setZoneOpen('update')
  }

  const handleZoneCreate = () => {
    setZoneCurrentRow(null)
    setZoneOpen('create')
  }

  const zoneCols = zoneColumns(handleZoneEdit)

  return (
    <Tabs defaultValue='country' className='w-full'>
      <TabsList>
        <TabsTrigger value='country'>Country</TabsTrigger>
        <TabsTrigger value='zone'>Zone</TabsTrigger>
      </TabsList>
      <TabsContent value='country'>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (
          <DataTable
            data={countryData || []}
            columns={columns}
            apiEndpoint={COUNTRY_ENDPOINT.GET_ALL_COUNTRY}
          />
        )}
      </TabsContent>
      <TabsContent value='zone'>
        <div className='mb-2 flex justify-end'>
          <Button onClick={handleZoneCreate}>Create Zone</Button>
        </div>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (
          <DataTable
            data={zoneData || []}
            columns={zoneCols}
            apiEndpoint={ZONE_ENDPOINT.GET_ALL_ZONES}
          />
        )}
        <ZoneDrawer
          open={zoneState.open === 'create' || zoneState.open === 'update'}
          onOpenChange={(open: boolean) => {
            if (!open) setZoneOpen('')
          }}
          initialData={zoneState.currentRow}
        />
      </TabsContent>
    </Tabs>
  )
}
