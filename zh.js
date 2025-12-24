window.translations = window.translations || {};

window.translations.zh = {
  // Page title
  "page.title": "Markdown 任务管理器",

  // Header
  "header.title": "📋 任务管理器",
  "header.renameProject": "重命名项目",
  "header.deleteProject": "从列表中移除项目",
  "header.folder": "📁 文件夹",
  "header.newTask": "➕ 任务",
  "header.archives": "📦 归档",
  "header.columns": "⚙️ 列",

  // Filters
  "filters.tags": "标签：",
  "filters.category": "分类：",
  "filters.user": "用户：",
  "filters.priority": "优先级：",
  "filters.select": "选择...",
  "filters.add": "+",
  "filters.clearAll": "✕ 清除全部",
  "filters.search": "搜索任务...",
  "filters.searchClear": "✕",

  // Welcome screen
  "welcome.title": "欢迎！👋",
  "welcome.description":
    "选择包含您的 Markdown 文件的文件夹（kanban.md 和 archive.md）",
  "welcome.start": "📁 开始使用",
  "welcome.howItWorks": "💡 如何使用？",
  "welcome.step1": '点击上方的"开始使用"',
  "welcome.step2": "选择包含您的 Markdown 文件的文件夹",
  "welcome.step3": "应用程序会自动加载 kanban.md",
  "welcome.step4": "使用看板可视化管理您的任务",
  "welcome.step5": "更改会自动保存到 Markdown 文件",
  "welcome.browserWarning":
    "⚠️ 支持的浏览器：Chrome 86+、Edge 86+、Opera 72+",

  // Task detail modal
  "taskDetail.title": "任务详情",
  "taskDetail.close": "关闭",
  "taskDetail.delete": "🗑️ 删除",
  "taskDetail.archive": "📦 归档",
  "taskDetail.edit": "✏️ 编辑",

  // Task form modal
  "taskForm.newTask": "新建任务",
  "taskForm.editTask": "编辑任务",
  "taskForm.titleLabel": "标题 *",
  "taskForm.columnLabel": "列 *",
  "taskForm.priorityLabel": "优先级",
  "taskForm.priorityNone": "无",
  "taskForm.priorityCritical": "紧急",
  "taskForm.priorityHigh": "高",
  "taskForm.priorityMedium": "中",
  "taskForm.priorityLow": "低",
  "taskForm.categoryLabel": "分类",
  "taskForm.categoryPlaceholder": "前端、后端...",
  "taskForm.assignedLabel": "分配给",
  "taskForm.assignedPlaceholder": "@alice",
  "taskForm.createdLabel": "创建时间",
  "taskForm.startedLabel": "开始时间",
  "taskForm.dueLabel": "截止时间",
  "taskForm.completedLabel": "完成时间",
  "taskForm.tagsLabel": "标签",
  "taskForm.tagsPlaceholder": "#bug #feature",
  "taskForm.tagsHelp": "用空格分隔",
  "taskForm.descriptionLabel": "描述",
  "taskForm.subtasksLabel": "子任务",
  "taskForm.subtaskPlaceholder": "添加子任务...",
  "taskForm.subtaskAdd": "+ 添加",
  "taskForm.notesLabel": "备注",
  "taskForm.notesPlaceholder": "技术说明、结果、决定等...",
  "taskForm.notesHelp":
    "支持 Markdown：**粗体**、*斜体*、`代码`、列表、链接、**子标题**：",
  "taskForm.cancel": "取消",
  "taskForm.create": "创建",
  "taskForm.save": "保存",

  // Columns modal
  "columns.title": "管理列",
  "columns.add": "+ 添加列",

  // Archives modal
  "archives.title": "📦 归档",
  "archives.search": "搜索归档...",
  "archives.empty": "没有已归档的任务",

  // Project selector
  "projects.select": "选择项目...",

  // Task metadata in detail modal
  "meta.priority": "优先级",
  "meta.status": "状态",
  "meta.category": "分类",
  "meta.assigned": "分配给",
  "meta.created": "创建日期",
  "meta.started": "开始日期",
  "meta.due": "截止日期",
  "meta.completed": "完成日期",
  "meta.tags": "标签",
  "meta.description": "描述",
  "meta.subtasks": "子任务（{completed}/{total}）",
  "meta.notes": "备注",

  // Empty states
  "empty.noTasks": "没有任务",

  // Buttons and actions
  "action.restore": "↩️ 恢复",
  "action.delete": "🗑️",
  "action.edit": "✏️",
  "action.moveUp": "上移",
  "action.moveDown": "下移",

  // Tooltips
  "tooltip.filterByCategory": "按此分类筛选",
  "tooltip.filterByUser": "按此用户筛选",
  "tooltip.filterByTag": "按此标签筛选",
  "tooltip.filterByPriority": "按此优先级筛选",
  "tooltip.doubleClickEdit": "双击编辑",
  "tooltip.delete": "删除",

  // Notifications
  "notif.folderLoaded": "文件夹加载成功！",
  "notif.folderError": "加载文件夹时出错",
  "notif.initializingFolder": "正在初始化文件夹...",
  "notif.filesInitialized":
    "文件初始化成功！（kanban.md 和 archive.md）",
  "notif.filesError": "创建文件时出错",
  "notif.projectLoaded": '项目"{name}"已加载',
  "notif.permissionDenied": "此项目的权限被拒绝",
  "notif.projectError": "切换项目时出错",
  "notif.projectRenamed": "项目重命名成功",
  "notif.projectDeleted": "项目已从列表中移除",
  "notif.renameError": "重命名时出错",
  "notif.projectRestored": "项目已自动恢复",
  "notif.taskMoved": "任务已移动！",
  "notif.taskEdited": "任务 {id} 已更新！",
  "notif.taskCreated": "任务 {id} 已创建！",
  "notif.taskArchived": "任务已归档！",
  "notif.taskDeleted": "任务已永久删除",
  "notif.taskRestored": "任务已恢复到原来的列！",

  // Prompts and confirmations
  "prompt.projectName": '项目名称（留空则使用"{name}"）：',
  "prompt.renameProject": "新项目名称：",
  "prompt.columnName": "列名称：",
  "prompt.columnId": "列 ID（例如：todo、done）：",
  "prompt.editSubtask": "编辑子任务：",
  "confirm.deleteColumn": "删除此列？",
  "confirm.deleteSubtask": "删除此子任务？",
  "confirm.deleteProject":
    '从最近列表中移除项目"{name}"？\n\n这只会从下拉菜单中移除 - 您的文件不会被删除。',
  "confirm.archiveTask": '归档任务"{title}"？',
  "confirm.deleteTask":
    '⚠️ 警告：永久删除任务"{title}"？\n\n此操作无法撤销。',
  "confirm.deleteTaskFromArchive":
    '⚠️ 警告：永久删除任务"{title}"？\n\n此操作无法撤销。\n\n如果您想保留在历史记录中，请改用"归档"。',

  // Alerts
  "alert.browserNotSupported":
    "您的浏览器不支持文件系统访问 API。\n\n请使用 Chrome 86+、Edge 86+ 或 Opera 72+。",

  // Subtasks in detail modal
  "subtask.newPlaceholder": "新子任务...",

  // Markdown generation
  "markdown.archiveTitle": "# 任务归档",
  "markdown.archiveDesc": "> 已归档的任务",
  "markdown.archiveSection": "## ✅ 归档",
  "markdown.configSection": "## ⚙️ 配置",
  "markdown.configColumns": "**列**：",
  "markdown.configCategories": "**分类**：",
  "markdown.configUsers": "**用户**：",
  "markdown.configPriorities": "**优先级**：",
  "markdown.configTags": "**标签**：",

  // Language selector
  "language.label": "语言：",
  "language.en": "English",
  "language.fr": "Français",
  "language.zh": "中文",
};
