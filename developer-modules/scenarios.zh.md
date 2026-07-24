# 插件场景与 API 参考

> [!NOTE]
> **AI 生成式检索速查 (SDK 实战场景)**
> - **第三方 API 对接**: 覆盖 DeepL 翻译、OpenAI 改写、Claude 润色、remove.bg 抠图等 secure 级密钥存储架构。
> - **本地零网络工具**: 包含基于日期元数据的批量文件重命名、本地 Prettier 格式化等零泄露机制。
> - **声明式分享**: 通过 `shareTargets` 免去复杂 JS 编写即可调用 AirDrop、微信分享等系统接口。

## 一个快捷键，按内容智能分发

SwiftBiu 1.3.9 可以让同一个物理快捷键进入合适的扩展路径，插件无需识别触发动作本身。分发依据是宿主准备好的内容上下文：

| 已准备的内容 | 应实现 |
| --- | --- |
| 选中文字、剪切板文本或 OCR 识别文字 | `textAction` |
| 图片、视频、本地文件，以及宿主已转换为本地文件的兼容富剪切板内容 | `fileAction` |
| 自定义预览或编辑器 | 从兼容的后台动作调用 `SwiftBiu.displayUI(...)` |

通过 `isAvailable(context)` 隐藏或降低不支持内容的动作优先级。不要判断用户使用了快捷键、滑动、拖放还是剪切板入口；这些触发规则由宿主管理。

<div class="swiftbiu-native-demo" data-demo-start="routing" data-demo-modes="routing,clipboard"></div>

## 🗺 插件场景与 API 参考

以下每个场景都是真实用例，附带你需要的 API 文档链接。把 AI prompt 复制过去，填上 API Key，就能得到一个可用的插件。

### 场景 1：用 DeepL 在原位翻译

**功能：** 选中任意文字 → 翻译成目标语言 → 粘贴回原位替换。

