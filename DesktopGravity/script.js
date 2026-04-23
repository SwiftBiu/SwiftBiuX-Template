/**
 * Desktop Gravity - script.js (v2.0)
 * Native-first file organization flow with structured progress metadata.
 */

const DEFAULT_LOCALE = "zh-Hans";

const STRINGS = {
    "zh-Hans": {
        panelFileName: "Desktop Gravity",
        noFilesTitle: "未获取到可整理的文件",
        noFilesBody: "请先选中文件，或复制包含文件路径 / file:// URL 的文本后再运行。",
        headlineSorting: "整理文件",
        headlineWaitingAuthorization: "等待授权",
        headlineAuthorizationRequired: "需要文件夹授权",
        headlineCompleted: "整理完成",
        headlineCompletedWithIssues: "整理完成，部分异常",
        headlineFailed: "整理失败",
        detailCheckingPermissions: "正在检查文件夹权限…",
        detailAnalyzingSelection: "正在分析所选文件…",
        detailWaitingForAuthorization: "请在弹出的原生面板中授权需要整理的文件夹…",
        detailStoppedByPermission: "没有权限创建目标文件夹，请先授权对应目录。",
        detailStoppedByCreation: "无法创建目标文件夹，已停止本次整理",
        queueLabel: "等待整理",
        analyzingLabel: "分析中",
        movingLabel: "移动中",
        organizedLabel: "已归类",
        conflictLabel: "同名冲突",
        permissionFailureLabel: "权限失败",
        moveFailureLabel: "移动失败",
        processingFailureLabel: "处理失败",
        creatingFolderLabel: "创建目录中",
        waitingForUndoLabel: "可撤销",
        sectionTitles: {
            planTitle: "分类计划",
            logTitle: "流式日志",
            fileTitle: "最近文件",
            failureTitle: "异常分组",
            actionTitle: "操作"
        },
        actionRevealTargets: "打开目标目录",
        actionUndoMoves: "撤销本次整理",
        categoryNames: {
            images: "图片",
            documents: "文档",
            archives: "压缩包",
            videos: "视频",
            audio: "音频",
            code: "代码",
            others: "其他"
        },
        failureGroupTitles: {
            conflicts: "同名冲突",
            permissions: "权限失败",
            moves: "移动失败"
        },
        planDetected: function(fileCount, categoryCount) {
            return "已检测到 " + fileCount + " 个文件，准备整理到 " + categoryCount + " 个分类目录";
        },
        planPreview: function(summary) {
            return "分类计划预览：" + summary;
        },
        waitingAuthorization: function(count) {
            return "等待授权 " + count + " 个源文件夹";
        },
        authorizationComplete: "所需文件夹授权完成，继续执行整理",
        authorizationCancelled: "用户取消了文件夹授权，整理已取消。",
        authorizationUnresolved: function(count) {
            return "仍有 " + count + " 个文件夹未授权，整理已取消。";
        },
        startAnalyzingFile: function(fileName, categoryName) {
            return "开始分析 " + fileName + "，目标分类为 " + categoryName;
        },
        creatingFolder: function(categoryName) {
            return "开始创建 " + categoryName + " 文件夹";
        },
        creatingFolderProgress: function(categoryName) {
            return "正在创建 " + categoryName + " 文件夹…";
        },
        folderCreated: function(categoryName) {
            return categoryName + " 文件夹创建完成";
        },
        folderAlreadyExists: function(categoryName) {
            return categoryName + " 文件夹已经存在";
        },
        folderCreationFailed: function(categoryName) {
            return "未能创建 " + categoryName + " 文件夹，整理已终止";
        },
        beginMoving: function(fileName, categoryName) {
            return "开始移动 " + fileName + " -> " + categoryName;
        },
        movingProgress: function(fileName) {
            return "正在移动 " + fileName + "…";
        },
        fileOrganized: function(fileName, categoryName, completedCount, totalCount) {
            return fileName + " 已归类到 " + categoryName + " (" + completedCount + "/" + totalCount + ")";
        },
        categoryCompleted: function(categoryName) {
            return categoryName + " 类型已经归类完成";
        },
        destinationConflict: function(fileName) {
            return "跳过 " + fileName + "，目标位置已存在同名文件";
        },
        moveFailed: function(fileName) {
            return "移动 " + fileName + " 失败";
        },
        processingError: function(fileName) {
            return "处理 " + fileName + " 时发生错误";
        },
        progressSummary: function(doneCount, totalCount) {
            return "已完成 " + doneCount + " / " + totalCount + " 个文件";
        },
        finalSummaryLog: function(successCount, skipCount, failureCount) {
            return "整理结束：成功 " + successCount + "，跳过 " + skipCount + "，失败 " + failureCount;
        },
        finalSummaryText: function(successCount, skipCount, failureCount, createdDirectoryCount) {
            let message = "成功归类 " + successCount + " 个文件。";
            if (skipCount > 0) message += " 跳过 " + skipCount + " 个同名冲突。";
            if (failureCount > 0) message += " 失败 " + failureCount + " 个。";
            if (createdDirectoryCount > 0) message += " 创建了 " + createdDirectoryCount + " 个分类文件夹。";
            return message;
        },
        movedToCategory: function(categoryName) {
            return "已移动到 " + categoryName;
        },
        targetExistsInCategory: function(categoryName, fileName) {
            return "目标已存在：" + categoryName + "/" + fileName;
        },
        targetCategoryLabel: function(categoryName) {
            return "目标分类：" + categoryName;
        },
        movingToCategory: function(categoryName) {
            return "正在移动到 " + categoryName;
        },
        permissionFailureForCategory: function(categoryName) {
            return "没有权限创建目标目录 " + categoryName;
        },
        stoppedByPermissionScope: function(scopeName) {
            return "未授权目录：" + scopeName;
        },
        previewChip: function(title, count) {
            return title + " " + count;
        },
        failureSummary: function(title, count) {
            return title + " " + count + " 项";
        }
    },
    en: {
        panelFileName: "Desktop Gravity",
        noFilesTitle: "No files were detected",
        noFilesBody: "Select files first, or copy POSIX paths / file:// URLs before running this action.",
        headlineSorting: "Organizing Files",
        headlineWaitingAuthorization: "Waiting for Access",
        headlineAuthorizationRequired: "Folder Access Required",
        headlineCompleted: "Organization Complete",
        headlineCompletedWithIssues: "Completed with Issues",
        headlineFailed: "Organization Failed",
        detailCheckingPermissions: "Checking folder permissions…",
        detailAnalyzingSelection: "Analyzing selected files…",
        detailWaitingForAuthorization: "Authorize the required folders in the native panel…",
        detailStoppedByPermission: "The target folder could not be created because authorization is missing.",
        detailStoppedByCreation: "The target folder could not be created, so this run was stopped.",
        queueLabel: "Waiting",
        analyzingLabel: "Analyzing",
        movingLabel: "Moving",
        organizedLabel: "Organized",
        conflictLabel: "Conflict",
        permissionFailureLabel: "Permission Failed",
        moveFailureLabel: "Move Failed",
        processingFailureLabel: "Failed",
        creatingFolderLabel: "Creating Folder",
        waitingForUndoLabel: "Undo Available",
        sectionTitles: {
            planTitle: "Category Plan",
            logTitle: "Live Log",
            fileTitle: "Recent Files",
            failureTitle: "Failure Groups",
            actionTitle: "Actions"
        },
        actionRevealTargets: "Open Target Folders",
        actionUndoMoves: "Undo This Sort",
        categoryNames: {
            images: "Images",
            documents: "Documents",
            archives: "Archives",
            videos: "Videos",
            audio: "Audio",
            code: "Code",
            others: "Other"
        },
        failureGroupTitles: {
            conflicts: "Conflicts",
            permissions: "Permission Failures",
            moves: "Move Failures"
        },
        planDetected: function(fileCount, categoryCount) {
            return "Detected " + fileCount + " files and prepared " + categoryCount + " category folders";
        },
        planPreview: function(summary) {
            return "Category preview: " + summary;
        },
        waitingAuthorization: function(count) {
            return "Waiting for authorization for " + count + " source folder(s)";
        },
        authorizationComplete: "Required folder access has been granted. Continuing…",
        authorizationCancelled: "Folder authorization was cancelled, so the task was stopped.",
        authorizationUnresolved: function(count) {
            return count + " folder(s) are still unauthorized, so the task was stopped.";
        },
        startAnalyzingFile: function(fileName, categoryName) {
            return "Analyzing " + fileName + " for category " + categoryName;
        },
        creatingFolder: function(categoryName) {
            return "Creating " + categoryName + " folder";
        },
        creatingFolderProgress: function(categoryName) {
            return "Creating " + categoryName + " folder…";
        },
        folderCreated: function(categoryName) {
            return categoryName + " folder created";
        },
        folderAlreadyExists: function(categoryName) {
            return categoryName + " folder already exists";
        },
        folderCreationFailed: function(categoryName) {
            return "Could not create the " + categoryName + " folder. The task was stopped.";
        },
        beginMoving: function(fileName, categoryName) {
            return "Moving " + fileName + " into " + categoryName;
        },
        movingProgress: function(fileName) {
            return "Moving " + fileName + "…";
        },
        fileOrganized: function(fileName, categoryName, completedCount, totalCount) {
            return fileName + " moved to " + categoryName + " (" + completedCount + "/" + totalCount + ")";
        },
        categoryCompleted: function(categoryName) {
            return categoryName + " is fully organized";
        },
        destinationConflict: function(fileName) {
            return "Skipped " + fileName + " because a file with the same name already exists";
        },
        moveFailed: function(fileName) {
            return "Moving " + fileName + " failed";
        },
        processingError: function(fileName) {
            return "An error occurred while processing " + fileName;
        },
        progressSummary: function(doneCount, totalCount) {
            return "Processed " + doneCount + " / " + totalCount + " file(s)";
        },
        finalSummaryLog: function(successCount, skipCount, failureCount) {
            return "Finished: " + successCount + " succeeded, " + skipCount + " skipped, " + failureCount + " failed";
        },
        finalSummaryText: function(successCount, skipCount, failureCount, createdDirectoryCount) {
            let message = "Organized " + successCount + " file(s).";
            if (skipCount > 0) message += " Skipped " + skipCount + " conflict(s).";
            if (failureCount > 0) message += " Failed " + failureCount + " item(s).";
            if (createdDirectoryCount > 0) message += " Created " + createdDirectoryCount + " category folder(s).";
            return message;
        },
        movedToCategory: function(categoryName) {
            return "Moved to " + categoryName;
        },
        targetExistsInCategory: function(categoryName, fileName) {
            return "Already exists: " + categoryName + "/" + fileName;
        },
        targetCategoryLabel: function(categoryName) {
            return "Target: " + categoryName;
        },
        movingToCategory: function(categoryName) {
            return "Moving into " + categoryName;
        },
        permissionFailureForCategory: function(categoryName) {
            return "No permission to create the " + categoryName + " folder";
        },
        stoppedByPermissionScope: function(scopeName) {
            return "Unauthorized folder: " + scopeName;
        },
        previewChip: function(title, count) {
            return title + " " + count;
        },
        failureSummary: function(title, count) {
            return title + " " + count;
        }
    }
};

