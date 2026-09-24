/*
 * Apify Video Downloader
 * Headless background action: resolve with Apify, then save through SwiftBiu's
 * native file workflow. No custom Web UI is opened.
 */

var APIFY_VIDEO_ACTORS = {
    youtube: {
        name: "YouTube",
        actor: "crawlerbros~youtube-video-downloader",
        buildInput: function(url, quality) {
            return {
                videoUrls: [url],
                videoQuality: quality || "720p",
                downloadSubtitles: false,
                maxVideosPerInput: 1,
                proxyCountry: "US"
            };
        }
    },
    x: {
        name: "X / Twitter",
        actor: "easyapi~all-in-one-media-downloader",
        buildInput: function(url) { return { link: url }; }
    },
    tiktok: {
        name: "TikTok",
        actor: "maximedupre~tiktok-video-downloader",
        buildInput: function(url) { return { videoUrls: [{ url: url }] }; }
    },
    instagram: {
        name: "Instagram",
        actor: "crawlerbros~instagram-downloader-api",
        buildInput: function(url) {
            return { postUrls: [url], usernames: [], maxPosts_per_username: 1 };
        }
    },
    facebook: {
        name: "Facebook",
        actor: "solid-scraper~facebook-video-downloader",
        buildInput: function(url) { return { video_urls: [{ url: url }] }; }
    },
    vimeo: {
        name: "Vimeo",
        actor: "maximedupre~vimeo-video-downloader",
        buildInput: function(url) { return { startUrls: [{ url: url }] }; }
    }
};

var APIFY_TERMINAL_STATUSES = {
    "SUCCEEDED": true,
    "FAILED": true,
    "TIMED-OUT": true,
    "ABORTED": true
};

// These caches prevent duplicate paid runs when the same JavaScript runtime is
// still alive and the user retries after polling, dataset, or download errors.
var APIFY_PENDING_RUNS = {};
var APIFY_RESOLVED_RUNS = {};
var APIFY_ACTIVE_JOBS = {};

function isHostOrSubdomain(host, domain) {
    return host === domain || host.slice(-(domain.length + 1)) === "." + domain;
}

function hostFromHTTPURL(value) {
    var match = String(value || "").match(/^https?:\/\/([^\/?#:]+)(?::\d+)?(?:[\/?#]|$)/i);
    return match ? String(match[1]).toLowerCase().replace(/\.$/, "") : "";
}

function normalizeCandidateURL(value) {
    return String(value || "")
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
        .replace(/&amp;/gi, "&")
        .trim()
        .replace(/[\])},.;!?]+$/g, "");
}

function isSupportedVideoURL(value) {
    var host = hostFromHTTPURL(normalizeCandidateURL(value));
    return host === "youtu.be"
        || isHostOrSubdomain(host, "youtube.com")
        || isHostOrSubdomain(host, "x.com")
        || isHostOrSubdomain(host, "twitter.com")
        || isHostOrSubdomain(host, "tiktok.com")
        || isHostOrSubdomain(host, "instagram.com")
        || isHostOrSubdomain(host, "facebook.com")
        || host === "fb.watch"
        || isHostOrSubdomain(host, "vimeo.com");
}

