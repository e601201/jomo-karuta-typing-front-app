import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	// Svelte 5 のクライアント版（mount 等）を解決させる。これが無いと SSR ビルドが
	// 解決され、コンポーネントテストが
	// `lifecycle_function_unavailable: mount(...) is not available on the server` で失敗する。
	resolve: {
		conditions: ['browser']
	},
	test: {
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}'],
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'src/test/', '.svelte-kit/', 'build/', '*.config.*']
		}
	}
});
