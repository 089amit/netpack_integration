// types/api-response.ts
import { Pagination } from './pagination'

export interface ApiResponse<T> {
  data: T[]
  pagination: Pagination
}
