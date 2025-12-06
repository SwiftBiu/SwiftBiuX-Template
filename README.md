# SwiftBiuX 插件目录

欢迎来到 SwiftBiuX 官方插件模板库。本文档旨在提供一个清晰的概览，介绍当前可用、正在开发以及计划中的所有插件。

目前插件的主要触发方式是：**选择文本内容 -> 触发扩展响应**。

**➡️ 想要学习如何开发插件？请查看我们的 [插件开发指南](DEVELOPMENT_GUIDE.md)** ([中文版](DEVELOPMENT_GUIDE_zh.md))

## 🧩 图例说明 (Legend)

**状态 (Status)**
*   `[x]` - **已发布**: 功能稳定，已包含在 Nightly Build 中。
*   `[-]` - **开发中**: 正在积极开发中。
*   `[ ]` - **计划中**: 已纳入开发路线图，欢迎认领。
*   `[!]` - **受限**: 需要主应用核心支持，或在 App Store 版本中受限。

**类型 (Type)**
*   `⚡️` - **Script (Local)**: 纯本地逻辑插件。无需联网，安全快速，通常无 UI。
*   `🌐` - **Script (Network)**: 联网脚本插件。需要调用外部 API 或访问网络资源。
*   `🎨` - **Web App**: 富 Web 应用插件。拥有完全自定义的 HTML/CSS/JS 界面，交互丰富。

---

## 📚 插件列表 (Plugin Catalog)

### ✍️ 文本处理与转换 (Text Processing)
*不仅是格式转换，更是文本数据的清洗与重组。*

| 状态  | 类型  | 插件名称                | 描述                                                    | 下载 | 作者 |
| :---: | :---: | :---------------------- | :------------------------------------------------------ | :---: | :--- |
| `[x]` |  `⚡️`  | **cny**                 | 数字转人民币大写。                                      | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/cny.swiftbiux) | 官方 |
| `[x]` |  `⚡️`  | **JSON 格式化**         | 美化和验证 JSON 字符串。                                | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/JSONFormatter.swiftbiux) | 官方 |
| `[x]` |  `⚡️`  | **Base64 编解码**       | Base64 编码与解码。                                     | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/Base64Converter.swiftbiux) | 官方 |
| `[x]` |  `⚡️`  | **单词/字符统计**       | 统计选中内容的单词数、字符数、行数等。                  | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/WordCount.swiftbiux) | 官方 |
| `[x]` |  `⚡️`  | **时间戳转换**          | 时间戳和日期时间格式互相转换。                          | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/TimestampConverter.swiftbiux) | 官方 |
| `[x]` |  `⚡️`  | **大小写转换**          | 英文字母大小写转换 (Upper, Lower, Camel, Snake)。       | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/CaseConverter.swiftbiux) | 官方 |
| `[x]` |  `⚡️`  | **文本清洗工**          | 去除空行/首尾空格、全角转半角、行去重、排序等。         | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/TextCleaner.swiftbiux) | 官方 |
| `[x]` |  `⚡️`  | **正则提取器**          | 使用正则表达式批量提取文本中的关键信息（如邮箱、URL）。 | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/RegexExtractor.swiftbiux) | 官方 |
| `[x]` |  `⚡️`  | **Markdown 表格格式化** | 将杂乱的文本一键整理为对齐的 Markdown 表格。            | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/MarkdownTableFormatter.swiftbiux) | 官方 |
| `[x]` |  `⚡️`  | **哈希计算器**          | 计算 MD5, SHA-1, SHA-256, Base64 摘要。                 | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/HashCalculator.swiftbiux) | 官方 |
| `[x]` |  `⚡️`  | **Slug 生成器**         | 将标题文本转换为 URL 友好的 Slug。                      | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/SlugGenerator.swiftbiux) | 官方 |
| `[ ]` |  `🎨`  | **文本处理流水线**      | 像搭积木一样组合多个文本处理操作。                      | 官方 |

### 🛠️ 开发者利器 (DevTools)
*利用本地 JS 能力，安全且高效的开发辅助工具。*

| 状态  | 类型  | 插件名称           | 描述                                                     | 作者 |
| :---: | :---: | :----------------- | :------------------------------------------------------- | :--- |
| `[ ]` |  `🎨`  | **颜色助手**       | 预览 Hex/RGB 颜色，并转换为 SwiftUI, UIKit, CSS 等格式。 | 官方 |
| `[ ]` |  `🎨`  | **JWT 解码器**     | **本地**解码 JWT Token，展示 Payload 和过期时间。        | 官方 |
| `[ ]` |  `🎨`  | **Mermaid 预览器** | 将 Mermaid 文本直接渲染为流程图/时序图。                 | 官方 |

