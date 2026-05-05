#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const CATALOG_DIR = path.join(ROOT_DIR, 'catalog');
const GENERATE_CATALOG_SCRIPT = path.join(ROOT_DIR, 'scripts', 'generate_catalog.js');
const STABLE_BASE_URL = 'https://github.com/SwiftBiu/SwiftBiuX-Template/releases/latest/download/';
const BETA_BASE_URL = 'https://github.com/SwiftBiu/SwiftBiuX-Template/releases/download/beta-latest/';
const ALLOWED_KINDS = new Set(['textAction', 'fileAction']);

function fail(message) {
  throw new Error(message);
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Failed to parse JSON: ${filePath}\n${error.message}`);
  }
}

function listManifestPaths() {
  return fs
    .readdirSync(ROOT_DIR)
    .map((entry) => path.join(ROOT_DIR, entry, 'manifest.json'))
    .filter((manifestPath) => fs.existsSync(manifestPath));
}

function validateManifestKinds() {
  const manifestPaths = listManifestPaths();
  const counts = { textAction: 0, fileAction: 0 };

  for (const manifestPath of manifestPaths) {
    const manifest = readJson(manifestPath);
    const pluginName = path.basename(path.dirname(manifestPath));
    const rootKind = manifest.extensionKind;

    if (!ALLOWED_KINDS.has(rootKind)) {
      fail(`${pluginName}: invalid manifest.extensionKind '${rootKind}'`);
    }

    counts[rootKind] += 1;

    const actions = Array.isArray(manifest.actions) ? manifest.actions : [];
    if (actions.length === 0) {
      fail(`${pluginName}: actions must contain at least one entry`);
    }

    actions.forEach((action, index) => {
      const actionKind = action && action.extensionKind;
      if (!ALLOWED_KINDS.has(actionKind)) {
        fail(`${pluginName}: actions[${index}].extensionKind is invalid '${actionKind}'`);
      }
      if (actionKind !== rootKind) {
        fail(`${pluginName}: actions[${index}].extensionKind '${actionKind}' must match root '${rootKind}'`);
      }
    });
  }

  console.log(
    `[manifest] validated ${manifestPaths.length} manifests (textAction=${counts.textAction}, fileAction=${counts.fileAction})`
  );
}

function runGenerateCatalog(channel, baseUrl) {
  const env = { ...process.env };
  if (channel) env.CATALOG_CHANNEL = channel;
  if (baseUrl) env.CATALOG_BASE_URL = baseUrl;

  execFileSync('node', [GENERATE_CATALOG_SCRIPT], {
    cwd: ROOT_DIR,
    env,
    stdio: 'pipe'
  });
}

function validateCatalog(fileName, expectedBaseUrl) {
  const filePath = path.join(CATALOG_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    fail(`Catalog file was not generated: ${fileName}`);
  }

  const catalog = readJson(filePath);
  if (!catalog || !Array.isArray(catalog.plugins)) {
    fail(`${fileName}: plugins must be an array`);
  }
  if (!Array.isArray(catalog.categories)) {
    fail(`${fileName}: categories must be an array`);
  }

  const ids = new Set();
  for (const plugin of catalog.plugins) {
    const pluginId = String(plugin.id || '').trim();
    if (!pluginId) {
      fail(`${fileName}: plugin.id is required`);
    }

    if (ids.has(pluginId)) {
      fail(`${fileName}: duplicate plugin.id '${pluginId}'`);
    }
    ids.add(pluginId);

    if (!ALLOWED_KINDS.has(plugin.extensionKind)) {
      fail(`${fileName}: plugin '${pluginId}' has invalid extensionKind '${plugin.extensionKind}'`);
    }

    const downloadUrl = String(plugin.downloadUrl || '');
    if (!downloadUrl.startsWith(expectedBaseUrl)) {
      fail(
        `${fileName}: plugin '${pluginId}' downloadUrl must start with '${expectedBaseUrl}', got '${downloadUrl}'`
      );
    }
  }

  console.log(`[catalog] validated ${fileName} (${catalog.plugins.length} plugins)`);
  return ids;
}

function assertSameIds(leftIds, rightIds, label) {
  if (leftIds.size !== rightIds.size) {
    fail(`${label}: plugin count mismatch (${leftIds.size} vs ${rightIds.size})`);
  }
  for (const id of leftIds) {
    if (!rightIds.has(id)) {
      fail(`${label}: missing plugin '${id}'`);
    }
  }
}

function main() {
  validateManifestKinds();

  runGenerateCatalog('stable');
  const stableIdsFromAppCatalog = validateCatalog('plugins.json', STABLE_BASE_URL);
  const stableIdsFromWebCatalog = validateCatalog('webPlugins.json', STABLE_BASE_URL);
  assertSameIds(stableIdsFromAppCatalog, stableIdsFromWebCatalog, 'stable catalog ids');

  runGenerateCatalog('beta', BETA_BASE_URL);
  const betaIdsFromAppCatalog = validateCatalog('plugins.beta.json', BETA_BASE_URL);
  const betaIdsFromWebCatalog = validateCatalog('webPlugins.beta.json', BETA_BASE_URL);
  assertSameIds(betaIdsFromAppCatalog, betaIdsFromWebCatalog, 'beta catalog ids');
  assertSameIds(stableIdsFromAppCatalog, betaIdsFromAppCatalog, 'stable/beta catalog ids');

  console.log('[ok] extensionKind routing and catalog channels verified');
}

main();
