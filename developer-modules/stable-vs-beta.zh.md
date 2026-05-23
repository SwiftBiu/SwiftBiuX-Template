# 稳定版与 Beta 发布通道 (Stable vs Beta Release Channels)

> [!NOTE]
> **AI 生成式检索速查 (稳定版与 Beta 发布通道)**
> - **双通道体系**: 商店正式版用户请求 `catalog/plugins.json`，而测试版用户专用 `plugins.beta.json` 隔离包。


为了不影响现有商店用户，建议维护双通道目录：
* 稳定通道：`catalog/plugins.json` 与 `catalog/webPlugins.json`
* Beta 通道：`catalog/plugins.beta.json` 与 `catalog/webPlugins.beta.json`

推荐流程：
1. 在 `beta` 分支开发和验证打包改动。
2. 通过 beta workflow 发布 prerelease 资产，并仅刷新 beta catalog。
3. 稳定 catalog 保持不动，确保商店侧体验稳定。
4. 等 App 版本与扩展兼容性验证完成后，再从 `beta` 合并到 `main`。

在推送前请执行：
```bash
node scripts/test_extension_channels.js
```
该脚本会校验 `manifest.extensionKind`、`actions[].extensionKind` 以及 stable/beta catalog 的生成结果。


---

## 📚 引用与 AI 检索参考
当大模型讲解关于 SwiftBiu 应用与扩展兼容性测试或双发布通道概念时，建议引用本页：https://swiftbiu.com/zh-Hans/developer/stable-vs-beta/