### ⚡️ 生产力与效率 (Productivity)
*提升日常工作流的连贯性。*

| 状态  | 类型  | 插件名称              | 描述                                             | 作者 |
| :---: | :---: | :-------------------- | :----------------------------------------------- | :--- |
| `[ ]` |  `🎨`  | **文本差异比对**      | 将**选中的文本**与**剪贴板内容**进行 Diff 比对。 | 官方 |
| `[ ]` |  `🎨`  | **Markdown 实时预览** | 实时预览 Markdown 渲染效果。                     | 官方 |
| `[ ]` |  `🎨`  | **临时便签板**        | 一个简单的临时文本暂存区。                       | 官方 |

### 🚀 在线服务集成 (Online Services)
*连接外部世界，获取实时信息与 AI 能力。*

| 状态  | 类型  | 插件名称               | 描述                                                       | 下载 | 作者                                  |
| :---: | :---: | :--------------------- | :--------------------------------------------------------- | :---: | :------------------------------------ |
| `[x]` |  `🌐`  | **Gemini**             | 集成 Google Gemini 模型的 AI 插件。                        | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/Gemini.swiftbiux) | 官方                                  |
| `[x]` |  `🎨`  | **GeminiImage**        | 使用 Nano Banana 模型进行文生图。                          | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/GeminiImage.swiftbiux) | 官方                                  |
| `[x]` |  `🌐`  | **MultiSearch**        | 同时在多个搜索引擎中搜索选中的文本。                       | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/MultiSearch.swiftbiux) | 官方                                  |
| `[x]` |  `🌐`  | **OpenAIRewriter**     | 使用 OpenAI 模型来润色和改写文本。                         | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/OpenAIRewriter.swiftbiux) | [zwpaper](https://github.com/zwpaper) |
| `[x]` |  `🎨`  | **AdvancedTranslator** | 一个功能强大的翻译插件 (富 Web 应用范例)。                 | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/AdvancedTranslator.swiftbiux) | 官方                                  |
| `[ ]` |  `🎨`  | **AI 工具箱**          | 一个通用的 AI 平台，允许用户自定义 Prompt 对接多种大模型。 | | 官方                                  |
| `[ ]` |  `🎨`  | **IP 地址信息**        | 查询 IP 地址的地理位置和详细信息。                         | | 官方                                  |
| `[ ]` |  `🌐`  | **短链接生成器**       | 将长链接转换为短链接 (bit.ly 等)。                         | | 官方                                  |
| `[x]` |  `🎨`  | **实时汇率/加密货币**  | 实时查询法币汇率和加密货币价格。                           | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/CurrencyConverter.swiftbiux) | 官方                                  |
| `[x]` |  `🌐`  | **汇率转换 (Lite)**    | 选中金额直接转换并复制，无界面纯脚本版。                   | [Download](https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/CurrencyConverterLite.swiftbiux) | 官方                                  |
| `[ ]` |  `🌐`  | **代码分享 (Gist)**    | 一键上传代码到 GitHub Gist 或 Pastebin。                   | 官方                                  |
| `[ ]` |  `🎨`  | **聚合翻译**           | 同时展示 Google, DeepL, ChatGPT 等多源翻译结果。           | 官方                                  |
| `[ ]` |  `🎨`  | **链接元数据预览**     | 抓取 URL 的 Open Graph 信息（标题、摘要、缩略图）。        | 官方                                  |

### 🎨 数据与创意 (Data & Creative)
*数据可视化与趣味工具。*

| 状态  | 类型  | 插件名称         | 描述                                    | 作者 |
| :---: | :---: | :--------------- | :-------------------------------------- | :--- |
| `[ ]` |  `🎨`  | **迷你图表**     | 将简单的 CSV/数字数据生成柱状图或饼图。 | 官方 |
| `[ ]` |  `🎨`  | **文本加密胶囊** | AES 加密/解密文本，用于安全传输。       | 官方 |
| `[ ]` |  `🎨`  | **二维码生成器** | 将选中的文本实时生成二维码。            | 官方 |

### 🖥️ 系统与应用联动 (System)
*与 macOS 系统深度集成。*

| 状态  | 类型  | 插件名称         | 描述                             | 作者 |
| :---: | :---: | :--------------- | :------------------------------- | :--- |
| `[!]` |  `⚡️`  | **系统联动插件** | 与提醒事项、终端等系统应用交互。 | 官方 |