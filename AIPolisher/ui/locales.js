const translations = {
    en: {
        title: "AI Polisher",
        originalLabel: "Original Text",
        polishedLabel: "Polished Result",
        btnCopy: "Copy Result",
        btnReplace: "Insert & Replace",
        btnRegenerate: "Regenerate",
        debugTitle: "DEBUG LOG",
        statusStarting: "Connecting to AI service...",
        statusSuccess: "Processing complete!",
        statusError: "An error occurred during polishing.",
        modeGrammar: "Grammar Fix",
        modeProfessional: "Professional",
        modeAcademic: "Academic",
        modeCreative: "Creative",
        modeConcise: "Concise",
        placeholderSelected: "Start typing or select text to polish...",
        placeholderResult: "Result will appear here...",
        autoTriggerLog: "Auto-trigger disabled by user configuration.",
        clickToStart: "Click Regenerate to start.",
        copied: "Copied!",
        modesTitle: "Polishing Modes",
        placeholderCustom: "Custom command..."
    },
    zh: {
        title: "AI 文本润色",
        originalLabel: "原始文本",
        polishedLabel: "润色结果",
        btnCopy: "复制结果",
        btnReplace: "插入并替换",
        btnRegenerate: "重新生成",
        debugTitle: "调试日志",
        statusStarting: "正在连接 AI 服务...",
        statusSuccess: "润色完成！",
        statusError: "出错了",
        modeGrammar: "语法修正",
        modeProfessional: "专业职场",
        modeAcademic: "学术论文",
        modeCreative: "创意写作",
        modeConcise: "精简表达",
        modeCasual: "轻松休闲",
        modeShorten: "精简表达",
        modeExpand: "丰富内容",
        modeEmoji: "添加表情",
        placeholderSelected: "请输入或选择需要润色的文本...",
        placeholderResult: "润色结果将显示在此处...",
        autoTriggerLog: "根据用户配置，已禁用自动润色。",
        clickToStart: "已切换模式，请点击“重新生成”开始。",
        copied: "已复制！",
        modesTitle: "润色模式",
        placeholderCustom: "输入自定义指令..."
    }
};

function getTranslation(locale) {
    // Basic support for 'zh-Hans', 'zh-Hant' etc by taking prefix
    const lang = (locale || 'en').split('-')[0];
    return translations[lang] || translations.en;
}
