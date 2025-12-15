<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import { onMount } from 'svelte';
	import { settingsStore } from '$lib/stores/settings';
	import { authStore } from '$lib/stores/auth';
	import { invalidate } from '$app/navigation';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	// アプリケーション起動時に設定を読み込む
	onMount(() => {
		settingsStore.load();

		// Set up auth state
		authStore.setSession(data.session);

		// Listen for auth state changes
		const {
			data: { subscription }
		} = data.supabase.auth.onAuthStateChange((event, session) => {
			authStore.setSession(session);

			if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
				invalidate('supabase:auth');
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
