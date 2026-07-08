# Manifest Icons Reference

Use this reference when a plugin needs an icon. Prefer simple, built-in icon formats unless the plugin has a strong brand or visual identity.

## Recommended order

1. **SF Symbol** for native-looking utility plugins.
2. **Text icon** for short labels such as `AI`, `JSON`, `OCR`.
3. **File icon** for branded or custom visuals bundled with the plugin.
4. **Iconify or data URI** only when you need a specific external icon shape.

## SF Symbol

```json
{
  "icon": "sparkles",
  "iconType": "sfSymbol"
}
```

If `iconType` is omitted and `icon` does not look like a file name, SwiftBiu treats it as an SF Symbol.

Good examples:

| Scenario | Icon |
| --- | --- |
| AI rewrite | `sparkles` |
| Translate | `globe` |
| File organizer | `folder` |
| JSON formatter | `curlybraces` |
| Image tool | `photo` |
| Search | `magnifyingglass` |

## Text icon

Use a short label:

```json
{
  "icon": "AI",
  "iconType": "text"
}
```

Useful for small technical utilities:

```json
{
  "icon": "JSON",
  "iconType": "text"
}
```

Keep text icons short. Long labels become unreadable in toolbar and catalog surfaces.

## Bundled file icon

Use a file when you need a custom icon:

```json
{
  "icon": "icon.png",
  "iconType": "file"
}
```

Supported common formats include `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.icns`, `.pdf`, and `.svg`.

Recommendations:

- Prefer transparent background.
- Prepare at least 64x64 or 128x128 source assets.
- Keep file size small.
- Put the icon file inside the plugin folder so it is packaged with the plugin.

## Data URI icon

Only use this when bundling a file is inconvenient:

```json
{
  "icon": "data:image/svg+xml;base64,...",
  "iconType": "data"
}
```

Data URI icons can make manifest files hard to read, so avoid them for normal plugins.

## When not to overthink icons

For AI-generated plugins, choose an SF Symbol first. The user can replace it later without changing plugin logic.
