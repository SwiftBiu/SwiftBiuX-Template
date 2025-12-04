#!/bin/bash

# cd SwiftBiuX-Template
# sh build_plugin.sh GeminiImage

# This script packages a plugin directory into a .swiftbiux file.
# It ensures that the contents are at the root of the zip archive.

# Check for required argument
if [ -z "$1" ]; then
  echo "Usage: $0 <plugin_directory>"
  echo "Example: $0 AdvancedTranslator"
  exit 1
fi

PLUGIN_DIR=$1
PLUGIN_NAME=$(basename "$PLUGIN_DIR")
OUTPUT_FILE="${PLUGIN_NAME}.swiftbiux"

# Check if the directory exists
if [ ! -d "$PLUGIN_DIR" ]; then
  echo "Error: Directory '$PLUGIN_DIR' not found."
  exit 1
fi

echo "Packaging '$PLUGIN_NAME' into '$OUTPUT_FILE'..."

# Go into the plugin directory, zip its contents, and place the output
# in the parent directory. This is the crucial step to avoid the parent
# folder being included in the zip file.
(cd "$PLUGIN_DIR" && zip -r -X "../$OUTPUT_FILE" .)

if [ $? -eq 0 ]; then
  echo "✅ Plugin packaged successfully: $OUTPUT_FILE"
else
  echo "❌ Plugin packaging failed."
fi