function supportedVideoURLsFromText(text) {
    var normalizedText = String(text || "")
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
        .replace(/&amp;/gi, "&");
    var pattern = /(?:^|[^a-z0-9.-])((?:https?:\/\/)?(?:www\.)?(?:(?:[a-z0-9-]+\.)*youtube\.com|youtu\.be|(?:[a-z0-9-]+\.)*x\.com|(?:[a-z0-9-]+\.)*twitter\.com|(?:[a-z0-9-]+\.)*tiktok\.com|(?:[a-z0-9-]+\.)*instagram\.com|(?:[a-z0-9-]+\.)*facebook\.com|fb\.watch|(?:[a-z0-9-]+\.)*vimeo\.com)(?=[/?#]|$)(?:[/?#][^\s<>"'()[\]{}]*)?)/gi;
    var results = [];
    var match;
    var value;
    while ((match = pattern.exec(normalizedText)) !== null) {
        value = match[1];
        if (!/^https?:\/\//i.test(value)) value = "https://" + value;
        results.push(normalizeCandidateURL(value));
    }
    return results;
}

function firstSupportedVideoURLFromContext(context) {
    var candidates = supportedVideoURLsFromText(context && context.selectedText);
    var remoteFiles = context && context.selectedRemoteFiles;
    var index;
    var item;
    if (Object.prototype.toString.call(remoteFiles) === "[object Array]") {
        for (index = 0; index < remoteFiles.length; index += 1) {
            item = remoteFiles[index];
            if (item && (item.url || item.fileURL)) {
                candidates.push(normalizeCandidateURL(item.url || item.fileURL));
            }
        }
    }
    for (index = 0; index < candidates.length; index += 1) {
        if (isSupportedVideoURL(candidates[index])) return candidates[index];
    }
    return null;
}

function detectPlatform(value) {
    var host = hostFromHTTPURL(value);
    if (host === "youtu.be" || isHostOrSubdomain(host, "youtube.com")) return "youtube";
    if (isHostOrSubdomain(host, "x.com") || isHostOrSubdomain(host, "twitter.com")) return "x";
    if (isHostOrSubdomain(host, "tiktok.com")) return "tiktok";
    if (isHostOrSubdomain(host, "instagram.com")) return "instagram";
    if (isHostOrSubdomain(host, "facebook.com") || host === "fb.watch") return "facebook";
    if (isHostOrSubdomain(host, "vimeo.com")) return "vimeo";
    return "";
}

function isAvailable(context) {
    var url = firstSupportedVideoURLFromContext(context);
    return { isAvailable: true, isContextMatch: Boolean(url) };
}

function localizedStrings(context) {
    var language = String(context && context.languageCode || "").toLowerCase();
    if (language.indexOf("zh") === 0) {
        return {
            taskName: "下载视频",
            noURLTitle: "没有可下载的视频链接",
            noURLBody: "请先选中 YouTube、X、TikTok、Instagram、Facebook 或 Vimeo 的公开视频链接。",
            noTokenTitle: "需要 Apify API Token",
            noTokenBody: "请先在扩展设置中填写 Apify API Token。",
            folderTitle: "需要下载目录",
            folderBody: "本次下载已取消。请重新运行并选择保存目录。",
            folderUnavailableTitle: "下载目录不可用",
            folderUnavailableBody: "请在扩展设置中重新选择下载目录。",
            alreadyRunningTitle: "下载任务正在进行",
            alreadyRunningBody: "同一链接已有任务正在处理，请查看原生任务面板。",
            preparing: "正在准备下载",
            starting: "正在启动 Apify Actor",
            running: "正在解析媒体",
            reading: "正在读取解析结果",
            choosing: "正在选择最佳媒体",
            downloading: "正在下载文件",
            completed: "视频下载完成",
            failed: "视频下载失败",
            actorRun: "Actor 任务",
            dataset: "解析结果",
            download: "文件下载",
            waiting: "等待处理",
            processing: "处理中",
            saved: "已保存",
            failedStatus: "失败",
            reveal: "在 Finder 中显示",
            plan: function(platform, folder) { return "使用 " + platform + " Actor 解析，并保存到 “" + folder + "”"; },
            runStatus: function(status) { return "Actor 状态：" + status; },
            selected: function(label) { return "已自动选择：" + label; },
            savedAt: function(path) { return "文件已保存到 " + path; },
            stillRunning: "Actor 仍在运行。稍后再次执行同一链接可继续查询，且不会在当前运行时重复创建付费任务。",
            noDataset: "Actor 已完成，但没有返回默认 Dataset。",
            noMedia: "Actor 已完成，但结果中没有找到可直接下载的视频或音频。",
            missingRun: "Apify 没有返回 Actor 运行 ID。",
            saveFailed: "SwiftBiu 未能确认文件已保存。",
            sectionTitles: {
                planTitle: "下载计划", logTitle: "处理记录", fileTitle: "任务状态",
                failureTitle: "失败详情", actionTitle: "后续操作"
            }
        };
    }
    return {
        taskName: "Download Video",
        noURLTitle: "No Downloadable Video URL",
        noURLBody: "Select a public YouTube, X, TikTok, Instagram, Facebook, or Vimeo URL first.",
        noTokenTitle: "Apify API Token Required",
        noTokenBody: "Add your Apify API token in the extension settings first.",
        folderTitle: "Download Folder Required",
        folderBody: "The download was cancelled. Run the action again and choose a save folder.",
        folderUnavailableTitle: "Download Folder Unavailable",
        folderUnavailableBody: "Choose the download folder again in extension settings.",
        alreadyRunningTitle: "Download Already Running",
        alreadyRunningBody: "This URL is already being processed. Check the native task panel.",
        preparing: "Preparing Download",
        starting: "Starting Apify Actor",
        running: "Resolving Media",
        reading: "Reading Results",
        choosing: "Choosing Best Media",
        downloading: "Downloading File",
        completed: "Video Downloaded",
        failed: "Video Download Failed",
        actorRun: "Actor Run",
        dataset: "Resolved Result",
        download: "File Download",
        waiting: "Waiting",
        processing: "Processing",
        saved: "Saved",
        failedStatus: "Failed",
        reveal: "Show in Finder",
        plan: function(platform, folder) { return "Resolve with the " + platform + " Actor and save to “" + folder + "”"; },
        runStatus: function(status) { return "Actor status: " + status; },
        selected: function(label) { return "Automatically selected: " + label; },
        savedAt: function(path) { return "Saved to " + path; },
        stillRunning: "The Actor is still running. Run the same URL again later to continue checking it without duplicating the paid run in the current runtime.",
        noDataset: "The Actor completed without a default Dataset.",
        noMedia: "The Actor completed, but no directly downloadable video or audio was found.",
        missingRun: "Apify did not return an Actor run ID.",
        saveFailed: "SwiftBiu could not confirm that the file was saved.",
        sectionTitles: {
            planTitle: "Download Plan", logTitle: "Activity", fileTitle: "Task Status",
            failureTitle: "Failure Details", actionTitle: "Next Actions"
        }
    };
}

function configValue(key, fallback) {
    var value = SwiftBiu.getConfig(key);
    value = value === undefined || value === null ? "" : String(value).trim();
    return value || fallback;
}

function loadSettings() {
    var cap = Number(configValue("max_charge_usd", "0.25"));
    if (!isFinite(cap)) cap = 0.25;
    cap = Math.min(Math.max(cap, 0.01), 5);
    return {
        token: configValue("apify_token", ""),
        youtubeQuality: configValue("youtube_quality", "720p"),
        mediaPreference: configValue("media_preference", "automatic"),
        maxCharge: cap,
        downloadDirectory: configValue("download_directory", "")
    };
}

function trimTrailingSlash(path) {
    return String(path || "").replace(/\/+$/, "");
}

function displayNameForPath(path) {
    var pieces = trimTrailingSlash(path).split("/");
    return pieces[pieces.length - 1] || path;
}

function resolveDownloadDirectory(settings, strings) {
    var directory = trimTrailingSlash(settings.downloadDirectory);
    var hadConfiguredDirectory = Boolean(directory);
    var hasDirectoryAccess;
    if (directory) {
        hasDirectoryAccess = SwiftBiu.hasAuthorizedDirectoryAccess(directory);
        if (!hasDirectoryAccess) {
            // The returned path is an authorization scope and may be an ancestor
            // of the configured folder. Never treat that scope as the destination.
            SwiftBiu.requestDirectoryAuthorization(directory);
            hasDirectoryAccess = SwiftBiu.hasAuthorizedDirectoryAccess(directory);
        }
        if (hasDirectoryAccess && SwiftBiu.directoryExists(directory)) {
            return directory;
        }
        directory = "";
    }

    directory = trimTrailingSlash(SwiftBiu.pickLocalDirectory());
    if (!directory) {
        SwiftBiu.showNotification(
            hadConfiguredDirectory ? strings.folderUnavailableTitle : strings.folderTitle,
            hadConfiguredDirectory ? strings.folderUnavailableBody : strings.folderBody
        );
        return "";
    }
    SwiftBiu.setConfig("download_directory", directory);
    return directory;
}

function appendActivity(job, message, category, pinned) {
    job.activityEntries.push({
        message: String(message || ""),
        category: category || "general",
        isPinned: Boolean(pinned)
    });
}

function taskOptions(job, headline, detail, progress) {
    return {
        headlineText: headline,
        detailText: detail,
        totalCount: 1,
        completedCount: job.completed ? 1 : 0,
        skippedCount: 0,
        progress: progress,
        batchItems: job.batchItems,
        activityEntries: job.activityEntries,
        summaryChips: [{ title: job.adapter.name, count: 1, tone: "accent" }],
        sectionTitles: job.strings.sectionTitles,
        actionButtons: job.completed ? [{ kind: "revealTargets", title: job.strings.reveal, isEnabled: true }] : [],
        targetDirectoryPaths: [job.directory]
    };
}

function updateJob(job, headline, detail, progress, category) {
    if (detail) appendActivity(job, detail, category || "general", false);
    SwiftBiu.updateFileTask(job.sessionID, taskOptions(job, headline, detail, progress));
}

function errorMessage(error) {
    if (error && error.message) return String(error.message);
    if (error && error.error) return String(error.error);
    return String(error || "Unknown error");
}

function failJob(job, error, keepRun) {
    var message = errorMessage(error);
    job.batchItems[0].status = "failed";
    job.batchItems[0].statusText = job.strings.failedStatus;
    job.batchItems[0].detailText = message;
    appendActivity(job, message, "error", true);
    SwiftBiu.failFileTask(job.sessionID, taskOptions(job, job.strings.failed, message, 1));
    SwiftBiu.showNotification(job.strings.failed, message);
    delete APIFY_ACTIVE_JOBS[job.key];
    if (!keepRun) {
        delete APIFY_PENDING_RUNS[job.key];
        delete APIFY_RESOLVED_RUNS[job.key];
    }
}

function finishJob(job, path) {
    job.completed = true;
    job.batchItems[0].outputFileName = path;
    job.batchItems[0].status = "completed";
    job.batchItems[0].statusText = job.strings.saved;
    job.batchItems[0].detailText = job.strings.savedAt(path);
    appendActivity(job, job.strings.savedAt(path), "summary", true);
    SwiftBiu.finishFileTask(job.sessionID, taskOptions(job, job.strings.completed, job.strings.savedAt(path), 1));
    SwiftBiu.showNotification(job.strings.completed, path);
    delete APIFY_ACTIVE_JOBS[job.key];
    delete APIFY_PENDING_RUNS[job.key];
    delete APIFY_RESOLVED_RUNS[job.key];
}

function parseResponseData(response) {
    var data;
    var trimmed;
    if (!response) return null;
    data = response.data;
    if (typeof data === "string") {
        trimmed = data.trim();
        if (!trimmed) return null;
        try { return JSON.parse(trimmed); } catch (_) { return trimmed; }
    }
    return data;
}

function requestJSON(job, url, options, onSuccess, onError) {
    SwiftBiu.fetch(url, options, function(response) {
        var status = Number(response && response.status || 0);
        var data = parseResponseData(response);
        var message;
        if (status < 200 || status >= 300) {
            if (data && typeof data === "object") {
                message = data.error && (data.error.message || data.error.type);
                message = message || data.message || JSON.stringify(data);
            } else {
                message = String(data || "HTTP " + status);
            }
            onError(new Error(message));
            return;
        }
        onSuccess(data);
    }, function(error) {
        onError(new Error(errorMessage(error)));
    });
}

function apiHeaders(job) {
    return {
        "Authorization": "Bearer " + job.settings.token,
        "Content-Type": "application/json"
    };
}

function startOrResumeRun(job) {
    var cached = APIFY_RESOLVED_RUNS[job.key];
    var pending = APIFY_PENDING_RUNS[job.key];
    var startURL;
    var input;

    if (cached && String(cached.status || "").toUpperCase() === "SUCCEEDED") {
        readDataset(job, cached);
        return;
    }
    if (pending && pending.id) {
        pollRun(job, pending, 0);
        return;
    }

    updateJob(job, job.strings.starting, job.adapter.name + " · " + job.adapter.actor.replace("~", "/"), 0.08, "plan");
    startURL = "https://api.apify.com/v2/actors/" + job.adapter.actor
        + "/runs?waitForFinish=0&maxItems=1&maxTotalChargeUsd="
        + encodeURIComponent(String(job.settings.maxCharge));
    input = job.adapter.buildInput(job.url, job.settings.youtubeQuality);

    requestJSON(job, startURL, {
        method: "POST",
        headers: apiHeaders(job),
        body: JSON.stringify(input)
    }, function(data) {
        var run = data && data.data ? data.data : data;
        if (!run || !run.id) {
            failJob(job, new Error(job.strings.missingRun), false);
            return;
        }
        APIFY_PENDING_RUNS[job.key] = run;
        pollRun(job, run, 0);
    }, function(error) {
        failJob(job, error, false);
    });
}

function pollRun(job, run, attempt) {
    var status = String(run && run.status || "RUNNING").toUpperCase();
    var pollURL;
    if (APIFY_TERMINAL_STATUSES[status]) {
        handleTerminalRun(job, run);
        return;
    }
    if (attempt >= 24) {
        failJob(job, new Error(job.strings.stillRunning), true);
        return;
    }

    job.batchItems[0].status = "processing";
    job.batchItems[0].statusText = job.strings.processing;
    job.batchItems[0].detailText = job.strings.runStatus(status);
    updateJob(job, job.strings.running, job.strings.runStatus(status), Math.min(0.12 + attempt * 0.025, 0.68), "processing");
    pollURL = "https://api.apify.com/v2/actor-runs/" + encodeURIComponent(run.id) + "?waitForFinish=8";
    requestJSON(job, pollURL, { method: "GET", headers: apiHeaders(job) }, function(data) {
        var nextRun = data && data.data ? data.data : data;
        if (!nextRun || !nextRun.id) nextRun = run;
        APIFY_PENDING_RUNS[job.key] = nextRun;
        pollRun(job, nextRun, attempt + 1);
    }, function(error) {
        failJob(job, error, true);
    });
}

function handleTerminalRun(job, run) {
    var status = String(run && run.status || "").toUpperCase();
    var detail;
    if (status !== "SUCCEEDED") {
        detail = run && (run.statusMessage || run.errorMessage) || status || "Unknown status";
        failJob(job, new Error("Apify Actor " + status + ": " + detail), false);
        return;
    }
    delete APIFY_PENDING_RUNS[job.key];
    APIFY_RESOLVED_RUNS[job.key] = run;
    readDataset(job, run);
}

function readDataset(job, run) {
    var datasetID = run && run.defaultDatasetId;
    var url;
    if (!datasetID) {
        failJob(job, new Error(job.strings.noDataset), false);
        return;
    }
    updateJob(job, job.strings.reading, job.strings.dataset, 0.73, "processing");
    url = "https://api.apify.com/v2/datasets/" + encodeURIComponent(datasetID)
        + "/items?format=json&clean=1&limit=20";
    requestJSON(job, url, { method: "GET", headers: apiHeaders(job) }, function(data) {
        var items;
        var candidates;
        var actorError;
        if (Object.prototype.toString.call(data) === "[object Array]") items = data;
        else if (data && Object.prototype.toString.call(data.items) === "[object Array]") items = data.items;
        else items = data ? [data] : [];

        candidates = extractCandidates(items, job.url, job.settings.mediaPreference);
        if (!candidates.length) {
            actorError = firstActorError(items);
            failJob(job, new Error(actorError || job.strings.noMedia), false);
            return;
        }
        downloadCandidate(job, candidates[0]);
    }, function(error) {
        // Keep the completed run so a retry does not start another paid Actor run.
        failJob(job, error, true);
    });
}

function firstActorError(items) {
    var index;
    var item;
    for (index = 0; index < items.length; index += 1) {
        item = items[index];
        if (item && (item.error || item.errorMessage)) return String(item.error || item.errorMessage);
    }
    return "";
}

function normalizedMediaURL(value) {
    return String(value || "").replace(/#.*$/, "");
}

function mediaExtension(raw, parent) {
    var parentValue = parent && (parent.ext || parent.extension || parent.fileExtension || parent.format);
    var path;
    var match;
    if (typeof parentValue === "string" && /^[a-z0-9]{2,5}$/i.test(parentValue)) {
        return parentValue.toLowerCase();
    }
    path = String(raw || "").replace(/[?#].*$/, "");
    match = path.match(/\.([a-z0-9]{2,5})$/i);
    return match ? match[1].toLowerCase() : "";
}

function firstField(object, keys) {
    var index;
    var value;
    if (!object || typeof object !== "object") return "";
    for (index = 0; index < keys.length; index += 1) {
        value = object[keys[index]];
        if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
    }
    return "";
}

function candidateFromURL(url, key, path, parent, root, sourceURL, preference) {
    var lowerPath;
    var ext;
    var parentType;
    var score = 0;
    var stats;
    var quality;
    var filename;
    var title;
    var size;
    var imageExtensions = { jpg: true, jpeg: true, png: true, gif: true, webp: true, avif: true, svg: true };
    var videoExtensions = { mp4: true, m4v: true, mov: true, webm: true };
    var audioExtensions = { mp3: true, m4a: true, aac: true, wav: true, ogg: true, opus: true };

    if (!/^https?:\/\//i.test(url)) return null;
    if (normalizedMediaURL(url) === normalizedMediaURL(sourceURL)) return null;
    lowerPath = (String(path || "") + "." + String(key || "")).toLowerCase();
    ext = mediaExtension(url, parent);
    parentType = firstField(parent, ["media_type", "mediaType", "type", "kind"]).toLowerCase();

    if (imageExtensions[ext] || ext === "m3u8" || ext === "mpd" || ext === "m4s"
        || /thumbnail|thumb|image|avatar|cover|poster/.test(lowerPath)
        || /photo|image/.test(parentType)) return null;

    if (/download[_-]?url|downloadurl|storageurl|storage_url/.test(lowerPath)) score += 100;
    if (/video[_-]?url|media[_-]?url|play|stream|file[_-]?url|audio[_-]?url/.test(lowerPath)) score += 55;
    if (/formats?|downloads?|medias?|streams?/.test(lowerPath)) score += 30;
    if (videoExtensions[ext] || audioExtensions[ext]) score += 45;
    if (/key-value-stores/.test(url)) score += 25;
    if (/video|audio|gif/.test(parentType)) score += 25;
    if (isHostOrSubdomain(hostFromHTTPURL(url), "api.apify.com")) score += 15;
    if (preference === "video" && (videoExtensions[ext] || /video/.test(parentType + " " + lowerPath))) score += 35;
    if (preference === "audio" && (audioExtensions[ext] || /audio/.test(parentType + " " + lowerPath))) score += 35;
    if (score < 40) return null;

    stats = parent && parent.media_stats && typeof parent.media_stats === "object" ? parent.media_stats : null;
    quality = firstField(parent, ["quality", "resolution", "format_note", "formatNote", "label"])
        || (stats && stats.width && stats.height ? stats.width + "×" + stats.height : "")
        || firstField(root, ["resolution", "quality"]);
    filename = firstField(parent, ["filename", "fileName", "name"]) || firstField(root, ["filename", "fileName"]);
    title = firstField(parent, ["title", "caption"]) || firstField(root, ["title", "caption", "description"]) || "video";
    size = firstField(parent, ["filesize_bytes", "fileSizeBytes", "file_size", "size"])
        || (stats ? firstField(stats, ["filesize_bytes", "fileSizeBytes", "size"]) : "")
        || firstField(root, ["filesize_bytes", "fileSizeBytes"]);
    return {
        url: url, score: score, ext: ext, quality: quality, filename: filename,
        title: title, size: Number(size) || 0, key: key, path: path
    };
}

function extractCandidates(items, sourceURL, preference) {
    var found = [];
    var byURL = {};
    var unique = [];
    var index;

    function walk(node, path, root) {
        var keys;
        var keyIndex;
        var key;
        var value;
        var candidate;
        var arrayIndex;
        if (!node || typeof node !== "object") return;
        if (Object.prototype.toString.call(node) === "[object Array]") {
            for (arrayIndex = 0; arrayIndex < node.length; arrayIndex += 1) {
                value = node[arrayIndex];
                if (value && typeof value === "object") walk(value, path + "[" + arrayIndex + "]", value);
                else if (typeof value === "string") {
                    candidate = candidateFromURL(value, String(arrayIndex), path, root, root, sourceURL, preference);
                    if (candidate) found.push(candidate);
                }
            }
            return;
        }
        keys = Object.keys(node);
        for (keyIndex = 0; keyIndex < keys.length; keyIndex += 1) {
            key = keys[keyIndex];
            value = node[key];
            if (typeof value === "string") {
                candidate = candidateFromURL(value, key, path, node, root, sourceURL, preference);
                if (candidate) found.push(candidate);
            } else if (value && typeof value === "object") {
                walk(value, path ? path + "." + key : key, root);
            }
        }
    }

    for (index = 0; index < items.length; index += 1) walk(items[index], "items[" + index + "]", items[index]);
    for (index = 0; index < found.length; index += 1) {
        var normalized = normalizedMediaURL(found[index].url);
        if (!byURL[normalized] || found[index].score > byURL[normalized].score) byURL[normalized] = found[index];
    }
    var urls = Object.keys(byURL);
    for (index = 0; index < urls.length; index += 1) unique.push(byURL[urls[index]]);
    unique.sort(function(left, right) { return right.score - left.score; });
    return unique.slice(0, 12);
}

function truncateUTF8(value, maximumBytes) {
    var source = String(value || "");
    var result = "";
    var bytes = 0;
    var index;
    var code;
    var width;
    for (index = 0; index < source.length; index += 1) {
        code = source.charCodeAt(index);
        if (code < 0x80) width = 1;
        else if (code < 0x800) width = 2;
        else if (code >= 0xD800 && code <= 0xDBFF && index + 1 < source.length) width = 4;
        else width = 3;
        if (bytes + width > maximumBytes) break;
        result += source.charAt(index);
        bytes += width;
        if (width === 4) {
            index += 1;
            result += source.charAt(index);
        }
    }
    return result;
}

function sanitizeName(value) {
    var result = String(value || "video")
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 140);
    return truncateUTF8(result, 220) || "video";
}

function fileNameFor(job, candidate) {
    var ext = candidate.ext || (job.platform === "youtube" && job.settings.youtubeQuality === "audio_only" ? "m4a" : "mp4");
    var name = sanitizeName(candidate.filename || candidate.title || job.adapter.name + " video");
    if (name.toLowerCase().slice(-(ext.length + 1)) !== "." + ext.toLowerCase()) name += "." + ext;
    return name;
}

function uniqueDestination(directory, filename) {
    var dot = filename.lastIndexOf(".");
    var base = dot > 0 ? filename.slice(0, dot) : filename;
    var ext = dot > 0 ? filename.slice(dot) : "";
    var index;
    var name;
    var path;
    for (index = 0; index < 100; index += 1) {
        name = index === 0 ? filename : base + "-" + index + ext;
        path = trimTrailingSlash(directory) + "/" + name;
        if (!SwiftBiu.fileExists(path)) return path;
    }
    return trimTrailingSlash(directory) + "/" + base + "-" + Date.now() + ext;
}

function downloadCandidate(job, candidate) {
    var filename = fileNameFor(job, candidate);
    var destination = uniqueDestination(job.directory, filename);
    var label = candidate.quality || (candidate.ext ? candidate.ext.toUpperCase() : "Media");
    job.batchItems[0].sourceFileName = filename;
    job.batchItems[0].outputFileName = destination;
    job.batchItems[0].detailText = destination;
    updateJob(job, job.strings.downloading, job.strings.selected(label), 0.82, "file");

    SwiftBiu.downloadRemoteFile(candidate.url, {
        fileName: filename,
        destinationPath: destination,
        maximumBytes: 4294967296
    }, function(result) {
        var savedPath = String(result && result.path || destination).trim();
        if (!savedPath || !SwiftBiu.fileExists(savedPath)) {
            failJob(job, new Error(job.strings.saveFailed), true);
            return;
        }
        finishJob(job, savedPath);
    }, function(error) {
        // The completed Actor result remains reusable for another attempt.
        failJob(job, error, true);
    });
}

function performAction(context) {
    var strings = localizedStrings(context);
    var url = firstSupportedVideoURLFromContext(context);
    var platform;
    var adapter;
    var settings;
    var directory;
    var key;
    var job;

    if (!url) {
        SwiftBiu.showNotification(strings.noURLTitle, strings.noURLBody);
        return;
    }
    platform = detectPlatform(url);
    adapter = APIFY_VIDEO_ACTORS[platform];
    if (!adapter) {
        SwiftBiu.showNotification(strings.noURLTitle, strings.noURLBody);
        return;
    }
    settings = loadSettings();
    if (!settings.token) {
        SwiftBiu.showNotification(strings.noTokenTitle, strings.noTokenBody);
        return;
    }
    directory = resolveDownloadDirectory(settings, strings);
    if (!directory) return;

    key = platform + "|" + url + "|" + settings.youtubeQuality + "|" + settings.mediaPreference;
    if (APIFY_ACTIVE_JOBS[key]) {
        SwiftBiu.showNotification(strings.alreadyRunningTitle, strings.alreadyRunningBody);
        return;
    }

    job = {
        key: key,
        context: context || {},
        strings: strings,
        url: url,
        platform: platform,
        adapter: adapter,
        settings: settings,
        directory: directory,
        completed: false,
        activityEntries: [],
        batchItems: [{
            sourceFileName: adapter.name,
            outputFileName: directory,
            status: "queued",
            statusText: strings.waiting,
            detailText: strings.plan(adapter.name, displayNameForPath(directory))
        }]
    };
    appendActivity(job, strings.plan(adapter.name, displayNameForPath(directory)), "plan", true);
    job.sessionID = SwiftBiu.beginFileTask(taskOptions(job, strings.preparing, strings.plan(adapter.name, displayNameForPath(directory)), 0.03));
    APIFY_ACTIVE_JOBS[key] = true;
    startOrResumeRun(job);
}
