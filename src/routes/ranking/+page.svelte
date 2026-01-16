<script lang="ts">
	import { onMount } from 'svelte';
	import { getTopScoresByDifficulty, getTopTimesByDifficulty } from '$lib/services/supabaseService';
	import { ArrowLeft, Trophy, Medal, Award, Timer, Zap } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import type { RandomModeDifficulty } from '$lib/types';

	type GameModeType = 'random' | 'timeattack';

	interface RankingEntry {
		id: number;
		nick_name: string;
		score?: number | null;
		time?: number | null;
		created_at: string;
		difficulty?: RandomModeDifficulty;
		game_mode?: string | null;
	}

	let rankings = $state<RankingEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedDifficulty = $state<RandomModeDifficulty>('standard');
	let selectedGameMode = $state<GameModeType>('random');

	onMount(async () => {
		await loadRankings();
	});

	async function loadRankings() {
		try {
			loading = true;
			error = null;
			let data;

			if (selectedGameMode === 'timeattack') {
				data = await getTopTimesByDifficulty(selectedDifficulty, 100);
			} else {
				data = await getTopScoresByDifficulty(selectedDifficulty, 100);
			}

			rankings = data as RankingEntry[];
		} catch (err) {
			error = 'ランキングの読み込みに失敗しました';
			console.error('Failed to load rankings:', err);
		} finally {
			loading = false;
		}
	}

	async function handleDifficultyChange(difficulty: RandomModeDifficulty) {
		selectedDifficulty = difficulty;
		await loadRankings();
	}

	async function handleGameModeChange(mode: GameModeType) {
		selectedGameMode = mode;
		await loadRankings();
	}

	function formatTime(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const milliseconds = Math.floor((ms % 1000) / 10);
		return `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
	}

	function getRankIcon(rank: number) {
		if (rank === 1) return Trophy;
		if (rank === 2) return Medal;
		if (rank === 3) return Award;
		return null;
	}

	function getRankClass(rank: number): string {
		if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white';
		if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-white';
		if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-500 text-white';
		return 'bg-gray-100';
	}
</script>

<div class="min-h-screen bg-linear-to-b from-gray-50 to-white">
	<div class="container mx-auto px-4 py-8">
		<!-- ヘッダー -->
		<div class="mb-8 flex items-center justify-between">
			<button
				onclick={() => goto('/')}
				class="flex items-center gap-2 rounded-lg px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100"
			>
				<ArrowLeft class="h-4 w-4" />
				メニューに戻る
			</button>
		</div>

		<!-- タイトル -->
		<div class="mb-8 text-center">
			<h1 class="mb-2 flex items-center justify-center gap-3 text-4xl font-bold text-gray-800">
				<Trophy class="h-10 w-10 text-yellow-500" />
				ランキング
			</h1>
			<p class="text-gray-600">
				{selectedGameMode === 'timeattack' ? 'タイムアタック' : 'ランダムモード'} TOP100
			</p>
		</div>

		<!-- ゲームモード切り替え -->
		<div class="mb-4 flex justify-center">
			<div class="inline-flex overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm">
				<button
					onclick={() => handleGameModeChange('random')}
					class={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
						selectedGameMode === 'random'
							? 'bg-linear-to-r from-blue-500 to-purple-500 text-white'
							: 'text-gray-700 hover:bg-gray-50'
					}`}
				>
					<Zap class="h-4 w-4" />
					ランダムモード
				</button>
				<button
					onclick={() => handleGameModeChange('timeattack')}
					class={`flex items-center gap-2 border-l border-gray-300 px-6 py-3 font-medium transition-colors ${
						selectedGameMode === 'timeattack'
							? 'bg-linear-to-r from-orange-500 to-red-500 text-white'
							: 'text-gray-700 hover:bg-gray-50'
					}`}
				>
					<Timer class="h-4 w-4" />
					タイムアタック
				</button>
			</div>
		</div>

		<!-- 難易度タブ -->
		<div class="mb-6 flex justify-center">
			<div class="inline-flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
				<button
					onclick={() => handleDifficultyChange('beginner')}
					class={`border-l border-gray-200 px-6 py-3 font-medium transition-colors ${
						selectedDifficulty === 'beginner'
							? 'bg-green-500 text-white'
							: 'text-gray-700 hover:bg-gray-50'
					}`}
				>
					🔰 初心者
				</button>
				<button
					onclick={() => handleDifficultyChange('standard')}
					class={`border-l border-gray-200 px-6 py-3 font-medium transition-colors ${
						selectedDifficulty === 'standard'
							? 'bg-blue-500 text-white'
							: 'text-gray-700 hover:bg-gray-50'
					}`}
				>
					📖 標準
				</button>
				<button
					onclick={() => handleDifficultyChange('advanced')}
					class={`border-l border-gray-200 px-6 py-3 font-medium transition-colors ${
						selectedDifficulty === 'advanced'
							? 'bg-red-500 text-white'
							: 'text-gray-700 hover:bg-gray-50'
					}`}
				>
					⚡ 上級者
				</button>
			</div>
		</div>

		<!-- ランキングテーブル -->
		<div class="mx-auto max-w-4xl">
			{#if loading}
				<div class="py-12 text-center">
					<div
						class="inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-gray-600"
					></div>
					<p class="mt-4 text-gray-600">読み込み中...</p>
				</div>
			{:else if error}
				<div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
					<p class="text-red-600">{error}</p>
					<button
						onclick={loadRankings}
						class="mt-4 rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600"
					>
						再読み込み
					</button>
				</div>
			{:else if rankings.length === 0}
				<div class="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
					<p class="mb-4 text-xl text-gray-800">
						{#if selectedDifficulty === 'beginner'}
							初心者モードのランキングデータがありません
						{:else if selectedDifficulty === 'standard'}
							標準モードのランキングデータがありません
						{:else if selectedDifficulty === 'advanced'}
							上級者モードのランキングデータがありません
						{:else}
							ランキングデータがありません
						{/if}
					</p>
					<p class="text-gray-600">最初の挑戦者になりましょう！</p>
				</div>
			{:else}
				<div class="overflow-hidden rounded-lg bg-white shadow-lg">
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="border-b border-gray-200 bg-gray-50">
								<tr>
									<th class="px-6 py-4 text-left font-semibold text-gray-700">順位</th>
									<th class="px-6 py-4 text-left font-semibold text-gray-700">プレイヤー</th>
									<th class="px-6 py-4 text-right font-semibold text-gray-700">
										{selectedGameMode === 'timeattack' ? 'タイム' : 'スコア'}
									</th>
								</tr>
							</thead>
							<tbody>
								{#each rankings as entry, index}
									{@const rank = index + 1}
									{@const Icon = getRankIcon(rank)}
									<tr class="border-b border-gray-100 transition-colors hover:bg-gray-50">
										<td class="px-6 py-4">
											<div class="flex items-center gap-2">
												{#if Icon}
													<div
														class={`inline-flex h-8 w-8 items-center justify-center rounded-full ${getRankClass(rank)}`}
													>
														<Icon class="h-4 w-4" />
													</div>
												{:else}
													<div
														class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700"
													>
														{rank}
													</div>
												{/if}
											</div>
										</td>
										<td class="px-6 py-4 font-medium text-gray-800">
											{entry.nick_name || '名無しの挑戦者'}
										</td>
										<td class="px-6 py-4 text-right">
											{#if selectedGameMode === 'timeattack'}
												{#if rank <= 3}
													<span
														class="bg-linear-to-r from-yellow-500 to-orange-500 bg-clip-text text-2xl font-bold text-transparent"
													>
														{entry.time ? `${formatTime(entry.time)}秒` : '-'}
													</span>
												{:else}
													<span class="text-xl font-bold text-gray-700">
														{entry.time ? `${formatTime(entry.time)}秒` : '-'}
													</span>
												{/if}
											{:else if rank <= 3}
												<span
													class="bg-linear-to-r from-yellow-500 to-orange-500 bg-clip-text text-2xl font-bold text-transparent"
												>
													{entry.score ? entry.score.toLocaleString() : '-'}
												</span>
											{:else}
												<span class="text-xl font-bold text-gray-700">
													{entry.score ? entry.score.toLocaleString() : '-'}
												</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
