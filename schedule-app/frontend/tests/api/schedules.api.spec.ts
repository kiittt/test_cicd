import { expect, test } from '@playwright/test'
import type { APIRequestContext, APIResponse } from '@playwright/test'

type Priority = 'low' | 'medium' | 'high'
type ScheduleStatus = 'todo' | 'done' | 'cancelled'

interface Schedule {
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

interface SchedulePayload {
  title: string
  description: string
  startTime: string
  endTime: string
  location: string
  priority: Priority
  status: ScheduleStatus
}

test('health check returns ok', async ({ request }) => {
  const response = await request.get('/health')

  expect(response.ok()).toBe(true)
  await expectJson(response, { status: 'ok' })
})

test('create schedule then get it by id', async ({ request }, testInfo) => {
  const cleanup = createCleanup()
  try {
    const payload = buildPayload(testInfo.title, {
      title: 'create-get',
      description: 'created by API test',
    })

    const created = await createSchedule(request, cleanup, payload)
    const response = await request.get(`/api/schedules/${created.id}`)

    expect(response.status()).toBe(200)
    await expectJson(
      response,
      expect.objectContaining({
        id: created.id,
        title: payload.title,
        description: payload.description,
        priority: payload.priority,
        status: payload.status,
      }),
    )
  } finally {
    await cleanup(request)
  }
})

test('update schedule persists changed fields', async ({
  request,
}, testInfo) => {
  const cleanup = createCleanup()
  try {
    const created = await createSchedule(
      request,
      cleanup,
      buildPayload(testInfo.title, { title: 'before-update' }),
    )

    const updatePayload = buildPayload(testInfo.title, {
      title: 'after-update',
      description: 'updated by API test',
      startTime: '2026-07-03T11:00:00Z',
      endTime: '2026-07-03T12:00:00Z',
      location: 'Room B',
      priority: 'high',
      status: 'done',
    })

    const response = await request.put(`/api/schedules/${created.id}`, {
      data: updatePayload,
    })

    expect(response.status()).toBe(200)
    await expectJson(
      response,
      expect.objectContaining({
        id: created.id,
        title: updatePayload.title,
        description: updatePayload.description,
        location: updatePayload.location,
        priority: updatePayload.priority,
        status: updatePayload.status,
      }),
    )
  } finally {
    await cleanup(request)
  }
})

test('delete schedule makes detail return 404', async ({
  request,
}, testInfo) => {
  const cleanup = createCleanup()
  try {
    const created = await createSchedule(
      request,
      cleanup,
      buildPayload(testInfo.title, { title: 'delete-flow' }),
    )

    const deleteResponse = await request.delete(`/api/schedules/${created.id}`)
    cleanup.forget(created.id)

    expect(deleteResponse.status()).toBe(204)

    const getResponse = await request.get(`/api/schedules/${created.id}`)
    expect(getResponse.status()).toBe(404)
    await expectJson(getResponse, { message: 'schedule not found' })
  } finally {
    await cleanup(request)
  }
})

test('querying an unmatched keyword returns an empty list', async ({
  request,
}) => {
  const response = await request.get(
    `/api/schedules?keyword=${encodeURIComponent(uniqueTitle('no-match'))}`,
  )

  expect(response.status()).toBe(200)
  await expectJson(response, [])
})

test('keyword and status filters return matching schedules only', async ({
  request,
}, testInfo) => {
  const cleanup = createCleanup()
  try {
    const token = shortToken(testInfo.title)
    const todo = await createSchedule(
      request,
      cleanup,
      buildPayload(
        token,
        {
          title: `${token}-planning`,
          description: 'filter-alpha',
          status: 'todo',
        },
        { uniqueTitle: false },
      ),
    )
    await createSchedule(
      request,
      cleanup,
      buildPayload(
        token,
        {
          title: `${token}-review`,
          description: 'filter-alpha',
          status: 'done',
        },
        { uniqueTitle: false },
      ),
    )

    const response = await request.get(
      `/api/schedules?keyword=${encodeURIComponent(token)}&status=todo`,
    )

    expect(response.status()).toBe(200)
    const schedules = (await response.json()) as Schedule[]
    expect(schedules).toHaveLength(1)
    expect(schedules[0]).toEqual(
      expect.objectContaining({
        id: todo.id,
        status: 'todo',
      }),
    )
  } finally {
    await cleanup(request)
  }
})

test('date filter returns schedules for the selected day', async ({
  request,
}, testInfo) => {
  const cleanup = createCleanup()
  try {
    const token = shortToken(testInfo.title)
    const targetDay = await createSchedule(
      request,
      cleanup,
      buildPayload(
        token,
        {
          title: `${token}-target-day`,
          startTime: '2026-07-04T09:00:00Z',
          endTime: '2026-07-04T10:00:00Z',
        },
        { uniqueTitle: false },
      ),
    )
    await createSchedule(
      request,
      cleanup,
      buildPayload(
        token,
        {
          title: `${token}-other-day`,
          startTime: '2026-07-05T09:00:00Z',
          endTime: '2026-07-05T10:00:00Z',
        },
        { uniqueTitle: false },
      ),
    )

    const response = await request.get(
      `/api/schedules?keyword=${encodeURIComponent(token)}&date=2026-07-04`,
    )

    expect(response.status()).toBe(200)
    const schedules = (await response.json()) as Schedule[]
    expect(schedules).toHaveLength(1)
    expect(schedules[0]?.id).toBe(targetDay.id)
  } finally {
    await cleanup(request)
  }
})

test('date filter matches schedules by start day for overnight events', async ({
  request,
}, testInfo) => {
  const cleanup = createCleanup()
  try {
    const token = shortToken(testInfo.title)
    const overnight = await createSchedule(
      request,
      cleanup,
      buildPayload(
        token,
        {
          title: `${token}-overnight`,
          startTime: '2026-07-06T23:30:00Z',
          endTime: '2026-07-07T00:30:00Z',
        },
        { uniqueTitle: false },
      ),
    )

    const startDayResponse = await request.get(
      `/api/schedules?keyword=${encodeURIComponent(token)}&date=2026-07-06`,
    )
    expect(startDayResponse.status()).toBe(200)
    const startDaySchedules = (await startDayResponse.json()) as Schedule[]
    expect(startDaySchedules.map((schedule) => schedule.id)).toContain(
      overnight.id,
    )

    const endDayResponse = await request.get(
      `/api/schedules?keyword=${encodeURIComponent(token)}&date=2026-07-07`,
    )
    expect(endDayResponse.status()).toBe(200)
    await expectJson(endDayResponse, [])
  } finally {
    await cleanup(request)
  }
})

test('special characters are persisted and searchable', async ({
  request,
}, testInfo) => {
  const cleanup = createCleanup()
  try {
    const token = shortToken(testInfo.title)
    const payload = buildPayload(
      token,
      {
        title: `${token}-特殊字符 !@#`,
        description: '包含中文、空格和符号 #weekly_sync',
      },
      { uniqueTitle: false },
    )
    const created = await createSchedule(request, cleanup, payload)

    const response = await request.get(
      `/api/schedules?keyword=${encodeURIComponent('#weekly_sync')}`,
    )

    expect(response.status()).toBe(200)
    const schedules = (await response.json()) as Schedule[]
    expect(schedules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.id,
          title: payload.title,
          description: payload.description,
        }),
      ]),
    )
  } finally {
    await cleanup(request)
  }
})

