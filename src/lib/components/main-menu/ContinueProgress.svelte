<script lang="ts">
	interface Props {
		completedCards: number;
		totalCards: number;
		oncontinue: () => void;
	}

	let { completedCards, totalCards, oncontinue }: Props = $props();
</script>

<div class="mx-auto mb-8 max-w-2xl rounded-lg border border-blue-200 bg-blue-50 p-6">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="font-semibold text-blue-800">前回の続きから</h3>
			<p class="text-sm text-blue-600">{completedCards}/{totalCards} 完了</p>
		</div>
		<button
			onclick={oncontinue}
			class="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
			aria-label="続きから"
		>
			続きから
		</button>
	</div>
</div>
