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

function selectedFiles(context) {
    return context && Array.isArray(context.selectedFiles) ? context.selectedFiles : [];
}

function filePath(file) {
    if (!file) {
        return "";
    }
    return String(file.path || file.fileURL || file.url || file.name || "").trim();
}

function isAudioFile(file) {
    var value = String((file && [file.path, file.fileURL, file.fileName, file.name, file.fileExtension].join(" ")) || file || "").toLowerCase();
    return /\.(m4a|mp3|wav|aac|flac|ogg|opus|webm|mp4|mov)$/.test(value);
}

function firstAudioFile(context) {
    var files = selectedFiles(context);
    for (var index = 0; index < files.length; index += 1) {
        if (isAudioFile(files[index])) {
            return files[index];
        }
    }
    return null;
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

function stringifyResult(result) {
    return typeof result === "string" ? result : JSON.stringify(result, null, 2);
}

function audioSourceFrom(result) {
    if (!result) {
        return "";
    }
    if (typeof result.base64 === "string" && result.base64.length > 0) {
        return result.base64;
    }
    if (typeof result.audioURL === "string") {
        return result.audioURL;
    }
    if (typeof result.url === "string") {
        return result.url;
    }
    return "";
}

function showPendingAudio(prompt, model) {
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showInteractiveAudio === "function") {
        currentSessionID = SwiftBiu.showInteractiveAudio({
            prompt: prompt,
            selectionText: prompt,
            modelName: model,
            showsPendingPlaceholder: true,
            isGenerating: true,
            statusMessage: "正在生成音频..."
        }, function(event) {
            handleRegenerate(event);
        });
    }
}

function showAudio(result, prompt, model) {
    var source = audioSourceFrom(result);
    
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showInteractiveAudio === "function") {
        var audioOptions = {
            audioSource: source,
            prompt: prompt,
            selectionText: prompt,
            modelName: model
        };
        
        if (currentSessionID) {
            SwiftBiu.updateInteractiveAudio(currentSessionID, audioOptions);
        } else {
            currentSessionID = SwiftBiu.showInteractiveAudio(audioOptions, function(event) {
                handleRegenerate(event);
            });
        }
    }
}

function failAudio(message) {
    if (currentSessionID && typeof SwiftBiu !== "undefined" && typeof SwiftBiu.failInteractiveAudio === "function") {
        SwiftBiu.failInteractiveAudio(currentSessionID, message);
    } else {
        notify("xAI Voice Error", message);
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
        return "模型不支持语音能力";
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
        return withErrorDetail("当前模型不支持语音能力，请在插件设置里切换到 TTS 或 STT 模型。", detail);
    case "payloadTooLarge":
        return withErrorDetail("文本、音频文件或上下文过大，请缩短内容后重试。", detail);
    case "safety":
        return withErrorDetail("请求被服务商安全策略拦截，请调整内容后再试。", detail);
    case "network":
        return withErrorDetail("网络连接失败，请检查网络或代理后重试。", detail);
    case "timeout":
        return withErrorDetail("语音请求等待超时，请稍后重试。", detail);
    case "permission":
        return withErrorDetail("账号或授权范围不足，请重新授权或切换账号。", detail);
    default:
        return detail;
    }
}

function handleAuthReconnectAudioError(error, prompt, model) {
    var message = authReconnectMessage(error);
    if (currentSessionID && typeof SwiftBiu !== "undefined" && typeof SwiftBiu.updateInteractiveAudio === "function") {
        SwiftBiu.updateInteractiveAudio(currentSessionID, {
            prompt: prompt,
            selectionText: prompt,
            modelName: model,
            showsPendingPlaceholder: true,
            isGenerating: false,
            statusMessage: message
        });
    }
    notify("需要重新登录", message);
}

function handleAudioError(error, prompt, model) {
    if (isAuthReconnectError(error)) {
        handleAuthReconnectAudioError(error, prompt, model);
        return;
    }
    var message = aiErrorMessage(error);
    failAudio(message);
    if (currentSessionID) {
        notify(aiErrorTitle(error, "xAI Voice Error"), message);
    }
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
    generateAudio(prompt);
}