test('invalid time range returns 400', async ({ request }, testInfo) => {
  const response = await request.post('/api/schedules', {
    data: buildPayload(testInfo.title, {
      title: 'invalid-time',
      startTime: '2026-07-03T12:00:00Z',
      endTime: '2026-07-03T11:00:00Z',
    }),
  })

  expect(response.status()).toBe(400)
  await expectJson(response, {
    message: 'start time must not be after end time',
  })
})

test('empty title returns 400', async ({ request }) => {
  const response = await request.post('/api/schedules', {
    data: buildPayload('empty-title', { title: ' ' }, { uniqueTitle: false }),
  })

  expect(response.status()).toBe(400)
  await expectJson(response, { message: 'title is required' })
})

test('invalid status filter returns 400', async ({ request }) => {
  const response = await request.get('/api/schedules?status=doing')

  expect(response.status()).toBe(400)
  await expectJson(response, {
    message: 'status must be todo, done, or cancelled',
  })
})

test('invalid date filter returns 400', async ({ request }) => {
  const response = await request.get('/api/schedules?date=07-01-2026')

  expect(response.status()).toBe(400)
  await expectJson(response, { message: 'date must use YYYY-MM-DD' })
})

test('updating missing schedule returns 404', async ({ request }, testInfo) => {
  const response = await request.put('/api/schedules/999999999', {
    data: buildPayload(testInfo.title, { title: 'missing-update' }),
  })

  expect(response.status()).toBe(404)
  await expectJson(response, { message: 'schedule not found' })
})

