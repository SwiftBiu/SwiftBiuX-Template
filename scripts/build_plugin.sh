#!/bin/bash

set -euo pipefail

# cd SwiftBiuX-Template
# ./scripts/build_plugin.sh AdvancedTranslator
# ./scripts/build_plugin.sh --all --output-dir dist
# ./scripts/build_plugin.sh --all --kind file --output-dir dist

usage() {
  echo "Usage: $0 [--all] [--kind all|text|file|textAction|fileAction] [--output-dir <dir>] [plugin_directory]"
  echo "Examples:"
  echo "  $0 AdvancedTranslator"
  echo "  $0 --all --output-dir dist"
  echo "  $0 --all --kind file --output-dir dist"
}

BUILD_ALL=false
KIND_FILTER="all"
OUTPUT_DIR="."
PLUGIN_DIR=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)
      BUILD_ALL=true
      shift
      ;;
    --kind)
      if [[ $# -lt 2 ]]; then
        echo "Error: --kind requires a value."
        usage
        exit 1
      fi
      KIND_FILTER="$2"
      shift 2
      ;;
    --output-dir)
      if [[ $# -lt 2 ]]; then
        echo "Error: --output-dir requires a directory."
        usage
        exit 1
      fi
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -n "$PLUGIN_DIR" ]]; then
        echo "Error: multiple plugin directories were provided."
        usage
        exit 1
      fi
      PLUGIN_DIR="$1"
      shift
      ;;
  esac
done

normalize_kind_filter() {
  case "$1" in
    all|"")
      echo "all"
      ;;
    text|textAction|text-action|text_actions)
      echo "textAction"
      ;;
    file|fileAction|file-action|file_actions)
      echo "fileAction"
      ;;
    *)
      echo "Error: unsupported kind '$1'. Expected all, text, or file." >&2
      exit 1
      ;;
  esac
}

resolve_manifest_kind() {
  local manifest_path="$1"
  node - "$manifest_path" <<'NODE'
const fs = require('fs');
const manifestPath = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function canonicalKind(value) {
  switch (normalize(value)) {
    case 'file':
    case 'fileaction':
    case 'fileactions':
    case 'fileextension':
    case 'fileextensions':
    case 'filedocument':
    case 'filedocuments':
      return 'fileAction';
    case 'text':
    case 'textaction':
    case 'textactions':
    case 'textdocument':
    case 'textdocuments':
    case 'document':
    case 'documents':
      return 'textAction';
    default:
      return null;
  }
}

const explicitKind = canonicalKind(manifest.extensionKind);
if (manifest.extensionKind && !explicitKind) {
  console.error(`Unsupported extensionKind '${manifest.extensionKind}' in ${manifestPath}`);
  process.exit(2);
}

const actionKinds = (manifest.actions || [])
  .map(action => action && action.extensionKind)
  .filter(Boolean)
  .map(canonicalKind);

if (actionKinds.some(kind => !kind)) {
  console.error(`Unsupported action extensionKind in ${manifestPath}`);
  process.exit(2);
}

if (explicitKind) {
  console.log(explicitKind);
  process.exit(0);
}

if (actionKinds.includes('fileAction')) {
  console.log('fileAction');
  process.exit(0);
}

const permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
const configuration = Array.isArray(manifest.configuration) ? manifest.configuration : [];
const hasFilePermission = permissions.includes('localFileRead') || permissions.includes('localFileWrite');
const hasFileRules = configuration.some(item => item && item.type === 'fileExtensionAppRules');
console.log(hasFilePermission || hasFileRules ? 'fileAction' : 'textAction');
NODE
}

package_plugin() {
  local plugin_dir="$1"

  if [[ ! -d "$plugin_dir" ]]; then
    echo "Error: Directory '$plugin_dir' not found."
    return 1
  fi

  if [[ ! -f "$plugin_dir/manifest.json" ]]; then
    echo "Skipping '$plugin_dir': manifest.json not found."
    return 0
  fi

  local plugin_kind
  plugin_kind="$(resolve_manifest_kind "$plugin_dir/manifest.json")"

  if [[ "$KIND_FILTER" != "all" && "$plugin_kind" != "$KIND_FILTER" ]]; then
    echo "Skipping '$plugin_dir' (${plugin_kind}) because --kind is '${KIND_FILTER}'."
    return 0
  fi

  local plugin_name
  plugin_name="$(basename "$plugin_dir")"
  local output_file="${OUTPUT_DIR}/${plugin_name}.swiftbiux"

  echo "Packaging '$plugin_name' (${plugin_kind}) into '$output_file'..."
  rm -f "$output_file"
  (cd "$plugin_dir" && zip -r -X "$output_file" .)
  echo "Plugin packaged successfully: $output_file"
}

KIND_FILTER="$(normalize_kind_filter "$KIND_FILTER")"
mkdir -p "$OUTPUT_DIR"
OUTPUT_DIR="$(cd "$OUTPUT_DIR" && pwd)"

if [[ "$BUILD_ALL" == false && -z "$PLUGIN_DIR" ]]; then
  usage
  exit 1
fi

if [[ "$BUILD_ALL" == true ]]; then
  for dir in */; do
    package_plugin "${dir%/}"
  done
else
  package_plugin "$PLUGIN_DIR"
fi
