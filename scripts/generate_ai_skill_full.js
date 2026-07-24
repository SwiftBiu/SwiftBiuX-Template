#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outputPath = path.join(root, "AI_SKILL_FULL.md");

const inputs = [
  { title: "Main Skill", file: "AI_SKILL.md" },
  { title: "Scenario Selection Reference", file: "references/scenarios.md" },
  { title: "File Workflow Reference", file: "references/file-workflows.md" },
  { title: "Network and Third-Party API Checklist", file: "references/network-api-checklist.md" },
  { title: "SwiftBiu-Managed AI Provider Contract", file: "references/native-ai.md" },
  { title: "UI Pattern Reference", file: "references/ui-patterns.md" },
  { title: "Configuration, Packaging, and Catalog Reference", file: "references/configuration.md" }
];

function stripFrontmatter(content) {
  if (!content.startsWith("---\n")) return content.trim();
  const end = content.indexOf("\n---\n", 4);
  if (end === -1) return content.trim();
  return content.slice(end + 5).trim();
}

function readMarkdown(relativePath) {
  const fullPath = path.join(root, relativePath);
  return stripFrontmatter(fs.readFileSync(fullPath, "utf8"));
}

const parts = [
  "---",
  "name: swiftbiux-plugin-development-full",
  "description: Single-file AI context for creating, modifying, or reviewing SwiftBiuX extensions (plugins) for SwiftBiu. This file combines AI_SKILL.md and all reference files so a user can give one document to an AI assistant.",
  "---",
  "",
  "# SwiftBiuX Extension Development Skill (Full Single-File Context)",
  "",
  "Generated from `AI_SKILL.md` and `references/*.md`.",
  "",
  "Use this file when an AI assistant can only receive one document or one GitHub raw link. It is self-contained: do not ask the user for additional SwiftBiuX skill reference files unless the user's plugin also needs third-party API documentation.",
  "",
  "If a source section says to read a file under `references/`, use the matching `## Source:` section included later in this document.",
  "",
  ...inputs.flatMap(({ title, file }) => [
    "---",
    "",
    `## Source: ${title} (${file})`,
    "",
    readMarkdown(file)
  ]),
  ""
];

fs.writeFileSync(outputPath, parts.join("\n"), "utf8");
console.log(`Generated ${path.relative(root, outputPath)}`);
