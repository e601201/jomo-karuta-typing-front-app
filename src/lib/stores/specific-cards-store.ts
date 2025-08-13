/**
 * 特定札練習モードストア
 * TASK-302: 特定札練習モード専用の状態管理
 */

import { writable, derived, get } from 'svelte/store';
import type { KarutaCard } from '$lib/types';

export interface Favorite {
	id: string;
	name: string;
	cardIds: string[];
	createdAt: Date;
}

export interface SpecificCardsSettings {
	repeatCount: number; // 1, 3, 5, Infinity
	shuffleOrder: boolean;
}

export interface SpecificCardsState {
	selectedCardIds: Set<string>;
	favorites: Favorite[];
	settings: SpecificCardsSettings;
}

function createSpecificCardsStore() {
	const initialState: SpecificCardsState = {
		selectedCardIds: new Set(),
		favorites: [],
		settings: {
			repeatCount: 1,
			shuffleOrder: false
		}
	};

	const { subscribe, set, update } = writable<SpecificCardsState>(initialState);

	return {
		subscribe,

		/**
		 * 札を選択
		 */
		selectCard(cardId: string) {
			update((state) => {
				state.selectedCardIds.add(cardId);
				return { ...state };
			});
		},

		/**
		 * 札の選択を解除
		 */
		deselectCard(cardId: string) {
			update((state) => {
				state.selectedCardIds.delete(cardId);
				return { ...state };
			});
		},

		/**
		 * 札の選択をトグル
		 */
		toggleCard(cardId: string) {
			update((state) => {
				const newSelectedCardIds = new Set(state.selectedCardIds);
				if (newSelectedCardIds.has(cardId)) {
					newSelectedCardIds.delete(cardId);
				} else {
					newSelectedCardIds.add(cardId);
				}
				return {
					...state,
					selectedCardIds: newSelectedCardIds
				};
			});
		},

		/**
		 * 全選択
		 */
		selectAll(cardIds: string[]) {
			update((state) => ({
				...state,
				selectedCardIds: new Set(cardIds)
			}));
		},

		/**
		 * 全解除
		 */
		clearSelection() {
			update((state) => ({
				...state,
				selectedCardIds: new Set()
			}));
		},

		/**
		 * お気に入りを保存
		 */
		saveFavorite(name: string): boolean {
			if (!name.trim()) {
				return false;
			}

			const state = get({ subscribe });

			// 重複チェック
			if (state.favorites.some((f) => f.name === name)) {
				return false;
			}

			const favorite: Favorite = {
				id: `favorite-${Date.now()}`,
				name,
				cardIds: Array.from(state.selectedCardIds),
				createdAt: new Date()
			};

			update((state) => ({
				...state,
				favorites: [...state.favorites, favorite]
			}));

			return true;
		},

		/**
		 * お気に入りを読み込み
		 */
		loadFavorite(favoriteId: string) {
			const state = get({ subscribe });
			const favorite = state.favorites.find((f) => f.id === favoriteId);

			if (favorite) {
				update((state) => ({
					...state,
					selectedCardIds: new Set(favorite.cardIds)
				}));
			}
		},

		/**
		 * お気に入りを削除
		 */
		deleteFavorite(favoriteId: string) {
			update((state) => ({
				...state,
				favorites: state.favorites.filter((f) => f.id !== favoriteId)
			}));
		},

		/**
		 * 繰り返し回数を設定
		 */
		setRepeatCount(count: number) {
			update((state) => ({
				...state,
				settings: {
					...state.settings,
					repeatCount: count
				}
			}));
		},

		/**
		 * 出題順序を設定
		 */
		setShuffleOrder(shuffle: boolean) {
			update((state) => ({
				...state,
				settings: {
					...state.settings,
					shuffleOrder: shuffle
				}
			}));
		},

		/**
		 * 練習用の札リストを生成
		 */
		generatePracticeCards(allCards: KarutaCard[]): KarutaCard[] {
			const state = get({ subscribe });

			if (state.selectedCardIds.size === 0) {
				return [];
			}

			// 選択された札のみフィルタリング
			const selectedCards = allCards.filter((card) => state.selectedCardIds.has(card.id));

			if (selectedCards.length === 0) {
				return [];
			}

			// 繰り返し回数分の札を生成
			let practiceCards: KarutaCard[] = [];
			const repeatCount = state.settings.repeatCount;

			for (let i = 0; i < repeatCount; i++) {
				if (state.settings.shuffleOrder) {
					// シャッフル
					const shuffled = [...selectedCards].sort(() => Math.random() - 0.5);
					practiceCards = [...practiceCards, ...shuffled];
				} else {
					// 順番通り
					practiceCards = [...practiceCards, ...selectedCards];
				}
			}

			return practiceCards;
		},

		/**
		 * リセット
		 */
		reset() {
			set({
				selectedCardIds: new Set(),
				favorites: [],
				settings: {
					repeatCount: 1,
					shuffleOrder: false
				}
			});
		}
	};
}

export const specificCardsStore = createSpecificCardsStore();

// 派生ストア: 選択数
export const selectedCards = derived(specificCardsStore, ($state) => $state.selectedCardIds.size);

// 派生ストア: 練習開始可能か
export const canStartPractice = derived(
	specificCardsStore,
	($state) => $state.selectedCardIds.size > 0
);

// 派生ストア: 選択された札のID配列
export const selectedCardsArray = derived(specificCardsStore, ($state) =>
	Array.from($state.selectedCardIds)
);
