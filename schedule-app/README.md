# Schedule App

日程安排 CRUD 项目，用于演示 React + Vite 前端、Go 后端、SQLite 数据库、自动化测试和 GitHub Actions CI/CD 质量门禁。

## 当前进度

- Day 1：项目初始化、需求文档、测试策略。
- Day 2：后端基础架构、Gin 路由、GORM + SQLite 初始化、`Schedule` 模型、数据库自动迁移、基础 Go 单元测试。
- Day 3：后端日程 CRUD API、列表筛选、统一错误响应、CORS、接口测试。
- Day 4：前端日程 CRUD 页面、接口联调、表单校验、加载/错误/空状态、前端单元和组件测试。
- Day 5：Playwright API 自动化测试，覆盖后端 CRUD、筛选、空结果和核心异常场景。
- Day 6：Playwright UI E2E 自动化测试，覆盖新增、筛选、编辑、删除和表单校验核心路径。
- Day 7：本地质量门禁，配置 ESLint、Prettier、gofmt 检查、go vet、Makefile 一键检查。
- Day 8：GitHub Actions CI 质量门禁，自动运行前端、后端、API 和 UI E2E 检查并归档 Playwright 报告。
- Day 9：AI 辅助测试设计，沉淀提示词模板、人工评审后的测试用例清单，并补充高价值 API 自动化场景。
- Day 10：项目收尾，补充测试报告、演示数据脚本、启动测试说明和最终交付清单。

## 技术栈

- Frontend: React + Vite + TypeScript
- Backend: Go + Gin
- Database: SQLite
- ORM: GORM
- Unit Test: Vitest、Go test
- API/UI Test: Playwright
- CI/CD: GitHub Actions

## 快速启动

在一个终端中，从项目根目录启动后端：

```bash
cd backend
GOPROXY=https://goproxy.cn,direct go run ./cmd/server
```

在另一个终端中，从项目根目录启动前端：

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

浏览器打开 Vite 输出的本地地址，默认通常是 `http://localhost:5173`。

在项目根目录写入演示数据：

```bash
./scripts/seed-demo.sh
```

也可以指定后端地址：

```bash
API_BASE_URL=http://localhost:8080 ./scripts/seed-demo.sh
```

## 前端检查

前端检查：

```bash
cd frontend
npm run lint
npm run test
API_BASE_URL=http://localhost:8080 npm run test:api
npm run test:e2e
npm run build
```

格式化前端代码：

```bash
cd frontend
npm run format
```

## 后端启动

当前后端 Go 版本以 `backend/go.mod` 为准。国内网络环境建议为 Go 命令显式设置代理：

```bash
cd backend
GOPROXY=https://goproxy.cn,direct go run ./cmd/server
```

健康检查：

```bash
curl http://localhost:8080/health
```

后端 API：

```text
GET    /api/schedules?keyword=会议&status=todo&date=2026-07-01
GET    /api/schedules/:id
POST   /api/schedules
PUT    /api/schedules/:id
DELETE /api/schedules/:id
```

日程 JSON 示例：

```json
{
  "title": "Team sync",
  "description": "Weekly planning",
  "startTime": "2026-07-01T09:00:00Z",
  "endTime": "2026-07-01T10:00:00Z",
  "location": "Meeting room A",
  "priority": "medium",
  "status": "todo"
}
```

后端检查：

```bash
cd backend
make quality
```

## 本地质量门禁

后端服务运行在 `http://localhost:8080` 时，可以在项目根目录一键执行完整检查：

```bash
make quality
```

该命令包含：

- 后端 `gofmt` 检查、`go vet`、`go test`
- 前端 Prettier 检查、ESLint、oxlint、Vitest、build
- Playwright API 自动化测试
- Playwright UI E2E 自动化测试

## GitHub Actions CI

`.github/workflows/quality-check.yml` 会在推送到 `main` 和向 `main` 发起 Pull Request 时运行。

流水线包含：

- `frontend-check`：安装前端依赖，执行 Prettier 检查、ESLint、oxlint、Vitest 和前端构建。
- `backend-check`：按 `backend/go.mod` 中的 Go 版本执行 `gofmt` 检查、`go vet` 和 `go test`。
- `api-check`：启动临时后端服务，执行 Playwright API 自动化测试。
- `e2e-check`：安装 Chromium 依赖，启动临时后端和 Vite 前端，执行 Playwright UI E2E 自动化测试。

API 和 E2E job 会在结束时上传 Playwright HTML 报告和失败截图、视频、trace 等测试产物，便于在 GitHub Actions 页面排查失败原因。

## 演示流程

1. 启动后端。
2. 执行 `./scripts/seed-demo.sh` 写入演示数据。
3. 启动前端。
4. 演示日程新增、关键字/日期/状态筛选、编辑、删除和表单校验。
5. 执行 `make quality` 展示本地质量门禁。
6. 推送到 `main` 或创建 Pull Request 后，在 GitHub Actions 页面查看 CI 结果和 Playwright artifact。

## 最终交付清单

| 类型 | 交付物 |
| --- | --- |
| 需求文档 | `docs/requirements.md` |
| 测试策略 | `docs/test-strategy.md` |
| 测试用例 | `docs/test-cases.md` |
| AI 提示词 | `docs/ai-prompts.md` |
| 测试报告 | `docs/test-report.md` |
| 后端服务 | `backend/` |
| 前端页面 | `frontend/` |
| API 自动化 | `frontend/tests/api/` |
| UI E2E 自动化 | `frontend/tests/e2e/` |
| CI 质量门禁 | `.github/workflows/quality-check.yml` |
| 演示数据脚本 | `scripts/seed-demo.sh` |

## 文档

- `docs/requirements.md`
- `docs/test-strategy.md`
- `docs/ai-prompts.md`
- `docs/test-cases.md`
- `docs/test-report.md`
