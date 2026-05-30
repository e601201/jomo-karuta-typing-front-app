<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import type { GameMode, RandomModeDifficulty } from '$lib/types';
	import type { PageData } from './$types';

	// Components
	import Header from '$lib/components/layout/Header.svelte';
	import GameModeCard from '$lib/components/main-menu/GameModeCard.svelte';
	import LoadingSpinner from '$lib/components/main-menu/LoadingSpinner.svelte';
	import ErrorDisplay from '$lib/components/main-menu/ErrorDisplay.svelte';
	import KarutaSlideshow from '$lib/components/main-menu/KarutaSlideshow.svelte';
	import PracticeModeModal from '$lib/components/main-menu/PracticeModeModal.svelte';
	import HowToPlayModal from '$lib/components/main-menu/HowToPlayModal.svelte';
	import DifficultySelectModal from '$lib/components/main-menu/DifficultySelectModal.svelte';

	let { data }: { data: PageData } = $props();

	interface GameModeOption {
		id: GameMode;
		title: string;
		description: string;
	}

	// State
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let showPracticeModeModal = $state(false);
	let showHowToPlayModal = $state(false);
	let showDifficultyModal = $state(false);
	let selectedMode: GameMode | null = $state(null);

	// Game modes configuration - 3つのメインボタンに変更
	const gameModes: GameModeOption[] = [
		{
			id: 'practice',
			title: '練習モード',
			description: '順番または特定札で練習'
		},
		{
			id: 'random',
			title: 'ランダムモード',
			description: '全44札がランダムな順序で出題'
		},
		{
			id: 'timeattack',
			title: 'タイムアタック',
			description: '10枚の札を最速でタイピング'
		}
	];

	// Lifecycle
	onMount(async () => {
		await initializeApp();
	});

	// Functions
	async function initializeApp() {
		try {
			isLoading = false;
		} catch (err) {
			handleError(err);
		}
	}

	function handleError(err: unknown) {
		error = err instanceof Error ? err.message : 'データの読み込みに失敗しました';
		isLoading = false;
	}

	function handleModeSelect(mode: GameMode) {
		if (isLoading || error) return;

		if (mode === 'practice') {
			showPracticeModeModal = true;
		} else if (mode === 'random') {
			selectedMode = mode;
			showDifficultyModal = true;
		} else if (mode === 'timeattack') {
			selectedMode = mode;
			showDifficultyModal = true;
		} else {
			navigateToGame(mode);
		}
	}

	function handlePracticeModeSelect(practiceType: 'practice' | 'specific') {
		if (practiceType === 'specific') {
			navigateToGame('specific');
		} else {
			navigateToGame('practice');
		}
	}

	function handleDifficultySelect(difficulty: RandomModeDifficulty, gameMode: GameMode) {
		// 難易度をパラメータに追加してゲーム画面へ遷移
		const params = new URLSearchParams({
			mode: gameMode,
			difficulty
		});
		goto(`${resolve('/game')}?${params.toString()}` as ResolvedPathname);
	}

	function navigateToGame(mode: GameMode) {
		// 特定札練習モードは専用ページへ
		if (mode === 'specific') {
			goto(resolve('/practice/specific'));
			return;
		}

		const params = new URLSearchParams({ mode });
		goto(`${resolve('/game')}?${params.toString()}` as ResolvedPathname);
	}

	function handleNavigation(path: '/ranking' | '/settings' | '/statistics') {
		goto(resolve(path));
	}

	function handleRetry() {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>上毛かるたタイピング</title>
	<meta
		name="description"
		content="群馬の郷土かるたでタイピング練習。楽しみながら上毛かるたを覚えよう！"
	/>

	<!-- OGP Meta Tags -->
	<meta property="og:title" content="上毛かるたタイピング" />
	<meta
		property="og:description"
		content="群馬の郷土かるたでタイピング練習。楽しみながら上毛かるたを覚えよう！"
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://jomo-karuta-typing-front-app.vercel.app" />
	<meta
		property="og:image"
		content="https://jomo-karuta-typing-front-app.vercel.app/images/ogp/og-image-optimized.jpg"
	/>
	<meta property="og:site_name" content="上毛かるたタイピング" />
	<meta property="og:locale" content="ja_JP" />

	<!-- Twitter Card Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="上毛かるたタイピング" />
	<meta
		name="twitter:description"
		content="群馬の郷土かるたでタイピング練習。楽しみながら上毛かるたを覚えよう！"
	/>
	<meta
		name="twitter:image"
		content="https://jomo-karuta-typing-front-app.vercel.app/images/ogp/og-image-optimized.jpg"
	/>
</svelte:head>

<Header user={data.user} />

<main class="min-h-screen bg-linear-to-b from-green-50 to-white">
	<div class="container mx-auto max-w-6xl px-4 py-8">
		<!-- Header -->
		<header class="mb-8 text-center">
			<img
				src="/images/game-title.png"
				alt="上毛かるたタイピング"
				class="mx-auto mb-6 h-auto w-full max-w-xl"
			/>
			<!-- かるたスライドショー -->
			<KarutaSlideshow />
		</header>

		<!-- Content -->
		{#if isLoading}
			<LoadingSpinner />
		{:else if error}
			<ErrorDisplay {error} onretry={handleRetry} />
		{:else}
			<div class="m-3 text-center text-gray-500 text-xl">モード選択</div>

			<!-- Game Modes -->
			<div
				data-testid="game-modes-container"
				class="mx-auto mb-12 grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-3"
			>
				{#each gameModes as mode (mode.id)}
					<GameModeCard
						mode={mode.id}
						title={mode.title}
						description={mode.description}
						disabled={isLoading || !!error}
						onclick={handleModeSelect}
					/>
				{/each}
			</div>

			<!-- Navigation Links -->
			<nav class="flex justify-center gap-8">
				<button
					onclick={() => (showHowToPlayModal = true)}
					class="flex items-center gap-2 text-gray-600 transition-colors hover:text-green-600"
					type="button"
				>
					<span class="text-xl">📖</span>
					<span>遊び方</span>
				</button>
				<a
					href={resolve('/ranking')}
					onclick={(e) => {
						e.preventDefault();
						handleNavigation('/ranking');
					}}
					class="flex items-center gap-2 text-gray-600 transition-colors hover:text-green-600"
				>
					<span class="text-xl">🏆</span>
					<span>ランキング</span>
				</a>
				<a
					href={resolve('/settings')}
					onclick={(e) => {
						e.preventDefault();
						handleNavigation('/settings');
					}}
					class="flex items-center gap-2 text-gray-600 transition-colors hover:text-green-600"
				>
					<span class="text-xl">⚙️</span>
					<span>設定</span>
				</a>
				<a
					href={resolve('/statistics')}
					onclick={(e) => {
						e.preventDefault();
						handleNavigation('/statistics');
					}}
					class="flex items-center gap-2 text-gray-600 transition-colors hover:text-green-600"
				>
					<span class="text-xl">📊</span>
					<span>統計（工事中🙇）</span>
				</a>
			</nav>
		{/if}
		<!-- 著作権表示 -->
		<div class="mt-3 text-center text-sm text-gray-500">© 2025 株式会社Vitalize</div>
	</div>

	<!-- 練習モード選択モーダル -->
	<PracticeModeModal
		isOpen={showPracticeModeModal}
		onclose={() => (showPracticeModeModal = false)}
		onselect={handlePracticeModeSelect}
	/>

	<!-- 遊び方モーダル -->
	<HowToPlayModal isOpen={showHowToPlayModal} onclose={() => (showHowToPlayModal = false)} />

	<!-- 難易度選択モーダル -->
	<DifficultySelectModal
		show={showDifficultyModal}
		onClose={() => {
			showDifficultyModal = false;
			selectedMode = null;
		}}
		onSelect={(difficulty) =>
			selectedMode && handleDifficultySelect(difficulty, selectedMode as GameMode)}
	/>
</main>
