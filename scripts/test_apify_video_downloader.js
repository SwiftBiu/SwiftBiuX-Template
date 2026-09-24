#!/usr/bin/env node

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repositoryRoot = path.join(__dirname, "..");
const pluginDirectory = path.join(repositoryRoot, "ApifyVideoDownloader");
const pluginScript = fs.readFileSync(
  path.join(pluginDirectory, "script.js"),
  "utf8"
);
const manifest = JSON.parse(
  fs.readFileSync(path.join(pluginDirectory, "manifest.json"), "utf8")
);

function isPathCoveredByScope(target, scope) {
  return target === scope || target.indexOf(scope.replace(/\/+$/, "") + "/") === 0;
}

function runSuccessfulDownload(options) {
  const configuredDirectory = options.configuredDirectory;
  const authorizationScopes = new Set(options.initialAuthorizationScopes || []);
  const existingFiles = new Set();
  const events = {
    authorizationRequests: [],
    configurationWrites: [],
    downloads: [],
    pickerCalls: 0,
    displayUICalls: 0,
    final: null
  };

  function hasAuthorizedDirectoryAccess(target) {
    return Array.from(authorizationScopes).some((scope) =>
      isPathCoveredByScope(target, scope)
    );
  }

  const config = {
    apify_token: "apify_api_test",
    youtube_quality: "720p",
    media_preference: "automatic",
    max_charge_usd: "0.25",
    download_directory: configuredDirectory
  };

  const SwiftBiu = {
    getConfig(key) {
      return config[key] || "";
    },
    setConfig(key, value) {
      events.configurationWrites.push({ key, value });
      config[key] = value;
    },
    directoryExists(target) {
      return options.existingDirectories.includes(target);
    },
    hasAuthorizedDirectoryAccess,
    requestDirectoryAuthorization(target) {
      events.authorizationRequests.push(target);
      const scope = options.authorizationScope || "";
      if (scope) authorizationScopes.add(scope);
      return scope;
    },
    pickLocalDirectory() {
      events.pickerCalls += 1;
      return options.pickedDirectory || "";
    },
    fileExists(target) {
      return existingFiles.has(target);
    },
    beginFileTask() {
      return "apify-download-test-session";
    },
    updateFileTask() {},
    finishFileTask(sessionID, payload) {
      events.final = { kind: "finished", sessionID, payload };
    },
    failFileTask(sessionID, payload) {
      events.final = { kind: "failed", sessionID, payload };
    },
    showNotification() {},
    displayUI() {
      events.displayUICalls += 1;
      throw new Error("ApifyVideoDownloader must remain page-free.");
    },
    fetch(url, requestOptions, onSuccess) {
      if (url.indexOf("/v2/actors/") !== -1) {
        onSuccess({
          status: 201,
          data: JSON.stringify({
            data: {
              id: "test-run",
              status: "SUCCEEDED",
              defaultDatasetId: "test-dataset"
            }
          })
        });
        return;
      }
      if (url.indexOf("/v2/datasets/test-dataset/items") !== -1) {
        onSuccess({
          status: 200,
          data: JSON.stringify([
            {
              title: "Configured Folder Video",
              download_url: "https://cdn.example.com/configured-folder-video.mp4"
            }
          ])
        });
        return;
      }
      throw new Error("Unexpected request: " + url);
    },
    downloadRemoteFile(url, downloadOptions, onSuccess) {
      events.downloads.push({ url, options: downloadOptions });
      existingFiles.add(downloadOptions.destinationPath);
      onSuccess({ path: downloadOptions.destinationPath });
    }
  };

  const sandbox = { SwiftBiu, console, Date, Error, JSON, Math };
  vm.runInNewContext(pluginScript, sandbox, {
    filename: "ApifyVideoDownloader/script.js"
  });
  sandbox.performAction({
    languageCode: "en",
    selectedText: "https://www.youtube.com/watch?v=swiftbiu-test"
  });
  return events;
}

function testParentAuthorizationScopeDoesNotReplaceConfiguredDirectory() {
  const configuredDirectory = "/Users/tester/Downloads/SwiftBiu";
  const parentAuthorizationScope = "/Users/tester";
  const events = runSuccessfulDownload({
    configuredDirectory,
    authorizationScope: parentAuthorizationScope,
    existingDirectories: [configuredDirectory, parentAuthorizationScope]
  });

  assert.deepStrictEqual(events.authorizationRequests, [configuredDirectory]);
  assert.strictEqual(events.pickerCalls, 0);
  assert.strictEqual(events.configurationWrites.length, 0);
  assert.strictEqual(events.downloads.length, 1);
  assert.ok(
    events.downloads[0].options.destinationPath.indexOf(configuredDirectory + "/") === 0,
    "destinationPath must remain inside the configured directory"
  );
  assert.notStrictEqual(
    events.downloads[0].options.destinationPath.indexOf(parentAuthorizationScope + "/") === 0
      && events.downloads[0].options.destinationPath.indexOf(configuredDirectory + "/") !== 0,
    true,
    "the returned parent authorization scope must never become the save destination"
  );
  assert.strictEqual(events.final.kind, "finished");
}

function testAlreadyAuthorizedConfigurationIsUsedDirectly() {
  const configuredDirectory = "/Users/tester/Downloads";
  const events = runSuccessfulDownload({
    configuredDirectory,
    initialAuthorizationScopes: [configuredDirectory],
    existingDirectories: [configuredDirectory]
  });

  assert.strictEqual(events.authorizationRequests.length, 0);
  assert.strictEqual(events.pickerCalls, 0);
  assert.strictEqual(events.downloads.length, 1);
  assert.ok(
    events.downloads[0].options.destinationPath.indexOf(configuredDirectory + "/") === 0
  );
}

function testPickerIsUsedOnlyWhenConfiguredDirectoryCannotBeReauthorized() {
  const configuredDirectory = "/Users/tester/Unavailable";
  const pickedDirectory = "/Volumes/Media/Downloads";
  const events = runSuccessfulDownload({
    configuredDirectory,
    authorizationScope: "/Unrelated/Scope",
    pickedDirectory,
    existingDirectories: [configuredDirectory, pickedDirectory]
  });

  assert.deepStrictEqual(events.authorizationRequests, [configuredDirectory]);
  assert.strictEqual(events.pickerCalls, 1);
  assert.deepStrictEqual(events.configurationWrites, [
    { key: "download_directory", value: pickedDirectory }
  ]);
  assert.strictEqual(events.downloads.length, 1);
  assert.ok(
    events.downloads[0].options.destinationPath.indexOf(pickedDirectory + "/") === 0
  );
}

function testPluginRemainsPageFree() {
  const configuredDirectory = "/Users/tester/Downloads";
  const events = runSuccessfulDownload({
    configuredDirectory,
    initialAuthorizationScopes: [configuredDirectory],
    existingDirectories: [configuredDirectory]
  });

  assert.strictEqual(events.displayUICalls, 0);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(manifest, "ui"), false);
  assert.strictEqual(fs.existsSync(path.join(pluginDirectory, "ui", "index.html")), false);
}

testParentAuthorizationScopeDoesNotReplaceConfiguredDirectory();
testAlreadyAuthorizedConfigurationIsUsedDirectly();
testPickerIsUsedOnlyWhenConfiguredDirectoryCannotBeReauthorized();
testPluginRemainsPageFree();

console.log("ApifyVideoDownloader directory and page-free behavior verified.");
