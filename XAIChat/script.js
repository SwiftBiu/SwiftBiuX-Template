var chatHistory = [];

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

function isConfigEnabled(key, fallbackValue) {
    return configString(key, fallbackValue ? "true" : "false").toLowerCase() === "true";
}

function notify(title, message) {
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.showNotification === "function") {
        SwiftBiu.showNotification(title, message);
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
    var providerName = error && error.providerDisplayName ? String(error.providerDisplayName) : "AI provider";
    return providerName + " login expired. Open SwiftBiu Settings > AI Providers & Authorizations and click Sign In Again.";
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

function withErrorDetail(message, detail) {
    if (!detail || detail === message) {
        return message;
    }
    return message + "\n\nDetails: " + detail;
}

function aiErrorTitle(error, fallbackTitle) {
    if (isAuthReconnectError(error)) {
        return "Sign In Again Required";
    }
    switch (aiErrorKind(error)) {
    case "rateLimited":
        return "Too Many Requests";
    case "quota":
        return "Quota or Billing Issue";
    case "providerDown":
        return "AI Provider Unavailable";
    case "badConfig":
        return "Provider Configuration Issue";
    case "unsupportedModel":
        return "Unsupported Model";
    case "payloadTooLarge":
        return "Request Too Large";
    case "safety":
        return "Safety Policy Blocked";
    case "network":
        return "Network Error";
    case "timeout":
        return "Request Timed Out";
    case "permission":
        return "Permission Required";
    default:
        return fallbackTitle;
    }
}

function aiErrorMessage(error) {
    if (isAuthReconnectError(error)) {
        return authReconnectMessage(error);
    }
    var detail = error && typeof error === "object"
        ? String(error.error || error.message || "Unknown AI error")
        : String(error);
    switch (aiErrorKind(error)) {
    case "rateLimited":
        return withErrorDetail("Too many requests. Wait a moment and try again.", detail);
    case "quota":
        return withErrorDetail("The provider quota or billing limit has been reached. Check the account balance, plan, or usage limits.", detail);
    case "providerDown":
        return withErrorDetail("The AI provider is temporarily unavailable or overloaded. Try again later.", detail);
    case "badConfig":
        return withErrorDetail("The provider configuration may be incorrect. Check the Base URL, API format, and credential.", detail);
    case "unsupportedModel":
        return withErrorDetail("This model does not support the requested AI capability. Choose a compatible model in the plugin settings.", detail);
    case "payloadTooLarge":
        return withErrorDetail("The input or conversation is too large. Shorten it and try again.", detail);
    case "safety":
        return withErrorDetail("The request was blocked by the provider safety policy. Revise the text and try again.", detail);
    case "network":
        return withErrorDetail("The network request failed. Check your connection or proxy and try again.", detail);
    case "timeout":
        return withErrorDetail("The request timed out. Try again in a moment.", detail);
    case "permission":
        return withErrorDetail("The account or authorization scope is missing permission for this request. Reconnect or switch accounts.", detail);
    default:
        return detail;
    }
}

function extractContent(result) {
    if (typeof result === "string") {
        try {
            var parsed = JSON.parse(result);
            if (parsed && typeof parsed === "object") {
                return extractContent(parsed);
            }
        } catch (e) {}
        return result;
    }
    if (!result) {
        return "";
    }
    if (result.normalized && typeof result.normalized.content === "string") {
        return result.normalized.content;
    }
    if (result.json) {
        return extractContent(result.json);
    }
    if (typeof result.data === "string" && result.data.trim().length > 0) {
        try {
            var parsedData = JSON.parse(result.data);
            if (parsedData && typeof parsedData === "object") {
                var extracted = extractContent(parsedData);
                if (extracted && extracted !== result.data) {
                    return extracted;
                }
            }
        } catch (e) {}
        return result.data;
    }
    if (typeof result.output_text === "string") {
        return result.output_text;
    }
    if (typeof result.text === "string") {
        return result.text;
    }
    if (result.message && typeof result.message.content === "string") {
        return result.message.content;
    }
    if (result.choices && result.choices.length > 0) {
        var choice = result.choices[0];
        if (choice.message && typeof choice.message.content === "string") {
            return choice.message.content;
        }
        if (typeof choice.text === "string") {
            return choice.text;
        }
    }
    return JSON.stringify(result, null, 2);
}

function consumeServerSentEvents(buffer) {
    var normalized = buffer.replace(/\r\n/g, "\n");
    var blocks = normalized.split("\n\n");
    var remainder = blocks.pop() || "";
    var events = [];

    for (var i = 0; i < blocks.length; i++) {
        var block = blocks[i];
        if (!block.trim()) {
            continue;
        }

        var eventType = "message";
        var dataLines = [];
        var lines = block.split("\n");
        for (var j = 0; j < lines.length; j++) {
            var line = lines[j];
            if (!line || line.indexOf(":") === 0) {
                continue;
            }

            if (line.indexOf("event:") === 0) {
                eventType = line.slice(6).trim() || "message";
                continue;
            }

            if (line.indexOf("data:") === 0) {
                dataLines.push(line.slice(5).replace(/^\s+/, ""));
            }
        }

        if (!dataLines.length) {
            continue;
        }

        events.push({
            event: eventType,
            data: dataLines.join("\n")
        });
    }

    return {
        events: events,
        remainder: remainder
    };
}

function extractAIDeltaText(payload) {
    if (!payload) return "";

    if (typeof payload.delta === "string") {
        return payload.delta;
    }
    if (payload.response && typeof payload.response.output_text === "string") {
        return payload.response.output_text;
    }
    if (typeof payload.output_text === "string") {
        return payload.output_text;
    }
    if (typeof payload.text === "string") {
        return payload.text;
    }
    if (Array.isArray(payload.output)) {
        var text = "";
        for (var i = 0; i < payload.output.length; i++) {
            var item = payload.output[i];
            if (item && typeof item.text === "string") {
                text += item.text;
            } else if (item && typeof item.output_text === "string") {
                text += item.output_text;
            }
        }
        return text;
    }
    return "";
}

function handleAuthReconnectBubble(sessionID, error) {
    var message = authReconnectMessage(error);
    if (sessionID && typeof SwiftBiu.updateAIResponseBubble === "function") {
        SwiftBiu.updateAIResponseBubble(sessionID, {
            state: "ready",
            status: "Sign In Required",
            text: "",
            allowSubmit: true,
            animateText: false
        });
    }
    notify("Sign In Again Required", message);
}

function pasteValue(value) {
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.pasteText === "function") {
        SwiftBiu.pasteText(value);
    }
}

