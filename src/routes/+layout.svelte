<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	let { children, origin, path }: { children: any; origin?: string; path?: string } = $props();

	const siteName = '上毛カルタタイピング';
	const title = siteName;
	const description = '群馬の郷土カルタでタイピング練習。楽しみながら上毛カルタを覚えよう！';
	const baseUrl = origin || 'https://jomo-karuta-typing.vercel.app';
	const pageUrl = `${baseUrl}${path ?? ''}`;
	const ogImage = `${baseUrl}/images/ogp/og-image-new.jpg`;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="description" content={description} />

	<!-- OGP Meta Tags (global default) -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:site_name" content={siteName} />
	<meta property="og:locale" content="ja_JP" />

	<!-- Twitter Card Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

{@render children?.()}
