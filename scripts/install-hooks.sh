#!/bin/sh
#
# This script installs the git hooks from the scripts/ directory
# into the local .git/hooks/ directory.

# The directory where git hooks are stored
HOOKS_DIR=$(git rev-parse --git-dir)/hooks
# The directory where our custom hook scripts are stored
SCRIPTS_DIR=scripts

# The name of the hook we want to install
HOOK_NAME=commit-msg

# Check if the source hook file exists
if [ ! -f "$SCRIPTS_DIR/$HOOK_NAME" ]; then
  echo "❌ Error: Source hook file '$SCRIPTS_DIR/$HOOK_NAME' not found."
  exit 1
fi

# Create the hooks directory if it doesn't exist
mkdir -p "$HOOKS_DIR"

echo "Installing '$HOOK_NAME' hook to '$HOOKS_DIR'..."

# Copy the hook file to the .git/hooks directory
cp "$SCRIPTS_DIR/$HOOK_NAME" "$HOOKS_DIR/$HOOK_NAME"

# Make the hook executable
chmod +x "$HOOKS_DIR/$HOOK_NAME"

echo "✅ Hook '$HOOK_NAME' installed successfully."
echo "Your commit messages will now be validated automatically."

exit 0