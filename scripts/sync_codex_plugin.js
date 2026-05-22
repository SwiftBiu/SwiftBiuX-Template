#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const pluginSkillDir = path.join(
  root,
  "plugins",
  "swiftbiux-developer",
  "skills",
  "swiftbiux-plugin-development"
);
const pluginReferencesDir = path.join(pluginSkillDir, "references");

const references = [
  "configuration.md",
  "file-workflows.md",
  "network-api-checklist.md",
  "scenarios.md",
  "ui-patterns.md"
];

function copyFile(source, destination) {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

copyFile(path.join(root, "AI_SKILL.md"), path.join(pluginSkillDir, "SKILL.md"));

for (const name of references) {
  copyFile(
    path.join(root, "references", name),
    path.join(pluginReferencesDir, name)
  );
}

const fullSkill = spawnSync(process.execPath, [
  path.join(root, "scripts", "generate_ai_skill_full.js")
], {
  cwd: root,
  stdio: "inherit"
});

if (fullSkill.status !== 0) {
  process.exit(fullSkill.status || 1);
}

console.log("Synced Codex plugin skill files.");
