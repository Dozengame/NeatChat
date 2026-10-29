# NeatChat 验证与交接

按当前任务选用本页；执行与授权遵循仓库根 `AGENTS.md` 和本次请求。先确定要证明的行为，再选检查。以下是命令入口，不是每次执行的清单；命令以 `package.json`、测试文件和相关 CI 为准。

## 选择验证范围

| 改动                     | 最小有效证据                                                                 | 扩展条件                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| 文档、AGENTS、skill      | 内容、引用路径、格式、敏感信息与 Git 范围；skill 另查 frontmatter 和触发边界 | 指令改变执行决策时，用代表性请求复核路由；无需应用 Jest/build                                    |
| UI 行为                  | 相关 Jest 回归、真实页面关键交互                                             | 响应式、主题、键盘或共享组件受影响时扩展 Browser QA                                              |
| 纯样式                   | 相关 visual contract、Browser QA                                             | 不机械新增仅匹配实现文字的测试                                                                   |
| API、provider、streaming | 相关 Jest、状态码/headers/payload 或日志                                     | 共享类型、请求链、打包边界变化时扩展 TypeScript、关联测试或 build；无 UI surface 不做 Browser QA |
| auth、MCP、持久化、同步  | 边界与失败路径回归                                                           | 按风险覆盖隔离、授权、重试、取消、恢复、导入导出；真实服务需要相应授权                           |
| 构建、部署、桌面端       | 目标配置或打包检查                                                           | 只验证受影响的平台，区分本地准备与实际发布                                                       |

先搜索并选现有 suite。`yarn test` 会进入 watch；单次任务使用：

```bash
yarn jest test/openai-responses-builder.test.ts --runInBand --runTestsByPath
```

将示例文件替换为受影响的 suite，可传多个路径。常用入口：

| 范围              | `test/` 下的候选文件                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------- |
| UI、消息          | `gemini-visual-migration.test.ts`、`chat-render.test.ts`、`message-content.test.ts`       |
| 配置、provider    | `server-config.test.ts`、`config-merge.test.ts`、`model-provider.test.ts`                 |
| Responses、stream | `openai-responses-builder.test.ts`、`chat-stream-payload.test.ts`、`stream-fetch.test.ts` |
| auth              | `access-code-validation.test.ts`、`access-control.test.ts`                                |
| MCP               | `mcp-config.test.ts`、`mcp-display.test.ts`、`mcp-initialize.test.ts`                     |
| 存储、指令        | `startup-cache.test.ts`、`custom-instructions.test.ts`                                    |

按影响补充 `yarn lint`（可用 `--file` 限定源文件）、`yarn tsc --noEmit --pretty false`、`git diff --check`。影响扩散到多个模块且窄检查无法覆盖时用 `yarn test:ci --runInBand`；构建图、依赖、Next.js 配置或产物行为受影响时用 `yarn build`，请求全面发布验证时也需覆盖相应构建。已有通过证据可复用，相关输入或运行环境变化后才失效。

| 平台                      | 按需命令与边界                                            |
| ------------------------- | --------------------------------------------------------- |
| Docker 配置               | `docker compose config --quiet`，避免默认展开并输出环境值 |
| export/PWA                | `yarn export`；只证明静态产物能力                         |
| Rust/Tauri                | `cargo check --manifest-path src-tauri/Cargo.toml`        |
| 桌面打包或 Web/Tauri 集成 | `yarn app:build`                                          |

CI 的触发器、平台、检查以 `.github/workflows/` 为准；本地精简验证不修改或替代 CI 要求。运行现有命令前理解其影响：build/export/app:build 会生成 masks 或构建产物，结束后检查 Git 范围。

## Browser 与外部证据

- UI 按风险选择 desktop `1440x1024`、constrained `1056x834`、mobile `390x844`、narrow `320x740`，覆盖溢出、重叠、关键控件、键盘/焦点、相关主题及 console；不为无关改动遍历全矩阵。
- 先确认访问的是本次 checkout 的目标页面和构建。需要鉴权时使用已获授权的正常访问路径；不得绕过 gate。阻塞时继续可独立完成的组件、fixture 或服务端验证，将真实页面验证标为未完成，不能以鉴权页或 fixture 替代通过。
- 对真实 provider、MCP 或付费服务仅执行会话已授权的调用；未知结果的写操作先查状态或幂等保障，再决定是否重试。mock、静态检查和本地 build 各自说明证据范围。
- 本次引入的失败应修复后复验；既有失败或环境限制需区分并说明。必要证据仍缺失时标记部分验证，不以扩大无关测试掩盖缺口。

## 交接与 Git 范围

- 只有形成后续任务需要的事实、复杂任务需续接，或用户要求记录时，更新 `current.md` 和相关 iteration。只读答疑、简单修复和文档排版不自动生成交接报告。
- `current.md` 保留短摘要、待解决项及相关记录链接；旧事实留在 `iterations/`，不重复堆积长日志。记录日期、适用的代码状态、验证边界和必要后续项；候选项不构成新任务授权。
- `docs/superpowers/plans/` 是可跟踪的项目文档。提交在范围内时，相关交接与产品切片一起提交；根 `AGENTS.md`、`.agents/`、`.codex/` 及临时产物保持 local-only。不要因旧 ignore 说明漏掉新 iteration，也不要为记录而自动 commit。
- `README.md` 仅作索引，`prompt.md` 仅作续接入口。历史 iteration 中的旧 workflow、模型能力和 Git 规则只作记录，不覆盖当前约定；不重建 `design-qa.md` 或平行文档体系。

## 官方依据

2026-09-06 核对：[GPT-6 Astra prompting](https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra#prompting-best-practices)、[AGENTS.md 加载规则](https://learn.chatgpt.com/docs/agent-configuration/agents-md)、[Skills 按需加载与编写](https://learn.chatgpt.com/docs/build-skills)。本仓库将这些指导落实为授权内持续执行、按需上下文、独立工作包并行与风险匹配验证；实际速度和质量需要任务样本验证，不能从规则长度推断。
