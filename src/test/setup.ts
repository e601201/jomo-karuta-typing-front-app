import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock SvelteKit's $app/navigation
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadCode: vi.fn(),
	preloadData: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	onNavigate: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

// Mock SvelteKit's $app/stores
vi.mock('$app/stores', async () => {
	const { writable, readable } = await import('svelte/store');
	const getStores = () => ({
		page: readable({ url: new URL('http://localhost'), params: {} }),
		navigating: readable(null),
		updated: readable(false)
	});

	const page = {
		subscribe: getStores().page.subscribe
	};

	const navigating = {
		subscribe: getStores().navigating.subscribe
	};

	return {
		getStores,
		page,
		navigating
	};
});
