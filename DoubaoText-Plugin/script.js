/**
 * @file script.js
 * @description 豆包文本生成插件 - 支持可选的 SwiftBiu 原生 AI 响应 UI
 */

function debugLog(message, details) {
  if (typeof details === "undefined") {
    console.log(`[DoubaoText] ${message}`);
    return;
  }

  try {
    console.log(`[DoubaoText] ${message}: ${JSON.stringify(details)}`);
  } catch (error) {
    console.log(`[DoubaoText] ${message}:`, details);
  }
}

function isAvailable(context) {
  const isTextSelected = context.selectedText && context.selectedText.trim().length > 0;
  return {
    isAvailable: isTextSelected,
    isContextMatch: false
  };
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
  const rawValue = SwiftBiu.getConfig("pasteBehavior");
  const mode = getBooleanConfig("pasteBehavior", true) ? "append" : "replace";
  debugLog("Resolved paste behavior", { rawValue, mode });
  return mode;
}

function resolveSystemPrompt() {
  const overridePrompt = (SwiftBiu.getConfig("responseSystemPrompt") || "").trim();
  if (overridePrompt) {
    debugLog("Using responseSystemPrompt override", { length: overridePrompt.length });
    return overridePrompt;
  }

  const systemRolesConfig = SwiftBiu.getConfig("systemPrompt");
  if (!systemRolesConfig) {
    debugLog("No systemPrompt config found, using built-in default");
    return "你是一个通用的人工智能助手。";
  }

  try {
    const roles = JSON.parse(systemRolesConfig);
    const enabledRole = roles.find(role => role.enabled);
    const resolvedPrompt = enabledRole ? enabledRole.value : "你是一个通用的人工智能助手。";
    debugLog("Resolved system prompt from role preset", {
      roleCount: Array.isArray(roles) ? roles.length : 0,
      enabledRoleFound: Boolean(enabledRole),
      length: resolvedPrompt.length
    });
    return resolvedPrompt;
  } catch (error) {
    console.log("无法解析 AI 角色配置:", error);
    debugLog("Failed to parse systemPrompt config, falling back to built-in default", {
      error: error.message
    });
    return "你是一个通用的人工智能助手。";
  }
}

function isAIResponseUIEnabled() {
  const rawValue = SwiftBiu.getConfig("enableAIResponseUI");
  const enabled = getBooleanConfig("enableAIResponseUI", false);
  debugLog("Resolved AI response UI switch", { rawValue, enabled });
  return enabled;
}

function persistResponseUISettings(event) {
  if (!event || typeof event !== "object" || !SwiftBiu.setConfig) {
    debugLog("Skip persisting response UI settings", {
      hasEvent: Boolean(event),
      hasSetConfig: typeof SwiftBiu.setConfig === "function"
    });
    return;
  }

  if (typeof event.systemPrompt === "string") {
    SwiftBiu.setConfig("responseSystemPrompt", event.systemPrompt);
  }

  if (typeof event.mode === "string") {
    SwiftBiu.setConfig("pasteBehavior", event.mode === "append" ? "true" : "false");
  }

  debugLog("Persisted response UI settings", {
    mode: event.mode,
    systemPromptLength: typeof event.systemPrompt === "string" ? event.systemPrompt.length : null
  });
}

function buildPasteContent(sourceText, responseText, mode) {
  return mode === "replace"
    ? responseText
    : sourceText + "\n\n" + responseText;
}

function resolveTextModel(textModel) {
  return textModel || "doubao-seed-2-0-pro-260215";
}

function extractTextContent(value) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item.text === "string") {
          return item.text;
        }
        if (item && typeof item.content === "string") {
          return item.content;
        }
        if (item && typeof item.value === "string") {
          return item.value;
        }
        return "";
      })
      .join("");
  }

  if (value && typeof value.text === "string") {
    return value.text;
  }

  if (value && typeof value.content === "string") {
    return value.content;
  }

  if (value && typeof value.value === "string") {
    return value.value;
  }

  return "";
}

function extractDoubaoResponseText(payload) {
  const firstChoice = payload?.choices?.[0];
  return (
    extractTextContent(firstChoice?.delta?.content) ||
    extractTextContent(firstChoice?.message?.content) ||
    extractTextContent(firstChoice?.content) ||
    extractTextContent(payload?.delta?.content) ||
    extractTextContent(payload?.message?.content) ||
    extractTextContent(payload?.content) ||
    ""
  );
}

