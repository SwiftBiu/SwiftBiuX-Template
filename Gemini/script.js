// An array to hold the history of the conversation in OpenAI's format for simplicity.
// We will convert it to Gemini's format on the fly.
const messages = [];

// The timestamp of the last interaction.
let lastChatDate = new Date();

/**
 * Resets the conversation history and notifies the user.
 */
function resetConversation() {
    messages.length = 0;
    SwiftBiu.showNotification("Gemini Conversation Reset", "The chat history has been cleared.");
}

/**
 * Converts the message history to the format required by the Gemini API.
 * @returns {object} The contents object for the Gemini API request.
 */
function convertMessagesToGeminiFormat() {
    return {
        contents: messages.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model', // Gemini uses 'model' for assistant
            parts: [{ text: msg.content }]
        }))
    };
}

/**
 * The main entry point for the SwiftBiu plugin.
 * This function is called when the user triggers the action.
 * @param {object} context - An object containing information about the selection.
 */
function performAction(context) {
    // --- 1. Get User Configuration ---
    const apiKey = SwiftBiu.getConfig("apikey");
    const customApiUrl = SwiftBiu.getConfig("apiurl");
    const resetMinutes = parseInt(SwiftBiu.getConfig("resetMinutes"), 10);
    const model = SwiftBiu.getConfig("model");

    const chatModel = model || "gemma-3n-e4b-it";
    const apiUrl = customApiUrl || `https://generativelanguage.googleapis.com/v1beta/models/${chatModel}:generateContent`;

    // --- 2. Check for API Key ---
    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Please set your Gemini API Key in the plugin settings.");
        return;
    }

    // --- 3. Handle Manual Reset Command ---
    if (context.selectedText.trim().toLowerCase() === "reset chat") {
        resetConversation();
        return;
    }

    // --- 4. Handle Automatic Reset Timer ---
    if (!isNaN(resetMinutes) && resetMinutes > 0) {
        const resetInterval = resetMinutes * 60 * 1000; // Convert minutes to milliseconds
        if (new Date().getTime() - lastChatDate.getTime() > resetInterval) {
            console.log(`Conversation automatically reset due to inactivity of over ${resetMinutes} minutes.`);
            messages.length = 0; // Silently reset without notification
        }
    }

    // --- 5. Add User's Message to History ---
    messages.push({ role: "user", content: context.selectedText });

    // --- 6. Prepare and Send API Request ---
    const requestBody = convertMessagesToGeminiFormat();

    // The model name is often in the URL for Gemini, but we add it here if needed by the API.
    // For generateContent, it's in the URL, so we don't add it to the body.

    SwiftBiu.showLoadingIndicator(context.screenPosition);
    SwiftBiu.fetch(
        `${apiUrl}?key=${apiKey}`, // Gemini API key is passed as a query parameter
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
        },
        (response) => { // onSuccess Callback
            SwiftBiu.hideLoadingIndicator();
            try {
                const responseData = JSON.parse(response.data);
                const candidate = responseData.candidates.at(0);

                if (candidate && candidate.content && candidate.content.parts) {
                    const assistantText = candidate.content.parts.at(0).text;
                    const assistantMessage = { role: "model", content: assistantText };

                    // Add assistant's response to history
                    messages.push(assistantMessage);

                    // Update last chat time
                    lastChatDate = new Date();

                    // Paste response and notify user
                    const newContent = context.selectedText + "\n\n" + assistantText;
                    SwiftBiu.pasteText(newContent);
                    SwiftBiu.showNotification("Gemini Response Pasted", "The assistant's reply has been pasted.");
                } else {
                    throw new Error("Invalid response structure from API.");
                }
            } catch (e) {
                SwiftBiu.showNotification("API Error", `Failed to parse response: ${e.message}`);
                console.log(`Parse error: ${e}, Original response: ${response.data}`);
                // Remove the user's last message on failure to allow retry
                messages.pop();
            }
        },
        (error) => { // onError Callback
            SwiftBiu.hideLoadingIndicator();
            SwiftBiu.showNotification("API Request Failed", `Error: ${error.error}`);
            console.log(`API Error: ${JSON.stringify(error)}`);
            // Remove the user's last message on failure to allow retry
            messages.pop();
        }
    );
}