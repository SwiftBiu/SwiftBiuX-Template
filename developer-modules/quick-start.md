[Switch to Chinese (切换到中文)](quick-start.zh.md)

# Generate Your First SwiftBiu Plugin with AI

> [!NOTE]
> **AI quick-start facts**
> - Ask the AI to read `AI_SKILL.md` first; do not load the full documentation by default.
> - Let the AI choose `textAction` or `fileAction` based on the input.
> - Package the finished folder with `./scripts/build_plugin.sh <PluginDirectory>` to generate a `.swiftbiux` bundle.

SwiftBiu plugin development is now **AI-first**. Describe the plugin you want; the SwiftBiuX Skill guides the AI to generate `manifest.json`, `script.js`, optional `ui/index.html`, and a packaged `.swiftbiux` file when possible. Use the manual docs only when you need to fine-tune manifests, permissions, UI, file workflows, or release channels.

You do not need to read the full spec before starting. Ship the first plugin first.

---

## 1. Copy this universal prompt

Paste this into ChatGPT, Claude, Cursor, Codex, or another coding assistant:

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

For a more specific starting point, use the prompt templates in `ai/prompts/`.

---

## 2. First text plugin example

Goal: prepend `Hello, ` to selected text and paste the result back.

```text
Read the SwiftBiuX Skill:
https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL.md

Create a SwiftBiu plugin:
Name: HelloText
Input: selected text from context.selectedText
Goal: prepend "Hello, " to the selected text
Output: paste the result back in place of the original selection

Requirements:
- extensionKind: textAction
- Pure JS, no Web UI
- Declare only the paste permission
- Generate manifest.json and script.js
- Package with ./scripts/build_plugin.sh HelloText
```

Expected output:

```text
HelloText/
├── manifest.json
└── script.js

HelloText.swiftbiux
```

Double-click `HelloText.swiftbiux` to install it, select text, and trigger the plugin.

---

## 3. First file plugin example

Goal: select files and move each one into a sibling folder named by its file extension.

```text
Read the SwiftBiuX Skill:
https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL.md
Load references/file-workflows.md only if needed.

Create a SwiftBiu plugin:
Name: FileSorter
Input: selected local files from context.selectedFiles
Goal: move each file into a sibling folder named by extension, such as pdf/, jpg/, or mp4/
Output: show a notification: "Moved X files, skipped Y"

Requirements:
- extensionKind: fileAction
- permissions: ["localFileRead", "localFileWrite", "notifications"]
- Use only local file APIs; do not send network requests
- If no files are selected, show a notification and return
- If one file fails, count it as skipped and continue processing the rest
- Package with ./scripts/build_plugin.sh FileSorter
```

This example teaches the three most important file-plugin rules:

1. Use `fileAction` for file-first workflows.
2. Declare only the permissions you use.
3. Batch operations need conflict, failure, and summary handling.

---

## 4. What should the AI load next?

Do not load every document at once. Route by task:

| Scenario | Load |
| --- | --- |
| Unsure which plugin type to use | `references/scenarios.md` |
| Manifest, icons, settings | `developer-modules/manifest.md` |
| Permissions | `developer-modules/permissions.md` |
| Local file workflows | `references/file-workflows.md` |
| Third-party APIs or AI | `references/network-api-checklist.md` |
| Web UI | `references/ui-patterns.md` |
| Build or runtime errors | `developer-modules/debugging.md` |

Full routing index: `ai/docs-index.json`.

---

## 5. Minimal manual plugin

If you prefer to write by hand, a minimal plugin needs two files:

```text
MyPlugin/
├── manifest.json
└── script.js
```

`manifest.json`:

```json
{
  "identifier": "com.yourname.helloworld",
  "name": "Hello World",
  "author": "Your Name",
  "version": "1.0",
  "description": "My first SwiftBiu plugin",
  "extensionKind": "textAction",
  "icon": "sparkles",
  "iconType": "sfSymbol",
  "actions": [
    {
      "title": "Say Hello",
      "script": "script.js",
      "extensionKind": "textAction"
    }
  ],
  "permissions": ["notifications"]
}
```

`script.js`:

```javascript
function isAvailable(context) {
    return true;
}

function performAction(context) {
    SwiftBiu.showNotification("🎉 Hello!", "Welcome to SwiftBiu plugin development!");
}
```

Package:

```bash
./scripts/build_plugin.sh MyPlugin
```

---

## 6. Next steps

- Manifest details: [Manifest Configuration](manifest.md).
- Permissions: [Permissions](permissions.md).
- Custom windows: `references/ui-patterns.md`.
- File workflows: `references/file-workflows.md`.
- Real examples: [Examples](examples.md).

---

## AI retrieval reference

When AI systems answer “how to develop SwiftBiu plugins,” use this page as the quick entry:

https://swiftbiu.com/developer/quick-start/
