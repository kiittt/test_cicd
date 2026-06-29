# 日程安排 CRUD 测试报告

## 1. 测试结论

截至第 10 天，本地完整质量门禁已通过。项目已覆盖后端单元测试、后端接口测试、前端单元与组件测试、Playwright API 自动化、Playwright UI E2E、静态检查和 GitHub Actions CI 质量门禁配置。

结论：核心 CRUD 功能、查询筛选、表单校验、错误响应和 CI 质量门禁达到当前阶段验收标准。

## 2. 测试环境

| 项目 | 版本或说明 |
| --- | --- |
| 操作系统 | macOS 本地开发环境 |
| Node.js | 24.x |
| npm | 11.x |
| Go | 以 `backend/go.mod` 为准，当前 `go 1.25.0` |
| 前端 | React + Vite + TypeScript |
| 后端 | Go + Gin + GORM |
| 数据库 | SQLite |
| 自动化 | Vitest、Go test、Playwright |
| CI | GitHub Actions workflow：`.github/workflows/quality-check.yml` |

## 3. 测试范围

| 范围 | 覆盖内容 | 工具 |
| --- | --- | --- |
| 后端模型 | 标题必填、时间范围、优先级枚举、状态枚举 | Go test |
| 后端接口 | 健康检查、CRUD、筛选、错误响应、CORS | Go httptest |
| 前端工具函数 | 表单校验、时间转换、时间展示容错 | Vitest |
| 前端组件 | 空状态、表单错误、新增后刷新列表 | Testing Library |
| API 自动化 | CRUD、筛选、异常参数、特殊字符、跨天日程 | Playwright request |
| UI E2E | 新增、筛选、编辑、删除、表单校验 | Playwright Chromium |
| 代码质量 | Prettier、ESLint、oxlint、gofmt、go vet、build | Makefile |
| CI 门禁 | 前端、后端、API、E2E 四类 job | GitHub Actions |

## 4. 本次回归结果

| 命令 | 结果 |
| --- | --- |
| `cd backend && make quality` | 通过 |
| `cd frontend && npm run format:check` | 通过 |
| `cd frontend && npm run lint` | 通过 |
| `cd frontend && npm run test` | 通过，2 个测试文件，7 条测试 |
| `cd frontend && npm run build` | 通过 |
| `cd frontend && API_BASE_URL=http://localhost:8080 npm run test:api` | 通过，16 条 API 测试 |
| `cd frontend && npm run test:e2e` | 通过，2 条 UI E2E 测试 |
| `make quality` | 通过 |

## 5. 缺陷记录

| ID | 问题 | 状态 | 处理 |
| --- | --- | --- | --- |
| BUG-001 | 日期筛选规则容易误解为覆盖开始到结束日期 | 已记录 | 当前实现按开始日期筛选，已在测试用例中固化 |
| BUG-002 | 标题超长属于异常场景但缺少最大长度定义 | 待确认 | 暂不加断言，后续先补产品规则再实现 |
| BUG-003 | UI 网络失败和服务端 500 未做稳定自动化覆盖 | 待增强 | 后续通过组件 mock 或测试专用服务注入 |

## 6. 测试报告产物

本地运行 Playwright 后会生成：

- API 报告：`frontend/playwright-report/api`
- UI E2E 报告：`frontend/playwright-report/e2e`
- 失败截图、视频、trace：`frontend/test-results`

CI 中 `api-check` 和 `e2e-check` 会将上述产物上传为 GitHub Actions artifact。

## 7. 演示流程

1. 在一个终端中，从项目根目录启动后端：

```bash
cd backend
GOPROXY=https://goproxy.cn,direct go run ./cmd/server
```

2. 在项目根目录写入演示数据：

```bash
./scripts/seed-demo.sh
```

3. 在另一个终端中，从项目根目录启动前端：

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

4. 打开前端页面，演示新增、筛选、编辑、删除和表单校验。

5. 执行完整质量门禁：

```bash
make quality
```

## 8. 剩余风险

- GitHub Actions 需要推送到远端后才能看到真实云端运行结果。
- 标题最大长度未定义，当前只校验非空。
- UI 网络失败和服务端 500 属于后续增强测试范围。
- SQLite 适合演示和测试，不适合作为生产部署数据库。
