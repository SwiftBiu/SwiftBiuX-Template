# Scenario Selection Reference

Use this reference when the user describes a plugin in everyday language. First choose the task object, then choose whether the result can be produced locally or needs outside help.

## Local Text Plugins

Use for selected-text transformations that do not require semantic AI or remote data.

Examples:

- Clean extra spaces, blank lines, punctuation spacing, or copied webpage clutter.
- Convert case, slug, Markdown table formatting, JSON formatting, regex extraction.
- Count words, lines, characters, reading time.

Required defaults:

- `extensionKind`: `textAction`
- Usually no `network`
- Use `paste` when replacing selected text
- Use `clipboardWrite` when copying without paste

## Text + AI/API Plugins

Use when the task needs rewriting, summarization, translation, tone changes, semantic extraction, or generated content.

Required defaults:

- Ask for API docs unless a concrete supported provider contract is already supplied.
- Add `network`.
- Add secure API key configuration.
- Provide preview, retry, copy, paste, and append/replace behavior when practical.

## Pure JS Plugins

Use for one-click actions with no custom window.

Good fits:

- Slug generation
- Timestamp conversion
- Base64/hash conversion
- Simple text cleanup
- Quick URL opening

Avoid for:

- Multi-step batch file operations
- Long-running API calls with progress
- Workflows needing confirmation or preview

## Web UI Plugins

Use when the user needs a form, preview, settings-like controls, progress, batch review, or editable output.

Good fits:

- Text statistics panel
- JSON/CSV previewer
- Batch rename preview
- API response preview with regenerate/apply controls
- Image generation preview

Read `references/ui-patterns.md` before implementing.

## File Plugins

Use when the workflow starts from selected files or writes files as the main result.

Good fits:

- Read selected text/Markdown/JSON/CSV files and generate local rule-based reports.
- Create new Markdown, CSV, JSON, or image files.
- Rename, copy, move, organize, open, or trash files.
- Extract or set file/app icons with host APIs.

Read `references/file-workflows.md` before implementing.

## Network/API Plugins

Use when the plugin connects to an external service.

Good fits:

- Translation APIs
- AI rewriting/summarization
- Image generation
- Company internal systems
- Notion/GitHub/Slack/Feishu integrations
- Live exchange rates, search, remote metadata

Read `references/network-api-checklist.md` before implementing.

## Plain-Language Prompt Pattern

When converting a user's idea into an implementation prompt, use this shape:

> Read the SwiftBiuX AI Skill context provided to you. Create a plugin named `[PluginName]`. The user will `[select text/select files/open a UI/type input]`. The plugin should `[goal]`. Prefer local processing if possible. If external AI/API is required, explain why and use secure settings for API keys. After finishing, `[paste/copy/show preview/save file/open file/share/move to Trash]`. Generate complete plugin files with the correct SwiftBiu permissions.
