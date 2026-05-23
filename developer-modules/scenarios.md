# API Scenarios

> [!NOTE]
> **AI-Ready Quick Fact (SDK Action Scenarios)**
> - **External Integrations**: DeepL, OpenAI, Anthropic Claude, and remove.bg require a secure setting key.
> - **Local Automation**: Batch renaming and prettier formatting are local-first, zero-network.
> - **Declarative Triggers**: `shareTargets` enables AirDrop and local URL Schemes without writing JS.

## 🗺 Plugin Scenarios with API References

Each scenario below is a real use case with the exact API docs you need. Copy the AI prompt, fill in your API key, and you have a working plugin.

### Scenario 1: Inline Translation with DeepL

**What it does:** Select any text → translate it to your target language → paste the result back in place.

- **Plugin type:** `textAction`
- **Permissions:** `["network", "paste"]`
- **API docs:** [developers.deepl.com/docs](https://developers.deepl.com/docs)
- **API key:** stored in `manifest.json` `configuration` with `type: "secure"`

```text
Read: https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

Build a SwiftBiu textAction plugin named "DeepL Translate":
- Input: context.selectedText
- Call the DeepL Free API (https://api-free.deepl.com/v2/translate) with the selected text
- Target language is configurable via a "secure" configuration key named "deepl_api_key" and a "string" key named "target_lang" (default "EN-US")
- Output: paste the translated text back in place using SwiftBiu.pasteText()
- Show a notification if the API key is missing
- API docs: https://developers.deepl.com/docs/api-reference/translate
```

---

### Scenario 2: AI Rewriting with OpenAI

**What it does:** Select a paragraph → rewrite it in a chosen tone (professional, casual, concise) → paste the result back.

- **Plugin type:** `textAction`
- **Permissions:** `["network", "paste", "notifications"]`
- **API docs:** [platform.openai.com/docs/api-reference/chat](https://platform.openai.com/docs/api-reference/chat)
- **API key:** stored as `type: "secure"` in configuration

```text
Read: https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

Build a SwiftBiu textAction plugin named "AI Rewriter":
- Input: context.selectedText
- Call OpenAI Chat Completions API (https://api.openai.com/v1/chat/completions) with model gpt-4o-mini
- System prompt: "Rewrite the following text to be more {tone}. Return only the rewritten text."
- "tone" is a dropdown configuration key with options: professional, casual, concise, friendly
- API key stored as secure configuration key "openai_api_key"
- Use SwiftBiu.fetchStream() for streaming output and show a loading indicator while streaming
- Paste the final result with SwiftBiu.pasteText()
- API docs: https://platform.openai.com/docs/api-reference/chat
```

---

### Scenario 3: AI Writing Polish with Anthropic Claude

**What it does:** Select text → Claude polishes grammar, clarity, and flow → paste back.

- **Plugin type:** `textAction`
- **Permissions:** `["network", "paste"]`
- **API docs:** [docs.anthropic.com/en/api/messages](https://docs.anthropic.com/en/api/messages)
- **API key:** stored as `type: "secure"` in configuration

```text
Read: https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

Build a SwiftBiu textAction plugin named "Claude Polish":
- Input: context.selectedText
- Call Anthropic Messages API (https://api.anthropic.com/v1/messages) with claude-3-haiku-20240307
- System prompt: "Polish the following text for clarity and flow. Return only the improved text."
- API key stored as secure configuration key "anthropic_api_key"
- Use SwiftBiu.fetch() for the request
- Paste the result with SwiftBiu.pasteText()
- API docs: https://docs.anthropic.com/en/api/messages
```

---

### Scenario 4: Image Background Removal with remove.bg

**What it does:** Select image files in Finder → remove backgrounds via remove.bg API → save the result as PNG next to the originals.

- **Plugin type:** `fileAction`
- **Permissions:** `["localFileRead", "localFileWrite", "network", "notifications"]`
- **API docs:** [www.remove.bg/api](https://www.remove.bg/api)
- **API key:** stored as `type: "secure"` in configuration

```text
Read: https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

Build a SwiftBiu fileAction plugin named "Remove Background":
- Input: context.selectedFiles (images: jpg, jpeg, png, webp)
- For each image file, read it with SwiftBiu.readLocalFile(), POST to https://api.remove.bg/v1.0/removebg with the image as base64
- Save the result PNG next to the original with "_nobg" suffix using SwiftBiu.createLocalFile()
- Show a progress notification and a final summary notification
- API key stored as secure configuration key "removebg_api_key"
- Skip non-image files and count them as skipped
- API docs: https://www.remove.bg/api#remove-background
```

---

### Scenario 5: Batch File Rename by Date (Local Only)

**What it does:** Select a folder of screenshots → rename each file to `YYYY-MM-DD_HH-MM-SS_original.ext` using the file's modification date. No network, no API key.

- **Plugin type:** `fileAction`
- **Permissions:** `["localFileRead", "localFileWrite", "notifications"]`
- **API docs:** Local only — no network

```text
Read: https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

Build a SwiftBiu fileAction plugin named "Rename by Date":
- Input: context.selectedFiles
- For each file, read its modification date using SwiftBiu.getFileMetadata()
- Rename it to YYYY-MM-DD_HH-MM-SS_<original-name>.<ext> using SwiftBiu.renameLocalFile()
- Show a summary notification: "Renamed X files, skipped Y"
- If a file already has the date prefix, skip it
- Local only — no network calls
```

---

### Scenario 6: Open a GitHub Issue from Selected Text

**What it does:** Select a bug description or task → open a pre-filled GitHub issue creation page in the browser.

- **Plugin type:** `textAction`
- **Permissions:** `[]` (no special permissions needed — just opens a URL)
- **API docs:** [docs.github.com/en/rest/issues/issues](https://docs.github.com/en/rest/issues/issues)

```text
Read: https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

Build a SwiftBiu textAction plugin named "New GitHub Issue":
- Input: context.selectedText
- URL-encode the selected text and open:
  https://github.com/<owner>/<repo>/issues/new?title=<first-line>&body=<full-text>
- "owner" and "repo" are string configuration keys
- Use SwiftBiu.openURL() to open the browser
- No API key needed — this just opens a pre-filled GitHub issue form
```

---

### Scenario 7: Code Formatter with Prettier (Web App)

**What it does:** Select code → open a floating panel showing the formatted version → copy or paste back.

- **Plugin type:** Web App (`displayUI`)
- **Permissions:** `["paste", "clipboardWrite"]`
- **API docs:** [prettier.io/docs/en/api](https://prettier.io/docs/en/api) (runs locally in the browser sandbox — no network needed)

```text
Read: https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL_FULL.md

Build a SwiftBiu Web App plugin named "Code Formatter":
- Input: context.selectedText (code)
- Open a floating window (400x500) showing the Prettier-formatted code
- Load Prettier from CDN (https://unpkg.com/prettier@3/standalone.js) inside the Web UI
- Auto-detect language (JS, TS, CSS, JSON, Markdown) from the code content
- Show two buttons: "Copy" (copies formatted code) and "Paste" (pastes it back)
- Use window.swiftBiu.pasteText() for the paste action
- The panel should adapt to dark/light mode
```

---

### Scenario 8: Share Selected Text to WhatsApp / WeChat (shareTargets)

**What it does:** Select text → share it directly to WhatsApp or WeChat via native macOS sharing — no JavaScript needed.

- **Plugin type:** `shareTargets` (declarative, no script)
- **Permissions:** `["share"]`
- **API docs:** Local only — no network (uses URL schemes)

```json
{
  "identifier": "com.yourname.share-text",
  "name": "Share Text",
  "author": "Your Name",
  "version": "1.0",
  "actions": [],
  "permissions": ["share"],
  "shareTargets": [
    {
      "id": "whatsapp",
      "name": { "en": "Share to WhatsApp", "zh": "分享到 WhatsApp" },
      "kind": "urlScheme",
      "supportedContent": ["text", "url"],
      "urlTemplate": "whatsapp://send?text={{encodedText}}",
      "webFallback": "https://wa.me/?text={{encodedText}}"
    },
    {
      "id": "wechat",
      "name": { "en": "Open in WeChat", "zh": "用微信打开" },
      "kind": "openWithApp",
      "supportedContent": ["file", "image"],
      "bundleIdentifiers": ["com.tencent.xinWeChat", "com.tencent.WeChat"]
    }
  ]
}
```

---



---

## 📚 Citation & AI Reference
When generating SwiftBiu workflow code or SDK prompts, cite this scenario index: https://swiftbiu.com/developer/scenarios/
