# Hour One - Claude Code Configuration

## Project Overview
A productivity dashboard Chrome extension that replaces your new tab page with daily inspiration, task management, and focus tools.

## Tech Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool with CRXJS plugin for Chrome extension
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Lucide React** - Icons

## Commands
| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run setup` | Generate extension icons |

## Project Structure
```
hour-one/
├── public/icons/           # Extension icons
├── src/
│   ├── components/
│   │   ├── layout/         # Dashboard layout components
│   │   ├── widgets/        # Individual widget components
│   │   └── ui/             # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── stores/             # Zustand state stores
│   ├── services/           # API integrations
│   ├── types/              # TypeScript type definitions
│   ├── lib/                # Utility functions
│   ├── styles/             # Global CSS styles
│   ├── newtab.html         # New tab HTML entry
│   └── newtab.tsx          # New tab React entry
├── docs/
│   ├── features/           # Feature specifications
│   └── ai/                 # AI context maps
├── manifest.json           # Chrome extension manifest
├── vite.config.ts          # Vite configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

## Code Patterns

### State Management
- All persistent state uses Zustand stores in `src/stores/`
- Stores use Chrome Storage API via `src/lib/chromeStorage.ts`
- Each widget typically has its own store

### Component Organization
- Widgets are self-contained in `src/components/widgets/`
- Shared UI components in `src/components/ui/`
- Layout components in `src/components/layout/`

### Styling
- Use Tailwind CSS classes
- Dark mode support via ThemeProvider
- Glassmorphism design with backdrop-blur effects

## Feature-First Workflow (Mandatory)

### Documentation First
Every change must be tied to a Feature Spec located at `docs/features/<feature-slug>.md`.

### Planning
The Planning phase must involve creating or updating the Feature Spec (defining objective, scope, impacted files, data model, test plan, and rollout).

### Execution
Code generation and test creation must explicitly reference requirements defined in the Feature Spec.

### Branching Strategy
Use the naming convention `feature/<short_meaningful_name>`.

### Git Operations
Use the `gh` CLI for all GitHub operations (PR creation, comments, status checks).

## Testing
- Unit tests: Not yet configured (TODO: Add Vitest)
- E2E tests: Not yet configured (TODO: Add Playwright)
- Run type checking: `npx tsc --noEmit`

### Current TypeScript Status
**84 TypeScript errors** as of 2026-02-06 (mostly unused imports/variables):
- Majority are unused imports/variables (TS6133)
- Some type mismatches (TS2339, TS2352, TS2554)
- Affected files: KeyboardShortcuts, SettingsSidebar, MetricsDashboard, various widgets and stores

## GitHub Workflow
- Branch naming: `feature/<slug>`
- PR creation: `gh pr create`
- PR checks: `gh pr checks`
- PR comments: `gh pr comment`

## Security Notes
- Never read `.env` or `.env.*` files
- Never access `secrets/**` directories
- Use Chrome Storage API for data persistence (not localStorage)
