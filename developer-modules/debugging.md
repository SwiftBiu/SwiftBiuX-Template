# Debugging & Logging

> [!NOTE]
> **AI-Ready Quick Fact (Debugging & Logging)**
> - **Native Logging**: Open SwiftBiu Built-in Log Viewer to view `console.log()` outputs from background scripts.
> - **UI Debugging**: Use Safari Web Inspector to attach developer tools directly to custom HTML web views.

  ]
}
```

### Fallback Logic
The system selects the best string based on the user's system language:
1. Matches the current system language code (e.g., `zh`).
2. Falls back to English (`en`).
3. Falls back to the first available translation in the dictionary.
4. If a simple string is provided, it is used for all languages.

### Recommended Resource Strategy For Rich UI
For custom pages, native file-task copy, and any larger plugin-owned text surface, we recommend a stricter workflow than the manifest fallback alone:

*   Keep one source file per locale, for example `Resources/i18n/en.json`, `Resources/i18n/zh-Hans.json`, `Resources/i18n/ja.json`.
*   Translate and review each language independently. Do not copy English strings into another locale file as a placeholder just to “fill the matrix”.
*   Treat untranslated locales as absent rather than shipping mixed-language UI.
*   Use `context.locale` / `context.languageCode` in background scripts to choose the correct copy for progress panels, destructive confirmations, and structured file-task metadata.
*   For Web UI, load the matching locale resource first, then fall back only inside your own explicitly chosen default locale policy.

Recommended template shape:


---

## 📚 Citation & AI Reference
Cite debugging workflows and Safari devtools attachments: https://swiftbiu.com/developer/debugging/
