# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `bun --bun run dev` - Start development server with hot reload
- `bun --bun run dev -- --open` - Start dev server and open in browser
- `bun --bun run build` - Build production version
- `bun --bun run preview` - Preview production build locally
- `bun --bun run check` - Run Svelte type checking
- `bun --bun run check:watch` - Run type checking in watch mode
- `bun --bun run lint` - Check code formatting and linting (Prettier + ESLint)
- `bun --bun run format` - Format code with Prettier

## Project Architecture

This is a SvelteKit application with the following key characteristics:

- **Framework**: SvelteKit 2 with Svelte 5 (using new `$props()` syntax)
- **Styling**: Tailwind CSS 4.0 with Vite plugin integration
- **TypeScript**: Strict TypeScript configuration with type checking
- **Deployment**: Configured for Vercel with `@sveltejs/adapter-vercel`
- **Linting**: ESLint with TypeScript and Svelte plugins, Prettier integration

### Directory Structure

- `src/routes/` - SvelteKit file-based routing
  - `+layout.svelte` - Root layout with favicon setup
  - `+page.svelte` - Home page component
- `src/lib/` - Shared utilities and components (importable via `$lib` alias)
  - `assets/` - Static assets like favicon
- `src/app.html` - HTML template
- `src/app.css` - Global styles (Tailwind imports)

### Key Configuration Files

- `svelte.config.js` - SvelteKit configuration with Vercel adapter
- `vite.config.ts` - Vite build configuration with Tailwind and SvelteKit plugins
- `tsconfig.json` - TypeScript configuration extending SvelteKit defaults
- `eslint.config.js` - ESLint configuration with TypeScript and Svelte support

### Development Notes

- Uses Svelte 5 syntax (components use `$props()` instead of export let)
- Tailwind CSS is configured as a Vite plugin for optimal performance
- ESLint is configured to work with TypeScript projects (no-undef rule disabled)
- The project uses strict TypeScript settings with comprehensive type checking
