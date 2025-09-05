# SCCNY Monorepo

A [Turborepo](https://turbo.build/repo) monorepo containing the SCCNY (Second Chinese Christian Church of New York) website built with [Next.js](https://nextjs.org).

## Project Structure

```
├── apps/
│   └── sccny/           # Main Next.js application
│       ├── src/         # Application source code
│       ├── public/      # Static assets
│       ├── package.json # App-specific dependencies
│       └── next.config.mjs
├── packages/            # Shared packages (for future use)
├── turbo.json           # Turborepo configuration
└── package.json         # Root workspace configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

Build all applications:

```bash
npm run build
```

### Other Commands

```bash
npm run lint    # Lint all apps
npm run start   # Start production server
```

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org) with App Router
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app)
- **Build Tool**: [Turborepo](https://turbo.build/repo)
- **Language**: TypeScript

## Features

- 🌐 Multi-language support (English/Chinese)
- 📱 Responsive design
- ⚡ Optimized performance with Next.js
- 🎨 Modern UI with Tailwind CSS
- 🚀 Fast builds with Turborepo

## Development

The project uses Turborepo for efficient monorepo management. All apps are located in the `apps/` directory, and shared packages can be added to `packages/` when needed.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
