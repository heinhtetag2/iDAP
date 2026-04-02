import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse } from './types'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.idap.mn/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else if (token) resolve(token)
  })
  failedQueue = []
}

function getTokens() {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state ?? null
  } catch {
    return null
  }
}

function setTokens(accessToken: string, refreshToken: string) {
  try {
    const raw = localStorage.getItem('auth-storage')
    if (!raw) return
    const parsed = JSON.parse(raw)
    parsed.state.accessToken = accessToken
    parsed.state.refreshToken = refreshToken
    localStorage.setItem('auth-storage', JSON.stringify(parsed))
  } catch {
    // noop
  }
}

function clearTokens() {
  localStorage.removeItem('auth-storage')
  window.location.href = '/login'
}

// Request interceptor: attach access token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const state = getTokens()
  if (state?.accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${state.accessToken}`
  }
  return config
})

// Response interceptor: unwrap envelope + handle 401
apiClient.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>
    if (body.success) {
      return { ...response, data: body.data, meta: body.meta }
    }
    return Promise.reject(body.error)
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || originalRequest._retry) {
      const apiError = error.response?.data?.error ?? {
        code: 'NETWORK_ERROR',
        message: error.message,
      }
      return Promise.reject(apiError)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const state = getTokens()
      if (!state?.refreshToken) {
        clearTokens()
        return Promise.reject(error)
      }

      const { data } = await axios.post(`${API_BASE_URL}/auth/token/refresh`, {
        refresh_token: state.refreshToken,
      })

      const { access_token, refresh_token } = data.data
      setTokens(access_token, refresh_token)
      processQueue(null, access_token)

      originalRequest.headers.Authorization = `Bearer ${access_token}`
      return apiClient(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearTokens()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
