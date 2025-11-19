/**
 * Checks if the plugin is available for the current context.
 * @param {object} context - The context object containing selected text.
 * @returns {boolean} - True if text is selected.
 */
function isAvailable(context) {
    return context.selectedText.trim().length > 0;
}

/**
 * Performs the search action.
 * @param {object} context - The context object containing selected text.
 */
function performAction(context) {
    const searchEnginesConfig = SwiftBiu.getConfig("searchEngines");
    let urlPattern = "https://www.google.com/search?q=%s"; // Default fallback

    if (searchEnginesConfig) {
        try {
            const engines = JSON.parse(searchEnginesConfig);
            // Find the enabled engine.
            const activeEngine = engines.find(engine => engine.enabled);
            if (activeEngine && activeEngine.value) {
                // The value is stored as "Name|URL"
                const parts = activeEngine.value.split('|');
                if (parts.length === 2) {
                    urlPattern = parts[1];
                } else {
                    // Fallback if no pipe separator found, assume it's just the URL
                    urlPattern = activeEngine.value;
                }
            }
        } catch (e) {
            console.log("Error parsing search engines config: " + e);
        }
    }

    // Encode the selected text to be safe for URL
    const query = encodeURIComponent(context.selectedText);
    
    // Replace the placeholder %s with the query
    const finalUrl = urlPattern.replace("%s", query);

    console.log(`Opening URL: ${finalUrl}`);
    SwiftBiu.openURL(finalUrl);
}