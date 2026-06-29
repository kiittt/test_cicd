#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"

create_schedule() {
  curl -fsS -X POST "$API_BASE_URL/api/schedules" \
    -H "Content-Type: application/json" \
    -d "$1" >/dev/null
}

create_schedule '{
  "title": "产品周会",
  "description": "同步本周目标、风险和发布计划",
  "startTime": "2026-07-01T09:00:00Z",
  "endTime": "2026-07-01T10:00:00Z",
  "location": "会议室 A",
  "priority": "high",
  "status": "todo"
}'

create_schedule '{
  "title": "测试回归",
  "description": "执行 API、UI E2E 和本地质量门禁",
  "startTime": "2026-07-02T14:00:00Z",
  "endTime": "2026-07-02T16:00:00Z",
  "location": "远程",
  "priority": "medium",
  "status": "todo"
}'

create_schedule '{
  "title": "CI 报告复盘",
  "description": "检查 GitHub Actions 结果和 Playwright 报告",
  "startTime": "2026-07-03T11:00:00Z",
  "endTime": "2026-07-03T11:30:00Z",
  "location": "会议室 B",
  "priority": "low",
  "status": "done"
}'

echo "Demo schedules created at $API_BASE_URL"
