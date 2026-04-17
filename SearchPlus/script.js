/**
 * Check if the plugin should be available in the current context.
 */
function isAvailable(context) {
    // Show only if text is selected.
    return {
        isAvailable: !!context.selectedText && context.selectedText.trim().length > 0,
        isContextMatch: true
    };
}

/**
 * Handle the search action.
 */
function performAction(context) {
    var text = context.selectedText.trim();
    var keyword = (SwiftBiu.getConfig("keyword") || "").trim();
    var position = SwiftBiu.getConfig("keyword_position") || "suffix";
    var engine = SwiftBiu.getConfig("search_engine") || "https://www.google.com/search?q={query}";
    var customUrl = (SwiftBiu.getConfig("custom_engine_url") || "").trim();

    // Use custom URL if selected
    if (engine === "custom") {
        if (!customUrl) {
            SwiftBiu.showNotification("Error", "Custom Engine URL is not configured.");
            return;
        }
        engine = customUrl;
    }

    // Build the final query string
    var fullQuery = "";
    if (position === "prefix") {
        fullQuery = keyword + (keyword ? " " : "") + text;
    } else {
        fullQuery = text + (keyword ? " " : "") + keyword;
    }

    // Encode and replace placeholder
    var encodedQuery = encodeURIComponent(fullQuery);
    var targetUrl = engine.replace("{query}", encodedQuery);

    // Open in browser
    SwiftBiu.openURL(targetUrl);
}