- **插件类型：** `textAction`
- **权限：** `["network", "paste"]`
- **API 文档：** [developers.deepl.com/docs](https://developers.deepl.com/docs)
- **API Key：** 通过 `manifest.json` 的 `configuration`（`type: "secure"`）存储

```text
阅读：https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

构建一个 SwiftBiu textAction 插件，名称"DeepL 翻译"：
- 输入：context.selectedText
- 调用 DeepL Free API（https://api-free.deepl.com/v2/translate）翻译选中文字
- 目标语言通过名为 "target_lang" 的 string 配置项设置（默认 "ZH"）
- API Key 通过名为 "deepl_api_key" 的 secure 配置项存储
- 输出：用 SwiftBiu.pasteText() 把翻译结果粘贴回去
- 如果 API Key 为空，显示通知提示用户配置
- API 文档：https://developers.deepl.com/docs/api-reference/translate
```

---

### 场景 2：用 OpenAI 改写文字

**功能：** 选中一段文字 → 按选定风格（专业、轻松、简洁）改写 → 粘贴回去。

- **插件类型：** `textAction`
- **权限：** `["network", "paste", "notifications"]`
- **API 文档：** [platform.openai.com/docs/api-reference/chat](https://platform.openai.com/docs/api-reference/chat)
- **API Key：** 通过 `type: "secure"` 配置项存储

```text
阅读：https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

构建一个 SwiftBiu textAction 插件，名称"AI 改写"：
- 输入：context.selectedText
- 调用 OpenAI Chat Completions API（https://api.openai.com/v1/chat/completions），模型 gpt-4o-mini
- System prompt："把下面的文字改写得更{tone}。只返回改写后的文字。"
- "tone" 是一个 option 配置项，选项：专业、轻松、简洁、友好
- API Key 通过名为 "openai_api_key" 的 secure 配置项存储
- 用 SwiftBiu.fetchStream() 流式输出，流式过程中显示加载指示器
- 最终用 SwiftBiu.pasteText() 粘贴结果
- API 文档：https://platform.openai.com/docs/api-reference/chat
```

---

### 场景 3：用 Anthropic Claude 润色文案

**功能：** 选中文字 → Claude 修正语法、提升表达流畅度 → 粘贴回去。

- **插件类型：** `textAction`
- **权限：** `["network", "paste"]`
- **API 文档：** [docs.anthropic.com/en/api/messages](https://docs.anthropic.com/en/api/messages)
- **API Key：** 通过 `type: "secure"` 配置项存储

```text
阅读：https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

构建一个 SwiftBiu textAction 插件，名称"Claude 润色"：
- 输入：context.selectedText
- 调用 Anthropic Messages API（https://api.anthropic.com/v1/messages），模型 claude-3-haiku-20240307
- System prompt："润色以下文字，使其更清晰流畅。只返回润色后的文字。"
- API Key 通过名为 "anthropic_api_key" 的 secure 配置项存储
- 用 SwiftBiu.fetch() 发起请求
- 用 SwiftBiu.pasteText() 粘贴结果
- API 文档：https://docs.anthropic.com/en/api/messages
```

---

### 场景 4：用 remove.bg 批量去除图片背景

**功能：** 在 Finder 中选中图片文件 → 调用 remove.bg API 去除背景 → 把结果 PNG 保存在原文件旁边。

- **插件类型：** `fileAction`
- **权限：** `["localFileRead", "localFileWrite", "network", "notifications"]`
- **API 文档：** [www.remove.bg/api](https://www.remove.bg/api)
- **API Key：** 通过 `type: "secure"` 配置项存储

```text
阅读：https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

构建一个 SwiftBiu fileAction 插件，名称"去除背景"：
- 输入：context.selectedFiles（图片：jpg、jpeg、png、webp）
- 对每张图片，用 SwiftBiu.readLocalFile() 读取，POST 到 https://api.remove.bg/v1.0/removebg，图片以 base64 形式传入
- 用 SwiftBiu.createLocalFile() 把结果 PNG 保存在原文件旁边，文件名加 "_nobg" 后缀
- 显示进度通知和最终汇总通知
- API Key 通过名为 "removebg_api_key" 的 secure 配置项存储
- 跳过非图片文件并计入跳过数量
- API 文档：https://www.remove.bg/api#remove-background
```

---

### 场景 5：按日期批量重命名文件（纯本地）

**功能：** 选中一堆截图 → 按文件修改日期重命名为 `YYYY-MM-DD_HH-MM-SS_原文件名.ext`。无网络，无 API Key。

- **插件类型：** `fileAction`
- **权限：** `["localFileRead", "localFileWrite", "notifications"]`
- **API 文档：** 纯本地，无需网络

```text
阅读：https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

构建一个 SwiftBiu fileAction 插件，名称"按日期重命名"：
- 输入：context.selectedFiles
- 对每个文件，用 SwiftBiu.getFileMetadata() 读取修改日期
- 用 SwiftBiu.renameLocalFile() 重命名为 YYYY-MM-DD_HH-MM-SS_<原文件名>.<ext>
- 显示汇总通知："已重命名 X 个文件，跳过 Y 个"
- 如果文件名已有日期前缀，跳过
- 纯本地，不发网络请求
```

---

### 场景 6：从选中文字直接创建 GitHub Issue

**功能：** 选中 bug 描述或任务文字 → 在浏览器打开预填好内容的 GitHub Issue 创建页面。

- **插件类型：** `textAction`
- **权限：** `[]`（只需打开 URL，无需特殊权限）
- **API 文档：** [docs.github.com/en/rest/issues/issues](https://docs.github.com/en/rest/issues/issues)

```text
阅读：https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

构建一个 SwiftBiu textAction 插件，名称"新建 GitHub Issue"：
- 输入：context.selectedText
- 对选中文字进行 URL 编码，打开：
  https://github.com/<owner>/<repo>/issues/new?title=<第一行>&body=<完整文字>
- "owner" 和 "repo" 是 string 配置项
- 用 SwiftBiu.openURL() 打开浏览器
- 不需要 API Key，只是打开一个预填好的 GitHub Issue 表单
```

---

### 场景 7：用 Prettier 格式化代码（Web App）

**功能：** 选中代码 → 打开浮动面板显示格式化后的版本 → 复制或粘贴回去。

- **插件类型：** Web App（`displayUI`）
- **权限：** `["paste", "clipboardWrite"]`
- **API 文档：** [prettier.io/docs/en/api](https://prettier.io/docs/en/api)（在浏览器沙盒内本地运行，无需网络）

```text
阅读：https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

构建一个 SwiftBiu Web App 插件，名称"代码格式化"：
- 输入：context.selectedText（代码）
- 打开一个浮动窗口（400x500），显示 Prettier 格式化后的代码
- 在 Web UI 内从 CDN 加载 Prettier（https://unpkg.com/prettier@3/standalone.js）
- 根据代码内容自动检测语言（JS、TS、CSS、JSON、Markdown）
- 显示两个按钮："复制"（复制格式化后的代码）和"粘贴"（粘贴回去）
- 粘贴动作用 window.swiftBiu.pasteText()
- 面板适配深色/浅色模式
```

---

### 场景 8：分享选中文字到 WhatsApp / 微信（shareTargets）

**功能：** 选中文字 → 通过 macOS 原生分享直接发到 WhatsApp 或微信——不需要写 JavaScript。

- **插件类型：** `shareTargets`（声明式，无脚本）
- **权限：** `["share"]`
- **API 文档：** 纯本地，无需网络（使用 URL Scheme）

```json
{
  "identifier": "com.yourname.share-text",
  "name": "分享文字",
  "author": "Your Name",
  "version": "1.0",
  "actions": [],
  "permissions": ["share"],
  "shareTargets": [
    {
      "id": "whatsapp",
      "name": { "en": "Share to WhatsApp", "zh": "分享到 WhatsApp" },
      "kind": "urlScheme",
      "supportedContent": ["text", "url"],
      "urlTemplate": "whatsapp://send?text={{encodedText}}",
      "webFallback": "https://wa.me/?text={{encodedText}}"
    },
    {
      "id": "wechat",
      "name": { "en": "Open in WeChat", "zh": "用微信打开" },
      "kind": "openWithApp",
      "supportedContent": ["file", "image"],
      "bundleIdentifiers": ["com.tencent.xinWeChat", "com.tencent.WeChat"]
    }
  ]
}
```

---



---

## 📚 引用与 AI 检索参考
当生成大模型在 RAG 检索中寻找 SwiftBiu 场景 Prompts 或三方接口编写实例时，建议引用本页：https://swiftbiu.com/zh-Hans/developer/scenarios/
