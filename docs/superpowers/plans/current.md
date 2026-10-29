# NeatChat 续接摘要

最近一次产品验收与交接更新为 2026-10-29。续接前核对当前代码和 Git 状态；历史记录不替代当前环境验证。

## 当前产品交付：GPT-6.1 兼容

- 基于 `dev@4e0d01ac` 接入 OpenAI GPT-6.1 Sol/Terra；精确能力、参数清洗、图片与 Plugin 入口、历史预算、模型探针和配置恢复共用现有架构。
- Sol 不支持 none，旧 none/minimal 规范为 low；Terra 仅开放 auto context，显式未验证值可见且发送前拒绝。默认聊天模型、环境文件、网关、凭据、白名单及用户指令保持不变。
- 完整 Jest 95 套 / 1240 项、TypeScript、lint、生产构建及 diff 检查通过；独立代码审查未发现未处理问题。
- 正常测试访问码下的桌面/手机页面验证通过，实际 PNG 选择、带图切模、预览、发送及本机受控 Responses 接收已验证。文件选择器的临时 input 在 DOM 保持到选择完成或取消后清理。
- 本次没有真实付费模型、第三方 MCP、线上部署或 Tauri 打包验收；Git 推送不代表环境启用或部署。完整契约、配置示例与证据见 [GPT-6.1 交付说明](iterations/2026-10-29-gpt61-compatibility.md)。

## 2026-09-23 GPT-6 / Flare 交付（历史）

- 当时已交付并推送：`dev@4e0d01ac`、`main@b5f55b58`；两提交代码树完全一致，该次交接结束时 checkout 为 `main`。
- 代码兼容 GPT-6 Astra/Sol/Luna，本地环境仅显示 Luna 与 Flare；Luna 默认 `xhigh`，界面可选 `low/medium/high/xhigh/max`。默认自定义指令和本地更新公告已更新。
- 生图迁移已修复重复加载后回退 Luna 的问题：保留原有用户选择，管理员锁定/移除仍有效；旧会话内容与自定义指令快照保持不变。
- 最终验收：93 套 / 1060 项测试、TypeScript、lint、生产构建通过；正常鉴权的桌面/手机页面通过，真实 IndexedDB 连续刷新三次保持 Flare。
- 指定网关的 Luna 流式、Flare 生图及小图编辑通过。较大编辑上传仍有 Surge 写入超时；没有线上部署、真实第三方工具写操作或 Tauri 打包的验收证据。
- 维护入口、完整配置、迁移契约、命令、证据与限制见 [本次交接](iterations/2026-09-23-gpt6-flare-compatibility.md)。`.env` 保持 local-only，目标部署环境的配置同步不能由 Git push 推断。

## 2026-09-06 规则整理记录（历史）

- 本次整理开始时 checkout 为 `dev@6d3ac30c`（`fix(frontend): prevent stale theme transition callbacks`），工作区干净。
- 本次范围为 AGENTS、skill 与 workflow；未修改应用源码、依赖、模型配置或 CI，也未执行产品 build、真实 provider 调用或部署。
- 执行约定在根 `AGENTS.md`，验证与交接规则在 [workflow.md](workflow.md)。本页记录续接事实，不重复执行规则。
- 指令验证已完成：skill 元数据、Markdown 格式、引用与测试路径、历史原文完整性和 Git 范围检查；8 个代表性请求经独立只读场景复核，两处歧义修正后复核通过。此结果验证规则一致性，不代表实际任务速度或模型质量的 A/B 测量。

## 沿用的待核查风险

以下为 2026-09-06 的静态记录，本次产品升级未重新审查或修改该 CI 链路。

- 预览 CI 的 [deploy_preview.yml](../../../.github/workflows/deploy_preview.yml) 在 `pull_request_target` 下检出 PR head，并在带 Vercel secrets 的环境中构建。若 PR 内容不可信，构建脚本可接触这些凭据；本次仅静态确认了该链路，未执行 workflow、检查远端启用状态或修改发布流程。建议单独审查并隔离构建与凭据权限。

## 产品记录

以下为有日期的产品记录；各条目的验证只覆盖记录中的范围。

| 记录                                          | 入口                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| 2026-10-29 GPT-6.1、图片上传与最终验收        | [对应 iteration](iterations/2026-10-29-gpt61-compatibility.md)             |
| 2026-09-23 GPT-6、Flare、默认指令与迁移验收   | [对应 iteration](iterations/2026-09-23-gpt6-flare-compatibility.md)         |
| 2026-07-22 前端动效、主题切换与长消息渲染     | [对应 iteration](iterations/2026-07-22-frontend-motion-rendering-polish.md) |
| 2026-07-16 Composer 修复与响应式验收          | [对应 iteration](iterations/2026-07-16-composer-direct-remediation.md)      |
| 2026-07-14 Jimeng 移除、通用 MCP 与持久化修复 | [对应 iteration](iterations/2026-07-14-jimeng-removal-p1-masks.md)          |

## 续接时需重新确认的边界

- 旧记录中的测试数量、Browser 状态、部署页面和 branch/head 只证明记录时的范围。真实 provider、第三方 MCP、付费调用及未覆盖平台不因历史 Jest/build 通过而视为验收通过。
- Jimeng 的旧实现记录已被移除方案取代；按当前代码和本次需求判断，历史候选不自动成为恢复功能或继续打磨的授权。
- 旧文档中的 PTC、hosted MCP、Multi-agent 开关描述指 NeatChat 产品 API 功能，不决定 Codex 是否可使用 sub-agent。产品能力与模型指导涉及当前状态时重新核实。
- 需要接续未知结果的工具调用、持久化重试或 Markdown 安全工作时，先核对当前授权、幂等/隔离及 sanitizer 契约；不从旧候选直接开始重写。

## 历史检索

原 `current.md` 已完整保存在 [2026-07-22 状态快照](iterations/2026-07-22-state-snapshot.md)。其中重复和已被替代的结论保留用于追溯，不作为现行规则。按关键词搜索相关段落，其他主题见 [索引](README.md)；无需预读快照全文。
