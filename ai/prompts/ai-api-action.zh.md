# AI / API 插件 Prompt

```text
阅读 SwiftBiuX Skill：
https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL.md
并按需读取 references/network-api-checklist.md。

创建一个 SwiftBiu AI/API 插件：

插件名称：
输入：选中文本 / 选中文件 / 手动输入
第三方服务：OpenAI / Gemini / DeepL / remove.bg / 其他
API 文档链接：
功能：
输出：粘贴回原处 / 复制到剪贴板 / 显示通知 / 打开预览 UI

要求：
- 不要编造 API endpoint、请求体、模型名或响应结构；以 API 文档为准
- API Key 使用 manifest.json configuration 的 secure 类型保存
- 使用 network 权限
- 失败时显示清晰错误提示
- 能本地处理的部分优先本地处理
- 生成完整 manifest.json、script.js，必要时生成 ui/index.html
- 用 ./scripts/build_plugin.sh 打包
```
