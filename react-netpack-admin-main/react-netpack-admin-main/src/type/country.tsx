export type Country = {
  id: number
  name: string
  isActive: boolean
  boxWeightLimit: number
  zoneId: number | null
  rates?: Rate[] // <-- Add this line
}
export type CountryTableItem = {
  id: string
  name: string
  isActive: string
  boxWeightLimit: string
  zoneId: string
}

export type Rate = {
  id?: number
  weightFrom: number
  weightTo: number
  rate: number
  isPerKg: boolean
}
