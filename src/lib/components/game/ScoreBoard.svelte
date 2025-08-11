<script lang="ts">
	interface Props {
		score: {
			total: number;
			accuracy: number;
			speed: number;
			combo: number;
			maxCombo: number;
		};
	}

	let { score }: Props = $props();
</script>

<div class="rounded-lg bg-white p-4 shadow-md">
	<div class="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
		<div>
			<p class="text-sm text-gray-600">スコア</p>
			<p class="text-xl font-bold">{score.total}</p>
		</div>
		<div>
			<p class="text-sm text-gray-600">正確率</p>
			<p class="text-xl font-bold">{score.accuracy.toFixed(2)}%</p>
		</div>
		<div>
			<p class="text-sm text-gray-600">WPM</p>
			<p class="text-xl font-bold">{score.speed}</p>
		</div>
		<div>
			<p class="text-sm text-gray-600">コンボ</p>
			<p class="text-xl font-bold">{score.combo}</p>
		</div>
	</div>
</div>
