/**
 * Move Files
 * Native-first batch move flow with clear conflict, failure, and undo feedback.
 */

const DEFAULT_LOCALE = "zh-Hans";

const STRINGS = {
    "zh-Hans": {
        taskName: "移动文件",
        noFilesTitle: "没有可移动的项目",
        noFilesBody: "请先选择一个或多个本地文件或文件夹。",
        accessTitle: "需要目标目录权限",
        accessBody: "未获得已保存目录的访问权限，本次移动已取消。请重新授权，或在扩展设置中重新选择“快捷移动目录”。",
        missingTargetTitle: "目标目录不可用",
        missingTargetBody: "已保存的目录不存在或不再是文件夹。请在扩展设置中重新选择“快捷移动目录”。",
        headlineMoving: "正在移动文件",
        headlineCompleted: "移动完成",
        headlineCompletedWithIssues: "移动完成，部分项目未处理",
        headlineNothingMoved: "没有项目被移动",
        headlineFailed: "移动失败",
        queuedLabel: "等待移动",
        movingLabel: "移动中",
        movedLabel: "已移动",
        conflictLabel: "同名冲突",
        alreadyThereLabel: "已在目标目录",
        invalidTargetLabel: "目标位置无效",
        failedLabel: "移动失败",
        movedChip: "已移动",
        skippedChip: "已跳过",
        failedChip: "失败",
        revealAction: "打开目标目录",
        undoAction: "撤销本次移动",
        sectionTitles: {
            planTitle: "移动计划",
            logTitle: "处理记录",
            fileTitle: "文件状态",
            failureTitle: "未处理项目",
            actionTitle: "后续操作"
        },
        failureTitles: {
            conflicts: "同名冲突",
            alreadyThere: "已在目标目录",
            invalidTargets: "无效目标",
            moves: "移动失败"
        },
        plan: function(count, target) {
            return "准备将 " + count + " 个项目移动到“" + target + "”";
        },
        moving: function(name, index, total) {
            return "正在移动 " + name + "（" + index + "/" + total + "）";
        },
        moved: function(name) {
            return name + " 已移动到目标目录";
        },
        conflict: function(name) {
            return "已跳过 " + name + "：目标目录中存在同名项目";
        },
        alreadyThere: function(name) {
            return "已跳过 " + name + "：项目已经位于目标目录";
        },
        invalidTarget: function(name) {
            return "无法移动 " + name + "：不能把文件夹移动到自身或其子目录";
        },
        missingSource: function(name) {
            return "无法移动 " + name + "：没有可用的本地路径";
        },
        moveFailed: function(name) {
            return "移动 " + name + " 失败，请检查源文件和目标目录权限";
        },
        unexpectedFailure: function(name, message) {
            return "处理 " + name + " 时发生错误：" + message;
        },
        summary: function(success, skipped, failed) {
            let message = "已移动 " + success + " 个项目";
            if (skipped > 0) message += "，跳过 " + skipped + " 个";
            if (failed > 0) message += "，失败 " + failed + " 个";
            return message + "。";
        },
        failureDetail: function(count) {
            return count + " 个项目需要处理";
        }
    },
    en: {
        taskName: "Move Files",
        noFilesTitle: "No Items to Move",
        noFilesBody: "Select one or more local files or folders first.",
        accessTitle: "Destination Access Required",
        accessBody: "Access to the saved destination was not granted, so nothing was moved. Authorize it again or reselect the Quick Move Destination in extension settings.",
        missingTargetTitle: "Destination Unavailable",
        missingTargetBody: "The saved destination no longer exists or is not a folder. Reselect the Quick Move Destination in extension settings.",
        headlineMoving: "Moving Files",
        headlineCompleted: "Move Complete",
        headlineCompletedWithIssues: "Move Complete with Issues",
        headlineNothingMoved: "No Items Were Moved",
        headlineFailed: "Move Failed",
        queuedLabel: "Waiting",
        movingLabel: "Moving",
        movedLabel: "Moved",
        conflictLabel: "Name Conflict",
        alreadyThereLabel: "Already There",
        invalidTargetLabel: "Invalid Destination",
        failedLabel: "Move Failed",
        movedChip: "Moved",
        skippedChip: "Skipped",
        failedChip: "Failed",
        revealAction: "Open Destination",
        undoAction: "Undo This Move",
        sectionTitles: {
            planTitle: "Move Plan",
            logTitle: "Activity",
            fileTitle: "Item Status",
            failureTitle: "Unprocessed Items",
            actionTitle: "Next Actions"
        },
        failureTitles: {
            conflicts: "Name Conflicts",
            alreadyThere: "Already in Destination",
            invalidTargets: "Invalid Destinations",
            moves: "Move Failures"
        },
        plan: function(count, target) {
            return "Preparing to move " + count + " item(s) to “" + target + "”";
        },
        moving: function(name, index, total) {
            return "Moving " + name + " (" + index + "/" + total + ")";
        },
        moved: function(name) {
            return name + " was moved to the destination";
        },
        conflict: function(name) {
            return "Skipped " + name + ": an item with the same name already exists";
        },
        alreadyThere: function(name) {
            return "Skipped " + name + ": it is already in the destination";
        },
        invalidTarget: function(name) {
            return "Could not move " + name + ": a folder cannot be moved into itself or a child folder";
        },
        missingSource: function(name) {
            return "Could not move " + name + ": no local path is available";
        },
        moveFailed: function(name) {
            return "Moving " + name + " failed. Check access to the source and destination.";
        },
        unexpectedFailure: function(name, message) {
            return "An error occurred while moving " + name + ": " + message;
        },
        summary: function(success, skipped, failed) {
            let message = "Moved " + success + " item(s)";
            if (skipped > 0) message += ", skipped " + skipped;
            if (failed > 0) message += ", failed " + failed;
            return message + ".";
        },
        failureDetail: function(count) {
            return count + " item(s) need attention";
        }
    }
};

