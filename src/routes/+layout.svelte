<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import { onMount } from 'svelte';
	import { settingsStore } from '$lib/stores/settings';

	let { children } = $props();

	// アプリケーション起動時に設定を読み込む
	onMount(async () => {
		await settingsStore.load();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
