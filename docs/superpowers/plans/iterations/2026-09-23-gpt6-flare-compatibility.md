# 2026-09-23 GPT-6 / Flare 兼容升级交接

## 交付版本与范围

- `dev`：`4e0d01ac477d8a6e7193b11efdda37efcc339629`。
- `main`：`b5f55b5882f01ca71d70540dbe9995f83c1fd358`，通过 cherry-pick 移入上述提交；沿用 main 既有的独立提交方式。
- 两个提交的代码树相同：`9807e7456a7b38d9c78d297047fef270102af7e2`。两个远端分支的提交均已回读确认；代码提交共 39 个文件。
- 代码兼容 OpenAI 的 GPT-6 Astra、Sol、Luna；当前本地环境只展示 Luna 与 GPT Image 2.5 Flare。保留旧模型兼容，不增加 Azure GPT-6、异步工具、WebSocket 追加指令、hosted MCP 或多 Agent 产品功能。
- 本次还更新了默认自定义指令、模型配置迁移、摘要模型过滤和本地更新公告。`.env`、凭据、截图与临时验收文件未纳入代码提交。
- 这里只确认代码、测试、本地页面和指定网关的验证结果；未取得线上部署完成、生产环境变量已同步或生产页面验收的证据。

## 配置基线

本次本地 `.env` 使用以下配置；模型 ID 必须保留连字符：

```dotenv
CUSTOM_MODELS=-all,gpt-6-luna@openai,gpt-image-2.5-flare@openai
DEFAULT_MODEL=gpt-6-luna
OPENAI_REASONING_EFFORT="*=medium;gpt-6-luna=xhigh"
WEBUI_ALLOWED_REASONING_EFFORTS="*=low,medium;gpt-6-sol=low,medium,high;gpt-6-luna=low,medium,high,xhigh,max"
```

- 保留原有 `OPENAI_MAX_OUTPUT_TOKENS=100000`、`OPENAI_STORE_RESPONSES=false`、`OPENAI_REASONING_MODE=standard`、`OPENAI_REASONING_CONTEXT=auto`、`OPENAI_INPUT_IMAGE_DETAIL=high`、`OPENAI_PROMPT_CACHE_MODE=explicit`、`OPENAI_TEXT_VERBOSITY=low` 和历史压缩阈值 `1000`。
- `WEBUI_ALLOWED_REASONING_EFFORTS` 已去重。Luna 界面显示 `low/medium/high/xhigh/max`，默认 `xhigh`；Sol/Astra 虽在代码中兼容，但未在当前环境模型列表开放。
- `BASE_URL`、`OPENAI_RESPONSES_URL`、`OPENAI_IMAGES_URL` 保留本地已有网关。真实验证必须使用获授权环境中的该网关，不直连 OpenAI，也不自动切换备用上游。私有地址与凭据不复制到共享文档。
- `WEBUI_ANNOUNCEMENT_JSON` 是单行 JSON，日期为 `2026.09.23`，分为“模型升级”“功能优化”“默认指令更新”。沿用内容哈希与已读记录，不新增公告协议。
- `.env.template` 只维护字段说明，不承担部署环境同步；代码默认模型为 Luna，图片模式默认模型为 Flare。

### 公告内容

以下是本次公告的非敏感内容；写入 `WEBUI_ANNOUNCEMENT_JSON` 时压缩为单行 JSON，并保留 `.env` 所需的外层引号。

```json
{
  "date": "2026.09.23",
  "sections": [
    {
      "title": "模型升级",
      "items": [
        "新增 GPT‑6 系列兼容，默认聊天模型升级为 GPT‑6 Luna。",
        "生图与图片编辑模型升级为 GPT Image 2.5 Flare。"
      ]
    },
    {
      "title": "功能优化",
      "items": [
        "完善推理强度、图片理解、联网搜索和工具调用的模型适配。",
        "优化多轮对话、缓存复用及工具调用中断后的恢复。",
        "生图新增 xhigh、max 质量选项，完善 2K/4K 尺寸和图片输出处理。"
      ]
    },
    {
      "title": "默认指令更新",
      "items": [
        "更新设置页的默认自定义指令，强调简洁直接、可执行建议，以及第一性原理和长期价值。",
        "新指令对新会话生效，保留用户自行修改的指令和已有会话内容。"
      ]
    }
  ],
  "note": "点击“我知道了”后，本次公告不再重复提示。"
}
```

