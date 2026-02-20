$ErrorActionPreference = "Stop"
Set-Location "c:\Users\sriva\anant"

# Add remote
git remote add origin https://github.com/satvik-svg/anant.git 2>$null

# Helper function
function Commit($files, $msg) {
    foreach ($f in $files) {
        git add $f
    }
    git commit -m $msg
    Write-Host "✅ $msg" -ForegroundColor Green
}

# 1
Commit @("package.json", "README.md") "init next.js project with dependencies"

# 2
Commit @("tsconfig.json") "add typescript config"

# 3
Commit @("next.config.ts") "add next.js configuration"

# 4
Commit @("eslint.config.mjs") "setup eslint for the project"

# 5
Commit @("postcss.config.mjs") "configure postcss with tailwind"

# 6
Commit @(".gitignore", "app/globals.css") "add gitignore and global styles"

# 7
Commit @("prisma.config.ts") "prisma config pointing to neon db"

# 8
Commit @("prisma/schema.prisma") "define full database schema with all models"

# 9
Commit @("prisma/seed.ts") "add seed script with demo users and sample projects"

# 10
Commit @("lib/prisma.ts") "setup prisma client with neon adapter"

# 11
Commit @("lib/auth.config.ts") "add nextauth config for edge runtime"

# 12
Commit @("lib/auth.ts") "setup credentials auth provider with bcrypt"

# 13
Commit @("middleware.ts") "add auth middleware to protect dashboard routes"

# 14
Commit @("app/api/auth/[...nextauth]/route.ts") "expose nextauth GET and POST handlers"

# 15
Commit @("lib/actions/auth.ts") "add register and login server actions"

# 16
Commit @("app/layout.tsx") "root layout with geist fonts"

# 17
Commit @("app/page.tsx") "build landing page with hero and feature cards"

# 18
Commit @("app/login/page.tsx") "add login page with form"

# 19
Commit @("app/register/page.tsx") "add registration page"

# 20
Commit @("lib/actions/teams.ts") "add team invite and remove actions"

# 21
Commit @("lib/actions/projects.ts") "add project CRUD with default sections"

# 22
Commit @("lib/actions/notifications.ts") "add notification system with read/unread"

# 23
Commit @("lib/actions/tasks.ts") "add task CRUD, move, and filtering actions"

# 24
Commit @("lib/actions/comments.ts") "add comment and file attachment handling"

# 25
Commit @("lib/actions/subtasks.ts") "add subtask create, toggle and delete"

# 26
Commit @("lib/actions/activity.ts") "add activity log for task changes"

# 27
Commit @("lib/actions/tags.ts") "add tag system for tasks"

# 28
Commit @("lib/actions/search.ts") "add global search across tasks and projects"

# 29
Commit @("lib/actions/goals.ts") "add goals CRUD actions"

# 30
Commit @("lib/actions/analytics.ts") "add analytics data aggregation for reporting"

# 31
Commit @("lib/actions/portfolios.ts") "add portfolio management actions"

# 32
Commit @("components/sidebar.tsx") "build sidebar with nav links and project list"

# 33
Commit @("components/search-dialog.tsx") "add ctrl+k search dialog component"

# 34
Commit @("components/create-project-dialog.tsx") "add new project creation modal"

# 35
Commit @("app/dashboard/layout.tsx", "app/dashboard/page.tsx") "add dashboard layout and home page with stats"

# 36
Commit @("components/task-card.tsx") "add draggable task card with priority and dates"

# 37
Commit @("components/kanban-board.tsx") "build kanban board with drag and drop columns"

# 38
Commit @("components/list-view.tsx", "components/create-task-dialog.tsx") "add list view and task creation form"

# 39
Commit @("components/project-view.tsx", "app/dashboard/projects/[projectId]/page.tsx") "wire up project page with board and list toggle"

# 40 - remaining components and pages
Commit @(
    "components/task-detail-modal.tsx",
    "components/my-tasks-list.tsx",
    "app/dashboard/my-tasks/page.tsx",
    "components/inbox-list.tsx",
    "app/dashboard/inbox/page.tsx",
    "components/team-management.tsx",
    "app/dashboard/team/page.tsx",
    "components/goals-list.tsx",
    "app/dashboard/goals/page.tsx",
    "components/portfolios-list.tsx",
    "app/dashboard/portfolios/page.tsx",
    "components/analytics-dashboard.tsx",
    "app/dashboard/reporting/page.tsx",
    "public/",
    "src/"
) "add task detail modal, my tasks, inbox, team, goals, portfolios and reporting pages"

# Check if anything is left unstaged
$remaining = git status --porcelain
if ($remaining) {
    git add -A
    git commit -m "minor cleanup"
    Write-Host "✅ minor cleanup (leftover files)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 All 40 commits created! Pushing to origin..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

Write-Host "✅ Pushed successfully!" -ForegroundColor Green