// Map file extensions to stable category keys. The actual folder name is localized later.
const CATEGORY_MAP = {
    "jpg": "images", "jpeg": "images", "png": "images", "gif": "images", "webp": "images", "heic": "images", "svg": "images", "bmp": "images",
    "pdf": "documents", "doc": "documents", "docx": "documents", "txt": "documents", "md": "documents", "rtf": "documents", "pages": "documents", "csv": "documents", "xls": "documents", "xlsx": "documents",
    "zip": "archives", "rar": "archives", "7z": "archives", "tar": "archives", "gz": "archives", "dmg": "archives", "pkg": "archives",
    "mp4": "videos", "mov": "videos", "avi": "videos", "mkv": "videos", "webm": "videos",
    "mp3": "audio", "wav": "audio", "m4a": "audio", "flac": "audio",
    "swift": "code", "py": "code", "js": "code", "html": "code", "css": "code", "c": "code", "cpp": "code", "h": "code", "json": "code", "ts": "code", "sh": "code"
};

function isAvailable(context) {
    const files = resolveSelectedFiles(context, true);
    const isMatch = files.length > 0;

    return {
        isAvailable: isMatch,
        isContextMatch: isMatch
    };
}

function performAction(context) {
    const files = resolveSelectedFiles(context, true);
    const strings = resolveStrings(context);

    if (!files || files.length === 0) {
        SwiftBiu.showNotification(strings.noFilesTitle, strings.noFilesBody);
        return;
    }

    const categoryTotals = buildCategoryTotals(files);
    const summaryChips = buildSummaryChips(categoryTotals, strings);
    const state = createTaskState(context, files, strings, categoryTotals, summaryChips);

    appendLogEntry(state, strings.planDetected(files.length, summaryChips.length), "plan", true);
    appendLogEntry(
        state,
        strings.planPreview(summaryChips.map(function(chip) {
            return strings.previewChip(chip.title, chip.count);
        }).join(" / ")),
        "plan",
        true
    );

    const sessionID = SwiftBiu.beginFileTask(
        buildTaskOptions(state, {
            headlineText: strings.headlineSorting,
            detailText: strings.detailCheckingPermissions,
            progress: 0.02
        })
    );
    state.sessionID = sessionID;

    const authorizationResult = ensureDirectoryAuthorization(files, state);
    if (!authorizationResult.authorized) {
        appendLogEntry(state, authorizationResult.message || strings.authorizationCancelled, "error", true);
        SwiftBiu.failFileTask(
            sessionID,
            buildTaskOptions(state, {
                headlineText: strings.headlineAuthorizationRequired,
                detailText: authorizationResult.message || strings.authorizationCancelled,
                progress: 1,
                phase: "failed"
            })
        );
        return;
    }

    SwiftBiu.updateFileTask(
        sessionID,
        buildTaskOptions(state, {
            headlineText: strings.headlineSorting,
            detailText: strings.detailAnalyzingSelection,
            progress: 0.05
        })
    );

    for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const categoryKey = categoryKeyForFile(file);
        const categoryName = localizedCategoryName(categoryKey, strings);
        const targetDir = targetDirectoryForFile(file, strings);
        const destination = targetDir + "/" + file.fileName;

        state.batchItems[index] = {
            sourceFileName: file.fileName,
            status: "analyzing",
            statusText: strings.analyzingLabel,
            detailText: strings.targetCategoryLabel(categoryName)
        };
        appendLogEntry(state, strings.startAnalyzingFile(file.fileName, categoryName), "file", false);
        publishProgress(state, strings.startAnalyzingFile(file.fileName, categoryName), index);

        try {
            if (!SwiftBiu.directoryExists(targetDir)) {
                appendLogEntry(state, strings.creatingFolder(categoryName), "directory", true);
                state.batchItems[index].statusText = strings.creatingFolderLabel;
                state.batchItems[index].detailText = strings.creatingFolderProgress(categoryName);
                publishProgress(state, strings.creatingFolderProgress(categoryName), index);

                const createdDirectory = SwiftBiu.createLocalDirectory(targetDir);
                if (!createdDirectory) {
                    state.failureCount++;
                    recordFailure(state, "permissions", categoryName + " / " + file.fileName);
                    state.batchItems[index] = {
                        sourceFileName: file.fileName,
                        status: "failed",
                        statusText: strings.permissionFailureLabel,
                        detailText: strings.permissionFailureForCategory(categoryName),
                        errorMessage: "createLocalDirectory returned an empty result"
                    };
                    appendLogEntry(state, strings.folderCreationFailed(categoryName), "error", true);
                    publishProgress(state, strings.detailStoppedByCreation, index + 1);
                    SwiftBiu.failFileTask(
                        sessionID,
                        buildTaskOptions(state, {
                            headlineText: strings.headlineAuthorizationRequired,
                            detailText: strings.detailStoppedByPermission,
                            progress: 1,
                            processedCount: index + 1,
                            phase: "failed"
                        })
                    );
                    return;
                }

                appendLogEntry(state, strings.folderCreated(categoryName), "directory", true);
                if (!state.createdDirectories[targetDir]) {
                    state.createdDirectories[targetDir] = true;
                    state.createdDirectoryCount++;
                }
                addTargetDirectory(state, targetDir);
            } else {
                if (!state.createdDirectories[targetDir]) {
                    state.createdDirectories[targetDir] = true;
                    appendLogEntry(state, strings.folderAlreadyExists(categoryName), "directory", true);
                }
                addTargetDirectory(state, targetDir);
            }

            if (SwiftBiu.fileExists(destination)) {
                state.skipCount++;
                recordFailure(state, "conflicts", file.fileName);
                appendLogEntry(state, strings.destinationConflict(file.fileName), "warning", false);
                state.batchItems[index] = {
                    sourceFileName: file.fileName,
                    status: "conflicted",
                    statusText: strings.conflictLabel,
                    detailText: strings.targetExistsInCategory(categoryName, file.fileName)
                };
            } else {
                appendLogEntry(state, strings.beginMoving(file.fileName, categoryName), "file", false);
                state.batchItems[index] = {
                    sourceFileName: file.fileName,
                    status: "processing",
                    statusText: strings.movingLabel,
                    detailText: strings.movingToCategory(categoryName)
                };
                publishProgress(state, strings.movingProgress(file.fileName), index);

                const result = SwiftBiu.moveLocalFile(file.path, destination);
                if (result !== false && result !== null && result !== "") {
                    state.successCount++;
                    state.categoryCompleted[categoryKey] = (state.categoryCompleted[categoryKey] || 0) + 1;
                    state.undoOperations.push({
                        sourcePath: file.path,
                        destinationPath: destination,
                        fileName: file.fileName
                    });
                    addTargetDirectory(state, targetDir);
                    appendLogEntry(
                        state,
                        strings.fileOrganized(
                            file.fileName,
                            categoryName,
                            state.categoryCompleted[categoryKey],
                            state.categoryTotals[categoryKey]
                        ),
                        "summary",
                        false
                    );
                    if (state.categoryCompleted[categoryKey] === state.categoryTotals[categoryKey]) {
                        appendLogEntry(state, strings.categoryCompleted(categoryName), "summary", true);
                    }
                    state.batchItems[index] = {
                        sourceFileName: file.fileName,
                        outputFileName: destination,
                        status: "completed",
                        statusText: strings.organizedLabel,
                        detailText: strings.movedToCategory(categoryName)
                    };
                } else {
                    state.failureCount++;
                    recordFailure(state, "moves", file.fileName);
                    appendLogEntry(state, strings.moveFailed(file.fileName), "error", false);
                    state.batchItems[index] = {
                        sourceFileName: file.fileName,
                        status: "failed",
                        statusText: strings.moveFailureLabel,
                        detailText: strings.movingToCategory(categoryName),
                        errorMessage: "moveLocalFile returned an empty result"
                    };
                }
            }
        } catch (e) {
            state.failureCount++;
            recordFailure(state, "moves", file.fileName);
            appendLogEntry(state, strings.processingError(file.fileName), "error", false);
            state.batchItems[index] = {
                sourceFileName: file.fileName,
                status: "failed",
                statusText: strings.processingFailureLabel,
                detailText: e && e.message ? e.message : strings.processingFailureLabel,
                errorMessage: e && e.message ? e.message : "Unknown error"
            };
            console.log("Error processing " + file.fileName + ": " + (e && e.message ? e.message : e));
        }

        publishProgress(
            state,
            strings.progressSummary(Math.min(index + 1, files.length), files.length),
            index + 1
        );
    }

    appendLogEntry(state, strings.finalSummaryLog(state.successCount, state.skipCount, state.failureCount), "summary", true);
    const finalDetailText = strings.finalSummaryText(
        state.successCount,
        state.skipCount,
        state.failureCount,
        state.createdDirectoryCount
    );

    SwiftBiu.finishFileTask(
        sessionID,
        buildTaskOptions(state, {
            headlineText: state.failureCount > 0 ? strings.headlineCompletedWithIssues : strings.headlineCompleted,
            detailText: finalDetailText,
            progress: 1,
            processedCount: files.length,
            phase: state.failureCount > 0 ? "failed" : "completed"
        })
    );
}

