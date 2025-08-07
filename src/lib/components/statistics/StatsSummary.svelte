<script lang="ts">
	import type { OverallStats } from '$lib/types/game';

	interface Props {
		stats: OverallStats;
		compareWith?: 'yesterday' | 'lastWeek' | 'lastMonth';
		previousStats?: OverallStats;
		levelProgress?: {
			currentLevel: number;
			nextLevel: number;
			progress: number;
			pointsToNext: number;
		};
		animate?: boolean;
	}

	let { stats, compareWith, previousStats, levelProgress, animate = false }: Props = $props();

	// Format time duration
	function formatDuration(ms: number): string {
		if (ms === 0) return 'データなし';

		const hours = Math.floor(ms / 3600000);
		const minutes = Math.floor((ms % 3600000) / 60000);

		if (hours > 0) {
			return `${hours}時間${minutes > 0 ? minutes + '分' : ''}`;
		}
		return `${minutes}分`;
	}

	// Calculate comparison
	function getComparison(
		current: number,
		previous?: number
	): {
		value: number;
		percentage: number;
		direction: 'up' | 'down' | 'same';
	} {
		if (!previous || previous === 0) {
			return { value: 0, percentage: 0, direction: 'same' };
		}

		const diff = current - previous;
		const percentage = (diff / previous) * 100;

		return {
			value: diff,
			percentage,
			direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same'
		};
	}

	// Get comparison for WPM
	let wpmComparison = $derived(
		previousStats
			? getComparison(stats.averageWPM, previousStats.averageWPM)
			: null
	);
	let accuracyComparison = $derived(
		previousStats
			? getComparison(stats.averageAccuracy, previousStats.averageAccuracy)
			: null
	);
</script>

<div
	data-testid="stats-summary-container"
	class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
>
	<!-- Sessions Card -->
	<div
		data-testid="stat-card-sessions"
		class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800"
	>
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-gray-600 dark:text-gray-400">プレイ回数</p>
				<p class="text-2xl font-bold {animate ? 'animate-count-up' : ''}">{stats.totalSessions}</p>
				<p class="text-xs text-gray-500">
					{stats.totalSessions === 0 ? 'データなし' : `${stats.totalSessions}回`}
				</p>
			</div>
			<svg class="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 10V3L4 14h7v7l9-11h-7z"
				/>
			</svg>
		</div>
	</div>

	<!-- Play Time Card -->
	<div
		data-testid="stat-card-playtime"
		class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800"
	>
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-gray-600 dark:text-gray-400">総プレイ時間</p>
				<p data-testid="playtime-display" class="text-2xl font-bold">
					{formatDuration(stats.totalPlayTime)}
				</p>
			</div>
			<svg class="h-8 w-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
	</div>

	<!-- WPM Card -->
	<div
		data-testid="stat-card-wpm"
		class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800"
	>
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-gray-600 dark:text-gray-400">平均WPM</p>
				<div class="flex items-baseline gap-2">
					<p class="text-2xl font-bold">{Math.round(stats.averageWPM)}</p>
					{#if wpmComparison && wpmComparison.direction !== 'same'}
						<span
							data-testid="wpm-indicator"
							class="text-sm {wpmComparison.direction === 'up' ? 'text-green-600' : 'text-red-600'}"
						>
							{wpmComparison.direction === 'up' ? '↑' : '↓'}
							{wpmComparison.value > 0 ? '+' : ''}{Math.round(wpmComparison.value)}
						</span>
					{/if}
				</div>
				<p class="text-xs text-gray-500">最高: {Math.round(stats.maxWPM)}</p>
			</div>
			<svg class="h-8 w-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
				/>
			</svg>
		</div>
	</div>

	<!-- Accuracy Card -->
	<div
		data-testid="stat-card-accuracy"
		class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800"
	>
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-gray-600 dark:text-gray-400">平均正確率</p>
				<div class="flex items-baseline gap-2">
					<p class="text-2xl font-bold">{stats.averageAccuracy.toFixed(1)}%</p>
					{#if accuracyComparison && accuracyComparison.direction !== 'same'}
						<span
							data-testid="accuracy-indicator"
							class="text-sm {accuracyComparison.direction === 'up'
								? 'text-green-600'
								: 'text-red-600'}"
						>
							{accuracyComparison.direction === 'up' ? '↑' : '↓'}
							{accuracyComparison.value > 0 ? '+' : ''}{accuracyComparison.value.toFixed(1)}%
						</span>
					{/if}
				</div>
				<p class="text-xs text-gray-500">最高: {stats.maxAccuracy.toFixed(1)}%</p>
			</div>
			<svg class="h-8 w-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
	</div>

	<!-- Level Card -->
	<div class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800">
		<div class="flex items-center justify-between">
			<div class="flex-1">
				<p class="text-sm text-gray-600 dark:text-gray-400">レベル・ランク</p>
				<div class="flex items-baseline gap-3">
					<p data-testid="level-display" class="text-2xl font-bold">レベル {stats.level}</p>
					<span
						data-testid="rank-display"
						class="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900 dark:text-blue-200"
					>
						{stats.rank}
					</span>
				</div>
				{#if levelProgress}
					<div class="mt-2">
						<div class="mb-1 flex justify-between text-xs text-gray-500">
							<span>進捗</span>
							<span>次のレベルまで {levelProgress.pointsToNext} ポイント</span>
						</div>
						<div class="h-2 w-full rounded-full bg-gray-200">
							<div
								data-testid="level-progress-bar"
								class="h-2 rounded-full bg-blue-600 transition-all duration-500"
								style="width: {levelProgress.progress}%"
							></div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Score Card -->
	<div class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-gray-600 dark:text-gray-400">総スコア</p>
				<p
					data-testid="score-display"
					class="text-2xl font-bold {animate ? 'animate-count-up' : ''}"
				>
					{stats.totalScore.toLocaleString()}
				</p>
			</div>
			<svg class="h-8 w-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
				/>
			</svg>
		</div>
	</div>

	<!-- Streak Card -->
	<div class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-gray-600 dark:text-gray-400">連続プレイ</p>
				<div class="flex items-baseline gap-2">
					<p data-testid="current-streak" class="text-2xl font-bold">{stats.currentStreak}日</p>
					{#if stats.currentStreak >= 7}
						<span data-testid="streak-fire" class="text-2xl">🔥</span>
					{/if}
				</div>
				<p data-testid="longest-streak" class="text-xs text-gray-500">
					最長: {stats.longestStreak}日
				</p>
			</div>
			<svg class="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
				/>
			</svg>
		</div>
	</div>

	<!-- Cards Completed -->
	<div class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-800">
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-gray-600 dark:text-gray-400">完了札数</p>
				<p class="text-2xl font-bold">{stats.totalCardsCompleted}</p>
				<p class="text-xs text-gray-500">全44札中</p>
			</div>
			<svg class="h-8 w-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
				/>
			</svg>
		</div>
	</div>
</div>

<style>
	@keyframes countUp {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-count-up {
		animation: countUp 0.5s ease-out;
	}
</style>
