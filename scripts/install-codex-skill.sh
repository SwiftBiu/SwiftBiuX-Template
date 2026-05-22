#!/usr/bin/env bash
set -euo pipefail

SKILL_NAME="swiftbiux-plugin-development"
REPO_ZIP_URL="${SWIFTBIUX_TEMPLATE_ZIP_URL:-https://codeload.github.com/SwiftBiu/SwiftBiuX-Template/zip/refs/heads/main}"
DEST_DIR="${HOME}/.codex/skills/${SKILL_NAME}"
TMP_DIR="$(mktemp -d)"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required but was not found."
  exit 1
fi

if ! command -v unzip >/dev/null 2>&1; then
  echo "unzip is required but was not found."
  exit 1
fi

echo "Downloading SwiftBiuX Codex skill..."
curl -fsSL "$REPO_ZIP_URL" -o "$TMP_DIR/template.zip"
unzip -q "$TMP_DIR/template.zip" -d "$TMP_DIR"

SKILL_FILE="$(find "$TMP_DIR" -path "*/plugins/swiftbiux-developer/skills/${SKILL_NAME}/SKILL.md" -print -quit)"
if [ -z "$SKILL_FILE" ]; then
  echo "Could not find ${SKILL_NAME} in the downloaded template."
  exit 1
fi

mkdir -p "${HOME}/.codex/skills"
rm -rf "$DEST_DIR"
cp -R "$(dirname "$SKILL_FILE")" "$DEST_DIR"

echo "Installed ${SKILL_NAME} to ${DEST_DIR}"
echo "Restart Codex or open a new session, then search for: swiftbiux"