## 维护入口与行为约束

| 子系统                 | 主要入口                                                                                                                                                                                             | 更新时必须保留的行为                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 模型能力与目录         | [openai-responses.ts](../../../../app/utils/openai-responses.ts)、[constant.ts](../../../../app/constant.ts)                                                                                         | 明确列举三型号及日期快照，不把未知 `gpt-6-*` 自动当成已支持模型；模型菜单与 API 参数各自遵守能力和管理员策略。               |
| 请求、缓存与服务端约束 | [Responses builder](../../../../app/client/platforms/openai-responses-builder.ts)、[Responses policy](../../../../app/api/openai-responses-policy.ts)、[OpenAI proxy](../../../../app/api/common.ts) | 前后端复用能力与缓存规则；服务端也移除不支持的参数；不能只改 UI 或模型字符串。                                               |
| 多轮与工具恢复         | [chat store](../../../../app/store/chat.ts)、[Responses tool loop](../../../../app/client/platforms/openai-responses-tools.ts)、[OpenAI client](../../../../app/client/platforms/openai.ts)          | 保留 stored/stateless 回放、取消、未知执行结果保护和执行次数约束。                                                           |
| Flare 生成与编辑       | [openai-image.ts](../../../../app/utils/openai-image.ts)、[typing.ts](../../../../app/typing.ts)、[首页模式](../../../../app/components/chat-home-mode.ts)                                           | 生成 JSON、编辑 multipart 和服务端边界共用 `normalizeOpenAIImageRequestParameters`；图片字节与 multipart boundary 不被破坏。 |
| 配置与生图迁移         | [access store](../../../../app/store/access.ts)、[public-app-config.ts](../../../../app/utils/public-app-config.ts)                                                                                  | 生图替换不能退回文字模式；重复加载、持久化和管理员策略都要覆盖。                                                             |
| 默认自定义指令         | [config store](../../../../app/store/config.ts)                                                                                                                                                      | `DEFAULT_CUSTOM_INSTRUCTIONS` 是完整默认文案的唯一来源；版本为 `4.7`，只更新旧默认或空缺值，不覆盖用户定制及已有关闭状态。   |
| 设置、摘要与公告       | [ModelConfig](../../../../app/components/model-config.tsx)、[summary-request.ts](../../../../app/utils/summary-request.ts)、[公告解析](../../../../app/utils/update-announcement.ts)                 | 生图模型不进入摘要候选；Settings/Composer 的选项保持一致；中文与英文文案同时维护。                                           |

### GPT-6 请求规则

- Astra 支持 `low/medium/high/xhigh/max`；Sol、Luna 额外支持 `none`。旧 `minimal` 映射为 `low`，Astra 的 `none` 回落 `low`。三型号输出上限均为 `128000`。
- 继续使用 Responses API。只有 Sol/Luna 的 `none` 模式允许采样参数；其他 GPT-6 请求清除 `temperature`、`top_p`、`logprobs`、`top_logprobs` 及对应的 `include` 项。不要把产品级 Ultra 写入 API effort。
- 高级能力覆盖推理模式、推理上下文、图片理解、verbosity、联网搜索及经过服务端验证的 `safety_identifier`。用户传入的 safety identifier 不直接透传。
- 显式缓存重建最近两个用户回合末尾的断点，TTL 为 `30m`；关闭缓存时清除断点与 key。默认系统提示改用稳定的当地日期与时区，用户自定义 `{{time}}` 仍使用完整时间。未引入 `configuration_update`。
- 同一型号（忽略日期快照后缀）的历史可复用 Responses ID 和工具 trace。跨型号不复用加密推理或 stored ID；唯一配对的工具调用结果转为纯文本历史摘要，不携带调用参数，不重新执行工具。未记录型号的旧历史沿用兼容路径。
- `recoveryPending` 在异步准备前按兼容型号捕获，只清理本次实际消费的兼容恢复记录。跨型号保留原恢复状态，避免将未恢复的调用误标完成。
- 原生 function tools 来自现有 Plugin 适配；通用 MCP 仍沿用 system prompt / JSON 调用链。不能将这些覆盖描述为新增 hosted MCP。