function createTaskState(context, files, strings, categoryTotals, summaryChips) {
    return {
        interactionID: context && context.interactionID ? context.interactionID : "",
        files: files,
        strings: strings,
        totalCount: files.length,
        processedCount: 0,
        successCount: 0,
        skipCount: 0,
        failureCount: 0,
        createdDirectoryCount: 0,
        createdDirectories: {},
        categoryTotals: categoryTotals,
        categoryCompleted: {},
        summaryChips: summaryChips,
        sectionTitles: {
            planTitle: strings.sectionTitles.planTitle,
            logTitle: strings.sectionTitles.logTitle,
            fileTitle: strings.sectionTitles.fileTitle,
            failureTitle: strings.sectionTitles.failureTitle,
            actionTitle: strings.sectionTitles.actionTitle
        },
        activityEntries: [],
        batchItems: files.map(function(file) {
            return {
                sourceFileName: file.fileName,
                status: "queued",
                detailText: strings.queueLabel
            };
        }),
        failureBuckets: {
            conflicts: [],
            permissions: [],
            moves: []
        },
        targetDirectoryPaths: [],
        undoOperations: []
    };
}

function ensureDirectoryAuthorization(files, state) {
    const missingScopes = uniqueAuthorizationScopes(files).filter(function(scope) {
        return !SwiftBiu.hasAuthorizedDirectoryAccess(scope);
    });

    if (missingScopes.length === 0) {
        return { authorized: true };
    }

    appendLogEntry(state, state.strings.waitingAuthorization(missingScopes.length), "authorization", true);
    SwiftBiu.updateFileTask(
        state.sessionID,
        buildTaskOptions(state, {
            headlineText: state.strings.headlineWaitingAuthorization,
            detailText: state.strings.detailWaitingForAuthorization,
            progress: 0.02
        })
    );

    const authorizedDirectory = SwiftBiu.requestDirectoryAuthorization(missingScopes[0]);
    if (!authorizedDirectory) {
        missingScopes.forEach(function(scope) {
            recordFailure(state, "permissions", pathDisplayName(scope));
        });
        return {
            authorized: false,
            message: state.strings.authorizationCancelled
        };
    }

    const unresolvedScopes = missingScopes.filter(function(scope) {
        return !SwiftBiu.hasAuthorizedDirectoryAccess(scope);
    });
    if (unresolvedScopes.length > 0) {
        unresolvedScopes.forEach(function(scope) {
            recordFailure(state, "permissions", pathDisplayName(scope));
        });
        return {
            authorized: false,
            message: state.strings.authorizationUnresolved(unresolvedScopes.length)
        };
    }

    appendLogEntry(state, state.strings.authorizationComplete, "authorization", true);
    return { authorized: true };
}

