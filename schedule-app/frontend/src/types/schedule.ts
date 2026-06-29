export type Priority = 'low' | 'medium' | 'high'
export type ScheduleStatus = 'todo' | 'done' | 'cancelled'

export interface Schedule {
  id: number
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  priority: Priority
  status: ScheduleStatus
  createdAt: string
  updatedAt: string
}

export interface ScheduleInput {
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  priority: Priority
  status: ScheduleStatus
}

export interface ScheduleFilters {
  keyword: string
  status: '' | ScheduleStatus
  date: string
}

export type ScheduleFormErrors = Partial<Record<keyof ScheduleInput, string>>