function extractDoubaoErrorMessage(payload, fallbackMessage) {
  return (
    payload?.error?.message ||
    payload?.message ||
    payload?.error_msg ||
    fallbackMessage
  );
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

function requestDoubaoCompletion(options) {
  const {
    apiUrl,
    apiKey,
    textModel,
    systemPrompt,
    userPrompt,
    bubbleSessionID,
    mode,
    context
  } = options;

  const trimmedUserPrompt = typeof userPrompt === "string" ? userPrompt.trim() : "";
  if (!trimmedUserPrompt) {
    const errorMessage = "请输入需要重新生成的问题或文本。";
    debugLog("Abort Doubao request because userPrompt is empty", {
      bubbleSessionID
    });
    if (bubbleSessionID && typeof SwiftBiu.failAIResponseBubble === "function") {
      SwiftBiu.failAIResponseBubble(bubbleSessionID, errorMessage);
    } else {
      SwiftBiu.showNotification("输入错误", errorMessage);
    }
    return;
  }

  debugLog("Sending Doubao request", {
    apiUrl,
    model: resolveTextModel(textModel),
    bubbleSessionID,
    mode,
    systemPromptLength: typeof systemPrompt === "string" ? systemPrompt.length : 0,
    userPromptLength: trimmedUserPrompt.length
  });

  SwiftBiu.fetch(
    apiUrl,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: resolveTextModel(textModel),
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: trimmedUserPrompt }
        ],
        stream: false
      })
    },
    (response) => {
      if (!bubbleSessionID) {
        SwiftBiu.hideLoadingIndicator();
        debugLog("Hid legacy loading indicator after response");
      }

      try {
        const result = JSON.parse(response.data);
        debugLog("Received Doubao response", {
          status: response.status,
          hasChoices: Boolean(result.choices),
          choiceCount: Array.isArray(result.choices) ? result.choices.length : 0,
          bubbleSessionID
        });
        if (response.status !== 200) {
          const errorMessage = result?.error?.message || `HTTP Error ${response.status}`;
          throw new Error(errorMessage);
        }

        console.log("API Response:", JSON.stringify(result, null, 2));
        const content = result.choices?.[0]?.message?.content;
        console.log("API Response content:", content);

        if (!content) {
          throw new Error("API 未返回有效内容。");
        }

        if (bubbleSessionID) {
          debugLog("Updating native bubble with ready state", {
            sessionID: bubbleSessionID,
            contentLength: content.length
          });
          SwiftBiu.updateAIResponseBubble(bubbleSessionID, {
            state: "ready",
            status: "Ready",
            text: content,
            allowSubmit: true,
            animateText: true
          });
          return;
        }

        debugLog("Using legacy direct paste flow", {
          mode,
          contentLength: content.length
        });
        SwiftBiu.pasteText(buildPasteContent(context.selectedText, content, mode));
        SwiftBiu.showNotification("文本生成成功", mode === "append" ? "结果已追加到原文后。" : "结果已替换原文。");
      } catch (error) {
        debugLog("Failed to handle Doubao response", {
          message: error.message,
          bubbleSessionID
        });
        if (bubbleSessionID && typeof SwiftBiu.failAIResponseBubble === "function") {
          SwiftBiu.failAIResponseBubble(bubbleSessionID, error.message);
        } else {
          SwiftBiu.showNotification("处理失败", error.message);
        }
        console.log(`Parse error: ${error}, Original response: ${response.data}`);
      }
    },
    (error) => {
      if (!bubbleSessionID) {
        SwiftBiu.hideLoadingIndicator();
        debugLog("Hid legacy loading indicator after request error");
      }

      const errorMessage = error.error || error.message || "网络请求失败";
      debugLog("Doubao request failed", {
        errorMessage,
        bubbleSessionID
      });
      if (bubbleSessionID && typeof SwiftBiu.failAIResponseBubble === "function") {
        SwiftBiu.failAIResponseBubble(bubbleSessionID, errorMessage);
      } else {
        SwiftBiu.showNotification("请求失败", errorMessage);
      }
      console.log(`API Error: ${JSON.stringify(error)}`);
    }
  );
}

