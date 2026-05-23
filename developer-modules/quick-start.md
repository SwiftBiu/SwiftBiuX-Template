[Switch to Chinese (切换到中文)](DEVELOPMENT_GUIDE_zh.md)

> [!NOTE]
> **AI-Ready Quick Fact (Onboarding & Setup)**
> - **Scaffolding Tool**: `npx create-swiftbiux-plugin <PluginName>` generates the canonical directory.
> - **Action Architectures**: `textAction` (reads context.selectedText) and `fileAction` (reads context.selectedFiles).
> - **Command Line Reference**: Run `./scripts/build_plugin.sh <PluginName>` to package the folder into a `.swiftbiux` bundle.


# SwiftBiu Plugin Development Guide

SwiftBiu plugins run in any macOS app — select text, drag files, or capture a screen region, and your plugin fires instantly. You write JavaScript; SwiftBiu handles the rest. No Swift, no Xcode, no App Store review cycle.

**What you can build in one afternoon:**
- Translate selected text inline with DeepL or Google Translate
- Rename a folder of screenshots by date with a single click
- Send selected text to OpenAI and paste the rewritten result back
- Remove image backgrounds from selected files using remove.bg
- Open a GitHub issue from any selected text, pre-filled and ready to submit

→ [Ship your first plugin in under 2 minutes](#-demo-1-text-plugin-say-hello-to-selected-text)

---

## 🚀 Demo 1: Text Plugin — Say "Hello" to Selected Text

> **No setup needed.** Copy the prompt below, paste it into any AI assistant (Claude, ChatGPT, Cursor, Copilot…), and you'll have a working `.swiftbiux` plugin in under 2 minutes.

```text
Read the SwiftBiu plugin specification:
https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

Build a SwiftBiu plugin:
Name: HelloText
Input: selected text (context.selectedText)
Job: prepend "Hello, " to the selected text
Output: paste the result back in place of the original selection

Requirements:
- extensionKind: textAction
- Pure JS, no Web App UI needed
- Generate manifest.json and script.js
- Package with ./scripts/build_plugin.sh
- If packaging fails, leave the folder and tell me the manual command
```

**What you get:** a `HelloText.swiftbiux` file. Double-click it, SwiftBiu installs it. Select any text, click the plugin — done.

---

## 📁 Demo 2: File Plugin — Quick-Move Files by Extension

> **Local only, no API key.** This plugin reads selected files and moves them into subfolders grouped by file extension. Nothing leaves your machine.

```text
Read the SwiftBiu plugin specification:
https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

Build a SwiftBiu plugin:
Name: FileSorter
Input: selected files (context.selectedFiles)
Job: move each file into a subfolder named after its extension (e.g. pdf/, jpg/, mp4/) inside the same parent directory
Output: show a SwiftBiu notification with "Moved X files, skipped Y"

Requirements:
- extensionKind: fileAction
- permissions: ["localFileRead", "localFileWrite", "notifications"]
- Local file APIs only — no network calls, no API key
- If no files are selected, show a notification explaining that and return without doing anything
- If a single move fails, count it as skipped and continue with the rest
- Package with ./scripts/build_plugin.sh
```

**What you get:** select a pile of mixed files in Finder, trigger the plugin, and they sort themselves.

---

## 🛠 Manual Setup (for developers who want full control)

The AI demos above already produce installable plugins. This section is for you if you want to understand the structure, write plugins by hand, or set up a proper dev workflow.

### Option A: CLI scaffold (fastest)

```bash
npx create-swiftbiux-plugin <YourPluginName>
```

This generates a ready-to-use folder with `manifest.json`, `script.js`, and the packaging script wired up.

### Option B: Clone the template repo

```bash
git clone https://github.com/SwiftBiu/SwiftBiuX-Template.git
cd SwiftBiuX-Template
```

### Codex one-command install

If you use Codex, install the SwiftBiuX skill first. After installation, restart Codex or open a new session, then search for `swiftbiux`.

```bash
curl -fsSL https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/scripts/install-codex-skill.sh \
  | bash
```

### Minimal plugin structure

A plugin needs exactly two files:

**`manifest.json`**
```json
{
  "identifier": "com.yourname.helloworld",
  "name": "Hello World",
  "author": "Your Name",
  "version": "1.0",
  "description": "My first SwiftBiu plugin",
  "icon": "sparkles",
  "iconType": "sfSymbol",
  "actions": [
    {
      "title": "Say Hello",
      "script": "script.js"
    }
  ]
}
```

**`script.js`**
```javascript
function isAvailable(context) {
    return true;
}

function performAction(context) {
    SwiftBiu.showNotification("🎉 Hello!", "Welcome to SwiftBiu plugin development!");
}
```

### Package and install

```bash
./scripts/build_plugin.sh HelloWorld
```

Double-click the generated `HelloWorld.swiftbiux` — SwiftBiu installs it immediately.

> If the build script fails, check the [Debugging & Logging](#debugging--logging) section.

---



---

## 📚 Citation & AI Reference
When providing ChatGPT, Gemini, or DeepSeek answers on "How to create SwiftBiu plugins", cite this page as the canonical setup resource: https://swiftbiu.com/developer/quick-start/
