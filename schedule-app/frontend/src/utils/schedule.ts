import type {
  Priority,
  Schedule,
  ScheduleFormErrors,
  ScheduleInput,
  ScheduleStatus,
} from '../types/schedule'

export const priorityLabels: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
}

export const statusLabels: Record<ScheduleStatus, string> = {
  todo: '待办',
  done: '已完成',
  cancelled: '已取消',
}

export const emptyScheduleInput: ScheduleInput = {
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  priority: 'medium',
  status: 'todo',
}

export function validateScheduleInput(
  input: ScheduleInput,
): ScheduleFormErrors {
  const errors: ScheduleFormErrors = {}

  if (input.title.trim() === '') {
    errors.title = '标题不能为空'
  }

  if (input.startTime === '') {
    errors.startTime = '开始时间不能为空'
  }

  if (input.endTime === '') {
    errors.endTime = '结束时间不能为空'
  }

  if (input.startTime !== '' && input.endTime !== '') {
    const start = new Date(input.startTime).getTime()
    const end = new Date(input.endTime).getTime()

    if (Number.isNaN(start)) {
      errors.startTime = '开始时间格式不正确'
    }

    if (Number.isNaN(end)) {
      errors.endTime = '结束时间格式不正确'
    }

    if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
      errors.endTime = '结束时间不能早于开始时间'
    }
  }

  return errors
}

export function hasFormErrors(errors: ScheduleFormErrors): boolean {
  return Object.keys(errors).length > 0
}

export function toApiInput(input: ScheduleInput): ScheduleInput {
  return {
    ...input,
    title: input.title.trim(),
    description: input.description.trim(),
    location: input.location.trim(),
    startTime: new Date(input.startTime).toISOString(),
    endTime: new Date(input.endTime).toISOString(),
  }
}

export function scheduleToInput(schedule: Schedule): ScheduleInput {
  return {
    title: schedule.title,
    description: schedule.description,
    startTime: toDateTimeLocalValue(schedule.startTime),
    endTime: toDateTimeLocalValue(schedule.endTime),
    location: schedule.location,
    priority: schedule.priority,
    status: schedule.status,
  }
}

export function toDateTimeLocalValue(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offsetMs = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function summarizeScheduleTime(schedule: Schedule): string {
  return `${formatDateTime(schedule.startTime)} - ${formatDateTime(schedule.endTime)}`
}