function presentAIResponseBubble(context, initialMode, initialRequestOptions) {
  debugLog("Attempting to present AI response bubble", {
    initialMode
  });

  if (!isAIResponseUIEnabled()) {
    debugLog("AI response UI disabled, using legacy direct-paste flow");
    return null;
  }

  if (
    typeof SwiftBiu.showAIResponseBubble !== "function" ||
    typeof SwiftBiu.updateAIResponseBubble !== "function" ||
    typeof SwiftBiu.fetchStream !== "function"
  ) {
    debugLog("AI response bubble API is unavailable", {
      showType: typeof SwiftBiu.showAIResponseBubble,
      updateType: typeof SwiftBiu.updateAIResponseBubble,
      fetchStreamType: typeof SwiftBiu.fetchStream,
      failType: typeof SwiftBiu.failAIResponseBubble
    });
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
        textModel,
        systemPrompt,
        userPrompt
      } = requestOptions;

      const trimmedUserPrompt = typeof userPrompt === "string" ? userPrompt.trim() : "";
      const trimmedSystemPrompt = typeof systemPrompt === "string" ? systemPrompt.trim() : "";

      if (!trimmedUserPrompt) {
        failStreamingRequest(activeRequestToken, "请输入需要重新生成的问题或文本。");
        return;
      }

      cancelActiveStream();
      const requestToken = activeRequestToken + 1;
      activeRequestToken = requestToken;

      let responseStatus = 0;
      let accumulatedText = "";
      let sseRemainder = "";
      let pendingErrorMessage = "";

      SwiftBiu.updateAIResponseBubble(sessionID, {
        systemPrompt: trimmedSystemPrompt,
        userPrompt: trimmedUserPrompt,
        state: "generating",
        status: "Generating",
        text: "",
        allowSubmit: false,
        animateText: false
      });

      debugLog("Starting streaming Doubao request", {
        sessionID,
        requestToken,
        model: resolveTextModel(textModel),
        userPromptLength: trimmedUserPrompt.length,
        systemPromptLength: trimmedSystemPrompt.length
      });

      const streamID = SwiftBiu.fetchStream(
        apiUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: resolveTextModel(textModel),
            messages: [
              { role: "system", content: trimmedSystemPrompt },
              { role: "user", content: trimmedUserPrompt }
            ],
            stream: true
          })
        },
        function onStreamEvent(event) {
          if (requestToken !== activeRequestToken || !event || typeof event !== "object") {
            return;
          }

          if (event.type === "response") {
            responseStatus = typeof event.status === "number" ? event.status : 0;
            debugLog("Streaming Doubao response started", {
              sessionID,
              requestToken,
              responseStatus
            });
            return;
          }

          if (event.type === "cancelled") {
            clearActiveStream(streamID);
            debugLog("Streaming Doubao request cancelled", {
              sessionID,
              requestToken
            });
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

            for (const sseEvent of parsed.events) {
              if (sseEvent.data === "[DONE]") {
                continue;
              }

              try {
                const payload = JSON.parse(sseEvent.data);
                const deltaText = extractDoubaoResponseText(payload);
                const payloadErrorMessage = extractDoubaoErrorMessage(payload, "");

                if (payloadErrorMessage && !deltaText) {
                  pendingErrorMessage = payloadErrorMessage;
                }

                if (!deltaText) {
                  continue;
                }

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
                  message: error.message,
                  payloadPreview: sseEvent.data.slice(0, 200)
                });
              }
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
                animateText: false
              });
              return;
            }

            const trailingText = typeof sseRemainder === "string" ? sseRemainder.trim() : "";
            if (trailingText) {
              try {
                const payload = JSON.parse(trailingText);
                const responseText = extractDoubaoResponseText(payload);
                if (responseText) {
                  SwiftBiu.updateAIResponseBubble(sessionID, {
                    systemPrompt: trimmedSystemPrompt,
                    userPrompt: trimmedUserPrompt,
                    state: "ready",
                    status: "Ready",
                    text: responseText,
                    allowSubmit: true,
                    animateText: false
                  });
                  return;
                }

                pendingErrorMessage = extractDoubaoErrorMessage(payload, pendingErrorMessage);
              } catch (error) {
                debugLog("Trailing stream payload is not JSON", {
                  message: error.message,
                  payloadPreview: trailingText.slice(0, 200)
                });
              }
            }

            failStreamingRequest(
              requestToken,
              pendingErrorMessage || (responseStatus >= 400 ? `HTTP Error ${responseStatus}` : "API 未返回有效内容。")
            );
          }
        },
        function onStreamError(error) {
          if (requestToken !== activeRequestToken) {
            return;
          }

          clearActiveStream(streamID);
          const errorMessage = error?.error || error?.message || "网络请求失败";
          debugLog("Streaming Doubao request failed", {
            sessionID,
            requestToken,
            errorMessage
          });
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
  sessionID = SwiftBiu.showAIResponseBubble(
    {
      title: "豆包问答AI",
      mode: initialMode
    },
    function onBubbleEvent(event) {
      debugLog("Received AI response bubble event", {
        type: event && event.type ? event.type : null,
        mode: event && event.mode ? event.mode : null,
        textLength: event && typeof event.text === "string" ? event.text.length : null
      });

      if (!event || typeof event !== "object") {
        return;
      }

      if (event.type === "configChanged") {
        persistResponseUISettings(event);
        return;
      }

      if (event.type === "regenerate") {
        persistResponseUISettings(event);
        streamRunner?.run({
          apiUrl: SwiftBiu.getConfig("apiUrl") || "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
          apiKey: SwiftBiu.getConfig("apiKey"),
          textModel: SwiftBiu.getConfig("textModel"),
          systemPrompt: typeof event.systemPrompt === "string" && event.systemPrompt.trim()
            ? event.systemPrompt.trim()
            : resolveSystemPrompt(),
          userPrompt: typeof event.userPrompt === "string" ? event.userPrompt : context.selectedText,
          bubbleSessionID: sessionID,
          mode: event.mode === "replace" ? "replace" : "append",
          context
        });
        return;
      }

      if (event.type !== "submit") {
        return;
      }

      persistResponseUISettings(event);

      const nextText = typeof event.text === "string" ? event.text.trim() : "";
      if (!nextText) {
        SwiftBiu.showNotification("文本生成失败", "响应内容为空，无法应用。");
        return;
      }

      const mode = event.mode === "replace" ? "replace" : "append";
      debugLog("Applying AI response bubble content", {
        mode,
        appliedTextLength: nextText.length
      });
      SwiftBiu.pasteText(buildPasteContent(context.selectedText, nextText, mode));
      SwiftBiu.updateAIResponseBubble(sessionID, {
        state: "applied",
        status: "Applied",
        text: nextText,
        allowSubmit: false
      });
    }
  );

  debugLog("AI response bubble creation finished", {
    sessionID,
    created: Boolean(sessionID)
  });

  if (sessionID) {
    streamRunner = createStreamingRunner(sessionID);
    if (initialRequestOptions) {
      streamRunner.run(initialRequestOptions);
    }
  }

  return sessionID || null;
}

