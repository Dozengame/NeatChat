# GPT-6.1 兼容与启用说明

适用代码基线：`4e0d01ac477d8a6e7193b11efdda37efcc339629` 加 GPT-6.1 兼容与图片上传改动，交付分支为 `dev`。

## 已实现行为

- OpenAI 目录识别 `gpt-6.1-sol`、`gpt-6.1-terra`，共用模型能力、知识截止日期和预算规则；日期后缀仅用于能力匹配，不证明快照或账号可用性。
- Sol 支持 `low/medium/high/xhigh/max`，旧 `none/minimal` 转为 `low`；Terra 额外支持 `none`。仅 Terra 的 `none` 允许采样，两者输出上限均为 128000。
- 前后端按有效 effort 清理采样及 logprobs，保留 `text.format`；输出预算 0 在最终请求中省略，包括管理员锁定值。
- Sol 保留三种 reasoning context；Terra 仅开放 `auto`，wire 中省略 context。显式非 auto 或无效导入值保留并提示，发送前拒绝；这表示应用尚未验证，不代表官方明确不支持。
- 图片上传、带图切换、搜索、Plugin 和可信 safety identifier 接入现有能力链；图片默认 high，默认指令和稳定日期保持。
- 原生 Plugin 显式使用 `strict:false`，保留可选 schema 语义。非流式实际工具或 pending 恢复请求提前报错；无工具及标题摘要正常。
- 现有工具限额、取消、结果未知保护和跨型号历史隔离保持。Sol/Terra 之间不复用旧 response ID 或加密推理，不重执行历史工具。
- 完整历史路径按 `min(922000, 1050000 - 输出预留) - 64000 - 固定输入估算` 保护输入。普通历史窗口和 auto 策略保持。
- 服务端和直连模型探针共用完成判定；仅 completed 且有可见文本通过，incomplete、失败、无效 JSON、空文本和超时分别报告。预算和超时保持，不自动重试。

默认模型、effort、环境文件、白名单、网关、凭据、公告、摘要选择和持久化版本未调整。未引入新依赖、MCP 原生化、搜索后自动续接函数工具、计费面板或新的 Agent 协议。

## 人工启用示例

仅在目标环境完成模型授权与网关验证后，合并以下条目；不要覆盖该环境原有型号及模型级规则。

```dotenv
CUSTOM_MODELS=-all,gpt-6-luna@openai,gpt-image-2.5-flare@openai,gpt-6.1-terra@openai,gpt-6.1-sol@openai
OPENAI_REASONING_EFFORT="*=medium;gpt-6-luna=xhigh;gpt-6.1-terra=medium;gpt-6.1-sol=medium"
WEBUI_ALLOWED_REASONING_EFFORTS="*=low,medium;gpt-6-sol=low,medium,high;gpt-6-luna=low,medium,high,xhigh,max;gpt-6.1-terra=none,low,medium,high,xhigh,max;gpt-6.1-sol=low,medium,high,xhigh,max"
```

保留 `DEFAULT_MODEL`。若另设 `WEBUI_ALLOWED_MODELS`，同步追加两型号。沿用环境原有 store、standard、auto、图片 high、输出预算、缓存模式和 TTL；128K 不是推荐默认输出预算。

配置起点：均衡为 Terra/Sol medium；速度优先为 low；简单提取可选 Terra none，复杂分析可选 Sol high。模型及 effort 由用户主动选择，不自动路由。

## 验证边界

自动化覆盖能力/provider、采样、预算0、context、图片、缓存、schema、工具循环、配置连续加载与序列化恢复、指令快照、历史及探针完成状态。具体 suite 入口包括 `gpt61-responses`、`gpt6-settings`、`gpt6-tool-client`、`gpt6-config-migration`、`openai-all-turns-history`、`openai-model-test` 和 `model-test-route`。

