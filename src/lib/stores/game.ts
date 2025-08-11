/**
 * ゲーム状態管理ストア
 */

import { writable, derived, get, type Writable, type Readable } from 'svelte/store';
import { InputValidator } from '../services/typing/input-validator';

// 型定義
export type GameMode = 'practice' | 'specific' | 'random';

export interface KarutaCard {
	id: string;
	hiragana: string;
	romaji: string;
	meaning: string;
	category: string;
	difficulty: 'easy' | 'medium' | 'hard';
}

export interface GameSession {
	id: string;
	mode: GameMode;
	startTime: Date;
	endTime?: Date;
	isActive: boolean;
	totalCards: number;
}

export interface CompletedCard {
	card: KarutaCard;
	time: number;
	mistakes: number;
	accuracy: number;
}

export interface GameScore {
	total: number;
	accuracy: number;
	speed: number;
	combo: number;
	maxCombo: number;
}

export interface GameTimer {
	startTime: Date | null;
	elapsedTime: number;
	cardStartTime: Date | null;
	cardElapsedTime: number;
	isPaused: boolean;
	pausedDuration: number;
	pauseStartTime: Date | null;
	pauseCount: number;
	totalPauseTime: number;
}

export interface GameState {
	session: GameSession | null;
	cards: {
		current: KarutaCard | null;
		currentIndex: number;
		remaining: KarutaCard[];
		completed: CompletedCard[];
	};
	input: {
		current: string;
		position: number;
		mistakes: number;
		validator: InputValidator | null;
	};
	score: GameScore;
	timer: GameTimer;
}

export interface GameProgress {
	completed: number;
	total: number;
	percentage: number;
}

// 初期状態
const initialState: GameState = {
	session: null,
	cards: {
		current: null,
		currentIndex: 0,
		remaining: [],
		completed: []
	},
	input: {
		current: '',
		position: 0,
		mistakes: 0,
		validator: null
	},
	score: {
		total: 0,
		accuracy: 100,
		speed: 0,
		combo: 0,
		maxCombo: 0
	},
	timer: {
		startTime: null,
		elapsedTime: 0,
		cardStartTime: null,
		cardElapsedTime: 0,
		isPaused: false,
		pausedDuration: 0,
		pauseStartTime: null,
		pauseCount: 0,
		totalPauseTime: 0
	}
};

