/*
 * Image to SVG
 * Headless file action: convert locally through SwiftBiu.convertImageToSVG.
 */

var SUPPORTED_EXTENSIONS = {
    png: true, jpg: true, jpeg: true, webp: true, gif: true, bmp: true, tif: true, tiff: true, heic: true
};

function localizedStrings(context) {
    var language = String(context && context.languageCode || "").toLowerCase();
    if (language.indexOf("zh") === 0) {
        return {
            noImageTitle: "没有可转换的图片",
            noImageBody: "请先选中一张图片。",
            folderTitle: "需要保存目录",
            folderBody: "本次转换已取消。请重新运行并选择保存目录。",
            folderUnavailableTitle: "保存目录不可用",
            folderUnavailableBody: "请在扩展设置中重新选择保存目录。",
            missingAPITitle: "需要更新 SwiftBiu",
            missingAPIBody: "当前版本缺少本地转 SVG 接口，请先更新 SwiftBiu。",
            preparing: "正在准备转换",
            converting: "正在本地矢量化",
            completed: "已转换为 SVG",
            failed: "图片转 SVG 失败",
            waiting: "等待处理",
            processing: "处理中",
            saved: "已保存",
            failedStatus: "失败",
            reveal: "在 Finder 中显示",
            saveFailed: "SwiftBiu 未能确认文件已保存。",
            emptyResult: "本地转换没有返回 SVG。",
            plan: function(name, folder) { return "在本地将 “" + name + "” 转为 SVG，并保存到 “" + folder + "”"; },
            savedAt: function(path) { return "文件已保存到 " + path; },
            sectionTitles: {
                planTitle: "转换计划", logTitle: "处理记录", fileTitle: "任务状态",
                failureTitle: "失败详情", actionTitle: "后续操作"
            }
        };
    }
    return {
        noImageTitle: "No Convertible Image",
        noImageBody: "Select an image first.",
        folderTitle: "Output Folder Required",
        folderBody: "The conversion was cancelled. Run the action again and choose a save folder.",
        folderUnavailableTitle: "Output Folder Unavailable",
        folderUnavailableBody: "Choose the output folder again in extension settings.",
        missingAPITitle: "SwiftBiu Update Required",
        missingAPIBody: "This SwiftBiu version does not include the local SVG converter. Update SwiftBiu first.",
        preparing: "Preparing Conversion",
        converting: "Vectorizing Locally",
        completed: "Converted to SVG",
        failed: "Image to SVG Failed",
        waiting: "Waiting",
        processing: "Processing",
        saved: "Saved",
        failedStatus: "Failed",
        reveal: "Show in Finder",
        saveFailed: "SwiftBiu could not confirm that the file was saved.",
        emptyResult: "Local conversion did not return an SVG.",
        plan: function(name, folder) { return "Convert “" + name + "” to SVG locally and save to “" + folder + "”"; },
        savedAt: function(path) { return "Saved to " + path; },
        sectionTitles: {
            planTitle: "Conversion Plan", logTitle: "Activity", fileTitle: "Task Status",
            failureTitle: "Failure Details", actionTitle: "Next Actions"
        }
    };
}

function configValue(key, fallback) {
    var value = SwiftBiu.getConfig(key);
    value = value === undefined || value === null ? "" : String(value).trim();
    return value || fallback;
}