function performAction(context) {
  const apiUrl = SwiftBiu.getConfig("apiUrl") || "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
  const apiKey = SwiftBiu.getConfig("apiKey");
  const textModel = SwiftBiu.getConfig("textModel");
  const initialMode = resolveInsertMode();
  const systemPrompt = resolveSystemPrompt();

  debugLog("Starting Doubao action", {
    hasApiKey: Boolean(apiKey),
    apiUrl,
    textModel: textModel || "doubao-seed-2-0-pro-260215",
    selectedTextLength: context.selectedText ? context.selectedText.length : 0,
    initialMode,
    systemPromptLength: systemPrompt.length
  });

  if (!apiKey) {
    debugLog("Abort action because apiKey is missing");
    SwiftBiu.showNotification("配置错误", "请先在插件设置中配置 API Key。");
    return;
  }

  const selectedText = context.selectedText;
  if (!selectedText || selectedText.trim().length === 0) {
    debugLog("Abort action because selectedText is empty");
    SwiftBiu.showNotification("输入错误", "请先选择需要处理的文本。");
    return;
  }

  const bubbleSessionID = presentAIResponseBubble(context, initialMode, {
    apiUrl,
    apiKey,
    textModel,
    systemPrompt,
    userPrompt: selectedText
  });
  debugLog("Resolved response presentation mode", {
    bubbleSessionID,
    usingNativeBubble: Boolean(bubbleSessionID)
  });
  if (bubbleSessionID) {
    return;
  }

  SwiftBiu.showLoadingIndicator(context.screenPosition);
  debugLog("Showing legacy loading indicator because native bubble is not active");
  requestDoubaoCompletion({
    apiUrl,
    apiKey,
    textModel,
    systemPrompt,
    userPrompt: selectedText,
    bubbleSessionID,
    mode: initialMode,
    context
  });
}
