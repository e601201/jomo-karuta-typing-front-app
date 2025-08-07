<script lang="ts">
	import type { KarutaCard } from '$lib/types';

	interface Props {
		card: KarutaCard | null;
		showFurigana?: boolean;
	}

	let { card, showFurigana = true }: Props = $props();
</script>

{#if card}
	<div class="mb-6 rounded-lg bg-white p-8 text-center shadow-lg">
		{#if showFurigana && card.romaji}
			<div data-testid="furigana" class="mb-2 text-sm text-gray-500">
				{card.romaji}
			</div>
		{/if}
		<div class="text-4xl leading-relaxed font-bold text-gray-800 md:text-5xl">
			{card.hiragana}
		</div>
		{#if card.meaning}
			<div class="mt-2 text-sm text-gray-600">
				{card.meaning}
			</div>
		{/if}
	</div>
{/if}