function isAvailable(context) {
    const hasFiles = resolveSelectedFiles(context).length > 0;
    return {
        isAvailable: hasFiles,
        isContextMatch: hasFiles
    };
}

function performAction(context) {
    const strings = resolveStrings(context);
    const files = resolveSelectedFiles(context);

    if (files.length === 0) {
        SwiftBiu.showNotification(strings.noFilesTitle, strings.noFilesBody);
        return;
    }

    const targetDirectory = resolveTargetDirectory(strings);
    if (!targetDirectory) return;

    const state = createTaskState(context, files, targetDirectory, strings);
    appendLog(state, strings.plan(files.length, displayNameForPath(targetDirectory)), "plan", true);

    const sessionID = SwiftBiu.beginFileTask(buildTaskOptions(state, {
        headlineText: strings.headlineMoving,
        detailText: strings.plan(files.length, displayNameForPath(targetDirectory)),
        progress: 0.03
    }));
    state.sessionID = sessionID;

    for (let index = 0; index < files.length; index++) {
        moveFileAtIndex(state, index);
    }

    const finalOptions = buildTaskOptions(state, {
        headlineText: finalHeadline(state),
        detailText: strings.summary(state.successCount, state.skipCount, state.failureCount),
        progress: 1,
        includeActions: true
    });

    if (state.successCount === 0 && state.failureCount > 0) {
        SwiftBiu.failFileTask(sessionID, finalOptions);
    } else {
        SwiftBiu.finishFileTask(sessionID, finalOptions);
    }
}

function resolveTargetDirectory(strings) {
    const configuredDirectory = normalizePath(SwiftBiu.getConfig("default_dir"));
    let targetDirectory = configuredDirectory;

    if (targetDirectory) {
        if (!SwiftBiu.hasAuthorizedDirectoryAccess(targetDirectory)) {
            SwiftBiu.requestDirectoryAuthorization(targetDirectory);
        }
        if (!SwiftBiu.hasAuthorizedDirectoryAccess(targetDirectory)) {
            SwiftBiu.showNotification(strings.accessTitle, strings.accessBody);
            return null;
        }
        if (!SwiftBiu.directoryExists(targetDirectory)) {
            SwiftBiu.showNotification(strings.missingTargetTitle, strings.missingTargetBody);
            return null;
        }
        return targetDirectory;
    }

    targetDirectory = normalizePath(SwiftBiu.pickLocalDirectory());
    return targetDirectory || null;
}

