# 日程安排 CRUD 测试与 CI/CD 开发计划

## 项目目标

使用一个“日程安排 CRUD”项目完整落地软件测试与 CI/CD 流程，覆盖需求分析、后端接口、前端页面、单元测试、API 自动化、UI 自动化、代码质量检查、测试报告和 GitHub Actions 质量门禁。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| 前端 | React + Vite + TypeScript |
| 后端 | Go + Gin |
| 数据库 | SQLite |
| ORM | GORM |
| 前端单元测试 | Vitest + Testing Library |
| 后端单元测试 | Go test |
| API 测试 | Playwright request 或 Go httptest |
| UI 测试 | Playwright |
| 代码质量 | ESLint + Prettier + gofmt + go vet |
| CI/CD | GitHub Actions |

## 功能范围

| 功能 | 说明 |
| --- | --- |
| 新增日程 | 创建标题、描述、开始时间、结束时间、地点、优先级、状态 |
| 查询日程 | 查询全部日程，支持按关键字、日期、状态筛选 |
| 查看详情 | 查看单条日程完整信息 |
| 编辑日程 | 修改日程基础信息 |
| 删除日程 | 删除指定日程 |
| 表单校验 | 标题必填，开始时间不能晚于结束时间 |

## 推荐目录结构

```text
schedule-app/
  frontend/
    src/
      components/
      pages/
      services/
      types/
      utils/
    tests/
      unit/
      e2e/
    package.json

  backend/
    cmd/
      server/
        main.go
    internal/
      database/
      handler/
      model/
      repository/
      service/
    tests/
    go.mod

  docs/
    requirements.md
    test-cases.md
    ai-prompts.md

  .github/
    workflows/
      quality-check.yml
```

## 第 1 天：需求分析与项目初始化

### 开发任务

- 明确日程 CRUD 的业务范围和字段。
- 编写 `docs/requirements.md`。
- 初始化 Git 仓库。
- 创建前后端目录结构。
- 初始化前端项目：

```bash
npm create vite@latest frontend -- --template react-ts
```

- 初始化后端项目：

```bash
mkdir -p backend/cmd/server
cd backend
go mod init schedule-app/backend
```

### 测试任务

- 编写第一版测试策略。
- 明确测试分层：
  - 后端单元测试
  - API 自动化测试
  - 前端组件测试
  - UI E2E 测试
  - CI 质量门禁

### 产出物

- `docs/requirements.md`
- 项目基础目录
- 前端 Vite 项目
- 后端 Go module
- 第一版测试策略

### 验收标准

- 前端能启动默认页面。
- 后端 Go module 初始化完成。
- 需求文档中包含字段、接口、校验规则和异常场景。

## 第 2 天：后端基础架构与数据库

### 开发任务

- 引入 Gin、GORM、SQLite。
- 创建日程模型 `Schedule`。
- 创建数据库初始化逻辑。
- 实现数据库自动迁移。
- 增加健康检查接口：

```text
GET /health
```

### 后端模型建议

```go
type Schedule struct {
    ID          uint      `json:"id" gorm:"primaryKey"`
    Title       string    `json:"title"`
    Description string    `json:"description"`
    StartTime   time.Time `json:"startTime"`
    EndTime     time.Time `json:"endTime"`
    Location    string    `json:"location"`
    Priority    string    `json:"priority"`
    Status      string    `json:"status"`
    CreatedAt   time.Time `json:"createdAt"`
    UpdatedAt   time.Time `json:"updatedAt"`
}
```

### 测试任务

- 编写数据库初始化测试。
- 编写模型校验测试：
  - 标题不能为空
  - 开始时间不能晚于结束时间
  - 优先级只能是 `low`、`medium`、`high`
  - 状态只能是 `todo`、`done`、`cancelled`

### 产出物

- 后端基础服务
- SQLite 数据库连接
- GORM 自动迁移
- 基础 Go 单元测试

### 验收标准

- `go test ./...` 通过。
- `GET /health` 返回正常。
- 应用启动时能自动创建数据表。

## 第 3 天：后端 CRUD API

### 开发任务

- 实现日程 CRUD 接口：

```text
GET    /api/schedules
GET    /api/schedules/:id
POST   /api/schedules
PUT    /api/schedules/:id
DELETE /api/schedules/:id
```

- 实现查询筛选：

```text
GET /api/schedules?keyword=会议&status=todo&date=2026-07-01
```

- 统一错误响应格式。
- 增加 CORS 配置，允许前端访问。

### 测试任务