test('non-numeric schedule id returns 400', async ({ request }) => {
  const response = await request.get('/api/schedules/not-a-number')

  expect(response.status()).toBe(400)
  await expectJson(response, { message: 'id must be a positive integer' })
})

test('deleting missing schedule returns 404', async ({ request }) => {
  const response = await request.delete('/api/schedules/999999999')

  expect(response.status()).toBe(404)
  await expectJson(response, { message: 'schedule not found' })
})

function buildPayload(
  prefix: string,
  overrides: Partial<SchedulePayload> = {},
  options: { uniqueTitle?: boolean } = {},
): SchedulePayload {
  const title = overrides.title ?? 'schedule'

  return {
    title:
      options.uniqueTitle === false ? title : uniqueTitle(`${prefix}-${title}`),
    description: overrides.description ?? 'API automation schedule',
    startTime: overrides.startTime ?? '2026-07-03T09:00:00Z',
    endTime: overrides.endTime ?? '2026-07-03T10:00:00Z',
    location: overrides.location ?? 'API Lab',
    priority: overrides.priority ?? 'medium',
    status: overrides.status ?? 'todo',
  }
}

async function createSchedule(
  request: APIRequestContext,
  cleanup: CleanupTracker,
  payload: SchedulePayload,
): Promise<Schedule> {
  const response = await request.post('/api/schedules', { data: payload })

  expect(response.status()).toBe(201)

  const schedule = (await response.json()) as Schedule
  cleanup.track(schedule.id)

  expect(schedule).toEqual(
    expect.objectContaining({
      title: payload.title,
      description: payload.description,
      startTime: payload.startTime,
      endTime: payload.endTime,
      location: payload.location,
      priority: payload.priority,
      status: payload.status,
    }),
  )

  return schedule
}

interface CleanupTracker {
  (request: APIRequestContext): Promise<void>
  track: (id: number) => void
  forget: (id: number) => void
}

function createCleanup(): CleanupTracker {
  const ids = new Set<number>()

  const cleanup = (async (request: APIRequestContext) => {
    await Promise.all(
      [...ids].map(async (id) => {
        await request.delete(`/api/schedules/${id}`)
        ids.delete(id)
      }),
    )
  }) as CleanupTracker

  cleanup.track = (id: number) => ids.add(id)
  cleanup.forget = (id: number) => ids.delete(id)

  return cleanup
}

async function expectJson(response: APIResponse, expected: unknown) {
  expect(await response.json()).toEqual(expected)
}

function uniqueTitle(label: string): string {
  return `${shortToken(label)}-${Math.random().toString(16).slice(2)}`
}

function shortToken(label: string): string {
  return `api-${sanitize(label).slice(0, 18)}-${Date.now()}`
}

function sanitize(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]+/g, '-')
}
