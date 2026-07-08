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

function pasteValue(value) {
    if (typeof SwiftBiu !== "undefined" && typeof SwiftBiu.pasteText === "function") {
        SwiftBiu.pasteText(value);
    }
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

function extractCodexDeltaText(payload) {
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

function extractNormalizedContent(result) {
    if (!result) return "";
    if (result.normalized && typeof result.normalized.content === "string") {
        return result.normalized.content;
    }
    if (result.response && typeof result.response.output_text === "string") {
        return result.response.output_text;
    }
    if (typeof result.output_text === "string") {
        return result.output_text;
    }
    return JSON.stringify(result, null, 2);
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
        console.log("[Codex Text] Streaming bubble APIs are not available, falling back to legacy paste.");
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
            if (requestOptions.provider !== "codex" && requestOptions.provider !== "openai-codex") {
                options.temperature = requestOptions.temperature;
            }

            if (systemPrompt.trim()) {
                options.messages.push({ role: "system", content: systemPrompt });
            }
            for (var i = 0; i < historyToSend.length; i++) {
                options.messages.push(historyToSend[i]);
            }

            console.log("[Codex Text] Starting streaming request via aiChatStream");

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
                                var deltaText = extractCodexDeltaText(payload);
                                if (deltaText) {
                                    accumulatedText += deltaText;
                                    hasUpdated = true;
                                }
                            } catch (e) {
                                console.log("[Codex Text] Error parsing event block: " + e.message);
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
                    var msg = error && (error.error || error.message) ? (error.error || error.message) : String(error);
                    failStreamingRequest(requestToken, msg);
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
            title: "Codex Text",
            mode: "append",
            allowFollowUp: true,
            systemPrompt: initialRequestOptions ? initialRequestOptions.systemPrompt : configString("systemPrompt", ""),
            systemPromptPlaceholder: "系统提示词...",
            userPrompt: initialRequestOptions ? initialRequestOptions.userPrompt : "",
            userPromptPlaceholder: "输入问题或需要处理的文本",
            userPromptVisible: true,
            promptVisible: !initialRequestOptions,
            state: initialRequestOptions ? "generating" : "ready",
            status: initialRequestOptions ? "Generating" : "Ready",
            text: initialRequestOptions ? "" : "请输入问题或选中文本后启动。",
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
                        provider: configString("chatProvider", "codex"),
                        model: configString("chatModel", "gpt-5.2-codex"),
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
                        provider: configString("chatProvider", "codex"),
                        model: configString("chatModel", "gpt-5.2-codex"),
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
                notify("Codex Text", "响应内容为空，无法应用。");
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

    var provider = configString("chatProvider", "codex");
    var model = configString("chatModel", "gpt-5.2-codex");
    var systemPrompt = configString("systemPrompt", "You are a concise assistant.");
    var temperature = configNumber("temperature", 0.3);

    var options = {
        provider: provider,
        model: model,
        useCase: "chat",
        messages: []
    };
    if (provider !== "codex" && provider !== "openai-codex") {
        options.temperature = temperature;
    }

    if (systemPrompt.trim()) {
        options.messages.push({ role: "system", content: systemPrompt });
    }
    options.messages.push({ role: "user", content: prompt });

    SwiftBiu.aiChat(
        options,
        function(result) {
            if (typeof SwiftBiu.hideLoadingIndicator === "function") {
                SwiftBiu.hideLoadingIndicator();
            }
            var text = extractNormalizedContent(result).trim();
            if (text.length > 0) {
                pasteValue(text);
                notify("Codex Text", "Response pasted successfully.");
            } else {
                notify("Codex Text", "The model returned an empty response.");
            }
        },
        function(error) {
            if (typeof SwiftBiu.hideLoadingIndicator === "function") {
                SwiftBiu.hideLoadingIndicator();
            }
            var msg = error && (error.error || error.message) ? (error.error || error.message) : String(error);
            notify("Codex Text Error", msg);
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
            notify("Codex Text", "Please select text or activate the floating bubble.");
        }
        return;
    }

    var bubbleID = presentAIResponseBubble(context, {
        provider: configString("chatProvider", "codex"),
        model: configString("chatModel", "gpt-5.2-codex"),
        temperature: configNumber("temperature", 0.3),
        systemPrompt: configString("systemPrompt", ""),
        userPrompt: prompt
    });

    if (bubbleID) {
        return;
    }

    runLegacyChat(prompt, context);
}
