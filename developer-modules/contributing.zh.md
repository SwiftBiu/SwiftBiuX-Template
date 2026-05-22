# 贡献指南 (Contributing Guidelines)

> 本节为占位翻译,内容将与英文版同步。详细的贡献规范请参阅[英文版本](/developer/contributing/)。

为了保证项目历史的清晰可读,本仓库对所有 commit 信息强制使用 **Conventional Commits** 规范。

详细约定请参考英文版,关键点包括:
- 每个 commit 的标题需要落在 `<type>(<scope>): <subject>` 形式中。
- 常用的 `type` 包括 `feat`、`fix`、`docs`、`style`、`refactor`、`test`、`chore` 等。
- 当 commit 引入破坏性变更时,在标题后追加 `!` 并在正文里附 `BREAKING CHANGE:` 段落。
