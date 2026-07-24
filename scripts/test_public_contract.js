#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const templateRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(templateRoot, "..");

function fail(message) {
  throw new Error(message);
}

function read(relativePath, base = templateRoot) {
  return fs.readFileSync(path.join(base, relativePath), "utf8");
}

function readJSON(relativePath, base = templateRoot) {
  return JSON.parse(read(relativePath, base));
}

function assertIncludes(document, values, label) {
  const missing = values.filter((value) => !document.includes(value));
  if (missing.length > 0) {
    fail(`${label} is missing: ${missing.join(", ")}`);
  }
}

function assertFilesEqual(sourcePath, generatedPath) {
  const source = read(sourcePath);
  const generated = read(generatedPath);
  if (source !== generated) {
    fail(`${generatedPath} is stale; run node scripts/sync_codex_plugin.js`);
  }
}

function pluginAPIExportNames() {
  const source = read("SwiftBiu/Plugin/API/PluginAPIExports.swift", workspaceRoot);
  const protocol = source
    .split("@objc protocol PluginAPIExports: JSExport {")[1]
    .split("@objc protocol PluginConsoleExports: JSExport")[0];

  return [...protocol.matchAll(/^    (?:var|func) ([A-Za-z0-9_]+)/gm)].map(
    (match) => match[1]
  );
}

function validateBackgroundAPIContract() {
  const apiNames = pluginAPIExportNames();
  const coverage = read(
    "SwiftBiuTests/PluginAPISurfaceCoverageTests.swift",
    workspaceRoot
  );
  const skill = read("AI_SKILL.md");
  const english = read("developer-modules/background-api.md");
  const chinese = read("developer-modules/background-api.zh.md");

  assertIncludes(coverage, apiNames.map((name) => `"${name}"`), "API coverage matrix");
  assertIncludes(skill, apiNames, "AI_SKILL.md background API contract");
  assertIncludes(english, apiNames, "English background API reference");
  assertIncludes(chinese, apiNames, "Chinese background API reference");

  console.log(`[contract] validated ${apiNames.length} background API exports`);
}

function validateWebBridgeContract() {
  const bridge = read("SwiftBiu/Plugin/WebViewBridge.js", workspaceRoot);
  const host = read("SwiftBiu/Plugin/PluginHost.swift", workspaceRoot);
  const hostRouter = host
    .split("func handleAPICall(body:")[1]
    .split("// Helper for handling fetch calls asynchronously.")[0];
  const commands = [
    ...new Set(
      [...bridge.matchAll(/postMessageToSwift\('([^']+)'/g)].map(
        (match) => match[1]
      )
    )
  ];
  const english = read("developer-modules/web-ui-api.md");
  const chinese = read("developer-modules/web-ui-api.zh.md");
  const skillBundle = `${read("AI_SKILL.md")}\n${read("references/native-ai.md")}`;

  for (const command of commands) {
    const escaped = command.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const casePattern = new RegExp(`case[^\\n]*"${escaped}"`);
    if (!casePattern.test(hostRouter)) {
      fail(`WebViewBridge command '${command}' has no PluginHost route`);
    }
  }

  const publicPaths = [
    "storage.get",
    "storage.set",
    "fetch",
    "ai.providers",
    "ai.imageModels",
    "ai.imageGenerate",
    "ai.videoGenerate",
    "ai.textToSpeech",
    "ai.tts",
    "ai.speechToText",
    "ai.stt",
    "ai.transcribe",
    "ai.chat",
    "downloadRemoteFile",
    "materializeSelectedRemoteFiles",
    "copyText",
    "copyImage",
    "getFileMetadata",
    "extractFileIcon",
    "setFileIcon",
    "readLocalFile",
    "readLocalTextFile",
    "listDirectory",
    "fileExists",
    "directoryExists",
    "speakText",
    "showNotification",
    "closeWindow",
    "openURL",
    "openFileWithApp",
    "share",
    "pasteText",
    "pickLocalFile",
    "pickLocalDirectory",
    "createLocalDirectory",
    "createLocalFile",
    "writeLocalTextFile",
    "overwriteLocalFile",
    "renameLocalFile",
    "copyLocalFile",
    "moveLocalFile",
    "trashLocalItem",
    "saveLocalFile",
    "exportFile",
    "ui.resizeWindow",
    "runShellScript"
  ].map((name) => `window.swiftBiu.${name}`);

  assertIncludes(skillBundle, publicPaths, "AI Skill Web UI contract");
  assertIncludes(english, publicPaths, "English Web UI reference");
  assertIncludes(chinese, publicPaths, "Chinese Web UI reference");

  console.log(`[contract] validated ${commands.length} WebView bridge commands`);
}

