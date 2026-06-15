/** Operoz Manual content — structure inspired by https://docs.plane.so/ */
export const operozManualEn = {
  title: "Operoz Docs",
  nav_label: "Manual",
  subtitle: "Complete platform guide",
  search_placeholder: "Search documentation…",
  search_empty: "No results found",
  mobile_nav_toggle: "Open documentation menu",
  home: {
    nav_label: "Home",
    hero_title: "Operoz documentation",
    hero_subtitle:
      "Plan, track, and ship your work with Operoz. This documentation helps you learn the platform, manage projects, collaborate with teams, and automate operational workflows.",
    get_started: "Get started",
    quickstart: "Quickstart guide",
    cards: {
      get_started: {
        description: "Learn the basics, set up your workspace, and create your first work items in minutes.",
        link: "Get started",
      },
      workspace: {
        description: "Set up workspaces, invite members, configure roles, and customize navigation.",
        link: "Configure workspaces",
      },
      boards: {
        description: "Organize teams with boards, work views, KPIs, and Client 360.",
        link: "Explore boards",
      },
      projects: {
        description: "Create projects, enable modules (cycles, intake, pages), and manage members.",
        link: "Manage projects",
      },
      work_items: {
        description: "Create and manage work items, properties, filters, drafts, and status flows.",
        link: "Manage work items",
      },
      planning: {
        description: "Plan with cycles, modules, saved views, and quick stickies.",
        link: "Plan work",
      },
      knowledge: {
        description: "Document with rich-text pages, status reports, and intake forms.",
        link: "Explore knowledge",
      },
      automation: {
        description: "Automate flows with visual graphs, playbooks, hooks, and run metrics.",
        link: "View automations",
      },
      ai: {
        description: "Use the Operoz Assistant to query real data and propose automations with AI.",
        link: "Explore AI",
      },
      analytics: {
        description: "Track workspace, board metrics, and custom dashboards.",
        link: "View analytics",
      },
      communication: {
        description: "Inbox, notifications, mentions, and communication preferences.",
        link: "View communication",
      },
      integrations: {
        description: "REST API, webhooks, MCP, and external tool integrations.",
        link: "View integrations",
      },
    },
  },
  nav: {
    get_started: "Get started",
    workspace: "Workspace",
    boards: "Boards",
    projects: "Projects",
    work_items: "Work items",
    planning: "Planning",
    knowledge: "Knowledge",
    automation: "Automation",
    ai: "AI",
    analytics: "Analytics",
    communication: "Communication",
    integrations: "Integrations",
  },
  tips_label: "Practical tips",
  footer: "Operoz — intelligent operations platform.",
  article_not_found: "Documentation page not found.",
  back_to_home: "Back to home",
  prev_article: "Previous",
  next_article: "Next",
  pagination_label: "Article navigation",
  articles: {
    get_started_introduction: {
      title: "Introduction",
      description: "Learn what Operoz is and how it organizes intelligent operations.",
      p: {
        0: "Operoz is an operations platform combining project management, support, documentation, and automation. Built for teams needing end-to-end visibility — from individual cards to client health.",
        1: "Main hierarchy: Workspace → Board (team) → Project → Card. Each layer adds context for governance and reporting.",
        2: "Operoz differentiators: native Client 360, board-level visual automation engine, and Operoz Assistant with real-data AI (not hallucination).",
      },
      tips: {
        0: "Use the top bar for Inbox, Manual, and profile — always accessible.",
        1: "The floating «Ask Operoz» button opens the AI assistant.",
        2: "Cmd+K (Power K) is the most powerful navigation shortcut.",
      },
    },
    get_started_quickstart: {
      title: "Quickstart guide",
      description: "Set up your workspace and deliver value in a few steps.",
      p: {
        0: "1. Create or join a workspace and invite members in Settings → Members.",
        1: "2. Create a board (team) and add projects — each gets a key (e.g. OPZ).",
        2: "3. Inside a project, create your first card with «New work item» or shortcut C.",
        3: "4. Explore board views (board, list, backlog) and set up basic automations if needed.",
      },
      tips: {
        0: "Start with the board overview for aggregated KPIs.",
        1: "Enable only modules your team uses in project settings.",
        2: "Save a filtered view for quick access later.",
        3: "Try the Assistant: «list open cards on this board».",
      },
    },
    get_started_core_concepts: {
      title: "Core concepts",
      description: "Understand Operoz building blocks.",
      p: {
        0: "Workspace: isolated environment for your organization with members, boards, and global settings.",
        1: "Board: team grouping with cross-project views, Client 360, and shared automations.",
        2: "Card (work item): executable unit with lifecycle, assignees, dates, and custom metadata.",
      },
      tips: {
        0: "Recommended model: board → projects (not orphan projects).",
        1: "Card states are configurable per project.",
        2: "Cycles and modules are optional — enable per methodology.",
        3: "Automations live at board level, not on individual cards.",
      },
    },
    workspace_overview: {
      title: "Manage workspace",
      description: "Workspace structure and settings overview.",
      p: {
        0: "The workspace is the root container. Home shows activity widgets and shortcuts. Sidebar lists projects/boards and personal items.",
        1: "Switch workspaces via the sidebar menu. Pending invites appear under workspace invites.",
        2: "Workspace settings at /settings — members, integrations, API tokens, export.",
      },
      tips: {
        0: "Personalize homepage widgets for your role.",
        1: "Use workspace views for global filtered card lists.",
        2: "Archived projects live under Projects → Archives.",
      },
    },
    workspace_members: {
      title: "Manage members",
      description: "Invite people and assign workspace roles.",
      p: {
        0: "Admins invite by email in Settings → Members. Roles: Admin, Member, Guest.",
        1: "Guests have restricted access. Members create work. Admins configure everything.",
        2: "Removing a member revokes future access but preserves their past work.",
      },
      tips: {
        0: "Review pending invites in the workspace menu.",
        1: "Combine workspace roles with board functions for fine control.",
        2: "Export member list from settings for audits.",
      },
    },
    workspace_power_k: {
      title: "Power K",
      description: "Operoz universal command palette.",
      p: {
        0: "Power K (Cmd+K / Ctrl+K) opens search and commands. Find projects, boards, cards, pages, or run actions.",
        1: "Command groups: Navigation, Contextual actions, Creation, and Help.",
        2: "Cmd+/ lists all keyboard shortcuts for the current screen.",
      },
      tips: {
        0: "On an open card, Power K shows change state, priority, assign to me.",
        1: "Search «Manual» in Power K to open this documentation.",
        2: "Power K respects your permissions.",
      },
    },
    workspace_navigation: {
      title: "Customize navigation",
      description: "Adapt the sidebar to your workflow.",
      p: {
        0: "Main sidebar shows Home, Projects/Boards, and Workspace section (views, analytics, archives).",
        1: "Use «Show more» and the preferences icon to reorder or hide personal items.",
      },
      tips: {
        0: "Pin favorite projects in Favorites.",
        1: "App Rail can show icons with or without labels.",
        2: "Boards support tabbed or extended sidebar navigation.",
      },
    },
    workspace_roles: {
      title: "Roles and permissions",
      description: "Who can do what in the workspace.",
      p: {
        0: "Base workspace roles: Admin, Member, Guest.",
        1: "Boards add custom functions — e.g. who edits automations or views Client 360.",
        2: "Projects have their own Admin/Member/Guest roles.",
      },
      tips: {
        0: "Permission matrix available in advanced settings.",
        1: "Assistant and MCP inherit logged-in user permissions.",
        2: "Review board roles when onboarding new squads.",
      },
    },
    boards_overview: {
      title: "Boards overview",
      description: "Boards as team organization unit.",
      p: {
        0: "A board represents a team, squad, or business area grouping multiple projects under shared operational governance.",
        1: "Board overview shows KPIs: open, overdue, completed cards, recent activity, status/priority charts.",
        2: "Create boards at /boards. Each has a unique slug in the URL.",
      },
      tips: {
        0: "Archived boards hide from sidebar but remain in settings.",
        1: "Add existing or new projects directly to the board.",
        2: "Overview alerts on cards without target dates or overdue items.",
        3: "Use spaces for sub-grouping in large boards.",
      },
    },
    boards_views: {
      title: "Views and layouts",
      description: "Board, list, backlog, timeline, and calendar.",
      p: {
        0: "Board (kanban): status columns, drag to transition. Best for continuous flow.",
        1: "List: dense table with filters, grouping, sorting. Best for triage at scale.",
        2: "Backlog, timeline, calendar: temporal planning and prioritization.",
      },
      tips: {
        0: "Display options group by assignee, priority, or label.",
        1: "Save filter combinations as reusable views.",
        2: "Timeline shows dependencies when configured.",
        3: "Board views span all projects in the team.",
      },
    },
    boards_client_360: {
      title: "Client 360",
      description: "Consolidated health view per client/project.",
      p: {
        0: "Client 360 lists all board projects with health indicators: open, overdue, support, status reports.",
        1: "Click a client for detail: KPIs, critical cards, active modules, delivery history.",
        2: "Built for account managers, squad leads, and multi-client operations.",
      },
      tips: {
        0: "Access at /boards/{slug}/clientes.",
        1: "Filter by health or period for at-risk accounts.",
        2: "Ask the Assistant: «Summarize Client 360 for board X».",
      },
    },
    boards_settings: {
      title: "Board settings",
      description: "Governance, fields, types, automation, notifications.",
      p: {
        0: "Settings at /settings/boards/{slug}: access, notifications, automation, custom fields, card types, roles.",
        1: "Board custom fields apply to all linked projects. Card types define specific workflows.",
        2: "Board functions control who edits automations or views sensitive metrics.",
      },
      tips: {
        0: "Email audit tracks automated board sends.",
        1: "Automation secrets are isolated per board.",
        2: "Playbooks are reusable graph templates.",
        3: "Simulate automations before production publish.",
      },
    },
    projects_overview: {
      title: "Manage projects",
      description: "Creation, publishing, and project structure.",
      p: {
        0: "Projects live in boards (recommended) or directly in the workspace. Each has name, key, description, members.",
        1: "Project navigation shows active modules: Work items, Cycles, Modules, Views, Pages, Intake, Status Report.",
        2: "Publish projects for guest visibility or unpublish to restrict access.",
      },
      tips: {
        0: "Project key appears on cards: OPZ-123.",
        1: "Project overview summarizes progress and active members.",
        2: "Project templates speed up new client setup.",
      },
    },
    projects_features: {
      title: "Project modules",
      description: "Cycles, modules, pages, intake, and more.",
      p: {
        0: "Work items: list/kanban of all project cards.",
        1: "Cycles: sprints with dates and burndown. Modules: feature groupings.",
        2: "Pages: rich-text wiki. Intake: intake forms. Status Report: periodic progress reports.",
      },
      tips: {
        0: "Disable unused modules to simplify navigation.",
        1: "Modules can have dates and dedicated members.",
        2: "Pages support versions, collaborative lock, Ask Pi in editor.",
        3: "Intake converts submissions to cards automatically.",
        4: "Saved views are shareable with the team.",
      },
    },
    projects_configuration: {
      title: "Configure project",
      description: "States, labels, estimates, and features.",
      p: {
        0: "Project settings: states (workflow), priorities, labels, estimates, card types, members.",
        1: "States define kanban flow — create groups (backlog, started, completed, cancelled).",
      },
      tips: {
        0: "Project automations complement board automations.",
        1: "Export project data for backup or migration.",
        2: "Archive completed projects instead of deleting.",
      },
    },
    work_items_manage: {
      title: "Manage work items",
      description: "Create, edit, move, and collaborate on cards.",
      p: {
        0: "Create via «New work item», Power K, or duplicate. Card modal centralizes all properties.",
        1: "Comments, mentions (@), attachments, and activity history in the card panel.",
        2: "Move cards between projects, cycles, and modules as work evolves.",
      },
      tips: {
        0: "Shortcut C creates a card in current project context.",
        1: "Use card relations for dependencies and blockers.",
        2: "Bulk operations edit multiple cards at once.",
        3: "AI in the modal helps draft descriptions.",
      },
    },
    work_items_properties: {
      title: "Work item properties",
      description: "Status, priority, assignees, dates, custom fields.",
      p: {
        0: "Standard: title, description, status, priority, assignees, dates, labels, estimate.",
        1: "Board/project custom fields appear as additional properties.",
        2: "Card types can have specific workflows and fields.",
      },
      tips: {
        0: "Priority: urgent, high, medium, low, none.",
        1: "Target date feeds overdue alerts in overview and Client 360.",
        2: "Subscribers get notifications on card changes.",
        3: "Description versions show edit history.",
      },
    },
    work_items_filters: {
      title: "Filters and views",
      description: "Find and organize cards with powerful filters.",
      p: {
        0: "Filter by status, assignee, label, priority, date, module, cycle, custom fields.",
        1: "Save filters as named views — personal or shared.",
      },
      tips: {
        0: "Workspace views aggregate cards across projects.",
        1: "«Your work» shows cards assigned to you.",
        2: "Combine filters with grouping for efficient standups.",
      },
    },
    work_items_drafts: {
      title: "Drafts",
      description: "Save incomplete work before publishing.",
      p: {
        0: "Draft cards live at /drafts — visible only to you until published.",
        1: "Capture ideas quickly without cluttering team backlog.",
      },
      tips: {
        0: "Draft count appears in the sidebar.",
        1: "Publish when title and project are set.",
      },
    },
    planning_cycles: {
      title: "Cycles",
      description: "Plan work in sprints with dates and scope.",
      p: {
        0: "Cycles are time periods (sprints) with card sets. Each has start, end, status.",
        1: "Burndown and progress show if the cycle is on track.",
        2: "Cards belong to one cycle at a time.",
      },
      tips: {
        0: "Active Cycles lists in-progress cycles workspace-wide.",
        1: "Close completed cycles for clean history.",
        2: "Use modules alongside cycles for feature scope.",
      },
    },
    planning_modules: {
      title: "Modules",
      description: "Group cards by feature or deliverable.",
      p: {
        0: "Modules represent delivery blocks with dates, members, status, progress.",
        1: "Cards can be in multiple modules. Module view filters associated cards.",
        2: "Status reports can be generated per module.",
      },
      tips: {
        0: "Modules appear in Client 360 as active scope indicators.",
        1: "Add cards to modules via modal or Power K.",
        2: "Archive delivered modules.",
      },
    },
    planning_views: {
      title: "Views",
      description: "Saved views with custom filters.",
      p: {
        0: "Views capture filters, sort, and display options. Private or shared.",
        1: "Workspace views cover all projects; project views are local.",
      },
      tips: {
        0: "Create «Critical bugs» view with priority=urgent + type=bug.",
        1: "Pin favorite views in the sidebar.",
        2: "Export filtered view results when needed.",
      },
    },
    planning_stickies: {
      title: "Stickies",
      description: "Quick personal notes in the workspace.",
      p: {
        0: "Stickies are digital post-its for reminders and unstructured ideas.",
        1: "Organize in grid, search by text, pin important ones.",
      },
      tips: {
        0: "Access at /stickies from sidebar.",
        1: "Stickies are personal — not a replacement for team cards.",
      },
    },
    knowledge_pages: {
      title: "Pages and documentation",
      description: "Rich-text wiki per project.",
      p: {
        0: "Pages are collaborative documents with block editor, tables, images, code.",
        1: "Support versions, inline comments, edit lock, nested page hierarchy.",
        2: "Ask Pi in editor: AI assists writing and summarization.",
      },
      tips: {
        0: "Operoz Assistant searches pages via search_pages tool.",
        1: "Use pages for runbooks, specs, architecture decisions.",
        2: "Export pages for external sharing when needed.",
      },
    },
    knowledge_status_report: {
      title: "Status Report",
      description: "Periodic project progress reports.",
      p: {
        0: "Status Report consolidates module/cycle progress in executive format.",
        1: "Ideal for stakeholder communication and weekly rituals.",
      },
      tips: {
        0: "Client 360 aggregates status reports across board projects.",
        1: "Combine with automations for automatic email delivery.",
      },
    },
    knowledge_intake: {
      title: "Intake",
      description: "Forms to capture external requests.",
      p: {
        0: "Intake creates public or internal forms that generate project cards.",
        1: "Submissions go through triage before becoming formal work.",
        2: "Assistant lists pending intake via list_intake_pending.",
      },
      tips: {
        0: "Configure form fields per request type.",
        1: "Automate team notification on new submission.",
        2: "Email intake supported in advanced settings.",
      },
    },
    automation_overview: {
      title: "Automation overview",
      description: "Visual rule engine per board.",
      p: {
        0: "Automations react to events (card created, status changed, daily cron) and run actions (email, webhook, script, notification).",
        1: "Each rule is a directed graph: trigger, filter, action nodes connected by edges.",
        2: "Runs are async (Celery + outbox) with retry, logs, and metrics.",
      },
      tips: {
        0: "Start simple: «when status = Done, notify assignee».",
        1: "Use filters to restrict to specific projects or card types.",
        2: "Disable rules instead of deleting — preserves history.",
        3: "Node catalog includes predefined triggers, filters, actions.",
      },
    },
    automation_canvas: {
      title: "Canvas and rules",
      description: "Build automation graphs visually.",
      p: {
        0: "Canvas lets you drag palette nodes, connect outputs to inputs, configure each node.",
        1: "Validation prevents publishing invalid graphs.",
        2: "Simulation runs dry-run with test card without side effects.",
      },
      tips: {
        0: "Name rules descriptively: «Support SLA alert».",
        1: "Scripts run in sandbox with timeout and allowed imports.",
        2: "Webhooks support retry and HMAC signing.",
        3: "Assistant can propose graphs in natural language.",
      },
    },
    automation_playbooks: {
      title: "Playbooks and hooks",
      description: "Reusable templates and Pre/Post governance.",
      p: {
        0: "Playbooks are installable graph templates per board.",
        1: "Pre/Post hooks intercept runs for audit, block, or enrich.",
      },
      tips: {
        0: "Policies define which actions need manual approval.",
        1: "Board playbooks at /settings/boards/{slug}/playbooks.",
        2: "Export playbooks to reuse on other boards.",
      },
    },
    automation_metrics: {
      title: "Metrics and debug",
      description: "Monitor runs, failures, performance.",
      p: {
        0: "Run history shows each execution with detailed step_logs JSON.",
        1: "Aggregated metrics: success rate, latency, volume per period.",
      },
      tips: {
        0: "Recent failures at /settings/boards/{slug}/automacao/falhas.",
        1: "Assistant explains runs with explain_automation_run.",
        2: "Alert on failure rate above threshold.",
      },
    },
    ai_assistant: {
      title: "Operoz Assistant",
      description: "AI chat grounded in real data.",
      p: {
        0: "Assistant answers about cards, pages, Client 360, intake, automations using API with your permissions.",
        1: "Persistent sessions keep history. Select board/project context for precision.",
        2: "Responses include clickable citations (cards, pages, automation runs).",
      },
      tips: {
        0: "Examples: «Overdue cards on board X», «Content of page Y».",
        1: "Thumbs up/down feedback improves quality over time.",
        2: "Requires LLM configured on instance.",
        3: "Tools: search_issues, get_client_360_summary, propose_automation_rule, etc.",
      },
    },
    ai_automation: {
      title: "AI for automation",
      description: "Propose and explain rules in natural language.",
      p: {
        0: "Describe what the automation should do — assistant generates graph, validates, optionally simulates.",
        1: "explain_automation_run translates technical step_logs into readable narrative.",
      },
      tips: {
        0: "Always review proposed graph before publishing.",
        1: "Dry-run is default for automation proposals.",
        2: "Combine AI with manual playbooks for critical flows.",
      },
    },
    analytics_overview: {
      title: "Analytics",
      description: "Work and operations metrics.",
      p: {
        0: "Workspace analytics: card distribution, lead time, throughput, trends.",
        1: "Board automation analytics: successes, failures, execution timeline.",
        2: "Filter by project, period, card type.",
      },
      tips: {
        0: "Access at /analytics in workspace.",
        1: "Export data to spreadsheets when needed.",
        2: "Correlate automation metrics with card volume.",
      },
    },
    analytics_dashboards: {
      title: "Dashboards",
      description: "Custom panels on home.",
      p: {
        0: "Dashboards allow draggable widgets: charts, lists, custom KPIs.",
        1: "Each user can build their ideal home with role-relevant widgets.",
      },
      tips: {
        0: "Access at /dashboards in workspace.",
        1: "Combine analytics widgets with favorite project shortcuts.",
      },
    },
    communication_inbox: {
      title: "Inbox",
      description: "Notification and mention hub.",
      p: {
        0: "Inbox aggregates mentions, assignments, comments, subscribed card updates.",
        1: "Filter by read/unread, mentions, event type.",
        2: "Top bar icon with red unread indicator.",
      },
      tips: {
        0: "Mark all read for quick triage.",
        1: "Click to jump to card or comment.",
        2: "Configure what generates notifications in preferences.",
      },
    },
    communication_notifications: {
      title: "Notifications",
      description: "Preferences and alert channels.",
      p: {
        0: "Configure per workspace, board, project: email, in-app, mentions.",
        1: "Subscribe to specific cards to follow updates.",
      },
      tips: {
        0: "Reduce noise by unsubscribing from irrelevant cards.",
        1: "Board email audit in notification settings.",
        2: "Mentions (@) always generate priority notifications.",
      },
    },
    integrations_overview: {
      title: "Integrations overview",
      description: "Connect Operoz to your ecosystem.",
      p: {
        0: "Native integrations: GitHub, GitLab, Slack, Sentry via workspace settings.",
        1: "Automation webhooks trigger external systems on board events.",
      },
      tips: {
        0: "Review OAuth permissions when connecting external apps.",
        1: "Test webhooks in staging first.",
        2: "Document critical integrations in project Pages.",
      },
    },
    integrations_api: {
      title: "API and webhooks",
      description: "REST API and access tokens.",
      p: {
        0: "Full REST API for workspaces, projects, cards, pages, automations.",
        1: "Generate API tokens in Settings → API Tokens with appropriate scope.",
        2: "Outbound webhooks in automations; inbound webhooks to create cards.",
      },
      tips: {
        0: "Use least-privilege tokens.",
        1: "Rate limits apply — see API documentation.",
        2: "Rotate tokens periodically.",
      },
    },
    integrations_mcp: {
      title: "MCP Server",
      description: "External agents (Cursor, Claude) connected to Operoz.",
      p: {
        0: "MCP server exposes hundreds of tools for AI agents to query and modify Operoz data.",
        1: "Configure in .cursor/mcp.json pointing to your instance. Authenticate with user token.",
        2: "MCP respects user permissions — agents don't bypass security.",
      },
      tips: {
        0: "Ideal for assisted development and backlog automation.",
        1: "operis_list_operations discovers available domains.",
        2: "Combine MCP for devs with web Assistant for end users.",
      },
    },
  },
} as const;