### Flare、默认指令与配置迁移

- Flare 支持 `auto/low/medium/high/xhigh/max` 质量和现有合法尺寸预设（含 2K/4K），默认 `auto` 尺寸、`auto` 质量、PNG、单图。沿用 Images API，未新增自由尺寸或遮罩编辑界面。
- JPEG/WebP 压缩限定 `0–100`；透明背景仅接受 PNG/WebP。空 `data` 或缺少图片结果必须报错，保留图片预览、下载、300 秒超时和取消处理。
- OpenAI 的旧 `gpt-image-2` 被移出白名单且 Flare 可用时，优先迁移到 Flare；历史图片、消息 model 标签及仍合法的图片参数保持不变。
- **最终审查修复：** 全局生图选择迁移后必须保留 `user_override` 语义。若标成 `fallback`，第二次加载配置会改回 Luna，并影响跟随全局的会话。此保留仅针对已有用户选择的 Image 2 → Flare 替换；普通聊天回退仍跟随后续服务端默认，管理员锁定或白名单移除仍优先。
- Settings 的默认自定义指令完整替换为本次用户提供的中文原文，强调简洁、第一性原理、复利思维和授权内推进。新用户默认开启；已有开关值保持不变；新会话和空会话取当前设置，有消息的旧会话保留指令快照。
- 摘要与标题只使用聊天模型。旧 Flare、Image 2、DALL-E 摘要覆盖不再用于请求，回退到有效聊天默认；保留有效聊天覆盖。

## 验收记录

| 验证层                   | 最终结果                                                                            | 证明范围                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 自动化回归               | 93 套、1060 项全部通过                                                              | 最终修复后的完整工作树；包含新旧模型、服务端、MCP mock、原生工具回放、配置迁移和默认指令。                                    |
| 静态与构建               | TypeScript、lint、生产构建、`git diff --check` 通过                                 | Web 代码与构建；不代表线上部署或 Tauri 打包通过。                                                                             |
| 本地 Browser             | 桌面 `1440×1024`、手机 `390×844` 通过                                               | 正常鉴权；Luna 五档和默认 xhigh、Flare 六档质量及 4K 选择、摘要过滤、默认指令、公告首次展示及确认后不重复；未见页面运行错误。 |
| 迁移 Browser 复验        | 旧 `4.6` 生图配置升级后连续刷新三次均为 Flare，来源为 `user_override`，版本为 `4.7` | 验证真实 IndexedDB 持久化；新建聊天仍遵守 Luna 默认。                                                                         |
| 真实网关：Luna           | 流式 HTTP 200，返回 `gpt-6-luna`，收到 `response.completed`                         | 一次简短文本，使用 xhigh；共 61 token。未验证缓存命中率或长期质量。                                                           |
| 真实网关：Flare 生成     | HTTP 200，得到可解码的 1024×1024 PNG                                                | low 质量、单图；约 53 秒，共 215 token。                                                                                      |
| 真实网关：Flare 小图编辑 | HTTP 200，得到可解码且符合测试编辑要求的 PNG                                        | 约 1.6 KB 参考图，low 质量；约 16 秒，共 229 token。                                                                          |
| Git 交付                 | `origin/dev` 和 `origin/main` 均回读确认                                            | 两分支代码树相同；提交 hooks 未改变已验收文件内容。                                                                           |

