var currentSessionID = "";

function selectedText(context) {
    if (!context) {
        return "";
    }
    if (typeof context.selectedText === "string") {
        return context.selectedText.trim();
    }
    if (typeof context.text === "string") {
        return context.text.trim();
    }
    return "";
}

function configString(key, fallbackValue) {
    var value = "";
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.getConfig === "function") {
        value = SwiftBiu.getConfig(key);
    }
    if (value === null || value === undefined) {
        return fallbackValue;
    }
    value = String(value).trim();
    return value.length > 0 ? value : fallbackValue;
}

function configNumber(key, fallbackValue) {
    var value = Number(configString(key, String(fallbackValue)));
    return isFinite(value) ? value : fallbackValue;
}

function notify(title, message) {
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showNotification === "function") {
        SwiftBiu.showNotification(title, message);
    }
}

function pasteValue(value) {
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.pasteText === "function") {
        SwiftBiu.pasteText(value);
    }
}

function videoURLFrom(result) {
    if (!result) {
        return "";
    }
    if (typeof result.videoURL === "string") {
        return result.videoURL;
    }
    if (typeof result.url === "string") {
        return result.url;
    }
    if (result.video && typeof result.video.url === "string") {
        return result.video.url;
    }
    return "";
}

function showPending(prompt, model, aspectRatio) {
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showInteractiveVideo === "function") {
        currentSessionID = SwiftBiu.showInteractiveVideo({
            prompt: prompt,
            selectionText: prompt,
            modelName: model,
            aspectRatio: aspectRatio,
            showsPendingPlaceholder: true,
            isGenerating: true,
            statusMessage: "正在生成视频..."
        }, function(event) {
            handleRegenerate(event);
        });
    }
}

function showVideo(result, prompt, model) {
    var url = videoURLFrom(result);
    
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showInteractiveVideo === "function") {
        var videoOptions = {
            videoURL: url,
            prompt: prompt,
            selectionText: prompt,
            modelName: model
        };
        
        if (currentSessionID) {
            SwiftBiu.updateInteractiveVideo(currentSessionID, videoOptions);
        } else {
            currentSessionID = SwiftBiu.showInteractiveVideo(videoOptions, function(event) {
                handleRegenerate(event);
            });
        }
    }
}

function failVideo(message) {
    if (currentSessionID && typeof SwiftBiu !== "undefined" && typeof SwiftBiu.failInteractiveVideo === "function") {
        SwiftBiu.failInteractiveVideo(currentSessionID, message);
    } else {
        notify("xAI Video Error", message);
    }
}

function isAuthReconnectError(error) {
    return !!error && typeof error === "object" && (
        error.code === "auth_reconnect_required" ||
        error.requiresSignIn === true ||
        error.action === "sign_in_again"
    );
}

function authReconnectMessage(error) {
    var providerName = error && error.providerDisplayName ? String(error.providerDisplayName) : "AI 服务商";
    return providerName + " 登录已过期，请在 SwiftBiu 设置 > AI 服务商与授权 中点击“重新登录”。";
}

function aiErrorKind(error) {
    if (!error || typeof error !== "object") {
        return "";
    }
    var marker = String(error.errorKind || error.kind || error.code || error.recoverability || "").toLowerCase();
    if (marker === "ratelimited" || marker.indexOf("rate_limit") >= 0 || marker.indexOf("rate_limited") >= 0) {
        return "rateLimited";
    }
    if (marker.indexOf("quota") >= 0 || marker.indexOf("billing") >= 0 || marker.indexOf("credit") >= 0) {
        return "quota";
    }
    if (marker.indexOf("providerdown") >= 0 || marker.indexOf("provider_down") >= 0 || marker.indexOf("server") >= 0) {
        return "providerDown";
    }
    if (marker.indexOf("badconfig") >= 0 || marker.indexOf("bad_config") >= 0 || marker.indexOf("configuration") >= 0) {
        return "badConfig";
    }
    if (marker.indexOf("unsupportedmodel") >= 0 || marker.indexOf("unsupported_model") >= 0 || marker.indexOf("model_not_found") >= 0) {
        return "unsupportedModel";
    }
    if (marker.indexOf("payloadtoolarge") >= 0 || marker.indexOf("payload_too_large") >= 0 || marker.indexOf("context_length") >= 0) {
        return "payloadTooLarge";
    }
    if (marker.indexOf("safety") >= 0 || marker.indexOf("policy") >= 0 || marker.indexOf("content_filter") >= 0) {
        return "safety";
    }
    if (marker.indexOf("network") >= 0) {
        return "network";
    }
    if (marker.indexOf("timeout") >= 0 || marker.indexOf("timed_out") >= 0) {
        return "timeout";
    }
    if (marker.indexOf("permission") >= 0 || marker.indexOf("scope") >= 0) {
        return "permission";
    }
    return "";
}

function rawAIErrorMessage(error) {
    if (error && typeof error === "object") {
        return String(error.error || error.message || "未知 AI 错误");
    }
    return String(error);
}

function withErrorDetail(message, detail) {
    if (!detail || detail === message) {
        return message;
    }
    return message + "\n\n详情：" + detail;
}

function aiErrorTitle(error, fallbackTitle) {
    if (isAuthReconnectError(error)) {
        return "需要重新登录";
    }
    switch (aiErrorKind(error)) {
    case "rateLimited":
        return "请求太频繁";
    case "quota":
        return "额度或账单需要处理";
    case "providerDown":
        return "AI 服务暂时不可用";
    case "badConfig":
        return "AI 服务商配置需要检查";
    case "unsupportedModel":
        return "模型不支持视频生成";
    case "payloadTooLarge":
        return "请求内容过长";
    case "safety":
        return "内容被安全策略拦截";
    case "network":
        return "网络连接异常";
    case "timeout":
        return "请求超时";
    case "permission":
        return "授权权限不足";
    default:
        return fallbackTitle;
    }
}

