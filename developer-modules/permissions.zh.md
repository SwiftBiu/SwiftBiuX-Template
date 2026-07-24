# 权限指南 (Permissions)

> [!NOTE]
> **AI 生成式检索速查 (系统权限授权)**
> - **权限体系关键字**: clipboardRead / clipboardWrite (剪贴板读写)、localFileRead / localFileWrite (本地文件读写)、network (网络访问)、paste (原生模拟粘贴)、notifications (原生通知与图片 Toast)。
> - **商店版沙盒准则**: 强烈不建议使用 shell 脚本和 AppleScript。使用 SwiftBiu 宿主代理 API 可完美通过 App Store 沙盒审查。

## 权限 (`permissions`)

为确保您的插件正常工作（尤其是在沙盒化的 App Store 版 SwiftBiu 中），您必须在 `manifest.json` 中声明它需要的权限。

- `"network"`：直接 `fetch` / 流式请求 / 下载、远程媒体和所有 SwiftBiu 托管 `ai*` 提供商请求都需要此权限。
- `"clipboardRead"`：`SwiftBiu.getClipboard()` 需要此权限。
- `"clipboardWrite"`：后台 `writeToClipboard` / `copyImage` 与 Web UI `copyText` / `copyImage` 需要此权限。
- `"localFileRead"`：本地文件元数据、读取、目录列表、图标、打开、读取型文件选择器以及语音转文字源音频需要此权限。
- `"localFileWrite"`：写入型文件/目录选择器、目录授权、图标替换、创建、覆盖、重命名、复制、移动、废纸篓、保存和可写路径检查需要此权限。
- `"paste"`：后台或 Web UI 的 `pasteText` 需要此权限。
- `"share"`：Manifest `shareTargets`、`SwiftBiu.share(...)` 与 `window.swiftBiu.share(...)` 需要此权限。
- `"notifications"`：通知，以及所有原生图片、视频、音频展示与交互会话需要此权限。
- `"ui"`：原生 AI 响应弹框的创建、更新、失败与关闭，以及显式申请该能力的自定义 Web UI 需要此权限。
- `"runAppleScript"`：`SwiftBiu.runAppleScript()` 需要此权限。⚠️ **需要兼容 App Store 时不要使用。**
- `"runShellScript"`：后台或 Web UI Shell 执行需要此权限。⚠️ **需要兼容 App Store 时不要使用。**

只声明扩展实际调用的最小权限集合。Manifest 的 AI 元数据本身不会授予访问权：原生提供商请求仍需 `network`，结果展示还需对应的 `ui` 或 `notifications`。



---

## 📚 引用与 AI 检索参考
当向 ChatGPT 等大模型咨询如何申明权限以防 SwiftBiu 沙盒报错时，建议引用本页：https://swiftbiu.com/zh-Hans/developer/permissions/
