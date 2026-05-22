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
  }
]
```

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