function buildTaskOptions(state, overrides) {
    const options = overrides || {};
    const processedCount = typeof options.processedCount === "number"
        ? options.processedCount
        : state.processedCount;
    const progress = typeof options.progress === "number"
        ? options.progress
        : calculateProgress(state.totalCount, processedCount);
    const phase = options.phase || "progress";

    return {
        interactionID: state.interactionID,
        actionIdentifier: "plugin.file_operation.desktop_gravity",
        fileName: state.strings.panelFileName,
        headlineText: options.headlineText || state.strings.headlineSorting,
        detailText: options.detailText || state.strings.detailAnalyzingSelection,
        totalCount: state.totalCount,
        completedCount: state.successCount,
        skippedCount: state.skipCount,
        progress: progress,
        activityLogs: state.activityEntries.map(function(entry) {
            return entry.message;
        }),
        activityEntries: state.activityEntries.slice(),
        summaryChips: state.summaryChips.slice(),
        failureGroups: buildFailureGroups(state),
        sectionTitles: state.sectionTitles,
        actionButtons: buildActionButtons(state, phase),
        targetDirectoryPaths: state.targetDirectoryPaths.slice(),
        undoOperations: state.undoOperations.slice(),
        batchItems: state.batchItems.slice()
    };
}

function publishProgress(state, detailText, processedCount) {
    state.processedCount = Math.max(0, Math.min(processedCount, state.totalCount));
    SwiftBiu.updateFileTask(
        state.sessionID,
        buildTaskOptions(state, {
            headlineText: state.strings.headlineSorting,
            detailText: detailText,
            processedCount: state.processedCount
        })
    );
}