function generateAudio(prompt) {
    if (typeof SwiftBiu === "undefined" || (typeof SwiftBiu.aiTextToSpeech !== "function" && typeof SwiftBiu.aiTTS !== "function")) {
        notify("xAI Voice", "SwiftBiu text-to-speech is not available in this host version.");
        return;
    }

    var provider = configString("ttsProvider", "xai-oauth");
    var model = configString("ttsModel", "xai-tts");
    var voice = configString("voice", "eve");
    var format = configString("ttsFormat", "mp3");
    
    var options = {
        provider: provider,
        model: model,
        useCase: "tts",
        text: prompt,
        voice: voice,
        format: format
    };

    if (!currentSessionID) {
        showPendingAudio(prompt, model);
    } else {
        if (typeof SwiftBiu.updateInteractiveAudio === "function") {
            SwiftBiu.updateInteractiveAudio(currentSessionID, {
                prompt: prompt,
                selectionText: prompt,
                modelName: model,
                isGenerating: true,
                statusMessage: "正在重新生成音频..."
            });
        }
    }

    var successCallback = function(result) {
        console.log("xAI TTS success response: " + JSON.stringify(result, null, 2));
        showAudio(result, prompt, model);
    };

    var errorCallback = function(error) {
        console.log("xAI TTS error response: " + JSON.stringify(error, null, 2));
        handleAudioError(error, prompt, model);
    };

    if (typeof SwiftBiu.aiTextToSpeech === "function") {
        SwiftBiu.aiTextToSpeech(options, successCallback, errorCallback);
    } else {
        SwiftBiu.aiTTS(options, successCallback, errorCallback);
    }
}

function handleSTTResult(result, model) {
    var transcript = "";
    if (typeof result === "string") {
        transcript = result;
    } else if (result) {
        transcript = result.text || result.transcript || "";
    }
    pasteValue(transcript.length > 0 ? transcript : stringifyResult(result));
    notify("xAI STT", "Transcription pasted from " + model + ".");
}

function performSpeechToText(file) {
    var model = configString("sttModel", "grok-stt");
    var options = {
        provider: configString("sttProvider", "xai-oauth"),
        model: model,
        useCase: "stt",
        filePath: filePath(file),
        language: configString("language", "")
    };

    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.aiSpeechToText === "function") {
        SwiftBiu.aiSpeechToText(
            options,
            function(result) {
                console.log("xAI STT success response: " + JSON.stringify(result, null, 2));
                handleSTTResult(result, model);
            },
            function(error) {
                console.log("xAI STT error response: " + JSON.stringify(error, null, 2));
                notify(aiErrorTitle(error, "xAI STT Error"), aiErrorMessage(error));
            }
        );
        return;
    }

    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.aiTranscribe === "function") {
        SwiftBiu.aiTranscribe(
            options,
            function(result) {
                console.log("xAI STT success response: " + JSON.stringify(result, null, 2));
                handleSTTResult(result, model);
            },
            function(error) {
                console.log("xAI STT error response: " + JSON.stringify(error, null, 2));
                notify(aiErrorTitle(error, "xAI STT Error"), aiErrorMessage(error));
            }
        );
        return;
    }

    pasteValue([
        "SwiftBiu speech-to-text bridge is not available in this host version.",
        "The plugin model binding is ready; implement the native bridge to execute this request.",
        "",
        JSON.stringify(options, null, 2)
    ].join("\n"));
    notify("xAI STT", "Prepared an xAI STT request.");
}

function isAvailable(context) {
    return {
        isAvailable: true,
        isContextMatch: true // Always return true so the plugin is available even when no text or audio file is selected
    };
}

function performAction(context) {
    var file = firstAudioFile(context);
    if (file) {
        performSpeechToText(file);
        return;
    }

    var prompt = selectedText(context);
    var model = configString("ttsModel", "xai-tts");

    currentSessionID = "";

    if (prompt.length === 0) {
        if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showInteractiveAudio === "function") {
            currentSessionID = SwiftBiu.showInteractiveAudio({
                prompt: "",
                selectionText: "",
                modelName: model,
                showsPendingPlaceholder: true,
                isGenerating: false,
                statusMessage: "请输入要转换为语音的文本。"
            }, function(event) {
                handleRegenerate(event);
            });
        } else {
            notify("xAI Voice", "Select text for TTS or an audio/video file for STT.");
        }
        return;
    }
    
    generateAudio(prompt);
}