function validateManifestContract() {
  const fields = [
    "identifier",
    "name",
    "author",
    "description",
    "version",
    "actions",
    "permissions",
    "configuration",
    "requiredShortcuts",
    "icon",
    "iconType",
    "iconLottieStillFrame",
    "iconScale",
    "ui",
    "extensionKind",
    "shareTargets",
    "network",
    "ai"
  ];
  const permissions = [
    "network",
    "clipboardRead",
    "clipboardWrite",
    "localFileRead",
    "localFileWrite",
    "notifications",
    "paste",
    "share",
    "ui",
    "runAppleScript",
    "runShellScript"
  ];
  const configurationTypes = [
    "string",
    "secure",
    "boolean",
    "option",
    "directory",
    "fileExtensionAppRules"
  ];
  const documents = [
    ["AI_SKILL.md", read("AI_SKILL.md")],
    ["developer-modules/manifest.md", read("developer-modules/manifest.md")],
    ["developer-modules/manifest.zh.md", read("developer-modules/manifest.zh.md")]
  ];

  for (const [label, document] of documents) {
    assertIncludes(document, fields, `${label} manifest fields`);
  }
  for (const [label, document] of [
    ["AI_SKILL.md", read("AI_SKILL.md")],
    ["developer-modules/permissions.md", read("developer-modules/permissions.md")],
    [
      "developer-modules/permissions.zh.md",
      read("developer-modules/permissions.zh.md")
    ]
  ]) {
    assertIncludes(document, permissions, `${label} permission contract`);
  }
  for (const [label, document] of [
    ["AI_SKILL.md", read("AI_SKILL.md")],
    [
      "developer-modules/configuration.md",
      read("developer-modules/configuration.md")
    ],
    [
      "developer-modules/configuration.zh.md",
      read("developer-modules/configuration.zh.md")
    ]
  ]) {
    assertIncludes(document, configurationTypes, `${label} configuration types`);
  }

  console.log("[contract] validated manifest, permission, and configuration docs");
}

function collectAIConfigurations(manifest) {
  const configurations = [];
  if (manifest.ai) configurations.push(["ai", manifest.ai]);
  (manifest.actions || []).forEach((action, index) => {
    if (action.ai) configurations.push([`actions[${index}].ai`, action.ai]);
  });
  return configurations;
}

function validateNativeAIManifests() {
  const supportedUseCases = new Set([
    "chat",
    "textGeneration",
    "imageGeneration",
    "vision",
    "videoGeneration",
    "tts",
    "stt"
  ]);
  const providerSpecific = new Map([
    ["CodexTextStudio", ["codex", "custom-endpoint"]],
    ["CodexImageStudio", ["codex", "custom-endpoint"]],
    ["XAIChat", ["xai-oauth", "xai"]],
    ["XAIImage", ["xai-oauth", "xai"]],
    ["XAIVideo", ["xai-oauth", "xai"]],
    ["XAIVoice", ["xai-oauth", "xai"]]
  ]);

  const manifestPaths = fs
    .readdirSync(templateRoot)
    .map((entry) => path.join(templateRoot, entry, "manifest.json"))
    .filter((manifestPath) => fs.existsSync(manifestPath));
  let aiConfigurationCount = 0;

  for (const manifestPath of manifestPaths) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const pluginName = path.basename(path.dirname(manifestPath));
    const configurationKeys = new Set(
      (manifest.configuration || []).map((item) => item.key)
    );
    const aiConfigurations = collectAIConfigurations(manifest);
    if (aiConfigurations.length === 0) continue;

    if (!(manifest.permissions || []).includes("network")) {
      fail(`${pluginName}: native AI configuration requires network permission`);
    }

    for (const [location, ai] of aiConfigurations) {
      aiConfigurationCount += 1;
      const useCase = ai.role || ai.useCase || "textGeneration";
      if (!supportedUseCases.has(useCase)) {
        fail(`${pluginName}.${location}: unsupported AI use case '${useCase}'`);
      }
      for (const keyName of ["providerKey", "modelKey"]) {
        if (ai[keyName] && !configurationKeys.has(ai[keyName])) {
          fail(
            `${pluginName}.${location}.${keyName} references missing configuration key '${ai[keyName]}'`
          );
        }
      }
      if (useCase === "stt" && !(manifest.permissions || []).includes("localFileRead")) {
        fail(`${pluginName}.${location}: stt requires localFileRead permission`);
      }

      const expectedProviders = providerSpecific.get(pluginName);
      if (expectedProviders) {
        const actual = [...(ai.allowedProviders || [])].sort();
        const expected = [...expectedProviders].sort();
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          fail(
            `${pluginName}.${location}.allowedProviders must be ${JSON.stringify(
              expectedProviders
            )}`
          );
        }
      }
    }
  }

  console.log(
    `[contract] validated ${aiConfigurationCount} native AI manifest declarations`
  );
}

function validateGeneratedSkillCopies() {
  assertFilesEqual(
    "AI_SKILL.md",
    "plugins/swiftbiux-developer/skills/swiftbiux-plugin-development/SKILL.md"
  );
  for (const name of [
    "configuration.md",
    "file-workflows.md",
    "native-ai.md",
    "network-api-checklist.md",
    "scenarios.md",
    "ui-patterns.md"
  ]) {
    assertFilesEqual(
      `references/${name}`,
      `plugins/swiftbiux-developer/skills/swiftbiux-plugin-development/references/${name}`
    );
  }

  const fullSkill = read("AI_SKILL_FULL.md");
  assertIncludes(
    fullSkill,
    [
      "## Source: SwiftBiu-Managed AI Provider Contract (references/native-ai.md)",
      "allowedProviders",
      "SwiftBiu.aiVideoGenerate",
      "window.swiftBiu.ai.transcribe"
    ],
    "AI_SKILL_FULL.md"
  );

  console.log("[contract] validated generated AI Skill copies");
}

function main() {
  const templateOnly = process.argv.includes("--template-only");
  if (!templateOnly) {
    validateBackgroundAPIContract();
    validateWebBridgeContract();
  }
  validateManifestContract();
  validateNativeAIManifests();
  validateGeneratedSkillCopies();
  console.log(
    templateOnly
      ? "Template documentation contract is synchronized."
      : "Public extension contract is synchronized."
  );
}

main();
