<script lang="ts">
	import type { KarutaCard } from '$lib/types';

	interface Props {
		card: KarutaCard | null;
		showFurigana?: boolean;
		showImages?: boolean;
		shake?: boolean;
	}

	let { card, showFurigana = true, showImages = true, shake = false }: Props = $props();
	
	let imageLoadError = $state({
		torifuda: false,
		yomifuda: false
	});
	
	function handleImageError(type: 'torifuda' | 'yomifuda') {
		imageLoadError[type] = true;
	}
</script>

<style>
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		30%, 90% { transform: translateX(-10px); }
		60% { transform: translateX(10px); }
	}
	
	.shake-animation {
		animation: shake 0.1s ease-in-out;
	}
</style>

{#if card}
	<div class="mb-6 rounded-lg bg-white p-8 shadow-lg {shake ? 'shake-animation' : ''}">
		{#if showImages && card.images}
			<div class="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-center mb-6">
				{#if card.images.torifuda && !imageLoadError.torifuda}
					<div class="flex flex-col items-center w-full sm:w-auto bg-white p-2 rounded-lg">
						<img 
							src={card.images.torifuda} 
							alt={`${card.meaning}の取り札`}
							class="w-full max-w-[150px] sm:max-w-[180px] md:max-w-[200px] h-auto rounded shadow object-contain"
							style="filter: none !important; opacity: 1 !important; mix-blend-mode: normal !important; background-color: white !important;"
							onerror={() => handleImageError('torifuda')}
							loading="lazy"
						/>
					</div>
				{/if}
				{#if card.images.yomifuda && !imageLoadError.yomifuda}
					<div class="flex flex-col items-center w-full sm:w-auto bg-white p-2 rounded-lg">
						<img 
							src={card.images.yomifuda} 
							alt={`${card.meaning}の読み札`}
							class="w-full max-w-[150px] sm:max-w-[180px] md:max-w-[200px] h-auto rounded shadow object-contain"
							style="filter: none !important; opacity: 1 !important; mix-blend-mode: normal !important; background-color: white !important;"
							onerror={() => handleImageError('yomifuda')}
							loading="lazy"
						/>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
