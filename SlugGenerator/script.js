/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以确定插件在当前上下文中是否可在工具栏展示。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    return context.selectedText.trim().length > 0;
}

/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以执行插件的主要操作。
 */
function performAction(context) {
    const text = context.selectedText;
    
    // 1. 转小写
    // 2. 移除特殊字符 (保留字母、数字、中文、空格、连字符)
    // 3. 将空格、下划线替换为连字符
    // 4. 移除首尾连字符
    const slug = text.toLowerCase()
        .trim()
        .replace(/[^\w\s\u4e00-\u9fa5-]/g, '') 
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    if (slug) {
        SwiftBiu.pasteText(slug);
        SwiftBiu.showNotification("Slug 生成成功", slug);
    } else {
        SwiftBiu.showNotification("生成失败", "无法生成有效的 Slug");
    }
}