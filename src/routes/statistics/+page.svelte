<script lang="ts">
	import { onMount } from 'svelte';
	import { statisticsStore } from '$lib/stores/statistics';
	import StatsSummary from '$lib/components/statistics/StatsSummary.svelte';
	import StatsChart from '$lib/components/statistics/StatsChart.svelte';
	import type { FilterOptions, ChartData } from '$lib/types/game';

	let loading = $state(true);
	let selectedPeriod = $state<'today' | 'week' | 'month' | 'all'>('week');
	let selectedMode = $state<'all' | 'practice' | 'random' | 'specific'>('all');

	let stats = $state($statisticsStore);
	let filteredStats = $state($statisticsStore);
	let levelProgress = $state({
		currentLevel: 1,
		nextLevel: 2,
		progress: 0,
		pointsToNext: 5000
	});

	// Chart data
	let wpmChartData = $state<ChartData>({
		labels: [],
		datasets: []
	});

	let accuracyChartData = $state<ChartData>({
		labels: [],
		datasets: []
	});

	let playTimeChartData = $state<ChartData>({
		labels: [],
		datasets: []
	});

	let modeDistributionData = $state<ChartData>({
		labels: [],
		datasets: []
	});

	// Subscribe to store changes
	$effect(() => {
		stats = $statisticsStore;
		updateChartData();
		updateLevelProgress();
	});

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		loading = true;
		await statisticsStore.loadStatistics();
		await applyFilters();
		loading = false;
	}

	async function applyFilters() {
		const filters: FilterOptions = {
			period: selectedPeriod === 'all' ? undefined : selectedPeriod,
			mode: selectedMode === 'all' ? undefined : (selectedMode as any)
		};

		const filtered = await statisticsStore.getFilteredStats(filters);
		filteredStats = { ...stats, ...filtered };
		updateChartData();
	}

	function updateChartData() {
		// Get trend data for selected period
		const trendPeriod = selectedPeriod === 'month' ? 'month' : 'week';
		const trends = statisticsStore.calculateTrends(trendPeriod);

		// WPM trend chart
		wpmChartData = {
			labels: trends.labels,
			datasets: [
				{
					label: 'WPM',
					data: trends.wpmTrend,
					color: '#3B82F6'
				}
			]
		};

		// Accuracy trend chart
		accuracyChartData = {
			labels: trends.labels,
			datasets: [
				{
					label: '正確率 (%)',
					data: trends.accuracyTrend,
					color: '#10B981'
				}
			]
		};

		// Play time chart
		playTimeChartData = {
			labels: trends.labels,
			datasets: [
				{
					label: 'プレイ時間 (分)',
					data: trends.playTimeTrend,
					color: '#F59E0B'
				}
			]
		};

		// Mode distribution (from filtered sessions)
		const modeCounts = {
			practice: 0,
			random: 0,
			specific: 0
		};

		filteredStats.sessions.forEach((session) => {
			if (session.mode === 'practice') modeCounts.practice++;
			else if (session.mode === 'random') modeCounts.random++;
			else if (session.mode === 'specific') modeCounts.specific++;
		});

		modeDistributionData = {
			labels: ['練習', 'ランダム', '特定札'],
			datasets: [
				{
					label: 'モード別',
					data: [modeCounts.practice, modeCounts.random, modeCounts.specific]
				}
			]
		};
	}

	function updateLevelProgress() {
		levelProgress = statisticsStore.calculateLevelProgress(
			stats.overall.totalScore,
			stats.overall.level
		);
	}

	async function handlePeriodChange(event: Event) {
		selectedPeriod = (event.target as HTMLSelectElement).value as any;
		await applyFilters();
	}

	async function handleModeChange(event: Event) {
		selectedMode = (event.target as HTMLSelectElement).value as any;
		await applyFilters();
	}

	async function exportData(format: 'json' | 'csv') {
		try {
			const data = await statisticsStore.exportData(format);
			const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `statistics_${new Date().toISOString().split('T')[0]}.${format}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Export failed:', error);
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-3xl font-bold">統計</h1>

		<div class="flex gap-4">
			<!-- Period Filter -->
			<select
				value={selectedPeriod}
				onchange={handlePeriodChange}
				class="rounded-lg border px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
			>
				<option value="today">今日</option>
				<option value="week">週間</option>
				<option value="month">月間</option>
				<option value="all">全期間</option>
			</select>

			<!-- Mode Filter -->
			<select
				value={selectedMode}
				onchange={handleModeChange}
				class="rounded-lg border px-4 py-2 dark:border-gray-700 dark:bg-gray-800"
			>
				<option value="all">全モード</option>
				<option value="practice">練習</option>
				<option value="random">ランダム</option>
				<option value="specific">特定札</option>
			</select>

			<!-- Export Buttons -->
			<button
				onclick={() => exportData('json')}
				class="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
			>
				JSON出力
			</button>
			<button
				onclick={() => exportData('csv')}
				class="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
			>
				CSV出力
			</button>
		</div>
	</div>

	{#if loading}
		<div class="flex h-64 items-center justify-center">
			<div class="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
		</div>
	{:else}
		<!-- Summary Cards -->
		<div class="mb-8">
			<StatsSummary stats={filteredStats.overall} {levelProgress} animate={true} />
		</div>

		<!-- Charts Section -->
		<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- WPM Trend -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<StatsChart data={wpmChartData} type="line" title="WPM推移" options={{ height: 250 }} />
			</div>

			<!-- Accuracy Trend -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<StatsChart
					data={accuracyChartData}
					type="line"
					title="正確率推移"
					options={{ height: 250 }}
				/>
			</div>

			<!-- Play Time -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<StatsChart
					data={playTimeChartData}
					type="bar"
					title="日別プレイ時間"
					options={{ height: 250 }}
				/>
			</div>

			<!-- Mode Distribution -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
				<StatsChart
					data={modeDistributionData}
					type="pie"
					title="モード別プレイ割合"
					options={{ height: 250 }}
				/>
			</div>
		</div>

		<!-- Session History Table -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
			<h2 class="mb-4 text-xl font-semibold">最近のセッション</h2>

			{#if filteredStats.sessions.length === 0}
				<p class="py-8 text-center text-gray-500 dark:text-gray-400">
					セッションデータがありません
				</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
						<thead>
							<tr>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									日時
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									モード
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									WPM
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									正確率
								</th>
								<th
									class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
								>
									スコア
								</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-gray-200 dark:divide-gray-700">
							{#each filteredStats.sessions.slice(0, 10) as session}
								<tr>
									<td class="px-6 py-4 text-sm whitespace-nowrap">
										{new Date(session.timestamp).toLocaleDateString('ja-JP')}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap">
										{session.mode === 'practice'
											? '練習'
											: session.mode === 'random'
												? 'ランダム'
												: '特定札'}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap">
										{session.wpm}
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap">
										{session.accuracy.toFixed(1)}%
									</td>
									<td class="px-6 py-4 text-sm whitespace-nowrap">
										{session.score.toLocaleString()}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>
