#!/usr/bin/env node

"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const pluginScript = fs.readFileSync(
  path.join(__dirname, "..", "MoveFiles-Plugin", "script.js"),
  "utf8"
);

function runScenario(options) {
  const events = {
    authorizationRequests: [],
    notifications: [],
    updates: [],
    moves: [],
    final: null
  };
  const directories = new Set(options.directories || []);
  const files = new Set(options.existingFiles || []);
  const authorized = new Set(options.authorizedDirectories || []);

  const SwiftBiu = {
    getConfig() {
      return options.configuredDirectory || "";
    },
    hasAuthorizedDirectoryAccess(target) {
      return authorized.has(target);
    },
    requestDirectoryAuthorization(target) {
      events.authorizationRequests.push(target);
      if (options.authorizeOnRequest) authorized.add(target);
      return options.authorizeOnRequest ? target : null;
    },
    pickLocalDirectory() {
      return options.pickedDirectory || null;
    },
    directoryExists(target) {
      return directories.has(target);
    },
    fileExists(target) {
      return files.has(target);
    },
    moveLocalFile(source, destination) {
      events.moves.push({ source, destination });
      if (options.failedMoveSources && options.failedMoveSources.includes(source)) {
        return null;
      }
      return destination;
    },
    showNotification(title, body) {
      events.notifications.push({ title, body });
    },
    beginFileTask(payload) {
      events.started = payload;
      return "move-files-test-session";
    },
    updateFileTask(sessionID, payload) {
      events.updates.push({ sessionID, payload });
    },
    finishFileTask(sessionID, payload) {
      events.final = { kind: "finished", sessionID, payload };
    },
    failFileTask(sessionID, payload) {
      events.final = { kind: "failed", sessionID, payload };
    }
  };

  const sandbox = { SwiftBiu, console };
  vm.runInNewContext(pluginScript, sandbox, {
    filename: "MoveFiles-Plugin/script.js"
  });
  sandbox.performAction({
    locale: options.locale || "en",
    interactionID: "test-interaction",
    selectedFiles: options.selectedFiles || []
  });
  return events;
}

function testSuccessConflictsAndUndo() {
  const events = runScenario({
    configuredDirectory: "/dest",
    authorizedDirectories: ["/dest"],
    directories: ["/dest"],
    existingFiles: ["/dest/b.txt"],
    selectedFiles: [
      { path: "/source/a.txt", fileName: "a.txt" },
      { path: "/source/b.txt", fileName: "b.txt" },
      { path: "/dest/c.txt", fileName: "c.txt" }
    ]
  });

  assert.strictEqual(events.final.kind, "finished");
  assert.strictEqual(events.final.payload.completedCount, 1);
  assert.strictEqual(events.final.payload.skippedCount, 2);
  assert.strictEqual(
    Array.from(
      events.final.payload.failureGroups,
      (group) => group.identifier
    ).join(","),
    "conflicts,alreadyThere"
  );
  assert.strictEqual(
    Array.from(
      events.final.payload.actionButtons,
      (button) => button.kind
    ).join(","),
    "revealTargets,undoMoves"
  );
  assert.strictEqual(events.final.payload.undoOperations.length, 1);
}

function testFolderCannotMoveInsideItself() {
  const events = runScenario({
    configuredDirectory: "/source/child",
    authorizedDirectories: ["/source/child"],
    directories: ["/source", "/source/child"],
    selectedFiles: [{ path: "/source", fileName: "source" }]
  });

  assert.strictEqual(events.moves.length, 0);
  assert.strictEqual(events.final.kind, "failed");
  assert.strictEqual(
    events.final.payload.failureGroups[0].identifier,
    "invalidTargets"
  );
}

function testSavedDestinationCanBeReauthorized() {
  const events = runScenario({
    configuredDirectory: "/dest",
    authorizeOnRequest: true,
    directories: ["/dest"],
    selectedFiles: [{ path: "/source/a.txt", fileName: "a.txt" }]
  });

  assert.deepStrictEqual(events.authorizationRequests, ["/dest"]);
  assert.strictEqual(events.notifications.length, 0);
  assert.strictEqual(events.final.kind, "finished");
}

function testCancelledAuthorizationExplainsNextStep() {
  const events = runScenario({
    configuredDirectory: "/dest",
    authorizeOnRequest: false,
    directories: ["/dest"],
    selectedFiles: [{ path: "/source/a.txt", fileName: "a.txt" }]
  });

  assert.strictEqual(events.final, null);
  assert.strictEqual(events.notifications.length, 1);
  assert.match(events.notifications[0].body, /extension settings/i);
}

testSuccessConflictsAndUndo();
testFolderCannotMoveInsideItself();
testSavedDestinationCanBeReauthorized();
testCancelledAuthorizationExplainsNextStep();

console.log("MoveFiles-Plugin behavior verified.");
