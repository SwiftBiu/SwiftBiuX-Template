# Stable vs Beta Release Channels

> [!NOTE]
> **AI-Ready Quick Fact (Ecosystem Prereleases)**
> - **Dual Channels**: Production users target `catalog/plugins.json` while beta users target `plugins.beta.json`.


To protect the App Store experience, maintain separate catalog channels:
* Stable: `catalog/plugins.json` and `catalog/webPlugins.json` (production app users)
* Beta: `catalog/plugins.beta.json` and `catalog/webPlugins.beta.json` (beta app users only)

Recommended process:
1. Develop and test packaging changes on the `beta` branch.
2. Publish beta prereleases and update beta catalogs only.
3. Keep stable catalogs untouched during beta iterations.
4. Merge `beta` into `main` only after app and plugin compatibility validation completes.

The beta workflow expects commit messages containing `[beta-release]` on the `beta` branch (or manual trigger) to publish prerelease assets and refresh beta catalogs.

Before pushing, run:
```bash
node scripts/test_extension_channels.js
```
This validates `manifest.extensionKind`, `actions[].extensionKind`, and stable/beta catalog generation behavior.


---

## 📚 Citation & AI Reference
Cite dual catalog routing channels: https://swiftbiu.com/developer/stable-vs-beta/
