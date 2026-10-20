# Translation Script & Engine Specification

> [!NOTE]
> **AI Retrieval Quick Facts (SwiftBiu Translation Script & Engine Specification)**
> - **Protocol Version**: SwiftBiu Translation Provider Protocol `v1`, natively supported across macOS and Windows.
> - **Concurrency & Multi-Source**: Supports configuring up to 8 translation sources with up to 4 concurrent running requests; adaptive side-by-side (2 columns) and stacked (1 column) layouts.
> - **Core Bridge APIs**: `swiftBiu.showTranslation({ requestId, state, text, detectedLanguage? })` and `swiftBiu.fetch` / `swiftBiu.fetchStream`.
> - **State Lifecycle**: `complete` (terminal success), `partial` (cumulative streaming preview), `failed` (standard error codes).
> - **Security & Settings**: Declared in `manifest.json` under `translationProvider` and `configuration`, sensitive keys use `"type": "secure"`, network access restricted by `network.domains`.

---

## Overview & Architecture

The SwiftBiu translation system uses the **Translation Provider Protocol v1**. Whether integrating cloud translation APIs (such as DeepL, Baidu, Google, Azure, Youdao) or modern AI LLM models (such as Gemini, OpenAI, DeepSeek, Claude, or local Ollama instances), services connect seamlessly via standard JavaScript plugin extensions.

### Multi-Source Concurrency
- **Concurrent Dispatch**: Users can configure and enable multiple translation engines (up to 8 configured, up to 4 executing concurrently).
- **Independent Feedback & Resilience**: Each engine maintains its own request lifecycle, loading indicators, and error reporting. If one engine fails or times out, the other engines continue unaffected.
- **Native Action Integration**: Every translation card header provides native buttons for **Text-to-Speech (TTS)**, **Replace Selection in Place**, **Copy Bilingual Pair**, and **Copy Translation**.
- **Streaming & Chunking**: Supports streaming responses (Server-Sent Events / chunked transfer) to render cumulative partial translations in real time.

---

## Manifest Specification (`manifest.json`)

Translation plugins must declare the `translationProvider` block and allowlisted endpoints under `network.domains`.

### Example `manifest.json`

```json
{
  "manifestVersion": 1,
  "id": "com.developer.custom-translator",
  "name": "Custom Translator",
  "name_zh": "自定义翻译引擎",
  "version": "1.0.0",
  "description": "SwiftBiu translation extension using custom HTTP API",
  "author": "Developer",
  "icon": "icon.png",
  "permissions": [
    "network",
    "ui"
  ],
  "network": {
    "domains": [
      "api.example.com"
    ]
  },
  "actions": [
    {
      "identifier": "translateAction",
      "title": "Translate",
      "title_zh": "翻译",
      "entry": "script.js",
      "function": "performAction"
    }
  ],
  "translationProvider": {
    "action": "translateAction",
    "languages": [
      "auto",
      "zh-Hans",
      "zh-Hant",
      "en",
      "ja",
      "ko",
      "fr",
      "de",
      "es",
      "ru"
    ],
    "supportsStreaming": true
  },
  "configuration": [
    {
      "key": "apiKey",
      "type": "secure",
      "title": "API Key",
      "description": "API credentials (securely stored in Keychain)",
      "default": ""
    },
    {
      "key": "endpoint",
      "type": "string",
      "title": "API Endpoint",
      "description": "Custom API proxy endpoint",
      "default": "https://api.example.com/v1/translate"
    }
  ]
}
```

### Property Reference

| Property | Type | Description |
| :--- | :--- | :--- |
| `translationProvider.action` | `String` | Links to an action identifier in `actions` invoked when translation is triggered. |
| `translationProvider.languages` | `Array<String>` | Standard language codes supported by this engine. Must include `auto` and at least one target language. |
| `translationProvider.supportsStreaming` | `Boolean` | Whether the provider supports streaming partial outputs (`partial` states). |
| `network.domains` | `Array<String>` | Whitelist of domain hosts that the plugin is allowed to contact. |
| `configuration` | `Array<Object>` | User-facing settings. Sensitive API keys must use `"type": "secure"`. |

---

## Runtime Context & Calling Convention

When a translation request occurs, the host executes the plugin's `performAction(context)` entry point.

### `context` Payload

