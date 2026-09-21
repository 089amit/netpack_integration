import { createFileRoute } from '@tanstack/react-router'
import CountriesPage from '@/features/countries'

export const Route = createFileRoute('/_authenticated/country/')({
  component: CountriesPage,
})
