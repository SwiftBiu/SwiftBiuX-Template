# SwiftBiuX 插件模板库

欢迎来到 SwiftBiuX 官方插件模板库。这里既包含可直接安装的插件，也包含给 AI 和开发者使用的插件开发规范、示例与模板。

SwiftBiu 1.3.9 可把同一项扩展能力带到选中文字、剪切板、OCR 和文件入口，并按内容类型智能分发；扩展还可以使用 Lottie 工具栏动态图标，通过 `.swiftbiuxs` 可审阅源码或只读 iCloud 链接安全分享。

## 🤖 推荐：用 AI 快速生成插件

现在开发 SwiftBiu 插件的推荐方式是：**先让 AI 根据 SwiftBiuX Skill 生成可运行插件，再按需查文档微调。**

最快开始：

1. 打开 ChatGPT、Claude、Cursor、Codex 或其他代码助手。
2. 让它读取 [`AI_SKILL.md`](AI_SKILL.md)。
3. 描述你想做的插件：输入、功能、输出、是否需要 API。
4. 让 AI 生成 `manifest.json`、`script.js`、可选 `ui/index.html`。
5. 使用 `./scripts/build_plugin.sh <插件目录>` 打包成 `.swiftbiux`。

完整 AI 入口：[`ai/README.zh.md`](ai/README.zh.md)  
快速开始：[`developer-modules/quick-start.zh.md`](developer-modules/quick-start.zh.md)

## 复制即用的 AI Prompt

```text
阅读 SwiftBiuX Skill：
https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL.md

请帮我创建一个 SwiftBiu 插件：

插件名称：
输入类型：选中文本 / 选中文件 / 手动输入 / Web UI
功能目标：
输出方式：粘贴回原处 / 复制到剪贴板 / 显示通知 / 保存文件 / 打开窗口
是否需要网络/API：否 / 是，使用哪个服务：
是否需要配置项：否 / 是，需要哪些配置：

要求：
- 自动选择 textAction 或 fileAction
- 只声明必要权限
- 生成 manifest.json 和 script.js
- 如果需要界面，再生成 ui/index.html
- 尽量本地处理，只有必要时才使用网络/API
- 完成后用 ./scripts/build_plugin.sh 打包
```

更多场景 Prompt：[`ai/prompts/`](ai/prompts/)

## 🛠 手动开发文档

如果你想完全掌控插件结构、权限、配置项和发布流程，可以继续阅读：

- [`DEVELOPMENT_GUIDE_zh.md`](DEVELOPMENT_GUIDE_zh.md)：传统完整开发手册。
- [`developer-modules/manifest.zh.md`](developer-modules/manifest.zh.md)：manifest、图标、配置项、shareTargets 与核心 API。
- [`developer-modules/permissions.zh.md`](developer-modules/permissions.zh.md)：剪贴板、粘贴、文件、网络、通知等权限。
- [`references/native-ai.md`](references/native-ai.md)：SwiftBiu 托管 AI、提供商/模型选择和 `allowedProviders` 契约。
- [`developer-modules/examples.zh.md`](developer-modules/examples.zh.md)：真实插件模板和实现模式。

AI 按需加载索引：[`ai/docs-index.json`](ai/docs-index.json)

发布模板前运行 `node scripts/test_public_contract.js --template-only`。当本仓库位于
`SwiftBiu/SwiftBiuX-Template` 时，运行 `node scripts/test_public_contract.js`
还会继续对比 Swift 后台接口、Web Bridge 路由与 API 覆盖测试。

## 📦 查看插件目录

主 README 里维护了插件目录、插件状态和下载链接：[`README.md`](README.md)。