function presentAIResponseBubble(context, initialRequestOptions) {
    if (!isConfigEnabled("enableAIResponseUI", true)) {
        return null;
    }

    if (
        typeof SwiftBiu.showAIResponseBubble !== "function" ||
        typeof SwiftBiu.updateAIResponseBubble !== "function" ||
        typeof SwiftBiu.aiChatStream !== "function"
    ) {
        console.log("[xAI Chat] Streaming bubble APIs are not available, falling back to legacy paste.");
        return null;
    }

    function createStreamingRunner(sessionID) {
        var activeStreamID = "";
        var activeRequestToken = 0;

        function cancelActiveStream() {
            if (activeStreamID && typeof SwiftBiu.cancelFetchStream === "function") {
                SwiftBiu.cancelFetchStream(activeStreamID);
            }
            activeStreamID = "";
        }

        function failStreamingRequest(requestToken, message) {
            if (requestToken !== activeRequestToken) {
                return;
            }
            activeStreamID = "";
            SwiftBiu.failAIResponseBubble(sessionID, message);
        }

        function run(requestOptions) {
            var model = requestOptions.model;
            var systemPrompt = requestOptions.systemPrompt || "";
            var userPrompt = requestOptions.userPrompt || "";

            if (!userPrompt.trim()) {
                failStreamingRequest(activeRequestToken, "Selected text is empty.");
                return;
            }

            cancelActiveStream();
            var requestToken = activeRequestToken + 1;
            activeRequestToken = requestToken;

            var accumulatedText = "";
            var sseRemainder = "";
            var pendingErrorMessage = "";

            SwiftBiu.updateAIResponseBubble(sessionID, {
                systemPrompt: systemPrompt,
                userPrompt: userPrompt,
                state: "generating",
                status: "Generating",
                text: "",
                allowSubmit: false,
                animateText: false
            });

            var historyToSend = [];
            for (var i = 0; i < chatHistory.length; i++) {
                historyToSend.push(chatHistory[i]);
            }
            historyToSend.push({ role: "user", content: userPrompt });

            var options = {
                provider: requestOptions.provider,
                model: model,
                useCase: "chat",
                stream: true,
                messages: []
            };
            options.temperature = requestOptions.temperature;

            if (isConfigEnabled("enableXSearch")) {
                options.tools = [
                    {
                        type: "x_search"
                    }
                ];
            }

            if (systemPrompt.trim()) {
                options.messages.push({ role: "system", content: systemPrompt });
            }
            for (var i = 0; i < historyToSend.length; i++) {
                options.messages.push(historyToSend[i]);
            }

            console.log("[xAI Chat] Starting streaming request via aiChatStream");

            var streamID = SwiftBiu.aiChatStream(
                options,
                function onStreamEvent(event) {
                    if (requestToken !== activeRequestToken || !event || typeof event !== "object") {
                        return;
                    }

                    if (event.type === "response") {
                        if (typeof event.status === "number" && (event.status < 200 || event.status >= 300)) {
                            pendingErrorMessage = "HTTP Error " + event.status;
                        }
                        return;
                    }

                    if (event.type === "cancelled") {
                        if (activeStreamID === streamID) {
                            activeStreamID = "";
                        }
                        return;
                    }

                    if (event.type === "data") {
                        var chunk = typeof event.data === "string" ? event.data : "";
                        if (!chunk) return;

                        if (pendingErrorMessage) {
                            pendingErrorMessage += ": " + chunk;
                            return;
                        }

                        sseRemainder += chunk;
                        var parsed = consumeServerSentEvents(sseRemainder);
                        sseRemainder = parsed.remainder;

                        var hasUpdated = false;
                        for (var k = 0; k < parsed.events.length; k++) {
                            var sseEvent = parsed.events[k];
                            if (sseEvent.data === "[DONE]") continue;

                            try {
                                var payload = JSON.parse(sseEvent.data);
                                var deltaText = extractAIDeltaText(payload);
                                if (deltaText) {
                                    accumulatedText += deltaText;
                                    hasUpdated = true;
                                }
                            } catch (e) {
                                console.log("[xAI Chat] Error parsing event block: " + e.message);
                            }
                        }

                        if (hasUpdated) {
                            SwiftBiu.updateAIResponseBubble(sessionID, {
                                state: "writing",
                                status: "Drafting",
                                text: accumulatedText,
                                allowSubmit: false,
                                animateText: false
                            });
                        }
                        return;
                    }

                    if (event.type === "complete") {
                        if (activeStreamID === streamID) {
                            activeStreamID = "";
                        }

                        if (pendingErrorMessage) {
                            failStreamingRequest(requestToken, pendingErrorMessage);
                        } else if (accumulatedText) {
                            pendingSessionMessages = {
                                user: userPrompt,
                                model: accumulatedText
                            };
                            SwiftBiu.updateAIResponseBubble(sessionID, {
                                state: "ready",
                                status: "Ready",
                                text: accumulatedText,
                                allowSubmit: true,
                                animateText: false,
                                sessionUserContent: userPrompt,
                                sessionModelContent: accumulatedText
                            });
                        } else {
                            failStreamingRequest(requestToken, "Empty response or authorization error.");
                        }
                    }
                },
                function onStreamError(error) {
                    if (requestToken !== activeRequestToken) {
                        return;
                    }
                    if (activeStreamID === streamID) {
                        activeStreamID = "";
                    }
                    if (isAuthReconnectError(error)) {
                        handleAuthReconnectBubble(sessionID, error);
                        return;
                    }
                    var msg = aiErrorMessage(error);
                    failStreamingRequest(requestToken, msg);
                    notify(aiErrorTitle(error, "xAI Chat Error"), msg);
                }
            );

            activeStreamID = streamID;
        }

        return {
            run: run,
            cancel: cancelActiveStream
        };
    }

    var streamRunner = null;
    var pendingSessionMessages = null;
    var selectedSourceText = context && typeof context.selectedText === "string" ? context.selectedText : "";

    var sessionID = SwiftBiu.showAIResponseBubble(
        {
            title: "xAI Chat",
            mode: "append",
            allowFollowUp: true,
            systemPrompt: initialRequestOptions ? initialRequestOptions.systemPrompt : configString("systemPrompt", ""),
            systemPromptPlaceholder: "System prompt...",
            userPrompt: initialRequestOptions ? initialRequestOptions.userPrompt : "",
            userPromptPlaceholder: "Ask a follow-up or enter prompt",
            userPromptVisible: true,
            promptVisible: !initialRequestOptions,
            state: initialRequestOptions ? "generating" : "ready",
            status: initialRequestOptions ? "Generating" : "Ready",
            text: initialRequestOptions ? "" : "Ask a question or select text to start.",
            allowSubmit: false,
            submitLabel: "Apply",
            replaceLabel: "Replace",
            appendLabel: "Append"
        },
        function onBubbleEvent(event) {
            if (!event || typeof event !== "object") {
                return;
            }

            if (event.sessionUserContent && event.text) {
                pendingSessionMessages = {
                    user: event.sessionUserContent,
                    model: event.text
                };
            }

            if (event.type === "configChanged") {
                if (typeof event.systemPrompt === "string") {
                    SwiftBiu.setConfig("systemPrompt", event.systemPrompt);
                }
                return;
            }

            if (event.type === "regenerate") {
                if (typeof event.systemPrompt === "string") {
                    SwiftBiu.setConfig("systemPrompt", event.systemPrompt);
                }
                if (streamRunner) {
                    streamRunner.run({
                        provider: configString("textProvider", "xai-oauth"),
                        model: configString("textModel", "grok-4.3"),
                        temperature: configNumber("temperature", 0.3),
                        systemPrompt: typeof event.systemPrompt === "string" ? event.systemPrompt : configString("systemPrompt", ""),
                        userPrompt: typeof event.userPrompt === "string" ? event.userPrompt : selectedSourceText,
                        isRegenerate: true
                    });
                }
                return;
            }

            if (event.type === "followup") {
                if (typeof event.systemPrompt === "string") {
                    SwiftBiu.setConfig("systemPrompt", event.systemPrompt);
                }

                var previousText = typeof event.text === "string" ? event.text.trim() : "";
                if (pendingSessionMessages) {
                    chatHistory.push({ role: "user", content: pendingSessionMessages.user });
                    chatHistory.push({ role: "assistant", content: previousText || pendingSessionMessages.model });
                    pendingSessionMessages = null;
                } else if (typeof event.previousUserPrompt === "string" && event.previousUserPrompt.trim() && previousText) {
                    chatHistory.push({ role: "user", content: event.previousUserPrompt.trim() });
                    chatHistory.push({ role: "assistant", content: previousText });
                }

                if (streamRunner) {
                    streamRunner.run({
                        provider: configString("textProvider", "xai-oauth"),
                        model: configString("textModel", "grok-4.3"),
                        temperature: configNumber("temperature", 0.3),
                        systemPrompt: typeof event.systemPrompt === "string" ? event.systemPrompt : configString("systemPrompt", ""),
                        userPrompt: typeof event.followUpPrompt === "string" ? event.followUpPrompt : event.userPrompt,
                        isRegenerate: false
                    });
                }
                return;
            }

            if (event.type !== "submit") {
                return;
            }

            var nextText = typeof event.text === "string" ? event.text.trim() : "";
            if (!nextText) {
                notify("xAI Chat", "Response content is empty, cannot apply.");
                return;
            }

            if (pendingSessionMessages) {
                chatHistory.push({ role: "user", content: pendingSessionMessages.user });
                chatHistory.push({ role: "assistant", content: pendingSessionMessages.model });
                pendingSessionMessages = null;
            } else if (event.text && event.userPrompt) {
                chatHistory.push({ role: "user", content: event.userPrompt });
                chatHistory.push({ role: "assistant", content: event.text });
            }

            var pasteMode = event.mode === "replace" ? "replace" : "append";
            var finalPaste = pasteMode === "replace" || !selectedSourceText ? nextText : selectedSourceText + "\n\n" + nextText;

            pasteValue(finalPaste);

            SwiftBiu.updateAIResponseBubble(sessionID, {
                state: "applied",
                status: "Applied",
                text: nextText,
                allowSubmit: false
            });
        }
    );

    if (sessionID) {
        streamRunner = createStreamingRunner(sessionID);
        if (initialRequestOptions) {
            streamRunner.run(initialRequestOptions);
        }
    }

    return sessionID;
}

