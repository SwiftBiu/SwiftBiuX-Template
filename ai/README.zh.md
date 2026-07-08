# SwiftBiuX AI 开发入口

现在开发 SwiftBiu 插件的推荐方式是：先让 AI 根据 SwiftBiuX Skill 生成可运行插件，再按需查文档微调。

你不需要先读完整的 manifest、权限和 API 文档。先描述你想做什么，AI 会根据 Skill 自动选择插件类型、声明最小权限、生成文件，并在可能时打包成 `.swiftbiux`。

## 最快路径

把下面这段复制给 ChatGPT、Claude、Cursor、Codex 或其他代码助手：

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

## 什么时候读哪个文档？

AI 应先读取 `AI_SKILL.md`，然后根据任务类型按需加载文档：

| 你的需求 | 推荐文档 |
| --- | --- |
| 第一次生成插件 | `developer-modules/quick-start.zh.md` |
| 不知道该做文本插件还是文件插件 | `references/scenarios.md` |
| 最小 manifest、extensionKind、actions | `references/manifest-basics.md` |
| 图标格式、SF Symbol、文本图标 | `references/manifest-icons.md` |
| 完整 manifest、配置项、shareTargets | `developer-modules/manifest.zh.md` |
| 需要剪贴板、文件、网络、通知 | `developer-modules/permissions.zh.md` |
| 批量处理本地文件 | `references/file-workflows.md` |
| 接入 OpenAI、Gemini、DeepL、remove.bg 或内部 API | `references/network-api-checklist.md` |
| 需要 HTML 界面、预览、表单、进度条 | `references/ui-patterns.md` |
| 调试安装、日志或 Web Inspector | `developer-modules/debugging.zh.md` |

完整索引见：`ai/docs-index.json`。

## 推荐工作流

1. **先描述需求**：用自然语言说清输入、处理逻辑和输出方式。
2. **让 AI 选择架构**：textAction、fileAction、纯 JS、Web UI、AI/API、shareTargets。
3. **生成并打包**：得到 `manifest.json`、`script.js`、可选 `ui/index.html` 和 `.swiftbiux`。
4. **安装测试**：双击 `.swiftbiux` 安装，在 SwiftBiu 中触发。
5. **再查文档微调**：遇到权限、配置、UI、文件处理、发布问题时再读对应模块。

## 常见插件想法

- 选中文字后让 AI 改写、翻译、总结或提取结构化信息。
- 选中文件后批量重命名、分类、压缩、生成报告或打开指定 App。
- 框选 OCR 文本后自动翻译、清洗或保存到知识库。
- 打开一个 HTML 小窗口，用表单、预览和按钮完成复杂操作。
- 接入公司内部 API，把日常流程变成 SwiftBiu 工具栏动作。

## 手动开发入口

想完全手写或深入理解规范时，再阅读：

- `DEVELOPMENT_GUIDE_zh.md`
- `developer-modules/manifest.zh.md`
- `developer-modules/permissions.zh.md`
- `developer-modules/examples.zh.md`
