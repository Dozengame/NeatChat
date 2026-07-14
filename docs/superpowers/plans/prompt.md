# Minimal Prompt

```text
/goal 继续 NeatChat 当前任务。先读根目录 `AGENTS.md`，再读 `docs/superpowers/plans/README.md`、`current.md`、`workflow.md`，并按 README 路由只读一个相关 `iterations/` 文件。按“规划-行动-验收-交付-记录交接-再规划”循环执行：一次只做一个可验证切片，明确完成标准、目标文件、非目标、测试和 Browser QA；实现后运行相关 Jest、`yarn lint`、`npx tsc --noEmit --pretty false`、`git diff --check`、必要时 `yarn build`，并做桌面/移动/窄屏验证。交付前更新 `current.md` 和对应 dated iteration 文件；不要重建 `design-qa.md`，`AGENTS.md` 和内部计划默认不 stage、不提交。
```
