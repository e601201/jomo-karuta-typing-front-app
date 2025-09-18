<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { IndexedDBService } from '$lib/services/storage/indexed-db';
	import type { GameMode, RandomModeDifficulty } from '$lib/types';

	const db = new IndexedDBService();

	// Components
	import GameModeCard from '$lib/components/main-menu/GameModeCard.svelte';
	import LoadingSpinner from '$lib/components/main-menu/LoadingSpinner.svelte';
	import ErrorDisplay from '$lib/components/main-menu/ErrorDisplay.svelte';
	import ContinueProgress from '$lib/components/main-menu/ContinueProgress.svelte';
	import KarutaSlideshow from '$lib/components/main-menu/KarutaSlideshow.svelte';
	import PracticeModeModal from '$lib/components/main-menu/PracticeModeModal.svelte';
	import DifficultySelectModal from '$lib/components/main-menu/DifficultySelectModal.svelte';
	import HowToPlayModal from '$lib/components/main-menu/HowToPlayModal.svelte';

	interface GameModeOption {
		id: GameMode;
		title: string;
		description: string;
		icon: string;
	}

	// State
	let isLoading = $state(true);
	let error = $state<string | null>(null);
	let hasProgress = $state(false);
	let progressInfo = $state<{ completedCards: number; totalCards: number } | null>(null);
	let showPracticeModeModal = $state(false);
	let showDifficultyModal = $state(false);
	let showHowToPlayModal = $state(false);

	// Game modes configuration - 2つのメインボタンに変更
	const gameModes: GameModeOption[] = [
		{
			id: 'practice',
			title: '練習モード',
			description: '順番または特定札で練習',
			icon: '📚'
		},
		{
			id: 'random',
			title: 'プレイ開始',
			description: 'ランダムな順序でゲーム開始',
			icon: '🎮'
		}
	];

	// Lifecycle
	onMount(async () => {
		await initializeApp();
	});

	// Functions
	async function initializeApp() {
		try {
			await db.init();
			await checkExistingProgress();
			isLoading = false;
		} catch (err) {
			handleError(err);
		}
	}

	async function checkExistingProgress() {
		const latestSession = await db.getLatestSession();
		if (latestSession && latestSession.completedCards < latestSession.totalCards) {
			hasProgress = true;
			progressInfo = {
				completedCards: latestSession.completedCards,
				totalCards: latestSession.totalCards
			};
		}
	}

	function handleError(err: unknown) {
		error = err instanceof Error ? err.message : 'データの読み込みに失敗しました';
		isLoading = false;
	}

	function handleModeSelect(mode: GameMode) {
		if (isLoading || error) return;

		// 練習モードの場合はモーダルを表示
		if (mode === 'practice') {
			showPracticeModeModal = true;
		} else if (mode === 'random') {
			// ランダムモード（プレイ開始）の場合は難易度選択モーダルを表示
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

	function handleDifficultySelect(difficulty: RandomModeDifficulty) {
		// 難易度をパラメータに追加してゲーム画面へ遷移
		const params = new URLSearchParams({
			mode: 'random',
			difficulty
		});
		goto(`/game?${params.toString()}`);
	}

	function handleContinue() {
		if (isLoading || error || !hasProgress) return;
		navigateToGame('practice', true);
	}

	function navigateToGame(mode: GameMode, continueGame = false) {
		// 特定札練習モードは専用ページへ
		if (mode === 'specific') {
			goto('/practice/specific');
			return;
		}

		const params = new URLSearchParams({ mode });
		if (continueGame) params.append('continue', 'true');
		goto(`/game?${params.toString()}`);
	}

	function handleNavigation(path: string) {
		goto(path);
	}

	function handleRetry() {
		window.location.reload();
	}
</script>

<svelte:head>
	<title>上毛カルタタイピング</title>
	<meta name="description" content="群馬の郷土カルタでタイピング練習" />

	<!-- OGP Meta Tags -->
	<meta property="og:title" content="上毛カルタタイピング" />
	<meta
		property="og:description"
		content="群馬の郷土カルタでタイピング練習。楽しみながら上毛カルタを覚えよう！"
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://jomo-karuta-typing-front-app.vercel.app" />
	<meta
		property="og:image"
		content="https://jomo-karuta-typing-front-app.vercel.app/images/ogp/og-image-optimized.jpg"
	/>
	<meta property="og:site_name" content="上毛カルタタイピング" />
	<meta property="og:locale" content="ja_JP" />

	<!-- Twitter Card Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="上毛カルタタイピング" />
	<meta
		name="twitter:description"
		content="群馬の郷土カルタでタイピング練習。楽しみながら上毛カルタを覚えよう！"
	/>
	<meta
		name="twitter:image"
		content="https://jomo-karuta-typing-front-app.vercel.app/images/ogp/og-image-optimized.jpg"
	/>
</svelte:head>

<main class="min-h-screen bg-gradient-to-b from-green-50 to-white">
	<div class="container mx-auto max-w-6xl px-4 py-8">
		<!-- Header -->
		<header class="mb-8 text-center">
			<img
				src="/images/game-title.png"
				alt="上毛カルタタイピング"
				class="mx-auto mb-6 h-auto w-full max-w-2xl"
			/>
			<!-- カルタスライドショー -->
			<KarutaSlideshow />
		</header>

		<!-- Content -->
		{#if isLoading}
			<LoadingSpinner />
		{:else if error}
			<ErrorDisplay {error} onretry={handleRetry} />
		{:else}
			<!-- Continue Progress -->
			{#if hasProgress && progressInfo}
				<ContinueProgress
					completedCards={progressInfo.completedCards}
					totalCards={progressInfo.totalCards}
					oncontinue={handleContinue}
				/>
			{/if}

			<!-- Game Modes -->
			<div
				data-testid="game-modes-container"
				class="mx-auto mb-12 grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2"
			>
				{#each gameModes as mode (mode.id)}
					<GameModeCard
						mode={mode.id}
						title={mode.title}
						description={mode.description}
						icon={mode.icon}
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
					href="/ranking"
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
					href="/settings"
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
					href="/statistics"
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
		<div class="mt-8 text-center text-sm text-gray-500">© 2025 株式会社Vitalize</div>
	</div>

	<!-- 練習モード選択モーダル -->
	<PracticeModeModal
		isOpen={showPracticeModeModal}
		onclose={() => (showPracticeModeModal = false)}
		onselect={handlePracticeModeSelect}
	/>
	<!-- 難易度選択モーダル -->
	<DifficultySelectModal
		show={showDifficultyModal}
		onClose={() => (showDifficultyModal = false)}
		onSelect={handleDifficultySelect}
	/>

	<!-- 遊び方モーダル -->
	<HowToPlayModal isOpen={showHowToPlayModal} onclose={() => (showHowToPlayModal = false)} />
</main>
