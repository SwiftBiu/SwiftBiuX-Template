# 文本动作插件 Prompt

```text
阅读 SwiftBiuX Skill：
https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL.md

创建一个 SwiftBiu 文本动作插件：

插件名称：
输入：用户选中的文本 context.selectedText
功能：
输出：粘贴回原处 / 复制到剪贴板 / 显示通知

要求：
- extensionKind: textAction
- 优先纯 JS，不需要 Web UI
- 只声明必要权限
- 如果替换选中文字，使用 paste 权限和 SwiftBiu.pasteText(...)
- 如果只复制结果，使用 clipboardWrite 权限和 SwiftBiu.copyText(...)
- 生成 manifest.json 和 script.js
- 用 ./scripts/build_plugin.sh 打包
```
