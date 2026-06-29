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

## 技术栈

- Frontend: React + Vite + TypeScript
- Backend: Go + Gin
- Database: SQLite
- ORM: GORM
- Unit Test: Vitest、Go test
- API/UI Test: Playwright
- CI/CD: GitHub Actions

## 前端启动

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

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

## 文档

- `docs/requirements.md`
- `docs/test-strategy.md`