function aiErrorMessage(error) {
    if (isAuthReconnectError(error)) {
        return authReconnectMessage(error);
    }
    var detail = rawAIErrorMessage(error);
    switch (aiErrorKind(error)) {
    case "rateLimited":
        return withErrorDetail("请求过于频繁，请稍后再试。", detail);
    case "quota":
        return withErrorDetail("服务商额度不足或账单受限，请检查对应账号的余额、订阅或用量限制。", detail);
    case "providerDown":
        return withErrorDetail("AI 服务商当前不可用或繁忙，请稍后重试。", detail);
    case "badConfig":
        return withErrorDetail("AI 服务商配置可能不正确，请检查 Base URL、API 格式和密钥。", detail);
    case "unsupportedModel":
        return withErrorDetail("当前模型不支持视频生成，请在插件设置里切换到视频模型。", detail);
    case "payloadTooLarge":
        return withErrorDetail("提示词或上下文过长，请缩短内容后重试。", detail);
    case "safety":
        return withErrorDetail("请求被服务商安全策略拦截，请调整提示词后再试。", detail);
    case "network":
        return withErrorDetail("网络连接失败，请检查网络或代理后重试。", detail);
    case "timeout":
        return withErrorDetail("视频生成等待超时，请稍后重试。", detail);
    case "permission":
        return withErrorDetail("账号或授权范围不足，请重新授权或切换账号。", detail);
    default:
        return detail;
    }
}

function handleAuthReconnectError(error, prompt, model, aspectRatio) {
    var message = authReconnectMessage(error);
    if (currentSessionID && typeof SwiftBiu !== "undefined" && typeof SwiftBiu.updateInteractiveVideo === "function") {
        SwiftBiu.updateInteractiveVideo(currentSessionID, {
            prompt: prompt,
            selectionText: prompt,
            modelName: model,
            aspectRatio: aspectRatio,
            showsPendingPlaceholder: true,
            isGenerating: false,
            statusMessage: message
        });
    }
    notify("需要重新登录", message);
}

function handleVideoError(error, prompt, model, aspectRatio) {
    if (isAuthReconnectError(error)) {
        handleAuthReconnectError(error, prompt, model, aspectRatio);
        return;
    }
    var message = aiErrorMessage(error);
    failVideo(message);
    if (currentSessionID) {
        notify(aiErrorTitle(error, "xAI Video Error"), message);
    }
}

function isAvailable(context) {
    return {
        isAvailable: true,
        isContextMatch: true // Always return true so the plugin is available even when no text is selected
    };
}

function handleRegenerate(event) {
    if (!event || typeof event !== "object") {
        return;
    }
    var prompt = typeof event.prompt === "string" ? event.prompt.trim() : "";
    var sessionID = typeof event.sessionID === "string" ? event.sessionID : "";
    if (!prompt || !sessionID) {
        return;
    }
    
    currentSessionID = sessionID;
    generateVideo(prompt);
}

function generateVideo(prompt) {
    if (typeof SwiftBiu === "undefined" || typeof SwiftBiu.aiVideoGenerate !== "function") {
        notify("xAI Video", "SwiftBiu.aiVideoGenerate is not available in this host version.");
        return;
    }

    var provider = configString("videoProvider", "xai-oauth");
    var model = configString("videoModel", "grok-imagine-video");
    var aspectRatio = configString("aspectRatio", "16:9");
    var durationSeconds = configNumber("durationSeconds", 6);
    var resolution = configString("resolution", "medium");
    
    var options = {
        provider: provider,
        model: model,
        useCase: "videoGeneration",
        prompt: prompt,
        aspectRatio: aspectRatio,
        durationSeconds: durationSeconds,
        resolution: resolution
    };

    if (!currentSessionID) {
        showPending(prompt, model, aspectRatio);
    } else {
        if (typeof SwiftBiu.updateInteractiveVideo === "function") {
            SwiftBiu.updateInteractiveVideo(currentSessionID, {
                prompt: prompt,
                selectionText: prompt,
                modelName: model,
                isGenerating: true,
                statusMessage: "正在重新生成视频..."
            });
        }
    }

    SwiftBiu.aiVideoGenerate(
        options,
        function(result) {
            console.log("xAI Video success response: " + JSON.stringify(result, null, 2));
            showVideo(result, prompt, model);
        },
        function(error) {
            console.log("xAI Video error response: " + JSON.stringify(error, null, 2));
            handleVideoError(error, prompt, model, aspectRatio);
        }
    );
}

function performAction(context) {
    var prompt = selectedText(context);
    var model = configString("videoModel", "grok-imagine-video");
    var aspectRatio = configString("aspectRatio", "16:9");

    currentSessionID = "";

    if (prompt.length === 0) {
        if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showInteractiveVideo === "function") {
            currentSessionID = SwiftBiu.showInteractiveVideo({
                prompt: "",
                selectionText: "",
                modelName: model,
                aspectRatio: aspectRatio,
                showsPendingPlaceholder: true,
                isGenerating: false,
                statusMessage: "请输入提示词以生成视频。"
            }, function(event) {
                handleRegenerate(event);
            });
        } else {
            notify("xAI Video", "Select a prompt before running this action.");
        }
        return;
    }
    
    generateVideo(prompt);
}
