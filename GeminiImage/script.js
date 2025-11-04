/**
 * This function is called when the user triggers the plugin action.
 * @param {object} context - An object containing information about the selection.
 * @param {string} context.selectedText - The text selected by the user.
 */
function performAction(context) {
    const apiKey = SwiftBiu.getConfig("apiKey");

    if (!apiKey) {
        SwiftBiu.showNotification("Configuration Error", "Gemini API Key is not set.");
        return;
    }

    const prompt = context.selectedText;
    if (!prompt) {
        SwiftBiu.showNotification("Input Error", "Please select some text to generate an image.");
        return;
    }

    const modelId = "gemini-2.0-flash-preview-image-generation";
    const apiMethod = "streamGenerateContent";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:${apiMethod}?key=${apiKey}`;

    const requestBody = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": `A high-quality, detailed image of: ${prompt}`
                    }
                ]
            }
        ],
        "generationConfig": {
            "responseModalities": ["IMAGE", "TEXT"]
        }
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    };

    // Show loading indicator at the selection position for immediate feedback.
    SwiftBiu.showLoadingIndicator(context.screenPosition);

    SwiftBiu.fetch(url, options,
        (response) => {
            // On success, the image preview window will automatically replace the indicator.
            try {
                const chunks = JSON.parse(response.data);
                let base64Image = null;

                for (const chunk of chunks) {
                    const part = chunk.candidates?.at(0)?.content?.parts?.at(0);
                    if (part && part.inlineData && part.inlineData.data) {
                        base64Image = part.inlineData.data;
                        break;
                    }
                }

                if (base64Image) {
                    // The loading indicator will be hidden by the native side if the image is opened,
                    // or a notification will be shown if the limit is reached.
                    // We can hide it here as a fallback.
                    SwiftBiu.hideLoadingIndicator();
                    // Call the newly implemented native function.
                    // The native side will handle usage limits and showing notifications.
                    SwiftBiu.openImageInPreview(base64Image);
                    
                } else {
                    SwiftBiu.hideLoadingIndicator();
                    console.error("No image data found in the streaming response. Full response:", response.data);
                    SwiftBiu.showNotification("API Error", "No image data found in response.");
                }
            } catch (e) {
                SwiftBiu.hideLoadingIndicator();
                console.error("Failed to parse streaming response:", e.message);
                console.error("Raw response data:", response.data);
                SwiftBiu.showNotification("API Error", "Could not process image data from the server.");
            }
        },
        (error) => {
            // On failure, hide the indicator and show a notification.
            SwiftBiu.hideLoadingIndicator();
            console.error("Fetch error:", error);
            SwiftBiu.showNotification("Network Error", "Failed to connect to the Gemini API.");
        }
    );
}