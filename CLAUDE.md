# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `bun --bun run dev` - Start development server (port 5173)
- `bun --bun run build` - Build for production (Vercel adapter)
- `bun --bun run check` - Run Svelte type checking
- `bun --bun run lint` - Check formatting and linting (Prettier + ESLint)
- `bun --bun run format` - Auto-format code with Prettier
- `bun --bun run test` - Run all tests once
- `bun --bun run test:unit` - Run tests in watch mode (Vitest)
- `bun --bun run test:unit -- --run src/lib/services/typing/input-validator.spec.ts` - Run a single test file

## Project Overview

上毛かるたタイピングゲーム (Jomo Karuta Typing Game) - a SvelteKit typing game based on Jomo Karuta (群馬県の郷土かるた). Players type romaji corresponding to hiragana readings of 44 karuta cards.

## Tech Stack

- **SvelteKit 2 / Svelte 5** - Uses runes syntax (`$props()`, `$state()`, `$derived()`)
- **Tailwind CSS 4.0** - Configured as Vite plugin (`@tailwindcss/vite`)
- **Supabase** - Auth (Google/GitHub OAuth) and database (scores/rankings)
- **Dexie.js** - IndexedDB wrapper for game history, detailed stats, card history
- **Vitest + happy-dom** - Testing with `@testing-library/svelte`
- **Vercel** - Deployment target

## Environment Variables

Required in `.env` (copy from `.env.example`):

- `PUBLIC_SUPABASE_URL` - Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Architecture

### Game Modes

| Mode        | Route                                        | Cards             | Description                          |
| ----------- | -------------------------------------------- | ----------------- | ------------------------------------ |
| Practice    | `/game?mode=practice`                        | All 44 sequential | Full walkthrough                     |
| Specific    | `/practice/specific` → `/game?mode=specific` | User-selected     | Focused training                     |
| Random      | `/game?mode=random`                          | All 44 shuffled   | 3 difficulty levels                  |
| Time Attack | `/game?mode=timeattack`                      | 10 random         | Time-based scoring, 10s skip penalty |

All modes run through the single `gameStore` engine (`src/lib/stores/game.ts`). The specific-card route passes its (repeat/shuffle-expanded) selection to the game as an ordered, duplicate-preserving `cards` URL param. Practice/specific pass `difficulty=undefined`, so they always use full hiragana and standard scoring and show no ranking modal.

Difficulty levels (beginner/standard/advanced) affect scoring parameters and display mode (random mode only).

### Data Flow

```
User Keystroke → InputValidator (romaji↔hiragana mapping)
              → gameStore.updateInput()
              → completeCard() / nextCard()
              → Auto-save to LocalStorage (5s interval)
              → Final result → IndexedDB + Supabase
              → Derived stores recalculate stats
```

### Key Directories

- `src/lib/data/karuta-cards.ts` - 44-card dataset with hiragana, romaji, categories, difficulty
- `src/lib/services/game/` - `score.ts` (`calcTypingScore`, difficulty-aware scoring). Card sequencing/shuffle/timer/scoring all live in `gameStore`.
- `src/lib/services/typing/` - `input-validator.ts` (100+ romaji mappings), `partial-input-processor.ts`
- `src/lib/services/storage/` - `local-storage.ts` (settings/session), `indexed-db.ts` (Dexie: history/stats), `favorites-service.ts`
- `src/lib/stores/` - Svelte stores: `game.ts` (main game state + derived stores), `settings.ts`, `statistics.ts`, `auth.ts`
- `src/lib/types/` - TypeScript types: `game.ts` (core types), `storage.ts`, `database.ts`, `multiplayer.ts`
- `src/lib/supabase/` - `browser.ts` (client-side), `server.ts` (SSR)

### Routes

```
/                    - Main menu with mode selection
/game                - Game interface (mode via query params)
/practice/specific   - Card selection UI for specific mode
/ranking             - Leaderboards (random & time attack)
/statistics          - Stats visualization
/settings            - User preferences
/profile             - User profile (OAuth)
/auth/{login,signup,callback,logout,error} - Auth flows
```

### Auth Flow

- `src/hooks.server.ts` - JWT validation on every request, session in `event.locals`
- `src/routes/+layout.server.ts` - Passes session to client
- `src/routes/+layout.ts` - Client-side Supabase auth sync
- OAuth providers: Google, GitHub

### Stores Pattern

Stores use a factory pattern (e.g., `createGameStore()`) returning singleton instances. The game store has nested state (`session`, `cards`, `input`, `score`, `timer`, `statistics`) with derived stores (`currentCardStore`, `progressStore`, `scoreStore`, `statisticsStore`) for reactive UI updates.

### Testing

- Config: `vitest.config.ts` with `happy-dom` environment and globals enabled
- Setup: `src/test/setup.ts` mocks `$app/navigation` and `$app/stores`
- Pattern: `*.spec.ts` files co-located with source files
- Test library: `@testing-library/svelte` with `@testing-library/jest-dom` matchers
