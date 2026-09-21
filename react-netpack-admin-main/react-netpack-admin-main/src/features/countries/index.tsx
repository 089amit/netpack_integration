import { useEffect, useState } from 'react'
import { Country } from '@/type/country'
import http from '@/utils/http'
import { COUNTRY_ENDPOINT } from '@/constants/endpoint'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import CountryZoneTabs from './CountryZoneTabs'
import { CountryDetailDrawer } from './components/country-drawer'
import { CountryPrimaryButton } from './components/country-primary-buttons'
import { CountryRateDrawer } from './components/country-rate-drawer'
import { CountryProvider, useCountry } from './context/country-context'
import { ZoneProvider } from './context/zone-context'

export default function CountriesPage() {
  const [data, setData] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch Data
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const result = await http.get<any>(
          COUNTRY_ENDPOINT.GET_ALL_COUNTRY
        )

        if (result) {
          setData(result?.data || (Array.isArray(result) ? result : []))
        }
      } catch (err) {
        console.error(err)
        setError('Failed to load countries.')
      } finally {
        setLoading(false)
      }
    }

    fetchCountries()
  }, [])

  return (
    <CountryProvider>
      <ZoneProvider>
        <PageContent
          data={data}
          loading={loading}
          error={error}
          setData={setData}
        />
      </ZoneProvider>
    </CountryProvider>
  )
}

// 👇 Internal component inside the provider
function PageContent({
  loading,
  error,
  // setData,
}: {
  data: any[]
  loading: boolean
  error: string | null
  setData: React.Dispatch<React.SetStateAction<any[]>>
}) {
  const { state, setOpen } = useCountry()

  return (
    <>
      <Header fixed>
        <Search />
      </Header>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Countries</h2>
            <p className='text-muted-foreground'>
              A list of countries we deal with.
            </p>
          </div>
          <CountryPrimaryButton />
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div>{error}</div>
        ) : (
          <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
            <CountryZoneTabs />
          </div>
        )}
      </Main>
      <CountryDetailDrawer />
      <CountryRateDrawer
        open={state.open === 'rate'}
        onOpenChange={(open) => {
          if (!open) setOpen('')
        }}
        initialData={state.currentRow}
      />
    </>
  )
}
