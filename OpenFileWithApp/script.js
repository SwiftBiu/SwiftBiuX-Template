var DEFAULT_RULES = [
    { fileExtension: "pdf", appBundleID: "com.apple.Preview" },
    { fileExtension: "png", appBundleID: "com.apple.Preview" },
    { fileExtension: "jpg", appBundleID: "com.apple.Preview" },
    { fileExtension: "jpeg", appBundleID: "com.apple.Preview" },
    { fileExtension: "heic", appBundleID: "com.apple.Preview" },
    { fileExtension: "webp", appBundleID: "com.apple.Preview" }
];

function normalizedConfigValue(key) {
    var value = SwiftBiu.getConfig(key);
    return typeof value === "string" ? value.trim() : "";
}

function normalizeExtension(value) {
    if (value === null || value === undefined) {
        return "";
    }

    var result = String(value).trim().toLowerCase();
    while (result.indexOf(".") === 0) {
        result = result.slice(1);
    }

    return result.length > 0 && !/[\/:\\]/.test(result) ? result : "";
}

function normalizeBundleID(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}

function normalizedRules(rawRules) {
    var seen = {};
    var rules = [];

    if (!Array.isArray(rawRules)) {
        return rules;
    }

    rawRules.forEach(function (rule) {
        var fileExtension = normalizeExtension(rule && rule.fileExtension);
        var appBundleID = normalizeBundleID(rule && rule.appBundleID);
        if (!fileExtension || !appBundleID || seen[fileExtension]) {
            return;
        }

        seen[fileExtension] = true;
        rules.push({
            fileExtension: fileExtension,
            appBundleID: appBundleID
        });
    });

    return rules;
}

function configuredRules() {
    var value = normalizedConfigValue("rules");
    if (!value) {
        return normalizedRules(DEFAULT_RULES);
    }

    try {
        var parsed = JSON.parse(value);
        return normalizedRules(Array.isArray(parsed) ? parsed : parsed.rules);
    } catch (error) {
        return normalizedRules(DEFAULT_RULES);
    }
}

function fileExtension(file) {
    var explicit = file && file.fileExtension ? String(file.fileExtension) : "";
    explicit = normalizeExtension(explicit);
    if (explicit) {
        return explicit;
    }

    var name = file && file.fileName ? String(file.fileName) : "";
    var dotIndex = name.lastIndexOf(".");
    return dotIndex >= 0 ? normalizeExtension(name.slice(dotIndex + 1)) : "";
}

function fileName(file) {
    return file && file.fileName ? String(file.fileName).toLowerCase() : "";
}

function ruleMatchesFile(rule, file) {
    if (rule.fileExtension === fileExtension(file)) {
        return true;
    }

    var name = fileName(file);
    var suffix = "." + rule.fileExtension;
    return name.length >= suffix.length && name.slice(name.length - suffix.length) === suffix;
}

function selectedFilesFrom(context) {
    return context && Array.isArray(context.selectedFiles) ? context.selectedFiles : [];
}

function matchingFileActions(context) {
    var rules = configuredRules();
    var files = selectedFilesFrom(context);

    return files
        .map(function (file) {
            var extension = fileExtension(file);
            var rule = rules.find(function (candidate) {
                return candidate.fileExtension === extension || ruleMatchesFile(candidate, file);
            });

            return rule ? { file: file, rule: rule } : null;
        })
        .filter(function (item) {
            return !!item;
        });
}

function isAvailable(context) {
    return matchingFileActions(context).length > 0;
}

function performAction(context) {
    var actions = matchingFileActions(context);
    if (actions.length === 0) {
        SwiftBiu.showNotification("Open File With App", "No selected file matches the configured suffix rules.");
        return;
    }

    var openedCount = 0;
    var failedCount = 0;

    actions.forEach(function (action) {
        var path = action.file && action.file.path ? String(action.file.path) : "";
        if (!path) {
            failedCount += 1;
            return;
        }

        if (SwiftBiu.openFileWithApp(path, action.rule.appBundleID)) {
            openedCount += 1;
        } else {
            failedCount += 1;
        }
    });

    if (openedCount > 0 && failedCount === 0) {
        SwiftBiu.showNotification(
            "Open File With App",
            "Opening " + openedCount + " file" + (openedCount === 1 ? "." : "s.")
        );
    } else if (openedCount > 0) {
        SwiftBiu.showNotification(
            "Open File With App",
            "Opening " + openedCount + " file" + (openedCount === 1 ? "" : "s") + ", " + failedCount + " failed."
        );
    } else {
        SwiftBiu.showNotification("Open File With App", "Could not open the selected files with the configured apps.");
    }
}
