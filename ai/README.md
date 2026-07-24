# SwiftBiuX AI Development Entry

The recommended way to build SwiftBiu plugins is now AI-first: let an AI assistant read the SwiftBiuX Skill, generate a working plugin, then use the modular docs only when you need to adjust details.

You do not need to read the full manifest, permission, and runtime API documentation before starting. Describe what you want to build; the AI should choose the plugin type, declare minimal permissions, generate complete files, and package a `.swiftbiux` bundle when possible.

## Fastest path

Copy this prompt into ChatGPT, Claude, Cursor, Codex, or another coding assistant:

```text
Read the SwiftBiuX Skill:
https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL.md

Create a SwiftBiu plugin:

Plugin name:
Input type: selected text / selected files / manual input / Web UI
Goal:
Output: paste in place / copy to clipboard / show notification / save file / open window
Network/API needed: no / yes, service name:
Configuration needed: no / yes, fields:

Requirements:
- Choose textAction or fileAction automatically
- Declare only the required permissions
- Generate manifest.json and script.js
- Generate ui/index.html only if an interactive UI is actually needed
- Prefer local processing unless network/API is necessary
- Package with ./scripts/build_plugin.sh when finished
```

## What should the AI read?

The AI should read `AI_SKILL.md` first, then load only the smallest matching reference:

| Need | Recommended doc |
| --- | --- |
| First plugin | `developer-modules/quick-start.md` |
| Choose plugin type | `references/scenarios.md` |
| Minimal manifest, extensionKind, actions | `references/manifest-basics.md` |
| Icon formats, SF Symbol, text icons | `references/manifest-icons.md` |
| Full manifest, settings, shareTargets | `developer-modules/manifest.md` |
| Clipboard, files, network, notifications | `developer-modules/permissions.md` |
| SwiftBiu-managed AI providers, models, or `allowedProviders` | `references/native-ai.md` |
| Batch file workflows | `references/file-workflows.md` |
| OpenAI, Gemini, DeepL, remove.bg, internal APIs | `references/network-api-checklist.md` |
| HTML UI, preview, forms, progress | `references/ui-patterns.md` |
| Debugging logs or Web Inspector | `developer-modules/debugging.md` |

See the full routing index in `ai/docs-index.json`.

## Recommended workflow

1. **Describe the idea**: input, transformation, and output.
2. **Let AI choose the architecture**: textAction, fileAction, pure JS, Web UI, AI/API, or shareTargets.
3. **Generate and package**: `manifest.json`, `script.js`, optional `ui/index.html`, and `.swiftbiux`.
4. **Install and test**: double-click the `.swiftbiux` file and trigger it in SwiftBiu.
5. **Read docs only when needed**: permissions, configuration, UI, files, APIs, publishing.

## Manual docs

Use these when you want full control or deeper understanding:

- `DEVELOPMENT_GUIDE.md`
- `developer-modules/manifest.md`
- `developer-modules/permissions.md`
- `developer-modules/examples.md`
