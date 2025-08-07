<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface GameStats {
		currentCard: number;
		totalCards: number;
		elapsedTime: number;
		pauseCount: number;
		totalPauseTime: number;
		score: number;
		accuracy: number;
	}

	interface Props {
		isPaused: boolean;
		gameStats: GameStats;
		onResume: (options?: { skipCountdown?: boolean }) => void;
		onExit: () => void;
		onSettings?: () => void;
		showCountdown?: boolean;
		countdownDuration?: number;
		isCountingDown?: boolean;
	}

	let {
		isPaused,
		gameStats,
		onResume,
		onExit,
		onSettings,
		showCountdown = true,
		countdownDuration = 3,
		isCountingDown = false
	}: Props = $props();

	let showExitConfirm = $state(false);
	let countdown = $state(0);
	let isRunningCountdown = $state(false);
	let countdownInterval: NodeJS.Timeout | null = null;

	// Format time to mm:ss
	function formatTime(ms: number): string {
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

	// Handle resume with countdown
	function handleResume() {
		if (showCountdown && !isCountingDown) {
			startCountdown();
		} else {
			onResume();
		}
	}

	// Start countdown
	function startCountdown() {
		isRunningCountdown = true;
		countdown = countdownDuration;

		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				stopCountdown();
				onResume();
			}
		}, 1000);
	}

	// Stop countdown
	function stopCountdown() {
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}
		isRunningCountdown = false;
		countdown = 0;
	}

	// Skip countdown
	function skipCountdown() {
		if (isRunningCountdown) {
			stopCountdown();
			onResume({ skipCountdown: true });
		}
	}

	// Handle exit confirmation
	function handleExit() {
		showExitConfirm = true;
	}

	function confirmExit() {
		showExitConfirm = false;
		onExit();
	}

	function cancelExit() {
		showExitConfirm = false;
	}

	// Keyboard event handler
	function handleKeyDown(event: KeyboardEvent) {
		if (!isPaused) return;

		if (event.key === 'Escape' && !isRunningCountdown && !showExitConfirm) {
			handleResume();
		} else if (event.key === ' ' && isRunningCountdown) {
			event.preventDefault();
			skipCountdown();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeyDown);
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeyDown);
		stopCountdown();
	});
</script>

{#if isPaused}
	<div
		data-testid="pause-overlay"
		class="bg-opacity-70 fixed inset-0 z-50 flex items-center justify-center bg-black backdrop-blur-sm transition-opacity duration-300"
		aria-hidden="false"
	>
		<div
			data-testid="pause-modal"
			role="dialog"
			aria-labelledby="pause-title"
			aria-modal="true"
			class="mx-4 h-full w-full max-w-lg scale-100 rounded-2xl bg-white p-8 shadow-2xl transition-all duration-300 md:h-auto md:w-auto"
		>
			<!-- Title -->
			<h2 id="pause-title" class="mb-6 text-center text-3xl font-bold">一時停止中</h2>

			<!-- Countdown Display -->
			{#if isRunningCountdown}
				<div data-testid="countdown-display" class="mb-8 text-center">
					<div class="animate-pulse text-6xl font-bold text-blue-600">
						{countdown}
					</div>
					<p class="mt-2 text-sm text-gray-600">スペースキーでスキップ</p>
				</div>
			{:else if !showExitConfirm}
				<!-- Game Stats -->
				<div class="mb-8 space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="rounded-lg bg-gray-50 p-3 text-center">
							<p class="text-sm text-gray-600">進捗</p>
							<p class="text-xl font-bold">{gameStats.currentCard}/{gameStats.totalCards}枚完了</p>
						</div>
						<div class="rounded-lg bg-gray-50 p-3 text-center">
							<p class="text-sm text-gray-600">経過時間</p>
							<p class="text-xl font-bold">{formatTime(gameStats.elapsedTime)}</p>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="rounded-lg bg-gray-50 p-3 text-center">
							<p class="text-sm text-gray-600">スコア</p>
							<p class="text-xl font-bold">スコア: {gameStats.score}</p>
						</div>
						<div class="rounded-lg bg-gray-50 p-3 text-center">
							<p class="text-sm text-gray-600">正確率</p>
							<p class="text-xl font-bold">正確率: {gameStats.accuracy}%</p>
						</div>
					</div>

					<div class="rounded-lg bg-gray-50 p-3 text-center">
						<p class="text-sm text-gray-600">一時停止回数: {gameStats.pauseCount}回</p>
					</div>
				</div>

				<!-- Action Buttons -->
				<div class="flex flex-col gap-3">
					<button
						onclick={handleResume}
						class="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-700"
					>
						再開
					</button>

					{#if onSettings}
						<button
							onclick={onSettings}
							class="w-full rounded-lg bg-gray-600 px-6 py-3 text-white transition-colors hover:bg-gray-700"
						>
							設定
						</button>
					{/if}

					<button
						onclick={handleExit}
						class="w-full rounded-lg bg-red-600 px-6 py-3 text-white transition-colors hover:bg-red-700"
					>
						終了
					</button>
				</div>

				<p class="mt-4 text-center text-sm text-gray-600">ESCキーで再開</p>
			{/if}

			<!-- Exit Confirmation Dialog -->
			{#if showExitConfirm}
				<div class="text-center">
					<h3 class="mb-4 text-xl font-bold">本当に終了しますか？</h3>
					<p class="mb-6 text-gray-600">進捗は保存されます</p>
					<div class="flex justify-center gap-4">
						<button
							onclick={confirmExit}
							class="rounded-lg bg-red-600 px-6 py-2 text-white transition-colors hover:bg-red-700"
						>
							はい
						</button>
						<button
							onclick={cancelExit}
							class="rounded-lg bg-gray-600 px-6 py-2 text-white transition-colors hover:bg-gray-700"
						>
							いいえ
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	/* Additional animations can be added here if needed */
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(0.95);
		}
	}
</style>
