import {
  emptyScheduleInput,
  formatDateTime,
  hasFormErrors,
  toApiInput,
  validateScheduleInput,
} from './schedule'

describe('schedule utilities', () => {
  it('validates required title', () => {
    const errors = validateScheduleInput({
      ...emptyScheduleInput,
      title: ' ',
      startTime: '2026-07-01T09:00',
      endTime: '2026-07-01T10:00',
    })

    expect(errors.title).toBe('标题不能为空')
    expect(hasFormErrors(errors)).toBe(true)
  })

  it('validates time range', () => {
    const errors = validateScheduleInput({
      ...emptyScheduleInput,
      title: 'Team sync',
      startTime: '2026-07-01T11:00',
      endTime: '2026-07-01T10:00',
    })

    expect(errors.endTime).toBe('结束时间不能早于开始时间')
  })

  it('converts datetime-local values to API ISO strings', () => {
    const input = toApiInput({
      ...emptyScheduleInput,
      title: '  Team sync  ',
      description: '  Weekly planning  ',
      location: '  Room A  ',
      startTime: '2026-07-01T09:00',
      endTime: '2026-07-01T10:00',
    })

    expect(input.title).toBe('Team sync')
    expect(input.description).toBe('Weekly planning')
    expect(input.location).toBe('Room A')
    expect(input.startTime).toMatch(/^2026-07-01T/)
    expect(input.startTime).toContain(':00.000Z')
  })

  it('formats invalid datetime as dash', () => {
    expect(formatDateTime('not-a-date')).toBe('-')
  })
})
