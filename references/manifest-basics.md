# Manifest Basics Reference

Use this reference when you only need the minimum `manifest.json` contract. Load the full `developer-modules/manifest.md` only when you need icons, configuration fields, share targets, or advanced runtime API details.

## Minimal required fields

Every plugin should define:

```json
{
  "identifier": "com.yourname.pluginname",
  "name": "Plugin Name",
  "author": "Your Name",
  "description": "What this plugin does.",
  "version": "1.0",
  "extensionKind": "textAction",
  "actions": [
    {
      "title": "Action Title",
      "script": "script.js",
      "extensionKind": "textAction"
    }
  ],
  "permissions": []
}
```

## Required decisions

### `identifier`

Use a globally unique reverse-DNS identifier:

```json
"identifier": "com.example.cleantext"
```

Do not reuse an identifier from another plugin. Installing a plugin with the same identifier may replace the existing one.

### `extensionKind`

SwiftBiu routes actions by input type:

- `textAction`: selected text is the primary input.
- `fileAction`: selected files are the primary input.

Declare it twice:

```json
"extensionKind": "textAction",
"actions": [
  {
    "title": "Clean Text",
    "script": "script.js",
    "extensionKind": "textAction"
  }
]
```

If a workflow can receive both text and files, treat file-like data as `fileAction`.

### `actions`

Most plugins use one action:

```json
"actions": [
  {
    "title": "Format JSON",
    "script": "script.js",
    "extensionKind": "textAction"
  }
]
```

The script must expose:

```javascript
function isAvailable(context) {
  return true;
}

function performAction(context) {
  // plugin logic
}
```

### `permissions`

Declare only permissions used by code. Examples:

| Code behavior | Permission |
| --- | --- |
| Paste result back | `paste` |
| Copy result | `clipboardWrite` |
| Read selected files | `localFileRead` |
| Write, move, copy, or save files | `localFileWrite` |
| Use `SwiftBiu.fetch(...)` | `network` |
| Show notifications | `notifications` |

Do not add permissions "just in case".

## Text plugin starter

```json
{
  "identifier": "com.example.textcleaner",
  "name": "Text Cleaner",
  "author": "Example",
  "description": "Clean selected text.",
  "version": "1.0",
  "extensionKind": "textAction",
  "actions": [
    {
      "title": "Clean Text",
      "script": "script.js",
      "extensionKind": "textAction"
    }
  ],
  "permissions": ["paste"]
}
```

## File plugin starter

```json
{
  "identifier": "com.example.filesorter",
  "name": "File Sorter",
  "author": "Example",
  "description": "Sort selected files by extension.",
  "version": "1.0",
  "extensionKind": "fileAction",
  "actions": [
    {
      "title": "Sort Files",
      "script": "script.js",
      "extensionKind": "fileAction"
    }
  ],
  "permissions": ["localFileRead", "localFileWrite", "notifications"]
}
```

## When to load more docs

- Icons: read `references/manifest-icons.md`.
- Settings and secure API keys: read `references/configuration.md`.
- File workflows: read `references/file-workflows.md`.
- Web UI: read `references/ui-patterns.md`.
- Full manifest reference: read `developer-modules/manifest.md`.