| 验证 | 结果与证据范围 |
|---|---|
| 最终完整 Jest | 95 套、1240 项通过，包含文件选择器及配置迁移、额度预检、异常 context、大写型号元信息回归；现有 Markdown 测试需允许 tsx 创建本机 IPC，受限沙箱会产生 EPERM |
| 文件选择器改动的相关 Jest | 5 套、144 项通过，覆盖节点连接、取消、空选择、类型拒绝、成功清理，以及附件、Composer 和 6.1 请求回归 |
| TypeScript、相关 lint、diff 检查 | 通过；计划索引与续接摘要同步当前交付，历史原文保留 |
| 最终生产构建 | 当前完整工作区（含文件选择器修复）mask 生成及 standalone Next build 通过，包含编译、lint、类型检查、页面生成和构建追踪；没有跟踪中的生成物变化，不代表部署或 Tauri 打包通过 |
| 本地 Browser | 正常测试访问码；桌面布局与 390×844 手机布局。模型切换、管理员过滤与锁定、Sol 三种/Terra 仅 auto context、刷新保留、摘要跟随 Luna已验证；Sol 下实际选 PNG 后带图切换 Terra，预览保留并成功发送；手机下实际选择 96×64 PNG、Sol 发送、消息图片预览均通过 |
| 图片请求证据 | 本机 `/v1/responses` 收到 Terra 的 1×1 PNG、Sol 的 96×64 PNG，均为一个可解码的 `input_image`、`detail: high`。Sol 带 context auto，Terra 省略 context；页面均显示对应型号的“收到 1 张图片”受控响应 |
| Browser 限制 | 本地测试环境仍出现 MCP availability 错误，未据此认定第三方 MCP 可用。无图片选择、解码或发送错误，未见框架错误覆盖层及相关溢出 |

本地 Browser 使用仅监听本机的受控响应服务、测试凭据与独立进程配置，未修改环境文件或调用真实付费模型。该证据不等同于真实模型生成、图片理解或联网能力验收。

## 文件选择器生命周期

`uploadAttachments` 的临时文件 input 在选择期间挂到 DOM，并保持隐藏；完成、取消、空选择或类型拒绝后清理。浏览器自动化可据此稳定解析选择器对应的 backend node，避免对离线节点设置文件时失败。图片仍使用原有 FileReader/canvas 处理与 data URL 传输，不改变默认模型、环境、图片尺寸策略或 provider 路由。

实际页面选择两次均成功，完成处理后临时 file input 数量回到 0。手机消息预览中的图片完成解码，naturalWidth/naturalHeight 为 96×64；本机服务独立验证相同尺寸，证明图片内容已进入请求。

## 最终代码审查

能力与请求约束、UI、配置来源、探针、图片选择器及相关回归已完成交叉复核，未发现未处理的阻断问题。以下边界已在代码中明确处理并纳入测试：

- 6.1 已知旧 `none/minimal` 按型号规范为 `low`，不被服务端 medium 默认抢先替换；合法显式输出预算和用户／会话来源保留，连续配置加载保持稳定。
- 探针省略输出上限时，额度预检按被测模型最大输出加固定输入估算，不按零预算放行；额度不足不发请求，wire 仍省略上限。
- 导入 `__proto__`、`constructor` 等异常 context 时，标签只读取映射的自有属性；显示提示并允许用户选择 auto，不导致设置页崩溃。
- 大小写及日期后缀兼容的 6.1 型号使用同一能力元信息决定系统提示注入和知识截止日期，保留原始 model ID。

最终检查期间 `.env`、默认配置、服务端配置及 access store 文件指纹保持不变。未调用真实付费模型或执行部署；Git 提交和推送不代表环境启用。实际上游、第三方 MCP、真实识图质量与 Tauri 打包仍不属于已取得的验证证据。

真实上游的可用性、图片理解质量、联网/第三方工具、Pro、高 effort、缓存命中和长期性能需另行获授权验收。BYOK/Tauri 直连只复用客户端约束，不受 NeatChat 服务端强制策略保护；未进行 Tauri 打包或线上部署。

## 回退

未改变部署配置，可撤销本次代码改动并保留消息、附件、指令和恢复状态。正式启用采用追加白名单；出现问题时先停止新启用，不直接删除型号导致存量会话批量切换，不切换模型重放结果未知的工具。

## 官方依据

- [Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol)、[Terra](https://developers.openai.com/api/docs/models/gpt-6.1-terra)
- [迁移](https://developers.openai.com/api/docs/guides/latest-model#migration-quickstart)、[Reasoning](https://developers.openai.com/api/docs/guides/reasoning)
- [Function calling](https://developers.openai.com/api/docs/guides/function-calling)、[Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching)
