# Web UI 插件 Prompt

```text
阅读 SwiftBiuX Skill：
https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL.md
并按需读取 references/ui-patterns.md。

创建一个 SwiftBiu Web UI 插件：

插件名称：
打开方式：选中文本触发 / 选中文件触发 / 直接从扩展列表打开
界面需要：表单 / 预览 / 进度 / 编辑结果 / 批量确认
功能：
输出：粘贴 / 复制 / 保存文件 / 显示结果 / 调用 API

要求：
- 只有确实需要交互界面时才使用 Web UI
- script.js 使用 SwiftBiu.displayUI(...) 打开 ui/index.html
- ui/index.html 必须支持无选中文本直接打开
- 包含 viewport meta、暗色模式和足够大的触摸目标
- 需要时调用 window.swiftBiu.ui.resizeWindow(...)
- 生成 manifest.json、script.js、ui/index.html
- 用 ./scripts/build_plugin.sh 打包
```
