# Plugin Configuration

Use `configuration` to declare settings that users can edit in SwiftBiu, such as API keys, switches, languages, or file-suffix rules.

> [!IMPORTANT]
> Every configuration value is returned as a string. Background scripts use `SwiftBiu.getConfig(key)`; Web UIs use `window.swiftBiu.storage.get(key)`.

## Basic Configuration

```json
"configuration": [
  {
    "key": "api_key",
    "label": "API Key",
    "description": "Your secret API key.",
    "type": "secure",
    "placeholder": "Enter your key here"
  }
]
```

Supported `type` values:

- `string`: regular text.
- `secure`: passwords or API keys, stored in Keychain.
- `boolean`: a switch.
- `option`: a dropdown.
- `fileExtensionAppRules`: a native suffix-to-app rule editor.

Legacy `radioList` configurations are no longer supported. Migrate them to a normal `string` field or duplicate the extension for each fixed prompt variant.

Common optional fields:

- `group`: places related fields in the same settings section.
- `placeholder`: placeholder text for `string` and `secure` inputs.
- `description`: explanatory text shown under the label.
- `defaultValue`: initial value.

## Settings Layout

SwiftBiu renders settings in a vertical stack:

1. Label.
2. Description.
3. Control.

This keeps long labels and instructions readable.

## String Conversion

All values are returned as strings.

| Type | Returns | Usage |
| --- | --- | --- |
| `string` / `secure` | Stored string | Use directly |
| `boolean` | `"true"` or `"false"` | `SwiftBiu.getConfig("key") === "true"` |
| `option` | Selected option `value` | Use directly |
| `fileExtensionAppRules` | JSON string containing `rules` | Parse with `JSON.parse(...)` |

## `option`

`option` creates a dropdown.

Additional fields:

- `options`: required array of `{ label, value }` objects.
- `defaultValue`: optional value matching one option.

```json
"configuration": [
  {
    "key": "targetLanguage",
    "label": "Target Language",
    "type": "option",
    "defaultValue": "Python (Requests)",
    "options": [
      { "label": "Python (Requests)", "value": "Python (Requests)" },
      { "label": "JavaScript (Fetch)", "value": "JavaScript (Fetch)" }
    ]
  }
]
```

## `fileExtensionAppRules`

This type creates a native rule editor. Users add file suffixes and choose one macOS app per suffix without typing bundle identifiers.

The stored value is a JSON string containing a `rules` array. Each rule contains:

- `fileExtension`
- `appBundleID`

```json
"configuration": [
  {
    "key": "rules",
    "label": "File Suffix Rules",
    "type": "fileExtensionAppRules",
    "description": "Add suffixes and choose the app used to open each one.",
    "defaultValue": "{\"rules\":[{\"fileExtension\":\"pdf\",\"appBundleID\":\"com.apple.Preview\"}]}"
  }
]
```

```javascript
const value = SwiftBiu.getConfig("rules") || "{\"rules\":[]}";
const rules = JSON.parse(value).rules || [];
```

## Generic Keys and Documented Conventions

Most keys are plugin-defined. SwiftBiu stores and returns them, while your script defines their meaning.

Current AI text templates use these plugin-level conventions:

- `pasteBehavior`: default apply mode, `append` or `replace`.
- `enableAIResponseUI`: chooses between the native AI response bubble and direct paste.

`enableAIResponseUI` does nothing by itself. Your script must read it and branch into `showAIResponseBubble(...)`.

The native AI response bubble currently recognizes:

- `responseSystemPrompt`: used when `showAIResponseBubble(...)` does not receive an explicit `systemPrompt`.

Fallback order:

1. Current `responseSystemPrompt` value.
2. Manifest default for `responseSystemPrompt`.

Recommendations:

- Rename keys used only by your own script freely, but keep the script in sync.
- If you rename `responseSystemPrompt`, update any fallback behavior that depends on it.
- For several fixed prompt personas, duplicate the extension instead of adding a preset switcher.

## Related Documentation

- [Manifest and Action Types](manifest.md)
- [Background SwiftBiu API](background-api.md)
- [Native Workflows](native-workflows.md)
- [Web UI API](web-ui-api.md)
