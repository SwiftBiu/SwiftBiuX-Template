# 稳定版与 Beta 发布通道 (Stable vs Beta Release Channels)

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