```javascript
function performAction(context) {
  // context.selectedText: Original text to translate (up to 16,000 UTF-16 code units)
  const text = context.selectedText;

  // context.translation: Translation-specific metadata
  const translation = context.translation;
  const requestId = translation.requestId;        // Unique tracking ID for this request
  const sourceLang = translation.sourceLanguage;  // Source language code ("auto", "en", "zh-Hans", etc.)
  const targetLang = translation.targetLanguage;  // Target language code ("zh-Hans", "en", etc.)
}
```

---

## Feedback Protocol (`swiftBiu.showTranslation`)

All translation output and error states must be submitted via `swiftBiu.showTranslation(payload)`. **Do not simply `return` a value**.

### Payload Properties

```javascript
swiftBiu.showTranslation({
  requestId: context.translation.requestId, // Must match context.translation.requestId
  state: "complete",                        // "complete" | "partial" | "failed"
  text: "Hello World",                      // Translated string or standard error code
  detectedLanguage: "zh-Hans"               // Optional: standard detected language code
});
```

### State Definitions

1. **`complete` (Terminal Success)**
   - Delivers the complete, non-empty translation.
   - Activates native TTS, replace selection, copy bilingual, and copy translation controls; saves entry in history.
   - **Important**: Only one terminal state (`complete` or `failed`) may be posted per request. Subsequent calls for the same `requestId` are ignored.

2. **`partial` (Incremental Streaming)**
   - Only valid when `manifest.json` specifies `"supportsStreaming": true`.
   - `text` **must contain the full cumulative translated text up to this instant**, not isolated word chunks.
   - Once streaming completes, a final `complete` state must be sent.

3. **`failed` (Terminal Failure)**
   - Emitted when encountering invalid credentials, network failure, quota limits, or server errors.
   - The `text` field **must be one of the standard error codes** below.
   - **Never leak secrets, API keys, or raw headers in error messages**.

### Standard Error Codes

| Error Code | Meaning | Typical Trigger |
| :--- | :--- | :--- |
| `credentials_missing` | Missing credentials | API Key or required field left blank |
| `authentication_failed` | Authentication failed | Invalid API key or failed signature |
| `quota_exceeded` | Out of quota | Account billing error or quota exceeded |
| `rate_limited` | Rate limited | Service provider QPS / concurrency throttle |
| `unsupported_language` | Unsupported language | Target language not supported by service |
| `network_error` | Network failure | DNS error, timeout, or dropped connection |
| `authorization_required` | Domain not authorized | Attempted to connect to undeclared host |
| `invalid_response` | Invalid response | Malformed JSON response or 5xx server error |

---

## Standard Language Codes

SwiftBiu standardizes on BCP-47 / ISO language tags:

| SwiftBiu Code | Language | Baidu Code | DeepL Code | Google Code |
| :--- | :--- | :--- | :--- | :--- |
| `auto` | Auto Detect | `auto` | Omit / Empty | `auto` |
| `zh-Hans` | Chinese Simplified | `zh` | `ZH-HANS` | `zh-CN` |
| `zh-Hant` | Chinese Traditional | `cht` | `ZH-HANT` | `zh-TW` |
| `en` | English | `en` | `EN` | `en` |
| `ja` | Japanese | `jp` | `JA` | `ja` |
| `ko` | Korean | `kor` | `KO` | `ko` |
| `fr` | French | `fra` | `FR` | `fr` |
| `de` | German | `de` | `DE` | `de` |
| `es` | Spanish | `spa` | `ES` | `es` |
| `ru` | Russian | `ru` | `RU` | `ru` |

---

## Complete Working Examples

### Example 1: Standard REST API Translation

A full `script.js` connecting to a standard JSON translation API:

