/**
 * 检查插件在当前上下文是否可用。
 * @param {object} context - 包含当前选择信息的上下文对象。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */

function debugLog(message, details) {
    if (typeof details === "undefined") {
        console.log(`[GeminiText] ${message}`);
        return;
    }

    try {
        console.log(`[GeminiText] ${message}: ${JSON.stringify(details)}`);
    } catch (error) {
        console.log(`[GeminiText] ${message}:`, details);
    }
}

function isAvailable(context) {
    const selectedText = context && typeof context.selectedText === "string" ? context.selectedText.trim() : "";
    return {
        isAvailable: selectedText.length > 0 || isAIResponseUIEnabled(),
        isContextMatch: selectedText.length > 0
    };
}

const messages = [];
let lastChatDate = new Date();

function resetConversation() {
    messages.length = 0;
    SwiftBiu.showNotification("Gemini Conversation Reset", "The chat history has been cleared.");
}

function getBooleanConfig(key, fallbackValue) {
    const rawValue = SwiftBiu.getConfig(key);
    if (rawValue === true || rawValue === "true") {
        return true;
    }
    if (rawValue === false || rawValue === "false") {
        return false;
    }
    return fallbackValue;
}

function resolveInsertMode() {
    const mode = getBooleanConfig("pasteBehavior", true) ? "append" : "replace";
    debugLog("Resolved paste behavior", { mode });
    return mode;
}

function resolveSystemPrompt() {
    const overridePrompt = (SwiftBiu.getConfig("responseSystemPrompt") || "").trim();
    if (overridePrompt) {
        debugLog("Using responseSystemPrompt override", { length: overridePrompt.length });
        return overridePrompt;
    }
    return "";
}

function isAIResponseUIEnabled() {
    return getBooleanConfig("enableAIResponseUI", false);
}

function persistResponseUISettings(event) {
    if (!event || typeof event !== "object" || !SwiftBiu.setConfig) {
        return;
    }

    if (typeof event.systemPrompt === "string") {
        SwiftBiu.setConfig("responseSystemPrompt", event.systemPrompt);
    }

    if (typeof event.mode === "string") {
        SwiftBiu.setConfig("pasteBehavior", event.mode === "append" ? "true" : "false");
    }
}

function buildPasteContent(sourceText, assistantText, mode) {
    const trimmedSourceText = typeof sourceText === "string" ? sourceText.trim() : "";
    return mode === "replace" || !trimmedSourceText
        ? assistantText
        : trimmedSourceText + "\n\n" + assistantText;
}

function resolveModelConfig() {
    return SwiftBiu.getConfig("model") || "gemini-1.5-flash";
}

function extractGeminiResponseText(payload) {
    const candidate = payload && payload.candidates && payload.candidates[0];
    if (candidate && candidate.content && candidate.content.parts && candidate.content.parts[0]) {
        return candidate.content.parts[0].text || "";
    }
    return "";
}

function extractGeminiErrorMessage(payload, fallbackMessage) {
    return payload?.error?.message || fallbackMessage;
}