function buildSummaryChips(categoryTotals, strings) {
    return Object.keys(categoryTotals)
        .sort(function(lhs, rhs) {
            return categoryTotals[rhs] - categoryTotals[lhs];
        })
        .map(function(categoryKey) {
            return {
                title: localizedCategoryName(categoryKey, strings),
                count: categoryTotals[categoryKey],
                tone: categoryKey === "others" ? "neutral" : "accent"
            };
        });
}

function buildFailureGroups(state) {
    const strings = state.strings;
    const groups = [];

    if (state.failureBuckets.conflicts.length > 0) {
        groups.push({
            identifier: "conflicts",
            title: strings.failureGroupTitles.conflicts,
            count: state.failureBuckets.conflicts.length,
            items: state.failureBuckets.conflicts.slice(0, 3),
            detailText: strings.failureSummary(
                strings.failureGroupTitles.conflicts,
                state.failureBuckets.conflicts.length
            )
        });
    }

    if (state.failureBuckets.permissions.length > 0) {
        groups.push({
            identifier: "permissions",
            title: strings.failureGroupTitles.permissions,
            count: state.failureBuckets.permissions.length,
            items: state.failureBuckets.permissions.slice(0, 3),
            detailText: strings.failureSummary(
                strings.failureGroupTitles.permissions,
                state.failureBuckets.permissions.length
            )
        });
    }

    if (state.failureBuckets.moves.length > 0) {
        groups.push({
            identifier: "moves",
            title: strings.failureGroupTitles.moves,
            count: state.failureBuckets.moves.length,
            items: state.failureBuckets.moves.slice(0, 3),
            detailText: strings.failureSummary(
                strings.failureGroupTitles.moves,
                state.failureBuckets.moves.length
            )
        });
    }

    return groups;
}