// ゲームストアを作成
export function createGameStore() {
	// メインストア
	const gameStore: Writable<GameState> = writable(initialState);

	// タイマー更新用のインターバル
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	// 派生ストア: 現在のカード
	const currentCardStore: Readable<KarutaCard | null> = derived(
		gameStore,
		($game) => $game.cards.current
	);

	// 派生ストア: 進捗
	const progressStore: Readable<GameProgress> = derived(gameStore, ($game) => {
		const total = $game.session?.totalCards || 0;
		const completed = $game.cards.completed.length;
		const percentage = total > 0 ? (completed / total) * 100 : 0;

		return {
			completed,
			total,
			percentage
		};
	});

	// 派生ストア: スコア
	const scoreStore: Readable<GameScore> = derived(gameStore, ($game) => $game.score);

	// セッション開始
	function startSession(mode: GameMode, cards: KarutaCard[]) {
		if (cards.length === 0) return;

		// ランダムモードの場合はカードをシャッフル
		let gameCards = [...cards];
		if (mode === 'random') {
			gameCards = shuffleArray(gameCards);
		}

		const sessionId = generateSessionId();
		const startTime = new Date();

		gameStore.update((state) => ({
			...state,
			session: {
				id: sessionId,
				mode,
				startTime,
				isActive: true,
				totalCards: gameCards.length
			},
			cards: {
				current: gameCards[0],
				currentIndex: 0,
				remaining: gameCards.slice(1),
				completed: []
			},
			input: {
				current: '',
				position: 0,
				mistakes: 0,
				validator: new InputValidator()
			},
			score: {
				total: 0,
				accuracy: 100,
				speed: 0,
				combo: 0,
				maxCombo: 0
			},
			timer: {
				startTime,
				elapsedTime: 0,
				cardStartTime: startTime,
				cardElapsedTime: 0,
				isPaused: false,
				pausedDuration: 0,
				pauseStartTime: null,
				pauseCount: 0,
				totalPauseTime: 0
			}
		}));

		// InputValidatorにターゲットを設定
		const state = get(gameStore);
		if (state.input.validator && state.cards.current) {
			state.input.validator.setTarget(state.cards.current.hiragana);
		}

		// タイマー開始
		startTimer();
	}

	// 次のカードへ
	function nextCard() {
		const state = get(gameStore);

		// セッション未開始またはカードがない場合は何もしない
		if (!state.session?.isActive || !state.cards.current) {
			return;
		}

		// データ不整合の検出と修正
		if (state.cards.currentIndex >= state.session.totalCards) {
			// インデックスが範囲外の場合は修正
			gameStore.update((s) => ({
				...s,
				cards: {
					...s.cards,
					currentIndex: Math.max(
						0,
						Math.min(s.session?.totalCards ? s.session.totalCards - 1 : 0, s.cards.currentIndex)
					)
				}
			}));
			return;
		}

		// インデックスの範囲チェックと修正
		if (
			state.cards.currentIndex >= state.session.totalCards - 1 &&
			state.cards.remaining.length === 0
		) {
			// すでに最後のカードの場合は終了
			endSession();
			return;
		}

		// 現在のカードを完了済みに追加
		const cardTime =
			state.timer.cardElapsedTime ||
			Date.now() - (state.timer.cardStartTime?.getTime() || Date.now());

		const completedCard: CompletedCard = {
			card: state.cards.current,
			time: cardTime,
			mistakes: state.input.mistakes,
			accuracy: calculateAccuracy(state.input.position, state.input.mistakes)
		};

		gameStore.update((s) => {
			const newCompleted = [...s.cards.completed, completedCard];

			// 履歴を最大100件に制限
			if (newCompleted.length > 100) {
				newCompleted.shift();
			}

			// 次のカードがあるか確認
			if (s.cards.remaining.length === 0) {
				// ゲーム終了 - 完了済みリストを更新してから終了
				const finalState = {
					...s,
					cards: {
						...s.cards,
						completed: newCompleted
					}
				};
				setTimeout(() => endSession(), 0); // 非同期で終了処理
				return finalState;
			}

			const nextCard = s.cards.remaining[0];
			const newIndex = s.cards.currentIndex + 1;

			// InputValidatorに新しいターゲットを設定
			if (s.input.validator && nextCard) {
				s.input.validator.setTarget(nextCard.hiragana);
			}

			return {
				...s,
				cards: {
					current: nextCard,
					currentIndex: newIndex,
					remaining: s.cards.remaining.slice(1),
					completed: newCompleted
				},
				input: {
					...s.input,
					current: '',
					position: 0,
					mistakes: 0
				},
				timer: {
					...s.timer,
					cardStartTime: new Date(),
					cardElapsedTime: 0
				}
			};
		});
	}

	// カード完了
	function completeCard() {
		const state = get(gameStore);

		// コンボ更新
		gameStore.update((s) => ({
			...s,
			score: {
				...s.score,
				combo: s.score.combo + 1,
				maxCombo: Math.max(s.score.maxCombo, s.score.combo + 1)
			}
		}));

		nextCard();
	}

	// 入力更新
	function updateInput(input: string) {
		const state = get(gameStore);

		// セッション未開始または無効な状態
		if (!state.session?.isActive || !state.input.validator || !state.cards.current) {
			return;
		}

		// 入力検証
		const result = state.input.validator.validateInput(state.cards.current.hiragana, input);

		if (result.isValid) {
			// 正しい入力
			gameStore.update((s) => ({
				...s,
				input: {
					...s.input,
					current: input,
					position: input.length
				}
			}));

			// 完全一致の場合は次へ
			if (result.progress === 1) {
				completeCard();
			}
		} else {
			// 誤入力
			gameStore.update((s) => ({
				...s,
				input: {
					...s.input,
					mistakes: s.input.mistakes + 1
				},
				score: {
					...s.score,
					combo: 0 // コンボリセット
				}
			}));
		}

		// 正確率とスピードを更新
		updateScore();
	}

	// スコア更新
	function updateScore() {
		gameStore.update((state) => {
			const totalInputs = state.input.position + state.input.mistakes;
			const accuracy = totalInputs > 0 ? (state.input.position / totalInputs) * 100 : 100;

			const elapsedMinutes = state.timer.elapsedTime / 60000;
			const speed = elapsedMinutes > 0 ? Math.round(state.input.position / elapsedMinutes) : 0;

			return {
				...state,
				score: {
					...state.score,
					accuracy: accuracy,
					speed
				}
			};
		});
	}

	// 一時停止
	function pauseGame() {
		gameStore.update((state) => ({
			...state,
			timer: {
				...state.timer,
				isPaused: true,
				pauseStartTime: new Date(),
				pauseCount: state.timer.pauseCount + 1
			}
		}));

		// タイマー停止
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	// 再開
	function resumeGame() {
		const state = get(gameStore);

		if (!state.timer.isPaused || !state.timer.pauseStartTime) {
			return;
		}

		const pauseDuration = Date.now() - state.timer.pauseStartTime.getTime();

		gameStore.update((s) => ({
			...s,
			timer: {
				...s.timer,
				isPaused: false,
				pausedDuration: s.timer.pausedDuration + pauseDuration,
				totalPauseTime: s.timer.totalPauseTime + pauseDuration,
				pauseStartTime: null
			}
		}));

		// タイマー再開
		startTimer();
	}

	// セッション終了
	function endSession() {
		const state = get(gameStore);

		if (!state.session) return;

		gameStore.update((s) => ({
			...s,
			session: s.session
				? {
						...s.session,
						endTime: new Date(),
						isActive: false
					}
				: null,
			timer: {
				...s.timer,
				isPaused: false
			}
		}));

		// タイマー停止
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	// セッションリセット
	function resetSession() {
		// タイマー停止
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		gameStore.set(initialState);
	}

	// タイマー更新
	function updateTimer() {
		const state = get(gameStore);

		if (!state.session?.isActive || state.timer.isPaused) {
			return;
		}

		const now = Date.now();
		const startTime = state.timer.startTime?.getTime() || now;
		const cardStartTime = state.timer.cardStartTime?.getTime() || now;

		gameStore.update((s) => ({
			...s,
			timer: {
				...s.timer,
				elapsedTime: now - startTime - s.timer.pausedDuration,
				cardElapsedTime: now - cardStartTime
			}
		}));
	}

	// タイマー開始
	function startTimer() {
		if (timerInterval) {
			clearInterval(timerInterval);
		}

		timerInterval = setInterval(() => {
			updateTimer();
		}, 100);
	}

	// ユーティリティ関数
	function generateSessionId(): string {
		return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	function shuffleArray<T>(array: T[]): T[] {
		const arr = [...array];
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[arr[i], arr[j]] = [arr[j], arr[i]];
		}
		return arr;
	}

	function calculateAccuracy(correct: number, mistakes: number): number {
		const total = correct + mistakes;
		if (total === 0) return 100;
		return Math.round((correct / total) * 1000) / 10;
	}

	// クリーンアップ
	function destroy() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
	}

	return {
		gameStore,
		currentCardStore,
		progressStore,
		scoreStore,
		startSession,
		nextCard,
		completeCard,
		updateInput,
		pauseGame,
		resumeGame,
		endSession,
		resetSession,
		updateTimer,
		destroy
	};
}

// Export singleton instance
const storeInstance = createGameStore();
export const gameStore = {
	...storeInstance,
	subscribe: storeInstance.gameStore.subscribe,
	set: storeInstance.gameStore.set,
	update: storeInstance.gameStore.update
};
