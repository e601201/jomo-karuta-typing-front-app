<script lang="ts">
	import { onMount } from 'svelte';
	import { getTopScores } from '$lib/services/supabaseService';
	import { ArrowLeft, Trophy, Medal, Award } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	interface RankingEntry {
		id: number;
		nick_name: string;
		score: number;
		created_at: string;
	}

	let rankings = $state<RankingEntry[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		await loadRankings();
	});

	async function loadRankings() {
		try {
			loading = true;
			error = null;
			const data = await getTopScores(100);
			rankings = data as RankingEntry[];
		} catch (err) {
			error = 'ランキングの読み込みに失敗しました';
			console.error('Failed to load rankings:', err);
		} finally {
			loading = false;
		}
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

<div class="min-h-screen bg-gradient-to-b from-gray-50 to-white">
	<div class="container mx-auto px-4 py-8">
		<!-- ヘッダー -->
		<div class="flex items-center justify-between mb-8">
			<button
				onclick={() => goto('/')}
				class="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
			>
				<ArrowLeft class="h-4 w-4" />
				メニューに戻る
			</button>
		</div>

		<!-- タイトル -->
		<div class="text-center mb-8">
			<h1 class="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
				<Trophy class="h-10 w-10 text-yellow-500" />
				ランキング
			</h1>
			<p class="text-gray-600">ランダムモード TOP100</p>
		</div>

		<!-- ランキングテーブル -->
		<div class="max-w-4xl mx-auto">
			{#if loading}
				<div class="text-center py-12">
					<div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
					<p class="text-gray-600 mt-4">読み込み中...</p>
				</div>
			{:else if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
					<p class="text-red-600">{error}</p>
					<button
						onclick={loadRankings}
						class="mt-4 px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
					>
						再読み込み
					</button>
				</div>
			{:else if rankings.length === 0}
				<div class="bg-white border border-gray-200 rounded-lg p-12 text-center shadow-sm">
					<p class="text-gray-800 text-xl mb-4">まだランキングデータがありません</p>
					<p class="text-gray-600">最初の挑戦者になりましょう！</p>
				</div>
			{:else}
				<div class="bg-white rounded-lg overflow-hidden shadow-lg">
					<div class="overflow-x-auto">
						<table class="w-full">
							<thead class="bg-gray-50 border-b border-gray-200">
								<tr>
									<th class="px-6 py-4 text-left text-gray-700 font-semibold">順位</th>
									<th class="px-6 py-4 text-left text-gray-700 font-semibold">プレイヤー</th>
									<th class="px-6 py-4 text-right text-gray-700 font-semibold">スコア</th>
								</tr>
							</thead>
							<tbody>
								{#each rankings as entry, index}
									{@const rank = index + 1}
									{@const Icon = getRankIcon(rank)}
									<tr class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
										<td class="px-6 py-4">
											<div class="flex items-center gap-2">
												{#if Icon}
													<div class={`inline-flex items-center justify-center w-8 h-8 rounded-full ${getRankClass(rank)}`}>
														<Icon class="h-4 w-4" />
													</div>
												{:else}
													<div class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700">
														{rank}
													</div>
												{/if}
											</div>
										</td>
										<td class="px-6 py-4 text-gray-800 font-medium">
											{entry.nick_name || '名無しの挑戦者'}
										</td>
										<td class="px-6 py-4 text-right">
											{#if rank <= 3}
												<span class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
													{entry.score.toLocaleString()}
												</span>
											{:else}
												<span class="text-xl font-bold text-gray-700">
													{entry.score.toLocaleString()}
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