function buildActionButtons(state, phase) {
    if (phase !== "completed" && phase !== "failed") {
        return [];
    }

    const buttons = [];
    if (state.targetDirectoryPaths.length > 0) {
        buttons.push({
            kind: "revealTargets",
            title: state.strings.actionRevealTargets,
            isEnabled: true
        });
    }

    if (state.undoOperations.length > 0 && state.successCount > 0) {
        buttons.push({
            kind: "undoMoves",
            title: state.strings.actionUndoMoves,
            isEnabled: true
        });
    }

    return buttons;
}

function buildCategoryTotals(files) {
    const totals = {};

    files.forEach(function(file) {
        const categoryKey = categoryKeyForFile(file);
        totals[categoryKey] = (totals[categoryKey] || 0) + 1;
    });

    return totals;
}

function appendLogEntry(state, message, category, isPinned) {
    if (!message) return;

    state.activityEntries.push({
        message: "[" + currentTimestamp() + "] " + message,
        category: category || "general",
        isPinned: !!isPinned
    });

    if (state.activityEntries.length > 120) {
        state.activityEntries.splice(0, state.activityEntries.length - 120);
    }
}

function recordFailure(state, bucketKey, itemLabel) {
    if (!itemLabel || !state.failureBuckets[bucketKey]) return;
    state.failureBuckets[bucketKey].push(itemLabel);
}

