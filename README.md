# Hour One

A productivity dashboard Chrome extension that replaces your new tab page with daily inspiration, task management, and focus tools.

## Development Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Loading the Extension

1. Run `npm run dev` to start the development server
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist` folder in this project
6. Open a new tab to see Hour One

### Building for Production

```bash
npm run build
```

The built extension will be in the `dist` folder.

## Extension Icons

Before publishing, add extension icons to the `public/icons/` folder:
- `icon-16.png` (16x16 pixels)
- `icon-48.png` (48x48 pixels)
- `icon-128.png` (128x128 pixels)

## Project Structure

```
hour-one/
├── public/
│   └── icons/           # Extension icons
├── src/
│   ├── components/
│   │   ├── layout/      # Dashboard layout components
│   │   ├── widgets/     # Individual widget components
│   │   └── ui/          # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # Zustand state stores
│   ├── services/        # API integrations
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── styles/          # Global CSS styles
│   ├── newtab.html      # New tab HTML entry
│   └── newtab.tsx       # New tab React entry
├── manifest.json        # Chrome extension manifest
├── vite.config.ts       # Vite configuration
└── tailwind.config.js   # Tailwind CSS configuration
```

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Lucide React** - Icons

## License

MIT
