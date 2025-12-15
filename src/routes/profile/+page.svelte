<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<div class="min-h-screen bg-linear-to-br from-green-50 to-blue-50 py-8 px-4">
	<div class="max-w-4xl mx-auto">
		<div class="bg-white rounded-lg shadow-lg p-8 mb-8">
			<div class="flex items-center justify-between mb-6">
				<h1 class="text-3xl font-bold text-gray-800">プロフィール</h1>
				<div class="flex gap-4">
					<a href="/auth/logout" class="text-red-600 hover:text-red-700 font-medium">
						ログアウト
					</a>
				</div>
			</div>

			<div class="grid md:grid-cols-2 gap-8">
				<div>
					<h2 class="text-xl font-semibold text-gray-700 mb-4">ユーザー情報</h2>
					<div class="space-y-3">
						<div>
							<p class="text-sm text-gray-500">メールアドレス</p>
							<p class="text-gray-800">{data.user?.email}</p>
						</div>
						<div>
							<p class="text-sm text-gray-500">ニックネーム</p>
							<p class="text-gray-800">
								{(data.profile as any)?.nickname || data.user?.email?.split('@')[0]}
							</p>
						</div>
						<div>
							<p class="text-sm text-gray-500">登録日</p>
							<p class="text-gray-800">
								{data.user?.created_at
									? new Date(data.user.created_at).toLocaleDateString('ja-JP')
									: '-'}
							</p>
						</div>
					</div>
				</div>

				<!-- <div>
					<h2 class="text-xl font-semibold text-gray-700 mb-4">ゲーム統計</h2>
					<div class="grid grid-cols-3 gap-4">
						<div class="bg-blue-50 rounded-lg p-4 text-center">
							<p class="text-2xl font-bold text-blue-600">{data.stats.totalGames}</p>
							<p class="text-sm text-gray-600">プレイ回数</p>
						</div>
						<div class="bg-green-50 rounded-lg p-4 text-center">
							<p class="text-2xl font-bold text-green-600">{data.stats.highScore}</p>
							<p class="text-sm text-gray-600">最高スコア</p>
						</div>
						<div class="bg-purple-50 rounded-lg p-4 text-center">
							<p class="text-2xl font-bold text-purple-600">{data.stats.averageScore}</p>
							<p class="text-sm text-gray-600">平均スコア</p>
						</div>
					</div>
				</div> -->
			</div>
		</div>

		<!-- <div class="bg-white rounded-lg shadow-lg p-8">
			<h2 class="text-xl font-semibold text-gray-700 mb-4">最近のスコア</h2>
			{#if data.recentScores.length > 0}
				<div class="overflow-x-auto">
					<table class="w-full">
						<thead>
							<tr class="border-b">
								<th class="text-left py-2 px-4 text-gray-600">日時</th>
								<th class="text-left py-2 px-4 text-gray-600">難易度</th>
								<th class="text-right py-2 px-4 text-gray-600">スコア</th>
							</tr>
						</thead>
						<tbody>
							{#each data.recentScores as score}
								<tr class="border-b hover:bg-gray-50">
									<td class="py-2 px-4">
										{new Date(score.created_at).toLocaleDateString('ja-JP')}
									</td>
									<td class="py-2 px-4">
										<span class="inline-flex px-2 py-1 text-xs rounded-full
											{score.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : ''}
											{score.difficulty === 'standard' ? 'bg-blue-100 text-blue-800' : ''}
											{score.difficulty === 'advanced' ? 'bg-red-100 text-red-800' : ''}">
											{score.difficulty === 'beginner' ? '初級' : ''}
											{score.difficulty === 'standard' ? '標準' : ''}
											{score.difficulty === 'advanced' ? '上級' : ''}
										</span>
									</td>
									<td class="py-2 px-4 text-right font-semibold">{score.score}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else}
				<p class="text-gray-500 text-center py-8">まだスコアがありません</p>
			{/if}
		</div> -->

		<div class="mt-8 text-center">
			<a
				href="/"
				class="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
			>
				ホームに戻る
			</a>
		</div>
	</div>
</div>