function addTargetDirectory(state, directoryPath) {
    if (!directoryPath) return;
    if (state.targetDirectoryPaths.indexOf(directoryPath) > -1) return;
    state.targetDirectoryPaths.push(directoryPath);
}

function calculateProgress(totalCount, processedCount) {
    if (totalCount <= 0) return 1;
    const normalized = Math.max(0, Math.min(processedCount, totalCount));
    return Math.max(0.03, normalized / totalCount);
}

function currentTimestamp() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return hours + ":" + minutes + ":" + seconds;
}

function resolveStrings(context) {
    const locale = context && (context.locale || context.languageCode) ? String(context.locale || context.languageCode) : DEFAULT_LOCALE;
    const normalized = locale.replace(/_/g, "-");

    if (STRINGS[normalized]) return STRINGS[normalized];
    const shortCode = normalized.split("-")[0];
    if (shortCode === "zh") return STRINGS["zh-Hans"];
    if (STRINGS[shortCode]) return STRINGS[shortCode];
    return STRINGS[DEFAULT_LOCALE];
}

function categoryKeyForFile(file) {
    const ext = (file.fileExtension || "").toLowerCase();
    return CATEGORY_MAP[ext] || "others";
}

function localizedCategoryName(categoryKey, strings) {
    return strings.categoryNames[categoryKey] || strings.categoryNames.others;
}

