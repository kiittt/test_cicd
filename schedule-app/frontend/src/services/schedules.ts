import type {
  Schedule,
  ScheduleFilters,
  ScheduleInput,
} from '../types/schedule'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

interface ApiErrorBody {
  message?: string
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function listSchedules(
  filters: ScheduleFilters,
): Promise<Schedule[]> {
  const params = new URLSearchParams()

  if (filters.keyword.trim() !== '') {
    params.set('keyword', filters.keyword.trim())
  }

  if (filters.status !== '') {
    params.set('status', filters.status)
  }

  if (filters.date !== '') {
    params.set('date', filters.date)
  }

  const query = params.toString()
  return request<Schedule[]>(`/api/schedules${query === '' ? '' : `?${query}`}`)
}

export async function createSchedule(input: ScheduleInput): Promise<Schedule> {
  return request<Schedule>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function updateSchedule(
  id: number,
  input: ScheduleInput,
): Promise<Schedule> {
  return request<Schedule>(`/api/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export async function deleteSchedule(id: number): Promise<void> {
  await request<void>(`/api/schedules/${id}`, {
    method: 'DELETE',
  })
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiErrorBody
    if (body.message != null && body.message !== '') {
      return body.message
    }
  } catch {
    return `请求失败：${response.status}`
  }

  return `请求失败：${response.status}`
}