function consumeServerSentEvents(buffer) {
    const normalized = buffer.replace(/\r\n/g, "\n");
    const blocks = normalized.split("\n\n");
    const remainder = blocks.pop() || "";
    const events = [];

    for (const block of blocks) {
        if (!block.trim()) {
            continue;
        }

        let eventType = "message";
        const dataLines = [];
        for (const line of block.split("\n")) {
            if (!line || line.startsWith(":")) {
                continue;
            }

            if (line.startsWith("event:")) {
                eventType = line.slice(6).trim() || "message";
                continue;
            }

            if (line.startsWith("data:")) {
                dataLines.push(line.slice(5).trimStart());
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
        events,
        remainder
    };
}

function requestGeminiCompletion(options) {
    const {
        apiUrl,
        apiKey,
        model,
        systemPrompt,
        userPrompt,
        contextMessageCount,
        bubbleSessionID,
        mode,
        context
    } = options;

    const trimmedUserPrompt = typeof userPrompt === "string" ? userPrompt.trim() : "";
    if (!trimmedUserPrompt) {
        const errorMessage = "Selected text is empty.";
        if (bubbleSessionID && typeof SwiftBiu.failAIResponseBubble === "function") {
            SwiftBiu.failAIResponseBubble(bubbleSessionID, errorMessage);
        } else {
            SwiftBiu.showNotification("Input Error", errorMessage);
        }
        return;
    }

    const trimmedSystemPrompt = typeof systemPrompt === "string" ? systemPrompt.trim() : "";
    const combinedUserPrompt = trimmedSystemPrompt ? `${trimmedSystemPrompt} 我选择的内容是“${trimmedUserPrompt}”`.trim() : `我选择的内容是“${trimmedUserPrompt}”`.trim();

    if (!bubbleSessionID) {
        messages.push({ role: "user", content: combinedUserPrompt });
    }

    const historyToSend = [];
    if (contextMessageCount > 0 && messages.length > 0) {
        const sliceCount = contextMessageCount > messages.length ? messages.length : contextMessageCount;
        historyToSend.push(...messages.slice(-sliceCount));
    }
    historyToSend.push({ role: "user", content: combinedUserPrompt });

    const requestBody = {
        contents: historyToSend.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
        }))
    };

    const targetBaseUrl = apiUrl || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const targetUrl = `${targetBaseUrl}?key=${apiKey}`;

    debugLog("Sending Gemini legacy request", { targetUrl, bubbleSessionID });

    SwiftBiu.fetch(
        targetUrl,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        },
        (response) => {
            if (!bubbleSessionID) {
                SwiftBiu.hideLoadingIndicator();
            }

            try {
                const responseData = JSON.parse(response.data);
                if (responseData.error) {
                    throw new Error(responseData.error.message || "Unknown API error.");
                }

                const assistantText = extractGeminiResponseText(responseData);
                if (!assistantText) {
                    throw new Error("Invalid response structure from API.");
                }

                if (!bubbleSessionID) {
                    messages.push({ role: "model", content: assistantText });
                    lastChatDate = new Date();
                }

                if (bubbleSessionID) {
                    SwiftBiu.updateAIResponseBubble(bubbleSessionID, {
                        state: "ready",
                        status: "Ready",
                        text: assistantText,
                        allowSubmit: true,
                        animateText: true,
                        sessionUserContent: combinedUserPrompt,
                        sessionModelContent: assistantText
                    });
                    return;
                }

                SwiftBiu.pasteText(buildPasteContent(context.selectedText, assistantText, mode));
            } catch (error) {
                const message = `Failed to parse response: ${error.message}`;
                debugLog("Error in Gemini legacy request", { message: error.message });
                if (bubbleSessionID && typeof SwiftBiu.failAIResponseBubble === "function") {
                    SwiftBiu.failAIResponseBubble(bubbleSessionID, message);
                } else {
                    SwiftBiu.showNotification("API Error", message);
                }
                messages.pop();
            }
        },
        (error) => {
            if (!bubbleSessionID) {
                SwiftBiu.hideLoadingIndicator();
            }

            const errorMessage = error.error || error.message || "Unknown request error";
            debugLog("Error in API request", { errorMessage });
            if (bubbleSessionID && typeof SwiftBiu.failAIResponseBubble === "function") {
                SwiftBiu.failAIResponseBubble(bubbleSessionID, `Error: ${errorMessage}`);
            } else {
                SwiftBiu.showNotification("API Request Failed", `Error: ${errorMessage}`);
            }
            messages.pop();
        }
    );
}