function fileExtension(path) {
    var name = String(path || "").split("/").pop() || "";
    var dot = name.lastIndexOf(".");
    return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

function fileNameFromPath(path) {
    var pieces = String(path || "").split("/");
    return pieces[pieces.length - 1] || path;
}

function isSupportedImagePath(path) {
    return Boolean(SUPPORTED_EXTENSIONS[fileExtension(path)]);
}

function firstSelectedImage(context) {
    var files = context && context.selectedFiles;
    var index;
    var item;
    if (Object.prototype.toString.call(files) !== "[object Array]") return null;
    for (index = 0; index < files.length; index += 1) {
        item = files[index];
        if (item && item.path && isSupportedImagePath(item.path)) return item;
    }
    return null;
}

function isAvailable(context) {
    return { isAvailable: true, isContextMatch: Boolean(firstSelectedImage(context)) };
}

function trimTrailingSlash(path) {
    return String(path || "").replace(/\/+$/, "");
}

function displayNameForPath(path) {
    var pieces = trimTrailingSlash(path).split("/");
    return pieces[pieces.length - 1] || path;
}

function resolveOutputDirectory(strings) {
    var directory = trimTrailingSlash(configValue("output_directory", ""));
    var hadConfiguredDirectory = Boolean(directory);
    var hasDirectoryAccess;
    if (directory) {
        hasDirectoryAccess = SwiftBiu.hasAuthorizedDirectoryAccess(directory);
        if (!hasDirectoryAccess) {
            SwiftBiu.requestDirectoryAuthorization(directory);
            hasDirectoryAccess = SwiftBiu.hasAuthorizedDirectoryAccess(directory);
        }
        if (hasDirectoryAccess && SwiftBiu.directoryExists(directory)) return directory;
        directory = "";
    }
    directory = trimTrailingSlash(SwiftBiu.pickLocalDirectory());
    if (!directory) {
        SwiftBiu.showNotification(
            hadConfiguredDirectory ? strings.folderUnavailableTitle : strings.folderTitle,
            hadConfiguredDirectory ? strings.folderUnavailableBody : strings.folderBody
        );
        return "";
    }
    SwiftBiu.setConfig("output_directory", directory);
    return directory;
}

function resolveImageFile(context, strings) {
    var selected = firstSelectedImage(context);
    var picked;
    if (selected) return selected.path;
    picked = SwiftBiu.pickLocalFile({ kind: "image" });
    if (!picked || !isSupportedImagePath(picked)) {
        SwiftBiu.showNotification(strings.noImageTitle, strings.noImageBody);
        return "";
    }
    return picked;
}

function uniqueDestination(directory, filename) {
    var dot = filename.lastIndexOf(".");
    var base = dot > 0 ? filename.slice(0, dot) : filename;
    var ext = dot > 0 ? filename.slice(dot) : "";
    var index;
    var name;
    var path;
    for (index = 0; index < 100; index += 1) {
        name = index === 0 ? filename : base + "-" + index + ext;
        path = trimTrailingSlash(directory) + "/" + name;
        if (!SwiftBiu.fileExists(path)) return path;
    }
    return trimTrailingSlash(directory) + "/" + base + "-" + Date.now() + ext;
}

function performAction(context) {
    var strings = localizedStrings(context);
    var imagePath;
    var directory;
    var sourceName;
    var destination;
    var sessionID;
    var result;
    var savedPath;
    var detail;

    if (typeof SwiftBiu.convertImageToSVG !== "function") {
        SwiftBiu.showNotification(strings.missingAPITitle, strings.missingAPIBody);
        return;
    }

    imagePath = resolveImageFile(context, strings);
    if (!imagePath) return;
    directory = resolveOutputDirectory(strings);
    if (!directory) return;

    sourceName = fileNameFromPath(imagePath);
    destination = uniqueDestination(directory, sourceName.replace(/\.[^.]+$/, "") + ".svg");
    sessionID = SwiftBiu.beginFileTask({
        headlineText: strings.preparing,
        detailText: strings.plan(sourceName, displayNameForPath(directory)),
        totalCount: 1,
        completedCount: 0,
        skippedCount: 0,
        progress: 0.1,
        batchItems: [{
            sourceFileName: sourceName,
            outputFileName: destination,
            status: "processing",
            statusText: strings.processing,
            detailText: strings.plan(sourceName, displayNameForPath(directory))
        }],
        sectionTitles: strings.sectionTitles,
        targetDirectoryPaths: [directory]
    });

    result = SwiftBiu.convertImageToSVG(imagePath, {
        maxColors: Number(configValue("max_colors", "32")),
        maxDimension: Number(configValue("max_dimension", "768")),
        minArea: Number(configValue("min_area", "4")),
        curveMode: configValue("curve_mode", "spline"),
        layerMode: configValue("layer_mode", "stacked"),
        curveTolerance: Number(configValue("curve_tolerance", "0.6")),
        gradientMode: configValue("gradient_mode", "auto"),
        paintMode: configValue("paint_mode", "editable"),
        groupMode: configValue("group_mode", "objects")
    });

    if (!result || result.success !== true || !result.svg) {
        detail = (result && result.error) || strings.emptyResult;
        SwiftBiu.failFileTask(sessionID, {
            headlineText: strings.failed,
            detailText: detail,
            progress: 1,
            sectionTitles: strings.sectionTitles
        });
        SwiftBiu.showNotification(strings.failed, detail);
        return;
    }

    savedPath = SwiftBiu.writeLocalTextFile(destination, result.svg);
    if (!savedPath || !SwiftBiu.fileExists(savedPath)) {
        SwiftBiu.failFileTask(sessionID, {
            headlineText: strings.failed,
            detailText: strings.saveFailed,
            progress: 1,
            sectionTitles: strings.sectionTitles
        });
        SwiftBiu.showNotification(strings.failed, strings.saveFailed);
        return;
    }

    SwiftBiu.finishFileTask(sessionID, {
        headlineText: strings.completed,
        detailText: strings.savedAt(savedPath),
        completedCount: 1,
        progress: 1,
        actionButtons: [{ kind: "revealTargets", title: strings.reveal, isEnabled: true }],
        targetDirectoryPaths: [directory],
        sectionTitles: strings.sectionTitles
    });
    SwiftBiu.showNotification(strings.completed, savedPath);
}
