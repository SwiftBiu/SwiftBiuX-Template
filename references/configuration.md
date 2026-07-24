# Configuration, Packaging, and Catalog Reference

Use this reference when a plugin needs settings, secure API keys, option fields, file-extension app rules, packaging, or catalog metadata.

## Configuration Examples

Use `"defaultValue"`, not `"default"`.

```json
"configuration": [
  {
    "key": "api_key",
    "label": "API Key",
    "type": "secure",
    "placeholder": "Enter your API key",
    "description": "Stored securely in Keychain.",
    "group": "Authentication"
  },
  {
    "key": "api_url",
    "label": "API URL",
    "type": "string",
    "placeholder": "https://api.example.com/v1",
    "description": "Custom API endpoint. Leave blank for default.",
    "defaultValue": "https://api.example.com/v1",
    "group": "Authentication"
  },
  {
    "key": "auto_paste",
    "label": "Auto Paste Result",
    "type": "boolean",
    "description": "Automatically paste the result into the active app.",
    "defaultValue": true,
    "group": "General"
  },
  {
    "key": "model",
    "label": "Model",
    "type": "option",
    "description": "The AI model to use.",
    "defaultValue": "gpt-4o",
    "options": [
      { "label": "GPT-4o", "value": "gpt-4o" },
      { "label": "GPT-4o Mini", "value": "gpt-4o-mini" }
    ],
    "group": "Model"
  },
  {
    "key": "rules",
    "label": "File Suffix Rules",
    "type": "fileExtensionAppRules",
    "description": "Add suffixes on the left and choose one macOS app for each suffix on the right.",
    "defaultValue": "{\"rules\":[{\"fileExtension\":\"pdf\",\"appBundleID\":\"com.apple.Preview\"}]}",
    "group": "Files"
  },
  {
    "key": "outputDirectory",
    "label": "Output Folder",
    "type": "directory",
    "description": "Choose the destination folder.",
    "group": "Files"
  }
]
```

Supported configuration types:

- `string`: regular text. When its key matches `ai.providerKey` or `ai.modelKey`, SwiftBiu renders the native AI picker.
- `secure`: secret text stored in Keychain.
- `boolean`: switch; returned as `"true"` or `"false"`.
- `option`: fixed dropdown using `options`.
- `directory`: native folder-path picker.
- `fileExtensionAppRules`: native file-suffix-to-app rule editor.

All values are returned to JavaScript as strings. Use `defaultValue`, never `default`.

## SwiftBiu-Managed AI Settings

Do not add a plugin-owned `secure` API key when the extension should use an AI account already configured in SwiftBiu. Bind normal configuration keys to the manifest `ai` metadata instead:

```json
{
  "ai": {
    "useCase": "chat",
    "providerKey": "chatProvider",
    "modelKey": "chatModel",
    "allowedProviders": ["codex", "custom-endpoint"]
  },
  "configuration": [
    {
      "key": "chatProvider",
      "label": "Provider",
      "type": "string",
      "defaultValue": "codex"
    },
    {
      "key": "chatModel",
      "label": "Model",
      "type": "string",
      "defaultValue": "gpt-5.2-codex"
    }
  ]
}
```

- `allowedProviders` filters the generated native picker and is enforced again for background and Web UI proxy calls.
- An action-level `ai` declaration replaces the root declaration for that action. Repeat the allowlist and key bindings when overriding it.
- Add `custom-endpoint` only if the extension is compatible with the request/response protocol used by that account.
- For use cases, aliases, native AI APIs, runtime errors, and provider restrictions, read [SwiftBiu-Managed AI Provider Contract](native-ai.md).

## Packaging

```bash
cd <YourPluginFolder>
./scripts/build_plugin.sh <PluginFolderName>
```

If the scaffold uses npm:

```bash
npm run build
```

Expected output: `<PluginFolderName>.swiftbiux`.

## Catalog Entry

Only add catalog entries when the user asks to publish or prepare distribution metadata.

```json
{
  "id": "com.yourname.pluginname",
  "name": "Plugin Name",
  "description": { "en": "English desc", "zh": "Chinese desc" },
  "icon": "sfSymbolName",
  "version": "1.0",
  "type": "Web App",
  "author": "Author Name",
  "downloadUrl": "https://github.com/your-repo/releases/latest/download/PluginName.swiftbiux",
  "categoryId": "text-processing|devtools|productivity|online-services|data-creative|system"
}
```

Catalog icon notes:

- `catalog/plugins.json` stores `icon` only.
- SF Symbol name: `"sparkles"`.
- File icon by extension: `"icon.png"`.
- Explicit prefixes: `"text:AI"`, `"iconify:solar:flag-bold"`, `"data:image/png;base64,..."`.
