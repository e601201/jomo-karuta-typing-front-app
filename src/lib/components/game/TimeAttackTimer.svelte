<script lang="ts">
	interface Props {
		elapsedTime: number; // ミリ秒
		penalty: number; // ミリ秒
		isCompleted: boolean;
	}

	let { elapsedTime, penalty, isCompleted }: Props = $props();

	// 時間をフォーマット (SS.ms形式)
	function formatTime(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const milliseconds = Math.floor((ms % 1000) / 10); // 10ms単位
		return `${seconds}.${milliseconds.toString().padStart(2, '0')}`;
	}

	// 最終タイムを計算
	const finalTime = $derived(elapsedTime + penalty);
</script>

<div class="flex flex-col items-center justify-center rounded-lg bg-white p-4 shadow-lg">
	<!-- メインタイマー -->
	<div class="flex items-baseline">
		<span class="text-6xl font-bold tabular-nums text-blue-600">
			{formatTime(isCompleted ? finalTime : elapsedTime)}
		</span>
		<span class="ml-2 text-2xl text-gray-600">秒</span>
	</div>

	<!-- ペナルティ表示 -->
	{#if penalty > 0}
		<div class="mt-2 text-lg text-red-500">
			ペナルティ: +{formatTime(penalty)}秒
		</div>
	{/if}

	<!-- 完了時の最終タイム表示 -->
	{#if isCompleted && penalty > 0}
		<div class="mt-2 border-t-2 border-gray-200 pt-2">
			<span class="text-sm text-gray-600">実タイム: {formatTime(elapsedTime)}秒</span>
		</div>
	{/if}
</div>