真实请求使用本项目请求构建器或针对性的 multipart 诊断，通过获授权网关发送；这不等同于已部署站点的端到端验收。Astra/Sol、真实第三方 MCP/Plugin 写操作、线上部署及桌面打包没有做真实验收。临时截图和日志保留在本次本地验收目录，不作为后续维护的唯一依据。

### 回归入口

- `test/gpt6-responses.test.ts`：三型号能力、日期快照、采样、服务端规范化、缓存及跨型号历史摘要。
- `test/gpt-image-flare.test.ts`、`test/openai-proxy.test.ts`、`test/openai-nonstream-error.test.ts`：图片参数、multipart 字节、网关路由和空结果错误。
- `test/gpt6-config-migration.test.ts`、`test/config-merge.test.ts`：连续加载 1/2/3 次、JSON 持久化恢复、新配置版本、管理员锁定/移除与普通聊天默认回退。
- `test/gpt6-tool-client.test.ts`、`test/openai-all-turns-history.test.ts`、`test/openai-responses-tools.test.ts`、`test/mcp-chat-recovery.test.ts`：原生工具、MCP mock、异步准备、未知结果和恢复范围。
- `test/custom-instructions.test.ts`、`test/gpt6-settings.test.tsx`、`test/summary-request.test.ts`：默认文案迁移、关闭状态、档位显示和摘要模型过滤。

验证命令按 [workflow](../workflow.md) 选择。环境中的 Yarn/Corepack 入口不可用时，本次使用已安装依赖的等效入口，未安装新依赖：

```sh
node node_modules/jest/bin/jest.js --ci --runInBand
node node_modules/typescript/bin/tsc --noEmit --pretty false
node node_modules/next/dist/bin/next lint
node --import tsx app/masks/build.ts
BUILD_MODE=standalone node node_modules/next/dist/bin/next build
git diff --check
```

TypeScript 与 Next build 应顺序执行，避免 `.next/types` 重建期间产生缺文件误报。部分既有 Markdown 测试使用 tsx 的本地 IPC，需要执行环境允许创建该 socket；不要把沙箱权限错误误判为 Markdown 回归。

## 已知限制与后续更新

- **较大图片编辑上传尚未通过：** 约 763 KB 的 multipart 上传分别在约 30 秒、45 秒后失败。第二次看到的 HTTP 503 是 Surge 生成的 `Connection Closed / Write operation timed out` 页面；Surge 记录没有收到该请求的上游响应。不能据此声称 Flare 返回了业务错误，也不能推断存在固定 763 KB 大小上限。
- 小载荷成功只能证明该网关上的基本编辑能力可用。后续应针对上传链路、网关接收和超时排查；本次未修改 Surge 策略、未切换网关、未绕过访问控制。再次真实调用仍按当次授权执行，避免对未知结果进行无界重试。
- Prompt Cache 仅验证了请求规则和稳定前缀；没有测量真实缓存命中率、吞吐量或成本改善。不要把配置兼容写成性能提升的量化结论。
- 部署者需在目标环境自行同步上述非敏感模型配置和公告，保留该环境获授权的凭据及网关。重新构建/启动后，无缓存回读 `/api/config` 的 allowedModels、默认模型、effort 规则和公告，再做正常鉴权后的页面检查；Git push 不代表这些步骤已完成。
- 后续升级模型时先核对官方文档，再同步能力 helper、模型目录、前后端约束、双语选项及回归测试。更新默认指令时保留旧默认精确匹配与用户覆盖边界；不要在全局替换中改写旧会话内容。

本次依据：[GPT-6 指南](https://developers.openai.com/api/docs/guides/latest-model)、[Flare 模型卡](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare)、[图片生成指南](https://developers.openai.com/api/docs/guides/image-generation)。这是 2026-09-23 的实现与验收记录，后续模型规格仍需重新核实。
