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
	const { readable } = await import('svelte/store');
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

// Mock SvelteKit's $env/static/public
// テストをローカル .env の内容に依存させない。supabase-js 2.110 以降は createClient が
// モジュール読み込み時に URL を検証するため、プレースホルダ値のままだと
// supabaseClient.ts を import しただけで例外になる。
vi.mock('$env/static/public', () => ({
	PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
	PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key'
}));

// Mock SvelteKit's $app/paths
// happy-dom 上のテスト環境では仮想モジュール $app/paths の resolve が動く保証がなく、
// resolve('/') を描画時に評価するルートコンポーネント（routes/game・routes/ 等）が
// 壊れる。passthrough モックで決定性を確保する。詳細は docs/adr/0001-route-integration-tests.md。
vi.mock('$app/paths', () => ({
	base: '',
	assets: '',
	resolve: (path: string) => path,
	resolveRoute: (path: string) => path
}));
