<script lang="ts">
	import {
		specificCardsStore,
		selectedCards,
		canStartPractice
	} from '$lib/stores/specific-cards-store';
	import type { KarutaCard } from '$lib/types';

	interface Props {
		cards: KarutaCard[];
	}

	let { cards }: Props = $props();

	// ストアの値をリアクティブに取得
	let selectedCardIds = $state(new Set<string>());

	// ストアの更新を監視
	$effect(() => {
		const unsubscribe = specificCardsStore.subscribe((state) => {
			// 新しいSetを作成して反応性を確保
			selectedCardIds = new Set(state.selectedCardIds);
		});
		
		return () => unsubscribe();
	});

	function toggleCard(cardId: string) {
		console.log('Toggling card:', cardId);
		specificCardsStore.toggleCard(cardId);
		console.log('After toggle, selectedCardIds:', selectedCardIds);
	}

	function selectAll() {
		specificCardsStore.selectAll(cards.map((c) => c.id));
	}

	function clearAll() {
		specificCardsStore.clearSelection();
	}
</script>

<div class="card-selector">
	<div class="selector-header">
		<h2 class="text-xl font-bold">札を選択</h2>
		<div class="flex items-center gap-4">
			<span class="text-sm text-gray-600">
				{$selectedCards} / {cards.length} 枚選択中
			</span>
			<div class="flex gap-2">
				<button
					type="button"
					onclick={selectAll}
					class="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
				>
					全選択
				</button>
				<button
					type="button"
					onclick={clearAll}
					class="rounded bg-gray-500 px-3 py-1 text-sm text-white hover:bg-gray-600"
				>
					全解除
				</button>
			</div>
		</div>
	</div>

	<div class="cards-grid">
		{#each cards as card}
			<button
				type="button"
				onclick={() => toggleCard(card.id)}
				class="card-item {selectedCardIds.has(card.id) ? 'selected' : ''}"
				aria-pressed={selectedCardIds.has(card.id)}
			>
				<div class="card-content">
					<span class="card-initial">{card.id.toUpperCase()}</span>
					<span class="card-text">{card.meaning.slice(0, 12)}</span>
				</div>
			</button>
		{/each}
	</div>

	{#if !$canStartPractice}
		<div class="warning-message">
			<p class="text-amber-600">最低1枚の札を選択してください</p>
		</div>
	{/if}
</div>

<style>
	.card-selector {
		padding: 1rem;
	}

	.selector-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #e5e7eb;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.75rem;
	}

	@media (min-width: 640px) {
		.cards-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (min-width: 768px) {
		.cards-grid {
			grid-template-columns: repeat(4, 1fr);
		}
	}

	@media (min-width: 1024px) {
		.cards-grid {
			grid-template-columns: repeat(6, 1fr);
		}
	}

	.card-item {
		padding: 0.75rem;
		border: 2px solid #d1d5db;
		border-radius: 0.5rem;
		transition: all 0.2s;
		cursor: pointer;
	}

	.card-item:hover {
		border-color: #60a5fa;
		background-color: #eff6ff;
	}

	.card-item.selected {
		border-color: #3b82f6;
		background-color: #dbeafe;
	}

	.card-content {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.card-initial {
		font-size: 1.5rem;
		font-weight: bold;
		margin-bottom: 0.25rem;
	}

	.card-text {
		font-size: 0.75rem;
		color: #4b5563;
	}

	.warning-message {
		margin-top: 1rem;
		padding: 0.75rem;
		background-color: #fef3c7;
		border: 1px solid #fde68a;
		border-radius: 0.25rem;
	}
</style>
