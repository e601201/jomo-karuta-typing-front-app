/**
 * 練習モードストア
 * TASK-301: 練習モード専用の状態管理
 */

import { writable, derived, get } from 'svelte/store';
import type { KarutaCard } from '$lib/types';
import { LocalStorageService } from '$lib/services/storage/local-storage';

export interface PracticeModeState {
	cards: KarutaCard[];
	currentIndex: number;
	completedCards: Set<string>;
	skippedCards: Set<string>;
	startTime: number | null;
	pausedTime: number | null;
	totalPausedDuration: number;
	statistics: {
		totalKeystrokes: number;
		correctKeystrokes: number;
		mistakes: number;
		currentCombo: number;
		maxCombo: number;
	};
}

function createPracticeModeStore() {
	const initialState: PracticeModeState = {
		cards: [],
		currentIndex: 0,
		completedCards: new Set(),
		skippedCards: new Set(),
		startTime: null,
		pausedTime: null,
		totalPausedDuration: 0,
		statistics: {
			totalKeystrokes: 0,
			correctKeystrokes: 0,
			mistakes: 0,
			currentCombo: 0,
			maxCombo: 0
		}
	};

	const { subscribe, set, update } = writable<PracticeModeState>(initialState);
	
	let autoSaveInterval: NodeJS.Timeout | null = null;
	let storageService: LocalStorageService | null = null;

	return {
		subscribe,
		
		/**
		 * 練習モードを初期化
		 */
		initialize(cards: KarutaCard[], storage?: LocalStorageService) {
			console.log('PracticeModeStore.initialize called with cards:', cards?.length, 'first card:', cards?.[0]);
			storageService = storage || new LocalStorageService();
			
			update(state => {
				const newState = {
					...state,
					cards,
					currentIndex: 0,
					completedCards: new Set(),
					skippedCards: new Set(),
					startTime: Date.now(),
					pausedTime: null,
					totalPausedDuration: 0,
					statistics: {
						totalKeystrokes: 0,
						correctKeystrokes: 0,
						mistakes: 0,
						currentCombo: 0,
						maxCombo: 0
					}
				};
				console.log('PracticeModeStore updated state:', {
					cardsLength: newState.cards?.length,
					currentIndex: newState.currentIndex,
					firstCard: newState.cards?.[0]
				});
				return newState;
			});
			
			this.startAutoSave();
		},
		
		/**
		 * セッションから復元
		 */
		async resumeFromSession(cards: KarutaCard[], storage?: LocalStorageService) {
			storageService = storage || new LocalStorageService();
			
			try {
				const session = storageService.loadSession();
				if (session && session.mode === 'practice') {
					update(state => ({
						...state,
						cards,
						currentIndex: session.cards.currentIndex,
						completedCards: new Set(session.cards.completed.map((c: any) => c.id)),
						skippedCards: new Set(), // セッションでは保存しない
						startTime: new Date(session.startTime).getTime(),
						pausedTime: null,
						totalPausedDuration: Date.now() - new Date(session.startTime).getTime() - session.timer.elapsedTime,
						statistics: {
							totalKeystrokes: session.score.total || 0,
							correctKeystrokes: Math.floor((session.score.total || 0) * (session.score.accuracy || 100) / 100),
							mistakes: 0,
							currentCombo: session.score.combo || 0,
							maxCombo: session.score.maxCombo || 0
						}
					}));
					
					this.startAutoSave();
					return true;
				}
			} catch (error) {
				console.error('Failed to resume session:', error);
			}
			
			// セッション復元失敗時は新規開始
			this.initialize(cards, storageService);
			return false;
		},
		
		/**
		 * 次の札へ進む
		 */
		nextCard(completed: boolean = true) {
			console.log('PracticeModeStore.nextCard called, completed:', completed);
			update(state => {
				const currentCard = state.cards[state.currentIndex];
				const nextIndex = state.currentIndex + 1;
				console.log('Current index:', state.currentIndex, 'Next index:', nextIndex, 'Total cards:', state.cards.length);
				
				if (currentCard) {
					if (completed) {
						state.completedCards.add(currentCard.id);
					} else {
						state.skippedCards.add(currentCard.id);
					}
				}
				
				// Allow index to go beyond array length to signal completion
				// The game completion will be handled by the component
				return {
					...state,
					currentIndex: nextIndex
				};
			});
		},
		
		/**
		 * 入力を処理
		 */
		processKeystroke(isCorrect: boolean) {
			update(state => {
				state.statistics.totalKeystrokes++;
				
				if (isCorrect) {
					state.statistics.correctKeystrokes++;
					state.statistics.currentCombo++;
					state.statistics.maxCombo = Math.max(
						state.statistics.maxCombo,
						state.statistics.currentCombo
					);
				} else {
					state.statistics.mistakes++;
					state.statistics.currentCombo = 0;
				}
				
				return state;
			});
		},
		
		/**
		 * 一時停止
		 */
		pause() {
			update(state => ({
				...state,
				pausedTime: Date.now()
			}));
			
			this.stopAutoSave();
		},
		
		/**
		 * 再開
		 */
		resume() {
			update(state => {
				if (state.pausedTime) {
					const pauseDuration = Date.now() - state.pausedTime;
					return {
						...state,
						pausedTime: null,
						totalPausedDuration: state.totalPausedDuration + pauseDuration
					};
				}
				return state;
			});
			
			this.startAutoSave();
		},
		
		/**
		 * セッションを保存
		 */
		saveSession() {
			const state = get({ subscribe });
			if (!storageService || !state.startTime) return;
			
			const elapsedTime = this.getElapsedTime();
			const accuracy = state.statistics.totalKeystrokes > 0
				? (state.statistics.correctKeystrokes / state.statistics.totalKeystrokes) * 100
				: 100;
			
			const session = {
				id: `practice-${Date.now()}`,
				mode: 'practice' as const,
				startTime: new Date(state.startTime).toISOString(),
				cards: {
					current: state.cards[state.currentIndex],
					currentIndex: state.currentIndex,
					remaining: state.cards.slice(state.currentIndex + 1),
					completed: state.cards.slice(0, state.currentIndex)
						.filter(card => state.completedCards.has(card.id))
				},
				score: {
					total: state.statistics.totalKeystrokes,
					accuracy,
					speed: this.calculateWPM(),
					combo: state.statistics.currentCombo,
					maxCombo: state.statistics.maxCombo
				},
				timer: {
					elapsedTime,
					pausedDuration: state.totalPausedDuration
				}
			};
			
			try {
				storageService.saveSession(session);
			} catch (error) {
				console.warn('Failed to save session:', error);
			}
		},
		
		/**
		 * 自動保存を開始
		 */
		startAutoSave() {
			this.stopAutoSave();
			autoSaveInterval = setInterval(() => {
				this.saveSession();
			}, 5000);
		},
		
		/**
		 * 自動保存を停止
		 */
		stopAutoSave() {
			if (autoSaveInterval) {
				clearInterval(autoSaveInterval);
				autoSaveInterval = null;
			}
		},
		
		/**
		 * 経過時間を取得（ミリ秒）
		 */
		getElapsedTime(): number {
			const state = get({ subscribe });
			if (!state.startTime) return 0;
			
			const now = state.pausedTime || Date.now();
			return now - state.startTime - state.totalPausedDuration;
		},
		
		/**
		 * WPMを計算
		 */
		calculateWPM(): number {
			const state = get({ subscribe });
			const elapsedMinutes = this.getElapsedTime() / 60000;
			if (elapsedMinutes <= 0) return 0;
			
			const words = state.statistics.correctKeystrokes / 5; // 5文字を1単語と仮定
			return Math.round(words / elapsedMinutes);
		},
		
		/**
		 * 正確率を計算
		 */
		calculateAccuracy(): number {
			const state = get({ subscribe });
			if (state.statistics.totalKeystrokes === 0) return 100;
			
			return Math.round(
				(state.statistics.correctKeystrokes / state.statistics.totalKeystrokes) * 100
			);
		},
		
		/**
		 * ゲーム完了
		 */
		async complete() {
			this.stopAutoSave();
			
			if (storageService) {
				storageService.clearSession();
				
				// 結果を保存（IndexedDBへ）
				// TODO: IndexedDBService経由で結果を保存
			}
		},
		
		/**
		 * リセット
		 */
		reset() {
			this.stopAutoSave();
			set(initialState);
		}
	};
}

export const practiceModeStore = createPracticeModeStore();

// 派生ストア
export const currentCard = derived(
	practiceModeStore,
	$state => $state.cards[$state.currentIndex] || null
);

export const progress = derived(
	practiceModeStore,
	$state => ({
		current: $state.currentIndex + 1,
		total: $state.cards.length,
		percentage: $state.cards.length > 0 
			? Math.round(($state.currentIndex / $state.cards.length) * 100)
			: 0
	})
);

export const isComplete = derived(
	practiceModeStore,
	$state => $state.currentIndex >= $state.cards.length
);

export const statistics = derived(
	practiceModeStore,
	$state => ({
		wpm: practiceModeStore.calculateWPM(),
		accuracy: practiceModeStore.calculateAccuracy(),
		combo: $state.statistics.currentCombo,
		maxCombo: $state.statistics.maxCombo,
		totalKeystrokes: $state.statistics.totalKeystrokes,
		mistakes: $state.statistics.mistakes
	})
);