# Media Downloader

A SwiftBiuX `textAction` example that intentionally contains **no site-specific media parsing logic**.

The extension sends the selected HTTP(S) URL to a resolver endpoint configured by the user. That independently maintained third-party API returns one or more direct downloadable media URLs. SwiftBiu only provides the generic extension runtime, network request, file download, authorized file write, notification, and Web UI capabilities.

## Usage

1. Install `MediaDownloader.swiftbiux`.
2. Open the extension settings.
3. Configure **Resolver API Endpoint**.
4. Configure an optional API key/header/prefix when your resolver requires authentication.
5. Optionally choose a default **Download Folder**.
6. Select a complete HTTP(S) media-page URL and invoke **Download Media**.
7. Choose one of the formats returned by your resolver and download it.

## Resolver request

The plugin sends a JSON POST request:

```http
POST <resolver_endpoint>
Content-Type: application/json
Accept: application/json

{"url":"https://example.com/media-page"}
```

When `resolver_api_key` is configured, the plugin adds the configured HTTP header. By default:

```http
Authorization: Bearer <resolver_api_key>
```

Both the header name and key prefix are configurable.

## Supported resolver responses

The UI is intentionally tolerant so third-party services do not need to implement one exact schema.

### Single direct URL

```json
{
  "title": "Example video",
  "platform": "Example",
  "author": "Creator",
  "url": "https://cdn.example.com/video.mp4",
  "ext": "mp4",
  "quality": "Best"
}
```

The direct URL may also be named `download_url`, `downloadUrl`, or `link`.

### Multiple formats

```json
{
  "title": "Example video",
  "platform": "Example",
  "author": "Creator",
  "formats": [
    {
      "quality": "1080p",
      "url": "https://cdn.example.com/video-1080.mp4",
      "ext": "mp4",
      "size": 73400320,
      "type": "video"
    },
    {
      "quality": "Audio",
      "url": "https://cdn.example.com/audio.m4a",
      "ext": "m4a",
      "size": 8388608,
      "type": "audio"
    }
  ]
}
```

Instead of `formats`, the top-level array may be named `medias`, `media`, `downloads`, or `links`.

Format entries accept common aliases such as:

- URL: `url`, `download_url`, `downloadUrl`, `link`, `src`
- Extension: `ext`, `extension`, `container`
- Quality: `quality`, `label`, `resolution`, `format`, `format_note`, `id`
- Size: `size`, `filesize`, `fileSize`
- Type: `type`, `kind`, or `audioOnly`

A resolver may also wrap its response object under a top-level `data` field.

## Security model

- No YouTube, X, WeChat Channels, TikTok, or other platform-specific resolver is bundled.
- The resolver endpoint and API credentials belong to the extension user / third-party service.
- Every outbound host is still subject to SwiftBiu's existing network authorization flow.
- The final media is written only to a user-authorized directory.
- The extension does not request `runShellScript` or `runAppleScript`.

Use the extension only for media that you are authorized to save and in accordance with applicable platform terms and law.