function parentDirectoryForPath(path) {
    const pathParts = path.split("/");
    pathParts.pop();
    return pathParts.join("/") + "/";
}

function targetDirectoryForFile(file, strings) {
    return parentDirectoryForPath(file.path) + localizedCategoryName(categoryKeyForFile(file), strings);
}

function uniqueAuthorizationScopes(files) {
    const scopes = [];
    const seenScopes = {};

    files.forEach(function(file) {
        const scope = parentDirectoryForPath(file.path);
        if (!scope || seenScopes[scope]) return;
        seenScopes[scope] = true;
        scopes.push(scope);
    });

    return scopes;
}

function pathDisplayName(path) {
    const normalizedPath = String(path || "").replace(/\/+$/, "");
    if (!normalizedPath) return path;
    const pathParts = normalizedPath.split("/");
    return pathParts[pathParts.length - 1] || normalizedPath;
}

function resolveSelectedFiles(context, includeClipboardText) {
    const candidates = [];
    const seenPaths = {};

    function pushFile(file) {
        const normalizedFile = normalizeResolvedFile(file);
        if (!normalizedFile || seenPaths[normalizedFile.path]) return;
        seenPaths[normalizedFile.path] = true;
        candidates.push(normalizedFile);
    }

    const contextFiles = context && Array.isArray(context.selectedFiles) ? context.selectedFiles : [];
    contextFiles.forEach(pushFile);
    if (candidates.length > 0) {
        return candidates;
    }

    parseFileCandidates(context && context.selectedText).forEach(pushFile);
    if (candidates.length > 0) {
        return candidates;
    }

    if (includeClipboardText) {
        try {
            parseFileCandidates(SwiftBiu.getClipboard()).forEach(pushFile);
        } catch (e) {
            console.log("Failed to read clipboard text: " + e.message);
        }
    }

    return candidates;
}

function normalizeResolvedFile(file) {
    if (!file || !file.path) return null;

    const descriptor = buildFileDescriptor(file.path);
    if (!descriptor) return null;

    return {
        path: descriptor.path,
        fileURL: file.fileURL || descriptor.fileURL,
        fileName: file.fileName || descriptor.fileName,
        fileExtension: (file.fileExtension || descriptor.fileExtension || "").toLowerCase()
    };
}

function parseFileCandidates(rawText) {
    if (!rawText || typeof rawText !== "string") return [];

    return rawText
        .split(/\r?\n/)
        .map(function(line) {
            return normalizeFileCandidate(line);
        })
        .filter(Boolean);
}

function normalizeFileCandidate(raw) {
    if (!raw) return null;

    const trimmed = raw.trim().replace(/^['"]|['"]$/g, "");
    if (!trimmed) return null;

    let path = null;

    if (trimmed.indexOf("file://") === 0) {
        path = decodeFileURL(trimmed);
    } else if (trimmed.charAt(0) === "/") {
        path = trimmed;
    }

    if (!path) return null;

    return buildFileDescriptor(path);
}

function decodeFileURL(fileURL) {
    try {
        return decodeURIComponent(fileURL.replace(/^file:\/\//, ""));
    } catch (e) {
        console.log("Failed to decode file URL: " + fileURL);
        return null;
    }
}

function buildFileDescriptor(path) {
    const normalizedPath = path.replace(/\/+$/, "");
    const pathParts = normalizedPath.split("/");
    const fileName = pathParts[pathParts.length - 1] || "";
    if (!fileName) return null;

    const extIndex = fileName.lastIndexOf(".");
    const fileExtension = extIndex > -1 ? fileName.slice(extIndex + 1) : "";

    return {
        path: normalizedPath,
        fileURL: "file://" + encodeURI(normalizedPath),
        fileName: fileName,
        fileExtension: fileExtension
    };
}