function moveFileAtIndex(state, index) {
    const file = state.files[index];
    const strings = state.strings;
    const name = file.fileName;
    const sourcePath = file.path;
    const destinationPath = joinPath(state.targetDirectory, name);

    state.batchItems[index] = {
        sourceFileName: name,
        outputFileName: destinationPath,
        status: "processing",
        statusText: strings.movingLabel,
        detailText: strings.moving(name, index + 1, state.totalCount)
    };
    publishProgress(state, strings.moving(name, index + 1, state.totalCount), index);

    if (!sourcePath) {
        recordFailure(state, "moves", name);
        state.failureCount += 1;
        updateFailedBatchItem(state, index, strings.failedLabel, strings.missingSource(name));
        appendLog(state, strings.missingSource(name), "error", false);
        publishProgress(state, strings.missingSource(name), index + 1);
        return;
    }

    if (samePath(sourcePath, destinationPath)) {
        state.skipCount += 1;
        recordFailure(state, "alreadyThere", name);
        state.batchItems[index] = {
            sourceFileName: name,
            outputFileName: destinationPath,
            status: "skipped",
            statusText: strings.alreadyThereLabel,
            detailText: strings.alreadyThere(name)
        };
        appendLog(state, strings.alreadyThere(name), "warning", false);
        publishProgress(state, strings.alreadyThere(name), index + 1);
        return;
    }

    if (SwiftBiu.directoryExists(sourcePath) && isSameOrDescendant(state.targetDirectory, sourcePath)) {
        state.failureCount += 1;
        recordFailure(state, "invalidTargets", name);
        updateFailedBatchItem(state, index, strings.invalidTargetLabel, strings.invalidTarget(name));
        appendLog(state, strings.invalidTarget(name), "error", false);
        publishProgress(state, strings.invalidTarget(name), index + 1);
        return;
    }

    if (SwiftBiu.fileExists(destinationPath) || SwiftBiu.directoryExists(destinationPath)) {
        state.skipCount += 1;
        recordFailure(state, "conflicts", name);
        state.batchItems[index] = {
            sourceFileName: name,
            outputFileName: destinationPath,
            status: "conflicted",
            statusText: strings.conflictLabel,
            detailText: strings.conflict(name)
        };
        appendLog(state, strings.conflict(name), "warning", false);
        publishProgress(state, strings.conflict(name), index + 1);
        return;
    }

    try {
        const resultPath = SwiftBiu.moveLocalFile(sourcePath, destinationPath);
        if (!resultPath) {
            state.failureCount += 1;
            recordFailure(state, "moves", name);
            updateFailedBatchItem(state, index, strings.failedLabel, strings.moveFailed(name));
            appendLog(state, strings.moveFailed(name), "error", false);
        } else {
            state.successCount += 1;
            state.undoOperations.push({
                sourcePath: sourcePath,
                destinationPath: resultPath,
                fileName: name
            });
            state.batchItems[index] = {
                sourceFileName: name,
                outputFileName: resultPath,
                status: "completed",
                statusText: strings.movedLabel,
                detailText: strings.moved(name)
            };
            appendLog(state, strings.moved(name), "file", false);
        }
    } catch (error) {
        const errorMessage = error && error.message ? error.message : String(error || strings.failedLabel);
        state.failureCount += 1;
        recordFailure(state, "moves", name);
        updateFailedBatchItem(state, index, strings.failedLabel, strings.unexpectedFailure(name, errorMessage));
        appendLog(state, strings.unexpectedFailure(name, errorMessage), "error", false);
    }

    publishProgress(
        state,
        state.batchItems[index].detailText || strings.moving(name, index + 1, state.totalCount),
        index + 1
    );
}

function createTaskState(context, files, targetDirectory, strings) {
    return {
        sessionID: "",
        interactionID: context && context.interactionID ? context.interactionID : "",
        strings: strings,
        files: files,
        targetDirectory: targetDirectory,
        totalCount: files.length,
        processedCount: 0,
        successCount: 0,
        skipCount: 0,
        failureCount: 0,
        activityEntries: [],
        batchItems: files.map(function(file) {
            return {
                sourceFileName: file.fileName,
                status: "queued",
                statusText: strings.queuedLabel,
                detailText: strings.queuedLabel
            };
        }),
        failureBuckets: {
            conflicts: [],
            alreadyThere: [],
            invalidTargets: [],
            moves: []
        },
        undoOperations: []
    };
}

function buildTaskOptions(state, overrides) {
    const options = overrides || {};
    const processedCount = typeof options.processedCount === "number"
        ? options.processedCount
        : state.processedCount;
    const progress = typeof options.progress === "number"
        ? options.progress
        : calculateProgress(state.totalCount, processedCount);

    return {
        interactionID: state.interactionID,
        actionIdentifier: "plugin.file_operation.move_files",
        fileName: state.strings.taskName,
        headlineText: options.headlineText || state.strings.headlineMoving,
        detailText: options.detailText || state.strings.plan(
            state.totalCount,
            displayNameForPath(state.targetDirectory)
        ),
        totalCount: state.totalCount,
        completedCount: state.successCount,
        skippedCount: state.skipCount,
        progress: progress,
        activityLogs: state.activityEntries.map(function(entry) {
            return entry.message;
        }),
        activityEntries: state.activityEntries.slice(),
        summaryChips: [
            { title: state.strings.movedChip, count: state.successCount, tone: "success" },
            { title: state.strings.skippedChip, count: state.skipCount, tone: "warning" },
            { title: state.strings.failedChip, count: state.failureCount, tone: "danger" }
        ],
        failureGroups: buildFailureGroups(state),
        sectionTitles: state.strings.sectionTitles,
        actionButtons: options.includeActions ? buildActionButtons(state) : [],
        targetDirectoryPaths: [state.targetDirectory],
        undoOperations: state.undoOperations.slice(),
        batchItems: state.batchItems.slice()
    };
}

