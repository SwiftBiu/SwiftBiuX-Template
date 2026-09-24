#!/usr/bin/env node

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repositoryRoot = path.join(__dirname, "..");
const pluginDirectory = path.join(repositoryRoot, "ChannelsVideoDownloader");
const pluginScript = fs.readFileSync(path.join(pluginDirectory, "script.js"), "utf8");
const manifest = JSON.parse(fs.readFileSync(path.join(pluginDirectory, "manifest.json"), "utf8"));

console.log("==> 1. Testing manifest.json validity (Apify TextAction)");
assert.strictEqual(manifest.identifier, "com.swiftbiux.channels-video-downloader");
assert.strictEqual(manifest.extensionKind, "textAction");
assert(manifest.permissions.includes("network"), "Must include network permission");
assert(manifest.permissions.includes("localFileWrite"), "Must include localFileWrite permission");
assert(manifest.permissions.includes("notifications"), "Must include notifications permission");
assert(manifest.permissions.includes("clipboardRead"), "Must include clipboardRead permission");
assert(!manifest.permissions.includes("ui"), "Headless textAction should not request ui permission");
assert(!manifest.ui, "Should not declare ui entrypoint in manifest");
assert(manifest.configuration.some(c => c.key === "apify_token"), "Must have apify_token configuration");
assert(manifest.configuration.some(c => c.key === "channels_actor"), "Must have channels_actor configuration");
const declaredHosts = (manifest.network && manifest.network.domains || []).map(d => d.host);
assert(declaredHosts.includes("api.apify.com"), "Must declare api.apify.com");
console.log("✓ Manifest checks passed");

console.log("==> 2. Testing Channels URL Extraction & Normalization");
function setupContext(mockState) {
    const config = Object.assign({
        apify_token: "apify_api_test_key",
        channels_actor: "agentflow/wechat-channels-video-downloader",
        download_directory: "/Users/test/Downloads",
        auto_clipboard: true
    }, mockState.config || {});

    const events = {
        notifications: [],
        tasks: [],
        fetches: [],
        downloads: []
    };

    const existingFiles = new Set();

    const mockSwiftBiu = {
        getConfig(key) {
            return config[key];
        },
        setConfig(key, val) {
            config[key] = val;
        },
        getClipboard() {
            return mockState.clipboard || "";
        },
        hasAuthorizedDirectoryAccess(dir) {
            return true;
        },
        directoryExists(dir) {
            return true;
        },
        fileExists(path) {
            return existingFiles.has(path);
        },
        pickLocalDirectory() {
            return "/Users/test/Downloads";
        },
        showNotification(title, body) {
            events.notifications.push({ title, body });
        },
        beginFileTask(opts) {
            const id = "task-" + Date.now();
            events.tasks.push({ action: "begin", id, opts });
            return id;
        },
        updateFileTask(id, opts) {
            events.tasks.push({ action: "update", id, opts });
        },
        finishFileTask(id, opts) {
            events.tasks.push({ action: "finish", id, opts });
        },
        failFileTask(id, opts) {
            events.tasks.push({ action: "fail", id, opts });
        },
        fetch(url, opts, onSuccess, onError) {
            events.fetches.push({ url, opts });
            if (mockState.fetchHandler) {
                mockState.fetchHandler(url, opts, onSuccess, onError);
            } else {
                onSuccess({ status: 200, data: { status: "SUCCEEDED", defaultDatasetId: "dataset1" } });
            }
        },
        downloadRemoteFile(url, opts, onSuccess, onError) {
            events.downloads.push({ url, opts });
            existingFiles.add(opts.destinationPath);
            if (mockState.downloadHandler) {
                mockState.downloadHandler(url, opts, onSuccess, onError);
            } else {
                onSuccess({ path: opts.destinationPath });
            }
        }
    };

    const sandbox = {
        SwiftBiu: mockSwiftBiu,
        console: console,
        setTimeout: setTimeout,
        clearTimeout: clearTimeout,
        Date: Date,
        Math: Math,
        JSON: JSON,
        Array: Array,
        Object: Object,
        String: String,
        Number: Number,
        Boolean: Boolean,
        RegExp: RegExp,
        encodeURIComponent: encodeURIComponent,
        parseInt: parseInt,
        isFinite: isFinite
    };

    vm.createContext(sandbox);
    vm.runInContext(pluginScript, sandbox);
    return { sandbox, events, config };
}

