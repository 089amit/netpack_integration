import { createFileRoute } from '@tanstack/react-router'
import RateCalculatorPage from '@/ratecalc/index'

export const Route = createFileRoute('/_authenticated/ratecalc/')({
  component: RateCalculatorPage,
})
