export interface ForwardingCompanyItem {
  id: string
  name: string
  contactEmail: string
  contactPhone: string
  address: string
  createdAt: string
  updatedAt: string
}

export interface ForwardingCompanyResponse {
  data: {
    id: number
    name: string
    contactEmail: string
    contactPhone: string
    address: string
    createdAt: string
    updatedAt: string
  }[]
}
