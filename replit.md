# Guess Party! - Party Guessing Game

## Overview

Guess Party! is a mobile-friendly party guessing game built as a single-page application. Players take turns guessing words from customizable word lists within a time limit, using device tilt gestures to mark correct/incorrect answers. The game supports multiple rounds, custom word lists, and tracks scores across game sessions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: Zustand with persist middleware for local storage persistence
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based structure with:
- `/` - Home page with game start
- `/settings` - Game configuration (timer, rounds, word lists)
- `/settings/deleted` - Manage deleted categories
- `/game` - Active gameplay with tilt detection
- `/summary` - Round/game results with confetti celebrations

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript compiled with tsx
- **API Pattern**: RESTful endpoints prefixed with `/api`
- **Storage**: In-memory storage interface with PostgreSQL schema prepared (Drizzle ORM)

The server uses a storage abstraction pattern (`IStorage` interface) allowing easy swap between memory storage and database storage.

### Data Storage Solutions
- **Client-side**: Zustand persist middleware stores game settings, custom word lists, and deleted category tracking in localStorage
- **Server-side**: PostgreSQL ready via Drizzle ORM with schema in `shared/schema.ts`
- **Current State**: Uses `MemStorage` class for in-memory user data; database can be enabled by implementing `DatabaseStorage`

### Key Game Features
- Device orientation detection for tilt-based answer input
- Configurable round duration (timer) and total rounds
- Built-in word lists (Movies, Animals, Actions, Household Objects)
- Custom word list creation with CSV import support
- Soft-delete and permanent delete for built-in categories

### Tilt Detection Implementation
The tilt detection uses the DeviceOrientation API with gamma axis for landscape orientations:

- **Calibration**: When entering landscape mode, the app collects tilt samples over 500ms to establish a baseline
- **Dual Baseline Tracking**: Both mapped (effectiveTilt) and raw gamma baselines are stored
  - `baselineBetaRef`: The mapped tilt value used for delta calculations
  - `rawGammaBaselineRef`: The raw gamma value used for wrap detection
- **Gamma Unwrapping**: When phone is held vertically (gamma near ±90°), tilting forward causes gamma to wrap from +90 to -90. The unwrap logic detects this crossing and adds/subtracts 180° to create continuous values
- **Orientation-Specific Mapping**: 
  - landscape-secondary: raw gamma used directly
  - landscape-primary: gamma inverted (-gamma) to maintain consistent forward=positive convention
- **Return-to-Center**: After a gesture is recognized, user must return phone to center position before the next gesture is processed

### Build Configuration
- Development: Vite dev server with HMR
- Production: esbuild bundles server, Vite builds client to `dist/public`
- Database migrations: `drizzle-kit push` command

## External Dependencies

### UI Components
- **shadcn/ui**: Full component library based on Radix UI primitives
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel functionality
- **react-confetti**: Celebration animations on game completion

### Data & State
- **@tanstack/react-query**: Server state management
- **Zustand**: Client state management with persistence
- **Drizzle ORM**: Database toolkit with Zod schema validation
- **papaparse**: CSV parsing for word list imports

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **connect-pg-simple**: Session storage for Express (available but not actively used)

### Development Tools
- **Vite**: Build tool with React plugin
- **tsx**: TypeScript execution for server
- **esbuild**: Production server bundling
- **Tailwind CSS v4**: Styling with `@tailwindcss/vite` plugin