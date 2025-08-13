<script lang="ts">
	import {
		specificCardsStore,
		type Favorite,
		type SpecificCardsState
	} from '$lib/stores/specific-cards-store';
	import { favoritesService } from '$lib/services/storage/favorites-service';
	import { onMount } from 'svelte';

	let favorites = $state<Favorite[]>([]);
	let showNewDialog = $state(false);
	let newFavoriteName = $state('');
	let errorMessage = $state('');

	onMount(async () => {
		await loadFavorites();
	});

	async function loadFavorites() {
		try {
			favorites = await favoritesService.getFavorites();
		} catch (error) {
			console.error('Failed to load favorites:', error);
		}
	}

	function openNewDialog() {
		showNewDialog = true;
		newFavoriteName = '';
		errorMessage = '';
	}

	function closeDialog() {
		showNewDialog = false;
		newFavoriteName = '';
		errorMessage = '';
	}

	async function saveFavorite() {
		if (!newFavoriteName.trim()) {
			errorMessage = '名前を入力してください';
			return;
		}

		const isDuplicate = await favoritesService.isNameDuplicate(newFavoriteName);
		if (isDuplicate) {
			errorMessage = 'この名前は既に使用されています';
			return;
		}

		const success = specificCardsStore.saveFavorite(newFavoriteName);
		if (success) {
			// Get the current state properly
			let currentState: SpecificCardsState;
			const unsubscribe = specificCardsStore.subscribe((s) => (currentState = s));
			unsubscribe();

			const latestFavorite = currentState.favorites[currentState.favorites.length - 1];

			await favoritesService.saveFavorite(latestFavorite);
			await loadFavorites();
			closeDialog();
		}
	}

	async function loadFavorite(favoriteId: string) {
		specificCardsStore.loadFavorite(favoriteId);
	}

	async function deleteFavorite(favoriteId: string) {
		if (confirm('このお気に入りを削除しますか？')) {
			specificCardsStore.deleteFavorite(favoriteId);
			await favoritesService.deleteFavorite(favoriteId);
			await loadFavorites();
		}
	}
</script>

<div class="favorites-manager">
	<div class="manager-header">
		<h3 class="text-lg font-semibold">お気に入り</h3>
		<button
			type="button"
			onclick={openNewDialog}
			class="rounded bg-green-500 px-3 py-1 text-sm text-white hover:bg-green-600"
		>
			保存
		</button>
	</div>

	{#if favorites.length > 0}
		<div class="favorites-list">
			{#each favorites as favorite (favorite.id)}
				<div class="favorite-item">
					<button type="button" onclick={() => loadFavorite(favorite.id)} class="favorite-name">
						{favorite.name}
						<span class="card-count">({favorite.cardIds.length}枚)</span>
					</button>
					<button
						type="button"
						onclick={() => deleteFavorite(favorite.id)}
						class="delete-btn"
						aria-label="削除"
					>
						×
					</button>
				</div>
			{/each}
		</div>
	{:else}
		<p class="mt-2 text-sm text-gray-500">お気に入りがありません</p>
	{/if}

	{#if showNewDialog}
		<div
			class="dialog-overlay"
			onclick={closeDialog}
			onkeydown={(e) => e.key === 'Escape' && closeDialog()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="dialog" onclick={(e) => e.stopPropagation()}>
				<h4 class="mb-3 text-lg font-semibold">お気に入りを保存</h4>
				<input
					type="text"
					bind:value={newFavoriteName}
					placeholder="名前を入力"
					class="mb-2 w-full rounded border px-3 py-2"
					onkeydown={(e) => e.key === 'Enter' && saveFavorite()}
				/>
				{#if errorMessage}
					<p class="mb-2 text-sm text-red-500">{errorMessage}</p>
				{/if}
				<div class="flex justify-end gap-2">
					<button
						type="button"
						onclick={closeDialog}
						class="rounded border px-4 py-2 text-gray-600 hover:bg-gray-50"
					>
						キャンセル
					</button>
					<button
						type="button"
						onclick={saveFavorite}
						class="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
					>
						保存
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.favorites-manager {
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		background-color: #f9fafb;
	}

	.manager-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.favorites-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.favorite-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem;
		background-color: white;
		border: 1px solid #e5e7eb;
		border-radius: 0.25rem;
	}

	.favorite-name {
		flex: 1;
		text-align: left;
		transition: color 0.2s;
	}

	.favorite-name:hover {
		color: #2563eb;
	}

	.card-count {
		margin-left: 0.5rem;
		font-size: 0.875rem;
		color: #6b7280;
	}

	.delete-btn {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 0.25rem;
		color: #ef4444;
		transition: background-color 0.2s;
	}

	.delete-btn:hover {
		background-color: #fef2f2;
	}

	.dialog-overlay {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: rgba(0, 0, 0, 0.5);
	}

	.dialog {
		width: 24rem;
		max-width: 100%;
		padding: 1.25rem;
		background-color: white;
		border-radius: 0.5rem;
	}
</style>
