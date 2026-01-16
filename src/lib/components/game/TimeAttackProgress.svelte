<script lang="ts">
	interface Props {
		current: number;
		total: number;
		mistakes: number;
		skips: number;
	}

	let { current, total, mistakes, skips }: Props = $props();

	// 進捗パーセンテージ
	const percentage = $derived(Math.min((current / total) * 100, 100));
</script>

<div class="rounded-lg bg-white p-4 shadow-md">
	<!-- 進捗バー -->
	<div class="mb-3">
		<div class="mb-1 flex justify-between text-sm">
			<span class="font-medium text-gray-700">進捗</span>
			<span class="font-bold text-blue-600">{current}/{total}</span>
		</div>
		<div class="h-3 overflow-hidden rounded-full bg-gray-200">
			<div
				class="h-full rounded-full bg-liner-to-r from-blue-400 to-blue-600 transition-all duration-300"
				style="width: {percentage}%"
			></div>
		</div>
	</div>

	<!-- 統計情報 -->
	<div class="grid grid-cols-2 gap-4 text-sm">
		<div class="flex items-center justify-between">
			<span class="text-gray-600">ミス</span>
			<span class="font-bold {mistakes > 0 ? 'text-orange-500' : 'text-gray-700'}">
				{mistakes}回
			</span>
		</div>
		<div class="flex items-center justify-between">
			<span class="text-gray-600">スキップ</span>
			<span class="font-bold {skips > 0 ? 'text-red-500' : 'text-gray-700'}">
				{skips}回
			</span>
		</div>
	</div>
</div>