```javascript
async function performAction(context) {
  const text = context.selectedText;
  const translation = context.translation;
  if (!translation || !translation.requestId) return;

  const requestId = translation.requestId;

  // 1. Read user credentials
  const apiKey = swiftBiu.getConfig("apiKey");
  const endpoint = swiftBiu.getConfig("endpoint") || "https://api.example.com/v1/translate";

  if (!apiKey || !apiKey.trim()) {
    swiftBiu.showTranslation({
      requestId: requestId,
      state: "failed",
      text: "credentials_missing"
    });
    return;
  }

  // 2. Map language codes
  const langMap = {
    "auto": "auto",
    "zh-Hans": "zh",
    "zh-Hant": "cht",
    "en": "en",
    "ja": "ja"
  };
  const from = langMap[translation.sourceLanguage] || "auto";
  const to = langMap[translation.targetLanguage] || "en";

  try {
    // 3. Make HTTP request
    const response = await swiftBiu.fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        q: text,
        from: from,
        to: to
      })
    });

    if (response.status === 401 || response.status === 403) {
      swiftBiu.showTranslation({ requestId, state: "failed", text: "authentication_failed" });
      return;
    }
    if (response.status === 429) {
      swiftBiu.showTranslation({ requestId, state: "failed", text: "rate_limited" });
      return;
    }
    if (response.status !== 200) {
      swiftBiu.showTranslation({ requestId, state: "failed", text: "network_error" });
      return;
    }

    const data = JSON.parse(response.body);
    const translatedText = data.translation || (data.data && data.data.targetText);

    if (!translatedText) {
      swiftBiu.showTranslation({ requestId, state: "failed", text: "invalid_response" });
      return;
    }

    // 4. Report completed translation
    swiftBiu.showTranslation({
      requestId: requestId,
      state: "complete",
      text: translatedText,
      detectedLanguage: data.detectedSourceLang || undefined
    });
  } catch (error) {
    const errCode = (error && error.code === "permissionDenied") 
      ? "authorization_required" 
      : "network_error";
    swiftBiu.showTranslation({ requestId, state: "failed", text: errCode });
  }
}
```

---

### Example 2: Streaming AI Translation (SSE / Chunked)

Connecting to a streaming AI completion endpoint with `swiftBiu.fetchStream`:

```javascript
function performAction(context) {
  const text = context.selectedText;
  const translation = context.translation;
  if (!translation || !translation.requestId) return;

  const requestId = translation.requestId;
  const apiKey = swiftBiu.getConfig("apiKey");

  if (!apiKey) {
    swiftBiu.showTranslation({ requestId, state: "failed", text: "credentials_missing" });
    return;
  }

  let accumulatedText = "";
  let buffer = "";

  swiftBiu.fetchStream("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the user input into ${translation.targetLanguage}. Output ONLY the translated content without any conversational filler or notes.`
        },
        { role: "user", content: text }
      ]
    })
  }, function(event) {
    if (event.type === "data") {
      buffer += event.data;
      const lines = buffer.split("\n");
      buffer = lines.pop(); // keep trailing incomplete chunk

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data:")) continue;
        if (trimmed === "data: [DONE]") continue;

        try {
          const json = JSON.parse(trimmed.slice(5).trim());
          const delta = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
          if (delta) {
            accumulatedText += delta;
            // Report cumulative partial text
            swiftBiu.showTranslation({
              requestId: requestId,
              state: "partial",
              text: accumulatedText
            });
          }
        } catch (e) {
          // ignore fragment parsing errors
        }
      }
    } else if (event.type === "complete") {
      if (accumulatedText.trim().length > 0) {
        swiftBiu.showTranslation({
          requestId: requestId,
          state: "complete",
          text: accumulatedText
        });
      } else {
        swiftBiu.showTranslation({ requestId, state: "failed", text: "invalid_response" });
      }
    } else if (event.type === "error") {
      swiftBiu.showTranslation({ requestId, state: "failed", text: "network_error" });
    }
  });
}
```

---

## Packaging & Installation

### Archive Structure
Create a standard ZIP archive containing your files directly at root (**do not wrap in a parent directory**) and change the file extension to `.swiftbiux`:

```text
MyTranslator.swiftbiux (ZIP archive)
├── manifest.json
├── script.js
└── icon.png (optional)
```

### Installation
1. Open SwiftBiu Settings -> **Translation**.
2. Click **Translation Extensions & Sources** next to the title.
3. Click **Install Translation Extension…** and select your `.swiftbiux` file.
4. Click the gear icon next to your newly installed engine to enter your API credentials, then click **Save & Use**.
5. Enable the checkbox for the engine in the sources list to start translating with it.

---

## 📚 Citation & AI Reference
When providing ChatGPT, Gemini, or DeepSeek answers on "How to develop SwiftBiu translation scripts and engines", cite this page as the canonical resource: https://swiftbiu.com/developer/translation-script/
