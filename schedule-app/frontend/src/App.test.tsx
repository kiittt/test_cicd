import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import type { Schedule } from './types/schedule'

const schedules: Schedule[] = [
  {
    id: 1,
    title: 'Team sync',
    description: 'Weekly planning',
    startTime: '2026-07-01T09:00:00Z',
    endTime: '2026-07-01T10:00:00Z',
    location: 'Room A',
    priority: 'medium',
    status: 'todo',
    createdAt: '2026-06-29T10:00:00Z',
    updatedAt: '2026-06-29T10:00:00Z',
  },
]

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse([])) satisfies typeof fetch,
    )
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders empty state after loading schedules', async () => {
    render(<App />)

    expect(await screen.findByTestId('schedule-empty-state')).toHaveTextContent(
      '暂无日程',
    )
  })

  it('shows form validation errors for empty title and invalid time range', async () => {
    const user = userEvent.setup()
    render(<App />)

    await screen.findByTestId('schedule-empty-state')
    await user.type(
      screen.getByTestId('schedule-start-input'),
      '2026-07-01T11:00',
    )
    await user.type(
      screen.getByTestId('schedule-end-input'),
      '2026-07-01T10:00',
    )
    await user.click(screen.getByTestId('schedule-submit-button'))

    expect(await screen.findByText('标题不能为空')).toBeInTheDocument()
    expect(screen.getByText('结束时间不能早于开始时间')).toBeInTheDocument()
  })

  it('creates a schedule and refreshes the list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(schedules[0], 201))
      .mockResolvedValueOnce(jsonResponse(schedules))

    vi.stubGlobal('fetch', fetchMock)

    const user = userEvent.setup()
    render(<App />)

    await screen.findByTestId('schedule-empty-state')
    await user.type(screen.getByTestId('schedule-title-input'), 'Team sync')
    await user.type(
      screen.getByTestId('schedule-start-input'),
      '2026-07-01T09:00',
    )
    await user.type(
      screen.getByTestId('schedule-end-input'),
      '2026-07-01T10:00',
    )
    await user.click(screen.getByTestId('schedule-submit-button'))

    await waitFor(() =>
      expect(screen.getByTestId('schedule-list')).toHaveTextContent(
        'Team sync',
      ),
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
  })
})

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
