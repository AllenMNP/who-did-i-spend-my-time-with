# Friend Time Tracker

A personal web application to track time spent with friends, featuring charts, calendar view, CSV import, and dynamic categories.

## Features

- **Log Hangouts** - Record time spent with friends with quick duration presets
- **Dashboard** - View stats with bar charts (hours per friend) and pie charts (by category)
- **Calendar View** - See hangouts on a monthly calendar with color-coded categories
- **List View** - Filterable, sortable history with search and CSV export
- **Friends Management** - Track "last seen" for each friend
- **Dynamic Categories** - Create and manage your own activity categories
- **CSV Import** - Import existing data with column mapping

## Getting Started

### Prerequisites

- Node.js 18+ installed

### Installation

```bash
cd friend-time-tracker
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

## Data Storage

All data is stored in your browser's localStorage. Your data stays on your device and is never sent to any server.

To backup your data, use the Export feature in the History view.

## Tech Stack

- React 18 + Vite
- TailwindCSS
- Recharts (charts)
- date-fns (date utilities)
- PapaParse (CSV parsing)
- Lucide React (icons)
