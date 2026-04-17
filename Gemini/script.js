/**
 * 检查插件在当前上下文是否可用。
 * @param {object} context - 包含当前选择信息的上下文对象。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    return context.selectedText.trim().length > 0;
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
    return getBooleanConfig("pasteBehavior", true) ? "append" : "replace";
}

function resolveSystemPrompt() {
    const overridePrompt = (SwiftBiu.getConfig("responseSystemPrompt") || "").trim();
    if (overridePrompt) {
        return overridePrompt;
    }

    const systemRolesConfig = SwiftBiu.getConfig("systemRoles");
    if (!systemRolesConfig) {
        return "";
    }

    try {
        const roles = JSON.parse(systemRolesConfig);
        return roles
            .filter(role => role.enabled)
            .map(role => role.value)
            .join(" ")
            .trim();
    } catch (error) {
        console.log("Could not parse system roles config:", error);
        return "";
    }
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
    return mode === "replace"
        ? assistantText
        : sourceText + "\n\n" + assistantText;
}

function presentAIResponseBubble(context, assistantTitle, initialPrompt, initialMode) {
    if (!isAIResponseUIEnabled()) {
        return null;
    }

    if (typeof SwiftBiu.showAIResponseBubble !== "function" || typeof SwiftBiu.updateAIResponseBubble !== "function") {
        return null;
    }

    let sessionID = "";
    sessionID = SwiftBiu.showAIResponseBubble(
        {
            title: assistantTitle,
            state: "thinking",
            status: "Analyzing",
            mode: initialMode,
            systemPrompt: initialPrompt,
            systemPromptPlaceholder: "系统提示词（留空时回退到 System Roles）",
            submitLabel: "应用",
            replaceLabel: "替换",
            appendLabel: "追加",
            promptVisible: initialPrompt.length > 0
        },
        function onBubbleEvent(event) {
            if (!event || typeof event !== "object") {
                return;
            }

            if (event.type === "configChanged") {
                persistResponseUISettings(event);
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

    return sessionID || null;
}

function performAction(context) {
    const apiKey = SwiftBiu.getConfig("apikey");
    const customApiUrl = SwiftBiu.getConfig("apiurl");
    const model = SwiftBiu.getConfig("model");
    const contextMessageCount = parseInt(SwiftBiu.getConfig("contextMessageCount") || "0", 10);
    const initialMode = resolveInsertMode();

    const chatModel = model || "gemini-1.5-flash";
    const apiUrl = customApiUrl || `https://generativelanguage.googleapis.com/v1beta/models/${chatModel}:generateContent`;

    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Please set your Gemini API Key in the plugin settings.");
        return;
    }

    if (context.selectedText.trim().toLowerCase() === "reset chat") {
        resetConversation();
        return;
    }

    const systemPrompt = resolveSystemPrompt();
    const combinedUserPrompt = `${systemPrompt} 我选择的内容是“${context.selectedText}”`.trim();
    messages.push({ role: "user", content: combinedUserPrompt });

    const historyToSend = messages.slice(-(contextMessageCount + 1));
    const requestBody = {
        contents: historyToSend.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.content }]
        }))
    };

    const bubbleSessionID = presentAIResponseBubble(context, "Gemini", systemPrompt, initialMode);
    if (!bubbleSessionID) {
        SwiftBiu.showLoadingIndicator(context.screenPosition);
    }

    console.log(`Using API URL: ${apiUrl}`);
    console.log(`Request Body: ${JSON.stringify(requestBody)}`);

    SwiftBiu.fetch(
        `${apiUrl}?key=${apiKey}`,
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
                    console.log(`API Error Response: ${JSON.stringify(responseData.error)}`);
                    throw new Error(responseData.error.message || "Unknown API error.");
                }

                const candidate = responseData.candidates && responseData.candidates[0];
                if (!(candidate && candidate.content && candidate.content.parts && candidate.content.parts[0])) {
                    throw new Error("Invalid response structure from API.");
                }

                const assistantText = candidate.content.parts[0].text;
                messages.push({ role: "model", content: assistantText });
                lastChatDate = new Date();

                if (bubbleSessionID) {
                    SwiftBiu.updateAIResponseBubble(bubbleSessionID, {
                        state: "ready",
                        status: "Ready",
                        text: assistantText,
                        allowSubmit: true,
                        animateText: true
                    });
                    return;
                }

                SwiftBiu.pasteText(buildPasteContent(context.selectedText, assistantText, initialMode));
            } catch (error) {
                const message = `Failed to parse response: ${error.message}`;
                if (bubbleSessionID && typeof SwiftBiu.failAIResponseBubble === "function") {
                    SwiftBiu.failAIResponseBubble(bubbleSessionID, message);
                } else {
                    SwiftBiu.showNotification("API Error", message);
                }
                console.log(`Parse error: ${error}, Original response: ${response.data}`);
                messages.pop();
            }
        },
        (error) => {
            if (!bubbleSessionID) {
                SwiftBiu.hideLoadingIndicator();
            }

            const errorMessage = error.error || error.message || "Unknown request error";
            if (bubbleSessionID && typeof SwiftBiu.failAIResponseBubble === "function") {
                SwiftBiu.failAIResponseBubble(bubbleSessionID, `Error: ${errorMessage}`);
            } else {
                SwiftBiu.showNotification("API Request Failed", `Error: ${errorMessage}`);
            }
            console.log(`API Error: ${JSON.stringify(error)}`);
            messages.pop();
        }
    );
}