function buildFailureGroups(state) {
    const groups = [];
    Object.keys(state.failureBuckets).forEach(function(key) {
        const items = state.failureBuckets[key];
        if (items.length === 0) return;
        groups.push({
            identifier: key,
            title: state.strings.failureTitles[key],
            count: items.length,
            items: items.slice(0, 5),
            detailText: state.strings.failureDetail(items.length)
        });
    });
    return groups;
}

function buildActionButtons(state) {
    const buttons = [{
        kind: "revealTargets",
        title: state.strings.revealAction,
        isEnabled: true
    }];
    if (state.undoOperations.length > 0) {
        buttons.push({
            kind: "undoMoves",
            title: state.strings.undoAction,
            isEnabled: true
        });
    }
    return buttons;
}

function publishProgress(state, detailText, processedCount) {
    state.processedCount = Math.max(0, Math.min(processedCount, state.totalCount));
    SwiftBiu.updateFileTask(state.sessionID, buildTaskOptions(state, {
        detailText: detailText,
        processedCount: state.processedCount
    }));
}

function updateFailedBatchItem(state, index, statusText, detailText) {
    const file = state.files[index];
    state.batchItems[index] = {
        sourceFileName: file.fileName,
        status: "failed",
        statusText: statusText,
        detailText: detailText,
        errorMessage: detailText
    };
}

function appendLog(state, message, category, isPinned) {
    state.activityEntries.push({
        message: message,
        category: category || "general",
        isPinned: !!isPinned
    });
}

function recordFailure(state, bucket, name) {
    if (!state.failureBuckets[bucket]) return;
    state.failureBuckets[bucket].push(name);
}

function finalHeadline(state) {
    if (state.successCount === 0 && state.failureCount > 0) {
        return state.strings.headlineFailed;
    }
    if (state.successCount === 0) {
        return state.strings.headlineNothingMoved;
    }
    if (state.skipCount > 0 || state.failureCount > 0) {
        return state.strings.headlineCompletedWithIssues;
    }
    return state.strings.headlineCompleted;
}

function resolveSelectedFiles(context) {
    const source = context && Array.isArray(context.selectedFiles)
        ? context.selectedFiles
        : [];
    const files = [];
    const seenPaths = {};

    source.forEach(function(file) {
        if (!file || !file.path) return;
        const path = normalizePath(file.path);
        if (!path || seenPaths[path]) return;
        seenPaths[path] = true;
        files.push({
            path: path,
            fileName: file.fileName || displayNameForPath(path)
        });
    });
    return files;
}

function resolveStrings(context) {
    const locale = context && (context.locale || context.languageCode)
        ? String(context.locale || context.languageCode)
        : DEFAULT_LOCALE;
    const normalized = locale.replace(/_/g, "-");
    if (STRINGS[normalized]) return STRINGS[normalized];
    const language = normalized.split("-")[0];
    if (language === "zh") return STRINGS["zh-Hans"];
    if (STRINGS[language]) return STRINGS[language];
    return STRINGS.en;
}

function normalizePath(path) {
    let value = String(path || "").trim();
    if (value.length > 1) value = value.replace(/\/+$/, "");
    return value;
}

function joinPath(directory, name) {
    return directory === "/" ? "/" + name : directory + "/" + name;
}

function samePath(lhs, rhs) {
    return normalizePath(lhs) === normalizePath(rhs);
}

function isSameOrDescendant(candidate, parent) {
    const normalizedCandidate = normalizePath(candidate);
    const normalizedParent = normalizePath(parent);
    return normalizedCandidate === normalizedParent
        || normalizedCandidate.indexOf(normalizedParent + "/") === 0;
}

function displayNameForPath(path) {
    const normalized = normalizePath(path);
    if (normalized === "/") return "/";
    const components = normalized.split("/");
    return components[components.length - 1] || normalized;
}

function calculateProgress(totalCount, processedCount) {
    if (totalCount <= 0) return 1;
    return Math.max(0.03, Math.min(1, processedCount / totalCount));
}
