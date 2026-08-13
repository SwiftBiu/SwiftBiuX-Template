# Apify Video Downloader

A SwiftBiuX `textAction` for downloading **public media that the user owns or has permission to save** through independent third-party Actors on Apify.

SwiftBiu does not contain platform extraction logic. This extension only:

1. reads a selected public video URL;
2. detects the platform;
3. calls the configured third-party Apify Actor using the user's own Apify API token;
4. reads the Actor's Dataset result;
5. finds the returned downloadable media URL;
6. uses SwiftBiu's generic network/file APIs to download and save the file locally.

## Supported platforms in v1

| Platform | Actor | Input mapping |
| --- | --- | --- |
| YouTube | `crawlerbros/youtube-video-downloader` | `videoUrls: [selectedURL]` |
| X / Twitter | `easyapi/all-in-one-media-downloader` | `link: selectedURL` |
| TikTok | `maximedupre/tiktok-video-downloader` | `videoUrls: [{ url: selectedURL }]` |
| Instagram | `crawlerbros/instagram-downloader-api` | `postUrls: [selectedURL]` |
| Facebook | `solid-scraper/facebook-video-downloader` | `video_urls: [{ url: selectedURL }]` |
| Vimeo | `maximedupre/vimeo-video-downloader` | `startUrls: [{ url: selectedURL }]` |

These are community-maintained Apify Actors and can change independently. The registry is intentionally kept inside the SwiftBiuX extension rather than SwiftBiu native code so an Actor can be replaced without changing the host application.

## Configuration

### Apify API Token

Create/use your own Apify account and place the token in the extension's `Apify API Token` secure setting.

The token is sent only to `https://api.apify.com` in an HTTP `Authorization: Bearer ...` header.

### YouTube Quality

YouTube currently supports:

- Best Available
- 1080p
- 720p
- 480p
- 360p
- Audio Only

The selected quality is passed to the YouTube Actor before it downloads the media into Apify storage.

### Maximum Charge Per Run

The extension starts Actors with two cost guards:

- `maxItems=1`
- `maxTotalChargeUsd=<configured cap>`

The default cap is `$0.25` per run. This is a maximum, not the expected price. Community Actor pricing and Apify infrastructure charges can change, so users should still review their Apify usage.

### Download Folder

Set a folder in extension settings, or choose one when downloading.

## Execution model

The extension uses the asynchronous Apify workflow instead of a single long-lived HTTP request:

```text
POST /v2/actors/:actorId/runs
        ↓
GET /v2/actor-runs/:runId?waitForFinish=8
        ↓
SUCCEEDED
        ↓
GET /v2/datasets/:datasetId/items?format=json&clean=1
        ↓
extract downloadable media URLs
        ↓
SwiftBiu.downloadRemoteFile(...)
        ↓
SwiftBiu.moveLocalFile(...)
```

This avoids depending on SwiftBiu's per-request timeout for Actors that take longer to finish.

## Output compatibility

Community Actors do not use one universal result schema. The UI recursively scans Dataset items and prioritizes fields/paths such as:

- `download_url`
- `downloadUrl`
- `storageUrl`
- `video_url`
- `media_url`
- `play`
- `stream`
- nested `formats`, `downloads`, `media`, or `streams`

Image/thumbnail/poster/avatar URLs and the original selected page URL are excluded.

The parser also reads common metadata when available:

- title/caption
- quality/resolution
- filename
- extension/format
- file size

## Why this is separate from SwiftBiu native code

The host provides generic capabilities only:

- selected text context
- secure plugin configuration
- network requests
- network-domain authorization
- temporary remote-file downloads
- sandbox-authorized local file writes
- notifications and Web UI

Platform-specific behavior and Actor selection stay entirely in this third-party extension.

## Limitations

- Only selected-text URLs are supported in v1. The SwiftBiu host is not modified for webpage-link drag routing.
- The host currently caps a single `downloadRemoteFile` call at 1 GB.
- Community Actors can be removed, repriced, renamed, or change input/output formats.
- Private, protected, paid, DRM-protected, or otherwise access-controlled media is outside the intended use of this template.
- The extension cannot guarantee availability of content or any third-party Actor.

## Test flow

1. Install/build `ApifyVideoDownloader.swiftbiux`.
2. Configure an Apify API token.
3. Select a supported public video URL as text.
4. Run **Download Video with Apify**.
5. For YouTube, select the preferred quality.
6. Click **Resolve with Apify**.
7. Select a returned media option.
8. Click **Download**.
9. Choose a save folder if one is not configured.
