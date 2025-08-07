<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import CardSelector from '$lib/components/specific/CardSelector.svelte';
	import FavoritesManager from '$lib/components/specific/FavoritesManager.svelte';
	import { specificCardsStore, selectedCards, canStartPractice } from '$lib/stores/specific-cards-store';
	import { practiceModeStore } from '$lib/stores/practice-mode';
	import { getKarutaCards } from '$lib/data/karuta-cards';
	import type { KarutaCard } from '$lib/types';

	let cards = $state<KarutaCard[]>([]);
	let repeatCount = $state(1);
	let shuffleOrder = $state(false);
	let isLoading = $state(true);

	onMount(async () => {
		try {
			cards = getKarutaCards();
			console.log('Loaded cards:', cards.length);
			isLoading = false;
		} catch (error) {
			console.error('Failed to load cards:', error);
			isLoading = false;
		}
	});

	function handleRepeatChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		repeatCount = parseInt(value);
		specificCardsStore.setRepeatCount(repeatCount);
	}

	function handleShuffleChange(e: Event) {
		shuffleOrder = (e.target as HTMLInputElement).checked;
		specificCardsStore.setShuffleOrder(shuffleOrder);
	}

	async function startPractice() {
		if (!$canStartPractice) {
			alert('最低1枚の札を選択してください');
			return;
		}

		// 選択された札で練習用リストを生成
		const practiceCards = specificCardsStore.generatePracticeCards(cards);
		console.log('=== SPECIFIC MODE START PRACTICE ===');
		console.log('Selected cards count:', $selectedCards);
		console.log('Generated practice cards:', practiceCards.length, 'cards');
		console.log('Practice cards IDs:', practiceCards.map(c => c.id));
		console.log('First practice card:', practiceCards[0]);

		// 練習モードストアを初期化
		practiceModeStore.initialize(practiceCards);
		
		// ストアの状態を確認
		const storeState = get(practiceModeStore);
		console.log('Practice mode store after init:', {
			cardsLength: storeState.cards.length,
			firstCard: storeState.cards[0],
			currentIndex: storeState.currentIndex
		});

		// ゲーム画面へ遷移（specific=trueフラグを追加）
		await goto('/game?mode=practice&specific=true');
	}

	function goBack() {
		goto('/');
	}
</script>

<div class="container mx-auto max-w-6xl p-4">
	<div class="mb-6">
		<button type="button" onclick={goBack} class="mb-4 px-4 py-2 text-gray-600 hover:text-gray-800">
			← 戻る
		</button>

		<h1 class="mb-2 text-2xl font-bold">特定札練習モード</h1>
		<p class="text-gray-600">練習したい札を選択してください</p>
	</div>

	{#if isLoading}
		<div class="flex h-64 items-center justify-center">
			<div class="text-gray-500">読み込み中...</div>
		</div>
	{:else}
		<div class="grid gap-6 lg:grid-cols-3">
			<div class="lg:col-span-2">
				<CardSelector {cards} />
			</div>

			<div class="space-y-4">
				<FavoritesManager />

				<div class="practice-settings">
					<h3 class="mb-3 text-lg font-semibold">練習設定</h3>

					<div class="setting-item">
						<label for="repeat-count" class="mb-1 block text-sm font-medium"> 繰り返し回数 </label>
						<select
							id="repeat-count"
							onchange={handleRepeatChange}
							class="w-full rounded border px-3 py-2"
						>
							<option value="1">1回</option>
							<option value="3">3回</option>
							<option value="5">5回</option>
						</select>
					</div>

					<div class="setting-item">
						<label class="flex items-center gap-2">
							<input
								type="checkbox"
								checked={shuffleOrder}
								onchange={handleShuffleChange}
								class="h-4 w-4"
							/>
							<span class="text-sm">ランダム順序で出題</span>
						</label>
					</div>

					<button
						type="button"
						onclick={startPractice}
						disabled={!$canStartPractice}
						class="w-full rounded-lg bg-blue-500 py-3 font-semibold text-white
							   transition-colors hover:bg-blue-600 disabled:cursor-not-allowed
							   disabled:bg-gray-300"
					>
						練習開始
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.practice-settings {
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		background-color: white;
	}

	.setting-item {
		margin-bottom: 1rem;
	}
</style>
