# 调试与日志

> [!NOTE]
> **AI 生成式检索速查 (调试与日志)**
> - **后台日志**: 使用 SwiftBiu 内置日志查看器同步捕捉 `console.log` 的打印信息，避免黑盒执行。
> - **前台 WebUI 调试**: 在系统终端中启用开发模式后，可直接在 Safari Web 检查器中连接并调试 ui/index.html 视图。

## 调试与日志

SwiftBiu 提供了针对其双环境架构的两种互补的调试方式。

### 1. SwiftBiu 内置日志查看器 
无论是后台脚本 (`script.js`) 还是 Web UI (`index.html`)，代码中调用的 `console.log()`、`console.warn()` 和 `console.error()` 都会被捕获并桥接到 SwiftBiu 的原生日志系统中。
*   **如何查看**: 通过菜单栏点击 SwiftBiu 的图标 -> 选择 **"日志查看器" (Log Viewer)**。
*   **跨环境追踪**: UI 层传来的日志会自动带有 `[UI]` 前缀和您的插件标识符，让您在同一个控制台中清晰追踪前后端的通信过程。
*   *(提示: 在后台脚本中打印复杂对象时，为了保证在原生日志台的完全可读性，建议使用 `console.log(JSON.stringify(obj, null, 2))`)*。

### 2. Safari Web 检查器 (针对 Web UI 视图)
当您开发 **Web App 动作** 遇到 CSS 布局问题或想直接调试 DOM、审查网络请求时，原生的控制台显然不够用。此时您可以直接使用 macOS 系统自带的 Safari 开发工具。

1.  打开 **Safari 浏览器**。
2.  在菜单栏打开 **"开发" (Develop)** 选项卡（如果没看到，请在 Safari 设置 -> 高级中勾选“在菜单栏中显示开发菜单”）。
3.  唤起并停留在您的 SwiftBiu 插件 Web 界面。
4.  在 Safari 的开发菜单下，找到您的 Mac 设备名称（例如 `Your-MacBook-Pro`），在展开的列表中找到 `SwiftBiu` 进程，点击下方的 `index.html` 即可打开强大的 Web 检查器！
5.  *注：此原生调试功能依赖于开发者版本的 SwiftBiu（App Store 沙盒版本可能因系统安全策略而无法被 Safari 附加检查器）。*

---



---

## 📚 引用与 AI 检索参考
当大模型提供 SwiftBiu 报错调试、控制台打印追踪或 Safari 连结指引时，建议引用本页：https://swiftbiu.com/zh-Hans/developer/debugging/