- 使用 Go test 或 httptest 编写接口测试：
  - 创建日程成功
  - 标题为空创建失败
  - 开始时间晚于结束时间创建失败
  - 查询列表成功
  - 查询不存在的日程返回 404
  - 编辑日程成功
  - 删除日程成功
  - 删除不存在的日程返回 404

### 产出物

- 完整后端 CRUD API
- 后端接口测试
- 错误响应规范

### 验收标准

- 所有后端接口测试通过。
- 接口错误码合理：
  - 参数错误：400
  - 资源不存在：404
  - 服务异常：500
- 能通过 curl 或 Postman 完成 CRUD 流程。

## 第 4 天：前端页面与接口联调

### 开发任务

- 创建日程列表页。
- 创建新增/编辑日程表单。
- 创建删除确认交互。
- 创建筛选区域：
  - 关键字
  - 日期
  - 状态
- 封装 API 请求模块。
- 增加基础加载态和错误态。

### 测试任务

- 编写前端工具函数单元测试：
  - 时间格式化
  - 表单校验
  - 状态文案转换
- 编写组件测试：
  - 表单必填校验
  - 时间范围校验
  - 列表空状态展示

### 产出物

- 可操作的前端 CRUD 页面
- 前端 API service
- 前端单元测试
- 前端组件测试

### 验收标准

- 前端页面能完成新增、查询、编辑、删除。
- `npm run test` 通过。
- 表单错误提示清晰。
- 后端返回错误时前端能展示错误信息。

## 第 5 天：API 自动化测试

### 开发任务

- 安装并配置 Playwright。
- 创建 API 测试目录。
- 配置测试环境变量：

```text
API_BASE_URL=http://localhost:8080
```

### API 测试用例

- 创建日程后能查询到。
- 编辑日程后数据被正确更新。
- 删除日程后详情接口返回 404。
- 查询空列表返回空数组。
- 关键字筛选正确。
- 状态筛选正确。
- 非法时间范围返回 400。
- 删除不存在的日程返回 404。

### 产出物

- `tests/api` 或 `frontend/tests/api`
- Playwright request 测试
- API 测试报告

### 验收标准

- API 自动化测试能一键运行。
- 测试数据互相隔离，不依赖固定数据库状态。
- 失败时能看到清晰的错误原因。

## 第 6 天：UI E2E 自动化测试

### 开发任务

- 配置 Playwright 浏览器测试。
- 为关键元素增加稳定选择器，例如：

```text
data-testid="schedule-title-input"
data-testid="schedule-submit-button"
data-testid="schedule-list"
```

- 配置前后端本地启动脚本。

### UI 测试用例

- 用户新增一条日程。
- 用户编辑日程标题。
- 用户删除日程。
- 用户按关键字筛选日程。
- 用户提交空标题时看到校验提示。
- 用户填写非法时间范围时看到校验提示。

### 产出物

- UI E2E 测试脚本
- Playwright HTML 报告
- 失败截图和 trace 配置

### 验收标准

- `npx playwright test` 能完整跑通。
- 测试失败时自动保留截图、视频或 trace。
- 核心用户路径均有覆盖。

## 第 7 天：代码质量与本地质量门禁

### 开发任务

- 前端配置 ESLint。
- 前端配置 Prettier。
- 后端统一执行 gofmt。
- 后端加入 go vet。
- 整理 package scripts：

```json
{
  "scripts": {
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- 后端建议增加 Makefile：

```makefile
fmt:
	gofmt -w .

vet:
	go vet ./...

test:
	go test ./...
```

### 测试任务

- 本地执行完整质量检查：
  - 前端 lint
  - 前端单元测试
  - 后端 gofmt 检查
  - 后端 go vet
  - 后端 go test
  - API 测试
  - UI E2E 测试

### 产出物

- ESLint 配置
- Prettier 配置
- Makefile
- 本地质量门禁命令

### 验收标准

- 本地一键能跑完整检查。
- 代码格式统一。
- 明显的 lint、vet、测试失败不能进入下一阶段。

## 第 8 天：GitHub Actions CI/CD

### 开发任务

- 创建 `.github/workflows/quality-check.yml`。
- 配置前端任务：
  - npm ci
  - lint
  - unit test
  - build
- 配置后端任务：
  - gofmt check
  - go vet
  - go test
- 配置 E2E 任务：
  - 启动后端
  - 启动前端
  - 运行 Playwright
  - 上传测试报告

### CI 建议流程

```text
pull_request / push
  ↓
frontend-check
  ↓
backend-check
  ↓
e2e-check
  ↓
