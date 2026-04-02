export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: PaginationMeta
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

export interface PaginationMeta {
  total?: number
  cursor?: string
  has_next: boolean
}

export interface CursorParams {
  cursor?: string
  limit?: number
}

export interface PaginatedData<T> {
  items: T[]
  cursor?: string
  has_next: boolean
}
