/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以确定插件在当前上下文中是否可在工具栏展示。
 * @returns {boolean} - 如果插件可用则返回 true，否则返回 false。
 */
function isAvailable(context) {
    const text = context.selectedText.trim();
    // 至少包含一个英文字母
    return /[a-zA-Z]/.test(text);
}

/**
 * @param {object} context - 包含有关当前选择的所有信息的上下文对象。
 * 必须实现此函数以执行插件的主要操作。
 */
function performAction(context) {
    const text = context.selectedText;
    const nextText = cycleCase(text);
    
    if (nextText && nextText !== text) {
        SwiftBiu.pasteText(nextText);
        SwiftBiu.showNotification("已转换", nextText.length > 50 ? "格式转换成功" : nextText);
    } else {
        SwiftBiu.showNotification("提示", "无法转换或已是目标格式");
    }
}

function cycleCase(text) {
    const words = splitIntoWords(text);
    if (!words || words.length === 0) return text;

    const isAllUpper = text === text.toUpperCase() && /[a-zA-Z]/.test(text);
    const isAllLower = text === text.toLowerCase() && /[a-zA-Z]/.test(text);
    const hasSpace = text.includes(' ');
    const hasUnderscore = text.includes('_');
    const hasDash = text.includes('-');
    
    // 检测当前格式并决定下一个格式
    // Cycle: Lower(Space) -> Upper(Space) -> Title(Space) -> Camel -> Pascal -> Snake -> Kebab -> Lower...

    // 1. Snake Case (hello_world) -> Kebab Case
    if (hasUnderscore && !hasSpace) {
        return toKebab(words);
    }
    
    // 2. Kebab Case (hello-world) -> Lower Case (Space)
    // 修改循环顺序：Kebab -> Lower Space
    if (hasDash && !hasSpace) {
        return toLowerSpace(words);
    }

    // 3. Lower Space (hello world) -> Upper Space
    if (isAllLower && hasSpace) {
        return toUpperSpace(words);
    }

    // 4. Upper Space (HELLO WORLD) -> Title Space
    if (isAllUpper && hasSpace) {
        return toTitleSpace(words);
    }

    // 5. Title Space (Hello World) -> Camel Case
    // 检查是否每个单词首字母大写
    const isTitle = words.every(w => /^[A-Z]/.test(w));
    if (isTitle && hasSpace) {
        return toCamel(words);
    }
    
    // 6. Camel Case (helloWorld) -> Pascal Case
    // 检查首字母小写，中间有大写，无空格/下划线/横线
    if (!hasSpace && !hasUnderscore && !hasDash && /^[a-z]/.test(text) && /[A-Z]/.test(text)) {
        return toPascal(words);
    }

    // 7. Pascal Case (HelloWorld) -> Snake Case
    // 检查首字母大写，无空格...
    if (!hasSpace && !hasUnderscore && !hasDash && /^[A-Z]/.test(text)) {
        return toSnake(words);
    }

    // 默认/兜底：如果无法识别，尝试转为 Lower Space，或者进入循环的起点
    if (hasSpace) {
        // 如果有空格但不是全小写/全大写/Title，可能是混合，转为全大写
        if (!isAllUpper) return toUpperSpace(words);
        return toTitleSpace(words);
    }
    
    // 单个单词的情况
    if (words.length === 1) {
        if (isAllLower) return toUpperSpace(words);
        if (isAllUpper) return toTitleSpace(words); // HELLO -> Hello
        return toLowerSpace(words); // Hello -> hello
    }

    return toLowerSpace(words);
}

function splitIntoWords(text) {
    text = text.trim();
    // 1. 替换常见分隔符为空格
    let clean = text.replace(/[_-\s]+/g, ' ');
    // 2. 处理驼峰: helloWorld -> hello World
    clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
    // 3. 处理连续大写后跟小写: PDFLoader -> PDF Loader
    clean = clean.replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
    
    return clean.split(' ').filter(w => w.length > 0);
}

// Formatters

function toLowerSpace(words) {
    return words.map(w => w.toLowerCase()).join(' ');
}

function toUpperSpace(words) {
    return words.map(w => w.toUpperCase()).join(' ');
}

function toTitleSpace(words) {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function toCamel(words) {
    return words.map((w, i) => {
        if (i === 0) return w.toLowerCase();
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join('');
}

function toPascal(words) {
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
}

function toSnake(words) {
    return words.map(w => w.toLowerCase()).join('_');
}

function toKebab(words) {
    return words.map(w => w.toLowerCase()).join('-');
}