function runLegacyChat(prompt, context) {
    if (typeof SwiftBiu.showLoadingIndicator === "function") {
        SwiftBiu.showLoadingIndicator(context.screenPosition);
    }

    var provider = configString("textProvider", "xai-oauth");
    var model = configString("textModel", "grok-4.3");
    var systemPrompt = configString("systemPrompt", "You are a concise assistant.");
    var temperature = configNumber("temperature", 0.3);

    var options = {
        provider: provider,
        model: model,
        useCase: "chat",
        temperature: temperature,
        messages: []
    };

    if (systemPrompt.trim()) {
        options.messages.push({ role: "system", content: systemPrompt });
    }
    options.messages.push({ role: "user", content: prompt });

    if (isConfigEnabled("enableXSearch")) {
        options.tools = [
            {
                type: "x_search"
            }
        ];
    }

    SwiftBiu.aiChat(
        options,
        function(result) {
            if (typeof SwiftBiu.hideLoadingIndicator === "function") {
                SwiftBiu.hideLoadingIndicator();
            }
            var text = extractContent(result).trim();
            if (text.length > 0) {
                pasteValue(text);
                notify("xAI Chat", "Response pasted from " + model + ".");
            } else {
                notify("xAI Chat", "The model returned an empty response.");
            }
        },
        function(error) {
            if (typeof SwiftBiu.hideLoadingIndicator === "function") {
                SwiftBiu.hideLoadingIndicator();
            }
            if (isAuthReconnectError(error)) {
                notify("Sign In Again Required", authReconnectMessage(error));
                return;
            }
            notify(aiErrorTitle(error, "xAI Chat Error"), aiErrorMessage(error));
        }
    );
}

function isAvailable(context) {
    return {
        isAvailable: true,
        isContextMatch: selectedText(context).length > 0
    };
}

function performAction(context) {
    context = context || {};
    var prompt = selectedText(context);

    if (prompt.length === 0) {
        var emptyBubbleID = presentAIResponseBubble(context, null);
        if (!emptyBubbleID) {
            notify("xAI Chat", "Please select text or activate the floating bubble.");
        }
        return;
    }

    var bubbleID = presentAIResponseBubble(context, {
        provider: configString("textProvider", "xai-oauth"),
        model: configString("textModel", "grok-4.3"),
        temperature: configNumber("temperature", 0.3),
        systemPrompt: configString("systemPrompt", ""),
        userPrompt: prompt
    });

    if (bubbleID) {
        return;
    }

    runLegacyChat(prompt, context);
}
