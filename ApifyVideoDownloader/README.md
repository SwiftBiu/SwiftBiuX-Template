# Apify Video Downloader

A page-free SwiftBiuX `textAction` for downloading **public media that the user owns or has permission to save** through independent third-party Actors on Apify.

Select a supported URL and run **Download Video**. The extension immediately resolves the media and saves it using the defaults in SwiftBiu extension settings. It does not open a custom Web UI; progress and errors appear in SwiftBiu's native file-task panel.

## Supported platforms

| Platform | Actor | Input mapping |
| --- | --- | --- |
| YouTube | `crawlerbros/youtube-video-downloader` | `videoUrls: [selectedURL]` |
| X / Twitter | `easyapi/all-in-one-media-downloader` | `link: selectedURL` |
| TikTok | `maximedupre/tiktok-video-downloader` | `videoUrls: [{ url: selectedURL }]` |
| Instagram | `crawlerbros/instagram-downloader-api` | `postUrls: [selectedURL]` |
| Facebook | `solid-scraper/facebook-video-downloader` | `video_urls: [{ url: selectedURL }]` |
| Vimeo | `maximedupre/vimeo-video-downloader` | `startUrls: [{ url: selectedURL }]` |

These are community-maintained Apify Actors and can change independently. Actor selection stays in the extension so it can be updated without changing SwiftBiu native code.

## Settings

- **Apify API Token**: the user's own token, stored as a secure SwiftBiu configuration value and sent only to `api.apify.com`.
- **YouTube Quality**: defaults to `720p`; supports best available, 1080p, 720p, 480p, 360p, and audio only.
- **Media Selection**: automatically choose the best result, prefer video, or prefer audio when an Actor returns several files.
- **Maximum Charge Per Run**: defaults to `$0.25`; passed as `maxTotalChargeUsd` together with `maxItems=1`.
- **Download Folder**: the default save location. If empty, the first action asks for a folder before starting the paid Actor and remembers it.

When SwiftBiu needs to restore folder access, the system may authorize a parent directory as the security scope. That scope grants access only: the configured Download Folder remains the actual save destination.

There are intentionally no per-run form fields. Settings provide stable defaults so invoking the action means “download now.”

## Execution model

```text
Run Download Video
        ↓
Confirm/select authorized save folder
        ↓
POST /v2/actors/:actorId/runs
        ↓
GET /v2/actor-runs/:runId?waitForFinish=8
        ↓
GET /v2/datasets/:datasetId/items
        ↓
Automatically rank downloadable media
        ↓
SwiftBiu.downloadRemoteFile(url, { destinationPath })
```

The native file task reports the Actor, Dataset, media-selection, download, completion, and failure stages. If an Actor is still running or a Dataset/download request fails, the extension keeps the existing run result in the current plugin runtime so retrying the same action does not immediately start another paid run.

## Result compatibility

Community Actors do not share one result schema. The background parser recursively scans Dataset items and prioritizes fields and paths such as:

- `download_url` / `downloadUrl`
- `storageUrl`
- `video_url` / `media_url` / `audio_url`
- `play` / `stream`
- nested `formats`, `downloads`, `media`, or `streams`

It rejects thumbnails, images, posters, avatars, `.m3u8`/`.mpd` manifests, `.m4s` DASH fragments, and the original selected page URL. It prefers direct Apify storage links when available, then applies the configured video/audio preference.

## Permissions and network behavior

The extension requests only:

- `network`
- `localFileWrite`
- `notifications`

It does not request `ui` because it has no Web page. The declared control-plane domain is `api.apify.com`. Some Actors return a direct file hosted on a separate CDN; SwiftBiu may request authorization for that returned host. A strict platform policy that disallows undeclared dynamic hosts can prevent those particular files from downloading.

## Limitations

- Selected-text URLs and recognized remote URL context are supported.
- Direct save uses `downloadRemoteFile({ destinationPath })`; the requested size cap is 4 GB.
- Community Actors can be removed, repriced, renamed, or change their input/output formats.
- Private, protected, paid, DRM-protected, or otherwise access-controlled media is outside the intended use of this template.
- The extension cannot guarantee the availability of third-party content or Actors.

## Test flow

1. Install/build `ApifyVideoDownloader.swiftbiux`.
2. Add an Apify API token in extension settings.
3. Optionally change quality, media preference, charge cap, and save folder.
4. Select a supported public video URL.
5. Run **Download Video**.
6. On the first run only, choose a save folder if none is configured.
7. Follow progress in SwiftBiu's native task panel; the selected media saves automatically.