upload-report
```

### 质量门禁规则

- 前端 lint 必须通过。
- 前端单元测试必须通过。
- 前端 build 必须通过。
- 后端 gofmt 检查必须通过。
- 后端 go vet 必须通过。
- 后端单元测试必须通过。
- API 和 UI E2E 核心用例必须通过。

### 产出物

- GitHub Actions 工作流
- CI 测试报告归档
- Pull Request 自动检查

### 验收标准

- 每次 push 或 PR 自动触发 CI。
- CI 失败时能看到失败阶段。
- Playwright 报告作为 artifact 上传。

## 第 9 天：AI 辅助测试设计与测试文档

### 开发任务

- 整理 AI 提示词模板。
- 将需求文档、接口文档、历史缺陷样例作为 AI 输入。
- 生成测试点并人工评审。
- 将有效测试点补充到自动化或手工测试用例中。

### AI 提示词模板

```text
你是资深软件测试工程师。
请根据以下日程安排 CRUD 需求生成测试用例。

要求：
1. 覆盖正常流程、异常流程、边界值、安全场景和兼容性场景。
2. 输出字段：用例标题、前置条件、测试步骤、预期结果、优先级、是否适合自动化。
3. 标记哪些用例适合单元测试、API 测试、UI 自动化测试。

需求内容：
{{requirements}}
```

### 测试任务

- 对 AI 生成用例做人工筛选。
- 补齐遗漏场景：
  - 跨天日程
  - 重复时间段日程
  - 超长标题
  - 特殊字符
  - 删除后刷新列表
  - 服务端异常
  - 网络失败

### 产出物

- `docs/ai-prompts.md`
- `docs/test-cases.md`
- 自动化用例补充清单

### 验收标准

- 测试用例覆盖需求中的核心规则。
- AI 输出经过人工评审，不直接无脑采用。
- 至少补充 5 条由 AI 启发的有效测试用例。

## 第 10 天：收尾、报告与演示

### 开发任务

- 修复遗留问题。
- 整理 README。
- 补充启动说明、测试说明、CI 说明。
- 整理演示数据。
- 准备项目演示流程。

### 测试任务

- 执行完整回归：
  - 后端单元测试
  - 前端单元测试
  - API 自动化
  - UI E2E
  - GitHub Actions
- 整理测试报告：
  - 测试范围
  - 测试环境
  - 测试结果
  - 缺陷记录
  - 风险说明
  - 后续优化

### 产出物

- `README.md`
- `docs/test-report.md`
- 可演示的完整项目
- CI 通过记录
- Playwright 测试报告

### 验收标准

- 本地完整测试通过。
- GitHub Actions 通过。
- 日程 CRUD 功能可正常演示。
- 文档能说明项目如何启动、如何测试、如何查看报告。

## 最终交付清单

| 类型 | 交付物 |
| --- | --- |
| 需求文档 | `docs/requirements.md` |
| 测试用例 | `docs/test-cases.md` |
| AI 提示词 | `docs/ai-prompts.md` |
| 后端服务 | Go + Gin + GORM + SQLite |
| 前端页面 | React + Vite + TypeScript |
| 后端测试 | Go test / httptest |
| 前端测试 | Vitest |
| API 测试 | Playwright request |
| UI 测试 | Playwright |
| CI/CD | GitHub Actions |
| 测试报告 | `docs/test-report.md` |
| 项目说明 | `README.md` |

## 建议里程碑

| 里程碑 | 完成时间 | 判断标准 |
| --- | --- | --- |
| M1：项目可启动 | 第 2 天 | 前后端基础服务可运行 |
| M2：核心 CRUD 可用 | 第 4 天 | 页面能完成增删改查 |
| M3：自动化测试可运行 | 第 6 天 | API 和 UI 自动化通过 |
| M4：质量门禁完成 | 第 8 天 | GitHub Actions 可拦截失败 |
| M5：文档和报告完成 | 第 10 天 | 可完整演示和提交 |

## 风险与应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| 前后端联调耗时 | 影响 UI 和 E2E 进度 | 第 3 天先固定接口契约 |
| E2E 测试不稳定 | CI 偶发失败 | 使用稳定选择器、独立测试数据、等待明确状态 |
| 测试数据污染 | 用例互相影响 | 每条用例独立创建和清理数据 |
| GitHub Actions 环境差异 | 本地通过但 CI 失败 | 在 CI 中显式安装依赖和浏览器 |
| 时间不足 | 无法完成全部增强能力 | 优先保证 CRUD、API 测试、E2E、CI 主链路 |

## 推荐优先级

如果时间有限，优先完成：

1. Go 后端 CRUD API
2. React 前端 CRUD 页面
3. Go 单元测试
4. Playwright API 测试
5. Playwright UI 测试
6. GitHub Actions 质量门禁

AI 辅助测试、复杂筛选、测试报告美化可以作为增强项。
