window.translations = window.translations || {};

window.translations.fr ={
    // Page title
    "page.title": "Gestionnaire de Tâches Markdown",

    // Header
    "header.title": "📋 Task Manager",
    "header.renameProject": "Renommer le projet",
    "header.deleteProject": "Retirer le projet de la liste",
    "header.folder": "📁 Dossier",
    "header.newTask": "➕ Tâche",
    "header.archives": "📦 Archives",
    "header.columns": "⚙️ Colonnes",

    // Filters
    "filters.tags": "Tags:",
    "filters.category": "Catégorie:",
    "filters.user": "Utilisateur:",
    "filters.priority": "Priorité:",
    "filters.select": "Sélectionner...",
    "filters.add": "+",
    "filters.clearAll": "✕ Tout effacer",
    "filters.search": "Rechercher dans les tâches...",
    "filters.searchClear": "✕",

    // Welcome screen
    "welcome.title": "Bienvenue ! 👋",
    "welcome.description":
      "Sélectionnez le dossier contenant vos fichiers Markdown (kanban.md et archive.md)",
    "welcome.start": "📁 Commencer",
    "welcome.howItWorks": "💡 Comment ça marche ?",
    "welcome.step1": 'Cliquez sur "Commencer" ci-dessus',
    "welcome.step2": "Sélectionnez le dossier contenant vos fichiers Markdown",
    "welcome.step3": "L'application charge automatiquement kanban.md",
    "welcome.step4": "Gérez vos tâches visuellement avec le Kanban",
    "welcome.step5":
      "Les modifications sont sauvegardées dans les fichiers Markdown",
    "welcome.browserWarning":
      "⚠️ Navigateurs supportés : Chrome 86+, Edge 86+, Opera 72+",

    // Task detail modal
    "taskDetail.title": "Détails de la tâche",
    "taskDetail.close": "Fermer",
    "taskDetail.delete": "🗑️ Supprimer",
    "taskDetail.archive": "📦 Archiver",
    "taskDetail.edit": "✏️ Modifier",

    // Task form modal
    "taskForm.newTask": "Nouvelle tâche",
    "taskForm.editTask": "Modifier la tâche",
    "taskForm.titleLabel": "Titre *",
    "taskForm.columnLabel": "Colonne *",
    "taskForm.priorityLabel": "Priorité",
    "taskForm.priorityNone": "Aucune",
    "taskForm.priorityCritical": "Critique",
    "taskForm.priorityHigh": "Haute",
    "taskForm.priorityMedium": "Moyenne",
    "taskForm.priorityLow": "Basse",
    "taskForm.categoryLabel": "Catégorie",
    "taskForm.categoryPlaceholder": "Frontend, Backend...",
    "taskForm.assignedLabel": "Assigné à",
    "taskForm.assignedPlaceholder": "@alice",
    "taskForm.createdLabel": "Créé",
    "taskForm.startedLabel": "Commencé",
    "taskForm.dueLabel": "Échéance",
    "taskForm.completedLabel": "Terminé",
    "taskForm.tagsLabel": "Tags",
    "taskForm.tagsPlaceholder": "#bug #feature",
    "taskForm.tagsHelp": "Séparez avec des espaces",
    "taskForm.descriptionLabel": "Description",
    "taskForm.subtasksLabel": "Sous-tâches",
    "taskForm.subtaskPlaceholder": "Ajouter une sous-tâche...",
    "taskForm.subtaskAdd": "+ Ajouter",
    "taskForm.notesLabel": "Notes",
    "taskForm.notesPlaceholder":
      "Notes techniques, résultats, décisions, etc...",
    "taskForm.notesHelp":
      "Markdown supporté : **gras**, *italique*, `code`, listes, liens, **Sous-sections**:",
    "taskForm.cancel": "Annuler",
    "taskForm.create": "Créer",
    "taskForm.save": "Enregistrer",

    // Columns modal
    "columns.title": "Gérer les colonnes",
    "columns.add": "+ Ajouter une colonne",

    // Archives modal
    "archives.title": "📦 Archives",
    "archives.search": "Rechercher dans les archives...",
    "archives.empty": "Aucune tâche archivée",

    // Project selector
    "projects.select": "Sélectionner un projet...",

    // Task metadata in detail modal
    "meta.priority": "Priorité",
    "meta.status": "Statut",
    "meta.category": "Catégorie",
    "meta.assigned": "Assigné à",
    "meta.created": "Date de création",
    "meta.started": "Date de début",
    "meta.due": "Date d'échéance",
    "meta.completed": "Date de fin",
    "meta.tags": "Tags",
    "meta.description": "Description",
    "meta.subtasks": "Sous-tâches ({completed}/{total})",
    "meta.notes": "Notes",

    // Empty states
    "empty.noTasks": "Aucune tâche",

    // Buttons and actions
    "action.restore": "↩️ Restaurer",
    "action.delete": "🗑️",
    "action.edit": "✏️",
    "action.moveUp": "Déplacer vers le haut",
    "action.moveDown": "Déplacer vers le bas",

    // Tooltips
    "tooltip.filterByCategory": "Filtrer par cette catégorie",
    "tooltip.filterByUser": "Filtrer par cet utilisateur",
    "tooltip.filterByTag": "Filtrer par ce tag",
    "tooltip.filterByPriority": "Filtrer par cette priorité",
    "tooltip.doubleClickEdit": "Double-cliquez pour éditer",
    "tooltip.delete": "Supprimer",

    // Notifications
    "notif.folderLoaded": "Dossier chargé avec succès !",
    "notif.folderError": "Erreur lors de la sélection du dossier",
    "notif.initializingFolder": "Initialisation du dossier...",
    "notif.filesInitialized":
      "Fichiers initialisés avec succès ! (kanban.md et archive.md)",
    "notif.filesError": "Erreur lors de la création des fichiers",
    "notif.projectLoaded": 'Projet "{name}" chargé',
    "notif.permissionDenied": "Permission refusée pour ce projet",
    "notif.projectError": "Erreur lors du changement de projet",
    "notif.projectRenamed": "Projet renommé avec succès",
    "notif.projectDeleted": "Projet retiré de la liste",
    "notif.renameError": "Erreur lors du renommage",
    "notif.projectRestored": "Projet restauré automatiquement",
    "notif.taskMoved": "Tâche déplacée !",
    "notif.taskEdited": "Tâche {id} modifiée !",
    "notif.taskCreated": "Tâche {id} créée !",
    "notif.taskArchived": "Tâche archivée !",
    "notif.taskDeleted": "Tâche supprimée définitivement",
    "notif.taskRestored": "Tâche restaurée dans sa colonne d'origine !",

    // Prompts and confirmations
    "prompt.projectName":
      'Nom du projet (laisser vide pour utiliser "{name}") :',
    "prompt.renameProject": "Nouveau nom du projet :",
    "prompt.columnName": "Nom de la colonne:",
    "prompt.columnId": "ID de la colonne (ex: todo, done):",
    "prompt.editSubtask": "Modifier la sous-tâche:",
    "confirm.deleteColumn": "Supprimer cette colonne ?",
    "confirm.deleteSubtask": "Supprimer cette sous-tâche ?",
    "confirm.deleteProject":
      'Retirer le projet "{name}" de la liste récente ?\n\nCeci retire seulement le projet du menu déroulant - vos fichiers ne seront pas supprimés.',
    "confirm.archiveTask": 'Archiver la tâche "{title}" ?',
    "confirm.deleteTask":
      '⚠️ ATTENTION : Supprimer définitivement la tâche "{title}" ?\n\nCette action est irréversible.',
    "confirm.deleteTaskFromArchive":
      '⚠️ ATTENTION : Supprimer définitivement la tâche "{title}" ?\n\nCette action est irréversible.\n\nSi vous voulez la conserver dans l\'historique, utilisez plutôt "Archiver".',

    // Alerts
    "alert.browserNotSupported":
      "Votre navigateur ne supporte pas la File System Access API.\n\nVeuillez utiliser Chrome 86+, Edge 86+ ou Opera 72+.",

    // Subtasks in detail modal
    "subtask.newPlaceholder": "Nouvelle sous-tâche...",

    // Markdown generation
    "markdown.archiveTitle": "# Archive des Tâches",
    "markdown.archiveDesc": "> Tâches archivées",
    "markdown.archiveSection": "## ✅ Archives",
    "markdown.configSection": "## ⚙️ Configuration",
    "markdown.configColumns": "**Colonnes**:",
    "markdown.configCategories": "**Catégories**:",
    "markdown.configUsers": "**Utilisateurs**:",
    "markdown.configPriorities": "**Priorités**:",
    "markdown.configTags": "**Tags**:",

    // Language selector
    "language.label": "Langue :",
    "language.en": "English",
    "language.fr": "Français",
  },
}