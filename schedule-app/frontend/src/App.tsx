import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'
import {
  createSchedule,
  deleteSchedule,
  listSchedules,
  updateSchedule,
} from './services/schedules'
import type {
  Priority,
  Schedule,
  ScheduleFilters,
  ScheduleFormErrors,
  ScheduleInput,
  ScheduleStatus,
} from './types/schedule'
import {
  emptyScheduleInput,
  formatDateTime,
  hasFormErrors,
  priorityLabels,
  scheduleToInput,
  statusLabels,
  summarizeScheduleTime,
  toApiInput,
  validateScheduleInput,
} from './utils/schedule'

const priorities: Priority[] = ['low', 'medium', 'high']
const statuses: ScheduleStatus[] = ['todo', 'done', 'cancelled']

const emptyFilters: ScheduleFilters = {
  keyword: '',
  status: '',
  date: '',
}

function App() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [filters, setFilters] = useState<ScheduleFilters>(emptyFilters)
  const [draftFilters, setDraftFilters] =
    useState<ScheduleFilters>(emptyFilters)
  const [form, setForm] = useState<ScheduleInput>(emptyScheduleInput)
  const [formErrors, setFormErrors] = useState<ScheduleFormErrors>({})
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [selectedScheduleID, setSelectedScheduleID] = useState<number | null>(
    null,
  )
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const hasSchedules = schedules.length > 0
  const isEditing = editingSchedule !== null

  const selectedSchedule = useMemo(
    () =>
      schedules.find((schedule) => schedule.id === selectedScheduleID) ?? null,
    [schedules, selectedScheduleID],
  )

  const visibleSummary = useMemo(() => {
    const todoCount = schedules.filter(
      (schedule) => schedule.status === 'todo',
    ).length
    const doneCount = schedules.filter(
      (schedule) => schedule.status === 'done',
    ).length

    return {
      total: schedules.length,
      todo: todoCount,
      done: doneCount,
    }
  }, [schedules])

  const loadSchedules = useCallback(async (nextFilters: ScheduleFilters) => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const nextSchedules = await listSchedules(nextFilters)
      setSchedules(nextSchedules)
      return nextSchedules
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSchedules(filters)
  }, [filters, loadSchedules])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const errors = validateScheduleInput(form)
    setFormErrors(errors)
    if (hasFormErrors(errors)) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const payload = toApiInput(form)
      const saved =
        editingSchedule === null
          ? await createSchedule(payload)
          : await updateSchedule(editingSchedule.id, payload)

      resetForm()
      const nextSchedules = await loadSchedules(filters)
      setSelectedScheduleID(
        nextSchedules.some((schedule) => schedule.id === saved.id)
          ? saved.id
          : null,
      )
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(schedule: Schedule) {
    const confirmed = window.confirm(`删除「${schedule.title}」？`)
    if (!confirmed) {
      return
    }

    setErrorMessage('')

    try {
      await deleteSchedule(schedule.id)
      if (selectedScheduleID === schedule.id) {
        setSelectedScheduleID(null)
      }
      if (editingSchedule?.id === schedule.id) {
        resetForm()
      }
      await loadSchedules(filters)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    }
  }

  function handleEdit(schedule: Schedule) {
    setEditingSchedule(schedule)
    setSelectedScheduleID(schedule.id)
    setForm(scheduleToInput(schedule))
    setFormErrors({})
  }

  function resetForm() {
    setEditingSchedule(null)
    setForm(emptyScheduleInput)
    setFormErrors({})
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilters(draftFilters)
  }

  function clearFilters() {
    setDraftFilters(emptyFilters)
    setFilters(emptyFilters)
  }

  function updateForm<K extends keyof ScheduleInput>(
    key: K,
    value: ScheduleInput[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }))
    setFormErrors((current) => ({ ...current, [key]: undefined }))
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Schedule App</p>
          <h1>日程管理</h1>
        </div>
        <div className="metrics" aria-label="日程统计">
          <span>
            <strong>{visibleSummary.total}</strong>
            全部
          </span>
          <span>
            <strong>{visibleSummary.todo}</strong>
            待办
          </span>
          <span>
            <strong>{visibleSummary.done}</strong>
            完成
          </span>
        </div>
      </header>

      {errorMessage !== '' && (
        <div className="alert" role="alert">
          {errorMessage}
        </div>
      )}

      <section className="workspace" aria-label="日程工作区">
        <div className="primary-column">
          <form className="filter-bar" onSubmit={applyFilters}>
            <label>
              关键字
              <input
                data-testid="schedule-keyword-filter"
                value={draftFilters.keyword}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    keyword: event.target.value,
                  }))
                }
                placeholder="标题或描述"
              />
            </label>

            <label>
              日期
              <input
                data-testid="schedule-date-filter"
                type="date"
                value={draftFilters.date}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
            </label>

            <label>
              状态
              <select
                data-testid="schedule-status-filter"
                value={draftFilters.status}
                onChange={(event) =>
                  setDraftFilters((current) => ({
                    ...current,
                    status: event.target.value as ScheduleFilters['status'],
                  }))
                }
              >
                <option value="">全部状态</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>

            <div className="filter-actions">
              <button type="submit">筛选</button>
              <button
                type="button"
                className="ghost-button"
                onClick={clearFilters}
              >
                清空
              </button>
            </div>
          </form>

          <section className="schedule-list-panel" aria-label="日程列表">
            <div className="panel-heading">
              <div>
                <h2>日程列表</h2>
                <p>{isLoading ? '正在加载' : `${schedules.length} 条结果`}</p>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => void loadSchedules(filters)}
              >
                刷新
              </button>
            </div>

            {isLoading && <div className="empty-state">加载中...</div>}

            {!isLoading && !hasSchedules && (
              <div className="empty-state" data-testid="schedule-empty-state">
                暂无日程
              </div>
            )}

            {!isLoading && hasSchedules && (
              <ul className="schedule-list" data-testid="schedule-list">
                {schedules.map((schedule) => (
                  <li
                    key={schedule.id}
                    className={
                      selectedSchedule?.id === schedule.id
                        ? 'schedule-item selected'
                        : 'schedule-item'
                    }
                  >
                    <button
                      type="button"
                      className="schedule-select"
                      onClick={() => setSelectedScheduleID(schedule.id)}
                    >
                      <span className="schedule-title-row">
                        <strong>{schedule.title}</strong>
                        <span className={`status-badge ${schedule.status}`}>
                          {statusLabels[schedule.status]}
                        </span>
                      </span>
                      <span className="schedule-meta">
                        {summarizeScheduleTime(schedule)}
                      </span>
                      <span className="schedule-meta">
                        {priorityLabels[schedule.priority]}
                        {schedule.location !== ''
                          ? ` · ${schedule.location}`
                          : ''}
                      </span>
                    </button>
                    <div className="item-actions">
                      <button
                        type="button"
                        onClick={() => handleEdit(schedule)}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => void handleDelete(schedule)}
                      >
                        删除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="side-column" aria-label="日程表单和详情">
          <form
            className="form-panel"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="panel-heading">
              <div>
                <h2>{isEditing ? '编辑日程' : '新增日程'}</h2>
                <p>{isEditing ? `#${editingSchedule.id}` : '创建一条新日程'}</p>
              </div>
              {isEditing && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={resetForm}
                >
                  取消
                </button>
              )}
            </div>

            <label>
              标题
              <input
                data-testid="schedule-title-input"
                value={form.title}
                onChange={(event) => updateForm('title', event.target.value)}
                aria-invalid={formErrors.title != null}
              />
              {formErrors.title != null && (
                <span className="field-error">{formErrors.title}</span>
              )}
            </label>

            <label>
              描述
              <textarea
                data-testid="schedule-description-input"
                value={form.description}
                onChange={(event) =>
                  updateForm('description', event.target.value)
                }
                rows={3}
              />
            </label>

            <div className="field-grid">
              <label>
                开始时间
                <input
                  data-testid="schedule-start-input"
                  type="datetime-local"
                  value={form.startTime}
                  onChange={(event) =>
                    updateForm('startTime', event.target.value)
                  }
                  aria-invalid={formErrors.startTime != null}
                />
                {formErrors.startTime != null && (
                  <span className="field-error">{formErrors.startTime}</span>
                )}
              </label>

              <label>
                结束时间
                <input
                  data-testid="schedule-end-input"
                  type="datetime-local"
                  value={form.endTime}
                  onChange={(event) =>
                    updateForm('endTime', event.target.value)
                  }
                  aria-invalid={formErrors.endTime != null}
                />
                {formErrors.endTime != null && (
                  <span className="field-error">{formErrors.endTime}</span>
                )}
              </label>
            </div>

            <label>
              地点
              <input
                data-testid="schedule-location-input"
                value={form.location}
                onChange={(event) => updateForm('location', event.target.value)}
              />
            </label>

            <div className="field-grid">
              <label>
                优先级
                <select
                  data-testid="schedule-priority-select"
                  value={form.priority}
                  onChange={(event) =>
                    updateForm('priority', event.target.value as Priority)
                  }
                >
                  {priorities.map((priority) => (
                    <option key={priority} value={priority}>
                      {priorityLabels[priority]}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                状态
                <select
                  data-testid="schedule-form-status-select"
                  value={form.status}
                  onChange={(event) =>
                    updateForm('status', event.target.value as ScheduleStatus)
                  }
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="submit"
              data-testid="schedule-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : isEditing ? '保存修改' : '新增日程'}
            </button>
          </form>

          <section className="detail-panel" aria-label="日程详情">
            <div className="panel-heading">
              <div>
                <h2>日程详情</h2>
                <p>
                  {selectedSchedule == null
                    ? '未选择'
                    : `#${selectedSchedule.id}`}
                </p>
              </div>
            </div>

            {selectedSchedule == null ? (
              <div className="empty-state">选择一条日程查看详情</div>
            ) : (
              <dl className="detail-list">
                <div>
                  <dt>标题</dt>
                  <dd>{selectedSchedule.title}</dd>
                </div>
                <div>
                  <dt>时间</dt>
                  <dd>{summarizeScheduleTime(selectedSchedule)}</dd>
                </div>
                <div>
                  <dt>优先级</dt>
                  <dd>{priorityLabels[selectedSchedule.priority]}</dd>
                </div>
                <div>
                  <dt>状态</dt>
                  <dd>{statusLabels[selectedSchedule.status]}</dd>
                </div>
                <div>
                  <dt>地点</dt>
                  <dd>{selectedSchedule.location || '-'}</dd>
                </div>
                <div>
                  <dt>更新时间</dt>
                  <dd>{formatDateTime(selectedSchedule.updatedAt)}</dd>
                </div>
                <div className="wide-detail">
                  <dt>描述</dt>
                  <dd>{selectedSchedule.description || '-'}</dd>
                </div>
              </dl>
            )}
          </section>
        </aside>
      </section>
    </main>
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return '操作失败'
}

export default App
