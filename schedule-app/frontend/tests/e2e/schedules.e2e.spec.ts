import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '日程管理' })).toBeVisible()
})

test('user can create, filter, edit, and delete a schedule', async ({
  page,
}) => {
  const title = uniqueTitle('ui-flow')
  const updatedTitle = `${title}-updated`

  await createSchedule(page, {
    title,
    description: 'UI E2E creates this schedule',
    startTime: '2026-07-01T09:00',
    endTime: '2026-07-01T10:00',
    location: 'E2E Room',
  })

  await expect(page.getByTestId('schedule-list')).toContainText(title)
  await expect(page.getByLabel('日程统计')).toContainText('1全部')
  await expect(page.getByLabel('日程详情')).toContainText(title)

  await page.getByTestId('schedule-keyword-filter').fill(title)
  await page.getByTestId('schedule-status-filter').selectOption('todo')
  await page.getByRole('button', { name: '筛选' }).click()
  await expect(page.getByTestId('schedule-list')).toContainText(title)

  await page.getByRole('button', { name: '清空' }).click()
  await expect(page.getByTestId('schedule-list')).toContainText(title)

  await page.getByRole('button', { name: '编辑' }).click()
  await page.getByTestId('schedule-title-input').fill(updatedTitle)
  await page.getByTestId('schedule-form-status-select').selectOption('done')
  await page.getByTestId('schedule-submit-button').click()

  await expect(page.getByTestId('schedule-list')).toContainText(updatedTitle)
  await expect(page.getByTestId('schedule-list')).toContainText('已完成')
  await expect(page.getByLabel('日程详情')).toContainText(updatedTitle)

  await page.getByTestId('schedule-status-filter').selectOption('done')
  await page.getByRole('button', { name: '筛选' }).click()
  await expect(page.getByTestId('schedule-list')).toContainText(updatedTitle)

  page.on('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: '删除' }).click()
  await expect(page.getByTestId('schedule-empty-state')).toHaveText('暂无日程')
  await expect(page.getByLabel('日程详情')).toContainText('未选择')
})

test('user sees validation messages for required title and invalid time range', async ({
  page,
}) => {
  await page.getByTestId('schedule-start-input').fill('2026-07-01T11:00')
  await page.getByTestId('schedule-end-input').fill('2026-07-01T10:00')
  await page.getByTestId('schedule-submit-button').click()

  await expect(page.getByText('标题不能为空')).toBeVisible()
  await expect(page.getByText('结束时间不能早于开始时间')).toBeVisible()
})

async function createSchedule(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  input: {
    title: string
    description: string
    startTime: string
    endTime: string
    location: string
  },
) {
  await page.getByTestId('schedule-title-input').fill(input.title)
  await page.getByTestId('schedule-description-input').fill(input.description)
  await page.getByTestId('schedule-start-input').fill(input.startTime)
  await page.getByTestId('schedule-end-input').fill(input.endTime)
  await page.getByTestId('schedule-location-input').fill(input.location)
  await page.getByTestId('schedule-submit-button').click()
}

function uniqueTitle(label: string): string {
  return `e2e-${label}-${Date.now()}`
}
