export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export interface Customer {
  telephone: string
  city: string
  id: number
  name: string
  phone: string
  email: string
  isOrganization: boolean
  organizationName: string | null
  gender: Gender
  address1: string
  address2: string | null
  postcode: string | null
  countryId: number | null
  country?: {
    id: number
    name: string
  }
  createdAt: string
  updatedAt: string
}

export interface CustomerResponse {
  data: Customer[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