// Test URL extraction
{
    const { sandbox } = setupContext({});
    const extractChannelsURLs = sandbox.extractChannelsURLs;

    // Test AJ7MNjkqsf
    const urls1 = extractChannelsURLs("https://weixin.qq.com/sph/AJ7MNjkqsf");
    assert.strictEqual(urls1.length, 1);
    assert.strictEqual(urls1[0], "https://weixin.qq.com/sph/AJ7MNjkqsf");

    // Test mixed Chinese text
    const text2 = "【视频号】LEGO-Bill分享了视频 https://weixin.qq.com/sph/AJ7MNjkqsf 快来看！";
    const urls2 = extractChannelsURLs(text2);
    assert.strictEqual(urls2.length, 1);
    assert.strictEqual(urls2[0], "https://weixin.qq.com/sph/AJ7MNjkqsf");

    console.log("✓ URL extraction passed");
}

console.log("==> 3. Testing Dataset Candidate Stream Parsing");
{
    const { sandbox } = setupContext({});
    const findMediaCandidate = sandbox.findMediaCandidate;

    const mockDatasetItems = [
        {
            title: "Vibe coding日常",
            author: "LEGO-Bill",
            download_url: "https://finder.video.qq.com/251/20304/stodownload?encfilekey=test1234",
            quality: "1080P"
        }
    ];

    const result = findMediaCandidate(mockDatasetItems);
    assert(result, "Should extract media candidate");
    assert.strictEqual(result.url, "https://finder.video.qq.com/251/20304/stodownload?encfilekey=test1234");
    assert.strictEqual(result.title, "Vibe coding日常");
    console.log("✓ Dataset candidate parsing passed");
}

console.log("==> 4. Testing End-to-End Apify Flow for https://weixin.qq.com/sph/AJ7MNjkqsf");
{
    let fetchCount = 0;
    const ctx = setupContext({
        fetchHandler(url, opts, onSuccess) {
            fetchCount++;
            if (url.includes("/runs")) {
                // Return actor run response
                onSuccess({
                    status: 201,
                    data: {
                        id: "run_test_123",
                        status: "SUCCEEDED",
                        defaultDatasetId: "dataset_test_456"
                    }
                });
            } else if (url.includes("/items")) {
                // Return dataset response
                onSuccess({
                    status: 200,
                    data: [
                        {
                            title: "Vibe coding日常",
                            video_url: "https://finder.video.qq.com/251/20304/stodownload?token=tok123"
                        }
                    ]
                });
            }
        },
        downloadHandler(url, opts, onSuccess) {
            onSuccess({ path: opts.destinationPath });
        }
    });

    const context = {
        selectedText: "https://weixin.qq.com/sph/AJ7MNjkqsf",
        languageCode: "zh-CN"
    };

    ctx.sandbox.performAction(context);

    assert(fetchCount >= 2, "Should have called actor run and dataset API");
    assert(ctx.events.downloads.length > 0, "Should have downloaded the video from dataset");
    assert.strictEqual(ctx.events.downloads[0].url, "https://finder.video.qq.com/251/20304/stodownload?token=tok123");
    assert(ctx.events.tasks.some(t => t.action === "finish"), "File task should finish");
    console.log("✓ End-to-End Apify flow passed");
}

console.log("==> 5. Testing Clipboard Fallback");
{
    const ctx = setupContext({
        clipboard: "https://weixin.qq.com/sph/AJ7MNjkqsf",
        fetchHandler(url, opts, onSuccess) {
            if (url.includes("/runs")) {
                onSuccess({
                    status: 201,
                    data: { id: "run_clip", status: "SUCCEEDED", defaultDatasetId: "ds_clip" }
                });
            } else {
                onSuccess({
                    status: 200,
                    data: [{ storageUrl: "https://cdn.example.com/video.mp4", title: "ClipVideo" }]
                });
            }
        }
    });

    ctx.sandbox.performAction({ selectedText: "", languageCode: "zh-CN" });
    assert(ctx.events.downloads.length > 0, "Should download via clipboard fallback");
    console.log("✓ Clipboard fallback passed");
}

console.log("\nAll Apify ChannelsVideoDownloader tests passed! 🎉");
