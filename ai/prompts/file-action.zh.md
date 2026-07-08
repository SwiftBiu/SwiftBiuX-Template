# 文件动作插件 Prompt

```text
阅读 SwiftBiuX Skill：
https://raw.githubusercontent.com/SwiftBiu/SwiftBiuX-Template/main/AI_SKILL.md
并按需读取 references/file-workflows.md。

创建一个 SwiftBiu 文件动作插件：

插件名称：
输入：用户选中的本地文件 context.selectedFiles
功能：
输出：显示通知 / 保存新文件 / 移动文件 / 复制文件 / 打开文件

要求：
- extensionKind: fileAction
- 区分 context.selectedFiles 和 context.selectedRemoteFiles
- 批量写入或移动前要考虑冲突、跳过和失败统计
- 不要永久删除文件；需要删除时使用 Trash 流程
- 只声明必要权限，例如 localFileRead、localFileWrite、notifications
- 生成 manifest.json 和 script.js
- 用 ./scripts/build_plugin.sh 打包
```
