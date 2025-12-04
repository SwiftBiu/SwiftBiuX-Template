/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以确定插件在当前上下文中是否可在工具栏展示。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    return context.selectedText.length > 0;
}

/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以执行插件的主要操作。
 */
function performAction(context) {
    const text = context.selectedText;
    
    // Escape single quotes for shell: ' -> '\''
    // This ensures that when we use '{text}' in the shell command, it doesn't break out of the quotes.
    const escapedText = text.replace(/'/g, "'\\''");
    const ctx = { "text": escapedText };

    // Helper to run command
    function run(cmd) {
        // SwiftBiu.runShellScript performs the replacement of {text} with the value in ctx
        return SwiftBiu.runShellScript(cmd, ctx) || "Error";
    }

    // Use printf %s to avoid issues with echo and special characters
    const md5 = run("printf %s '{text}' | md5");
    const sha1 = run("printf %s '{text}' | shasum -a 1 | awk '{print $1}'");
    const sha256 = run("printf %s '{text}' | shasum -a 256 | awk '{print $1}'");
    
    // For Base64, we can also use the shell command, or JS btoa. 
    // Using shell ensures consistency with system encoding.
    const base64 = run("printf %s '{text}' | base64");

    const result = `MD5:
${md5}

SHA-1:
${sha1}

SHA-256:
${sha256}

Base64:
${base64}`;

    SwiftBiu.showNotification("哈希计算完成");
    SwiftBiu.pasteText(result);
}