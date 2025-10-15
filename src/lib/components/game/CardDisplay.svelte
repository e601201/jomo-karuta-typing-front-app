<script lang="ts">
	import type { KarutaCard, RandomModeDifficulty } from '$lib/types';

	interface Props {
		card: KarutaCard | null;
		showImages?: boolean;
		shake?: boolean;
		difficulty?: RandomModeDifficulty;
	}

	let { card, showImages = true, shake = false, difficulty = 'standard' }: Props = $props();

	let imageLoadError = $state({
		torifuda: false,
		yomifuda: false,
		kaisetsu: false
	});

	function handleImageError(type: 'torifuda' | 'yomifuda' | 'kaisetsu') {
		imageLoadError[type] = true;
	}
</script>

{#if card}
	<div class="mb-6 rounded-lg bg-white p-8 shadow-lg {shake ? 'shake-animation' : ''}">
		{#if difficulty === 'advanced'}
			<!-- 上級者モード：取り札と解説画像を並べて表示 -->
			<div class="flex flex-col items-center justify-center gap-6 md:flex-row">
				<!-- 取り札画像 -->
				{#if card.images?.torifuda && !imageLoadError.torifuda}
					<div class="flex flex-col items-center rounded-lg bg-white p-4">
						<img
							src={card.images.torifuda.replace('.jpg', '.webp')}
							alt={`${card.meaning}の取り札`}
							class="h-auto w-full max-w-[140px] rounded object-contain shadow-xl md:max-w-[180px]"
							style="filter: none !important; opacity: 1 !important; mix-blend-mode: normal !important; background-color: white !important;"
							onerror={() => handleImageError('torifuda')}
							loading="eager"
						/>
					</div>
				{:else}
					<!-- フォールバック：画像が読み込めない場合 -->
					<div class="flex h-[200px] w-[140px] items-center justify-center rounded-lg bg-gray-100">
						<p class="text-gray-500">取り札を読み込み中...</p>
					</div>
				{/if}
				
				<!-- 解説画像 -->
				{#if card.images?.kaisetsu && !imageLoadError.kaisetsu}
					<div class="flex flex-col items-center rounded-lg bg-white p-4">
						<img
							src={card.images.kaisetsu.replace('.jpg', '.webp')}
							alt={`${card.meaning}の解説`}
							class="h-auto w-full max-w-[140px] rounded object-contain shadow-xl md:max-w-[180px]"
							style="filter: none !important; opacity: 1 !important; mix-blend-mode: normal !important; background-color: white !important;"
							onerror={() => handleImageError('kaisetsu')}
							loading="eager"
						/>
					</div>
				{:else if card.id}
					<!-- 解説画像をIDから構築 -->
					<div class="flex flex-col items-center rounded-lg bg-white p-4">
						<img
							src={`/images/karuta/kaisetsu/${card.id}.webp`}
							alt={`${card.meaning}の解説`}
							class="h-auto w-full max-w-[140px] rounded object-contain shadow-xl md:max-w-[180px]"
							style="filter: none !important; opacity: 1 !important; mix-blend-mode: normal !important; background-color: white !important;"
							onerror={() => handleImageError('kaisetsu')}
							loading="eager"
						/>
					</div>
				{/if}
			</div>
		{:else if showImages && card.images}
			<!-- 通常モード：取り札と読み札を表示 -->
			<div class="mb-6 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
				{#if card.images.torifuda && !imageLoadError.torifuda}
					<div class="flex w-full flex-col items-center rounded-lg bg-white p-2 sm:w-auto">
						<img
							src={card.images.torifuda}
							alt={`${card.meaning}の取り札`}
							class="h-auto w-full max-w-[150px] rounded object-contain shadow sm:max-w-[180px] md:max-w-[200px]"
							style="filter: none !important; opacity: 1 !important; mix-blend-mode: normal !important; background-color: white !important;"
							onerror={() => handleImageError('torifuda')}
							loading="lazy"
						/>
					</div>
				{/if}
				{#if card.images.yomifuda && !imageLoadError.yomifuda}
					<div class="flex w-full flex-col items-center rounded-lg bg-white p-2 sm:w-auto">
						<img
							src={card.images.yomifuda}
							alt={`${card.meaning}の読み札`}
							class="h-auto w-full max-w-[150px] rounded object-contain shadow sm:max-w-[180px] md:max-w-[200px]"
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

<style>
	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		30%,
		90% {
			transform: translateX(-10px);
		}
		60% {
			transform: translateX(10px);
		}
	}

	.shake-animation {
		animation: shake 0.1s ease-in-out;
	}
</style>
