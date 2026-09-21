import { Country } from './country'

export type Zone = {
  id: number
  name: string
  description?: string
  weightLimit: number
  countries?: Country[]
  createdAt?: string
  updatedAt?: string
}