function presentAIResponseBubble(context, initialMode, initialRequestOptions, launchOptions) {
    const forceOpen = launchOptions && launchOptions.forceOpen === true;
    if (!forceOpen && !isAIResponseUIEnabled()) {
        debugLog("AI Response UI is disabled, falling back to legacy.");
        return null;
    }

    if (
        typeof SwiftBiu.showAIResponseBubble !== "function" ||
        typeof SwiftBiu.updateAIResponseBubble !== "function" ||
        typeof SwiftBiu.fetchStream !== "function"
    ) {
        debugLog("Streaming bubble APIs not available, falling back to legacy.");
        return null;
    }

    function createStreamingRunner(sessionID) {
        let activeStreamID = "";
        let activeRequestToken = 0;

        function clearActiveStream(streamID) {
            if (activeStreamID === streamID) {
                activeStreamID = "";
            }
        }

        function cancelActiveStream() {
            if (!activeStreamID || typeof SwiftBiu.cancelFetchStream !== "function") {
                activeStreamID = "";
                return;
            }

            const streamIDToCancel = activeStreamID;
            activeStreamID = "";
            SwiftBiu.cancelFetchStream(streamIDToCancel);
        }

        function failStreamingRequest(requestToken, message) {
            if (requestToken !== activeRequestToken) {
                return;
            }

            activeStreamID = "";
            if (typeof SwiftBiu.failAIResponseBubble === "function") {
                SwiftBiu.failAIResponseBubble(sessionID, message);
            } else {
                SwiftBiu.updateAIResponseBubble(sessionID, {
                    state: "failed",
                    status: "Failed",
                    text: message,
                    allowSubmit: false
                });
            }
        }

        function run(requestOptions) {
            const {
                apiUrl,
                apiKey,
                model,
                systemPrompt,
                userPrompt,
                contextMessageCount,
                isRegenerate
            } = requestOptions;

            const trimmedUserPrompt = typeof userPrompt === "string" ? userPrompt.trim() : "";
            const trimmedSystemPrompt = typeof systemPrompt === "string" ? systemPrompt.trim() : "";

            if (!trimmedUserPrompt) {
                failStreamingRequest(activeRequestToken, "Selected text is empty.");
                return;
            }

            cancelActiveStream();
            const requestToken = activeRequestToken + 1;
            activeRequestToken = requestToken;

            let responseStatus = 0;
            let accumulatedText = "";
            let sseRemainder = "";
            let pendingErrorMessage = "";
            let hasShownThinking = false;

            SwiftBiu.updateAIResponseBubble(sessionID, {
                systemPrompt: trimmedSystemPrompt,
                userPrompt: trimmedUserPrompt,
                state: "generating",
                status: "Generating",
                text: "",
                allowSubmit: false,
                animateText: false
            });

            const combinedUserPrompt = isRegenerate
                ? (trimmedSystemPrompt ? `${trimmedSystemPrompt}\n${trimmedUserPrompt}`.trim() : trimmedUserPrompt)
                : (trimmedSystemPrompt ? `${trimmedSystemPrompt} 我选择的内容是“${trimmedUserPrompt}”`.trim() : `我选择的内容是“${trimmedUserPrompt}”`.trim());

            const historyToSend = [];
            if (contextMessageCount > 0 && messages.length > 0) {
                const sliceCount = contextMessageCount > messages.length ? messages.length : contextMessageCount;
                historyToSend.push(...messages.slice(-sliceCount));
            }
            historyToSend.push({ role: "user", content: combinedUserPrompt });

            const requestBody = {
                contents: historyToSend.map(msg => ({
                    role: msg.role === "user" ? "user" : "model",
                    parts: [{ text: msg.content }]
                }))
            };

            const baseTargetUrl = apiUrl || `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
            const streamTargetUrl = baseTargetUrl.replace(":generateContent", ":streamGenerateContent");
            const fetchUrl = `${streamTargetUrl}?alt=sse&key=${apiKey}`;

            debugLog("Starting streaming request", { fetchUrl, isRegenerate });

            const streamID = SwiftBiu.fetchStream(
                fetchUrl,
                {
                    method: "POST",
                    headers: {
                        "Accept": "text/event-stream",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(requestBody)
                },
                function onStreamEvent(event) {
                    if (requestToken !== activeRequestToken || !event || typeof event !== "object") {
                        return;
                    }

                    if (event.type === "response") {
                        responseStatus = typeof event.status === "number" ? event.status : 0;
                        return;
                    }

                    if (event.type === "cancelled") {
                        clearActiveStream(streamID);
                        return;
                    }

                    if (event.type === "data") {
                        const chunk = typeof event.data === "string" ? event.data : "";
                        if (!chunk) {
                            return;
                        }

                        sseRemainder += chunk;
                        const parsed = consumeServerSentEvents(sseRemainder);
                        sseRemainder = parsed.remainder;

                        let chunkHasText = false;
                        for (const sseEvent of parsed.events) {
                            if (sseEvent.data === "[DONE]") {
                                continue;
                            }

                            try {
                                const payload = JSON.parse(sseEvent.data);
                                const deltaText = extractGeminiResponseText(payload);
                                const payloadErrorMessage = extractGeminiErrorMessage(payload, "");

                                if (payloadErrorMessage && !deltaText) {
                                    pendingErrorMessage = payloadErrorMessage;
                                }

                                if (!deltaText) {
                                    continue;
                                }

                                chunkHasText = true;
                                accumulatedText += deltaText;
                                SwiftBiu.updateAIResponseBubble(sessionID, {
                                    systemPrompt: trimmedSystemPrompt,
                                    userPrompt: trimmedUserPrompt,
                                    state: "writing",
                                    status: "Drafting",
                                    text: accumulatedText,
                                    allowSubmit: false,
                                    animateText: false
                                });
                            } catch (error) {
                                debugLog("Failed to parse SSE payload", {
                                    message: error.message
                                });
                            }
                        }

                        if (!chunkHasText && !accumulatedText && parsed.events.length > 0 && !hasShownThinking) {
                            hasShownThinking = true;
                            SwiftBiu.updateAIResponseBubble(sessionID, {
                                systemPrompt: trimmedSystemPrompt,
                                userPrompt: trimmedUserPrompt,
                                state: "generating",
                                status: "Thinking",
                                text: "",
                                allowSubmit: false,
                                animateText: false
                            });
                        }
                        return;
                    }

                    if (event.type === "complete") {
                        clearActiveStream(streamID);

                        if (accumulatedText) {
                            SwiftBiu.updateAIResponseBubble(sessionID, {
                                systemPrompt: trimmedSystemPrompt,
                                userPrompt: trimmedUserPrompt,
                                state: "ready",
                                status: "Ready",
                                text: accumulatedText,
                                allowSubmit: true,
                                animateText: false,
                                sessionUserContent: combinedUserPrompt,
                                sessionModelContent: accumulatedText
                            });
                            return;
                        }

                        failStreamingRequest(
                            requestToken,
                            pendingErrorMessage || (responseStatus >= 400 ? `HTTP Error ${responseStatus}` : "Empty response content.")
                        );
                    }
                },
                function onStreamError(error) {
                    if (requestToken !== activeRequestToken) {
                        return;
                    }

                    clearActiveStream(streamID);
                    const errorMessage = error?.error || error?.message || "Network request failed";
                    debugLog("Streaming request failed", { errorMessage });
                    failStreamingRequest(requestToken, errorMessage);
                }
            );

            activeStreamID = streamID;
        }

        return {
            run,
            cancel: cancelActiveStream
        };
    }

    let sessionID = "";
    let streamRunner = null;
    let pendingSessionMessages = null;

    sessionID = SwiftBiu.showAIResponseBubble(
        {
            title: "Gemini",
            mode: initialMode,
            allowFollowUp: true,
            systemPrompt: initialRequestOptions?.systemPrompt || resolveSystemPrompt(),
            systemPromptPlaceholder: "系统提示词（建议复制扩展保存不同版本）",
            userPrompt: initialRequestOptions?.userPrompt || "",
            userPromptPlaceholder: "输入问题或需要处理的文本",
            userPromptVisible: true,
            promptVisible: !initialRequestOptions,
            state: initialRequestOptions ? "generating" : "ready",
            status: initialRequestOptions ? "Generating" : "Ready",
            text: initialRequestOptions ? "" : "请输入问题或文本后点击发送。",
            allowSubmit: false,
            submitLabel: "应用",
            replaceLabel: "替换",
            appendLabel: "追加"
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
                persistResponseUISettings(event);
                return;
            }

            if (event.type === "regenerate") {
                persistResponseUISettings(event);
                streamRunner?.run({
                    apiUrl: SwiftBiu.getConfig("apiurl") || "", // Leave blank so base is calculated dynamically
                    apiKey: SwiftBiu.getConfig("apikey"),
                    model: resolveModelConfig(),
                    contextMessageCount: parseInt(SwiftBiu.getConfig("contextMessageCount") || "0", 10),
                    systemPrompt: typeof event.systemPrompt === "string" && event.systemPrompt.trim()
                        ? event.systemPrompt.trim()
                        : resolveSystemPrompt(),
                    userPrompt: typeof event.userPrompt === "string" ? event.userPrompt : context.selectedText,
                    isRegenerate: true
                });
                return;
            }

            if (event.type !== "submit") {
                return;
            }

            persistResponseUISettings(event);

            const nextText = typeof event.text === "string" ? event.text.trim() : "";
            if (!nextText) {
                SwiftBiu.showNotification("Gemini", "响应内容为空，无法应用。");
                return;
            }

            if (pendingSessionMessages) {
                messages.push({ role: "user", content: pendingSessionMessages.user });
                messages.push({ role: "model", content: pendingSessionMessages.model });
                pendingSessionMessages = null;
            } else if (event.text && event.userPrompt) {
                // Safely construct fallback just in case
                messages.push({ role: "user", content: event.userPrompt });
                messages.push({ role: "model", content: event.text });
            }

            const mode = event.mode === "replace" ? "replace" : "append";
            SwiftBiu.pasteText(buildPasteContent(context.selectedText, nextText, mode));
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
            initialRequestOptions.isRegenerate = false;
            streamRunner.run(initialRequestOptions);
        }
    }

    return sessionID || null;
}

function performAction(context) {
    const apiKey = SwiftBiu.getConfig("apikey");
    const customApiUrl = SwiftBiu.getConfig("apiurl");
    const contextMessageCount = parseInt(SwiftBiu.getConfig("contextMessageCount") || "0", 10);
    const initialMode = resolveInsertMode();
    const systemPrompt = resolveSystemPrompt();
    const model = resolveModelConfig();
    const selectedText = context && typeof context.selectedText === "string" ? context.selectedText.trim() : "";

    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Please set your Gemini API Key in the plugin settings.");
        return;
    }

    if (!selectedText) {
        const bubbleSessionID = presentAIResponseBubble(context, initialMode, null, { forceOpen: true });
        if (!bubbleSessionID) {
            SwiftBiu.showNotification("Input Error", "Please select text or enter a prompt in the Gemini bubble.");
        }
        return;
    }

    if (selectedText.toLowerCase() === "reset chat") {
        resetConversation();
        return;
    }

    const bubbleSessionID = presentAIResponseBubble(context, initialMode, {
        apiUrl: customApiUrl,
        apiKey,
        model,
        systemPrompt,
        userPrompt: selectedText,
        contextMessageCount
    });

    if (bubbleSessionID) {
        return;
    }

    SwiftBiu.showLoadingIndicator(context.screenPosition);
    requestGeminiCompletion({
        apiUrl: customApiUrl,
        apiKey,
        model,
        systemPrompt,
        userPrompt: selectedText,
        contextMessageCount,
        bubbleSessionID: null,
        mode: initialMode,
        context
    });
}
