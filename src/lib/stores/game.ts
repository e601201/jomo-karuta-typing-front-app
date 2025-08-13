/**
 * ゲーム状態管理ストア
 */

import { writable, derived, get, type Writable, type Readable } from 'svelte/store';
import { InputValidator } from '../services/typing/input-validator';
import type { KarutaCard, GameMode } from '$lib/types';
import { LocalStorageService } from '$lib/services/storage/local-storage';

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
	timeLimit: number | null; // 制限時間（ミリ秒）
	remainingTime: number; // 残り時間（ミリ秒）
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
	statistics: {
		totalKeystrokes: number;
		correctKeystrokes: number;
		mistakes: number;
		currentCombo: number;
		maxCombo: number;
	};
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
		totalPauseTime: 0,
		timeLimit: null,
		remainingTime: 0
	},
	statistics: {
		totalKeystrokes: 0,
		correctKeystrokes: 0,
		mistakes: 0,
		currentCombo: 0,
		maxCombo: 0
	}
};

// ゲームストアを作成
export function createGameStore() {
	// メインストア
	const gameStore: Writable<GameState> = writable(initialState);

	// タイマー更新用のインターバル
	let timerInterval: ReturnType<typeof setInterval> | null = null;

	// 自動保存用のインターバル
	let autoSaveInterval: ReturnType<typeof setInterval> | null = null;

	// ストレージサービス
	let storageService: LocalStorageService | null = null;

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

	// 派生ストア: 統計情報（練習モードと同様）
	const statisticsStore: Readable<any> = derived(gameStore, ($game) => {
		// WPM計算
		const elapsedMinutes = $game.timer.elapsedTime / 60000;
		const words = $game.statistics.correctKeystrokes / 5;
		const wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;

		// 正確率計算
		const accuracy =
			$game.statistics.totalKeystrokes > 0
				? Math.round(($game.statistics.correctKeystrokes / $game.statistics.totalKeystrokes) * 100)
				: 100;

		return {
			wpm,
			accuracy,
			combo: $game.statistics.currentCombo,
			maxCombo: $game.statistics.maxCombo,
			totalKeystrokes: $game.statistics.totalKeystrokes,
			mistakes: $game.statistics.mistakes
		};
	});

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

		// プラクティスモード以外は60秒の制限時間を設定
		const timeLimit = mode === 'practice' ? null : 10000;

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
				totalPauseTime: 0,
				timeLimit,
				remainingTime: timeLimit || 0
			},
			statistics: {
				totalKeystrokes: 0,
				correctKeystrokes: 0,
				mistakes: 0,
				currentCombo: 0,
				maxCombo: 0
			}
		}));

		// InputValidatorにターゲットを設定（スペースを除去）
		const state = get(gameStore);
		if (state.input.validator && state.cards.current) {
			const targetText = state.cards.current.hiragana.replace(/\s/g, '');
			state.input.validator.setTarget(targetText);
		}

		// タイマーはカウントダウン後に開始されるため、ここでは開始しない

		// LocalStorageServiceを初期化
		storageService = new LocalStorageService();

		// 自動保存を開始（練習モード以外でも5秒ごとに保存）
		startAutoSave();
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

			// InputValidatorに新しいターゲットを設定（スペースを除去）
			if (s.input.validator && nextCard) {
				const targetText = nextCard.hiragana.replace(/\s/g, '');
				s.input.validator.setTarget(targetText);
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
		// コンボ更新はprocessKeystrokeで行うため、ここでは不要
		// 次のカードへ進むだけ
		nextCard();
	}

	// キーストロークを処理（練習モードと同様の実装）
	function processKeystroke(isCorrect: boolean) {
		gameStore.update((state) => {
			const newState = { ...state };
			newState.statistics = { ...state.statistics };
			newState.score = { ...state.score };
			
			newState.statistics.totalKeystrokes++;

			if (isCorrect) {
				newState.statistics.correctKeystrokes++;
				newState.statistics.currentCombo++;
				newState.statistics.maxCombo = Math.max(
					newState.statistics.maxCombo,
					newState.statistics.currentCombo
				);
			} else {
				newState.statistics.mistakes++;
				newState.statistics.currentCombo = 0;
			}

			// スコアも更新
			newState.score.combo = newState.statistics.currentCombo;
			newState.score.maxCombo = newState.statistics.maxCombo;

			return newState;
		});
	}

	// 入力更新
	function updateInput(input: string) {
		const state = get(gameStore);

		// セッション未開始または無効な状態
		if (!state.session?.isActive || !state.input.validator || !state.cards.current) {
			return;
		}

		// 前回の入力との差分を検出
		const previousInput = state.input.current;
		const inputDiff = input.length - previousInput.length;

		// 入力検証（スペースを除去してから検証）
		const targetText = state.cards.current.hiragana.replace(/\s/g, '');
		const result = state.input.validator.validateInput(targetText, input);

		// 新しい文字が入力された場合のみキーストロークを処理
		if (inputDiff > 0) {
			// 新しく入力された各文字に対してキーストローク処理
			for (let i = 0; i < inputDiff; i++) {
				// 入力が正しいかどうかを判定
				processKeystroke(result.isValid);
			}
		}
		// バックスペースの場合は処理しない

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
		} else if (inputDiff > 0) {
			// 誤入力の場合（新しい入力があった場合のみ）
			gameStore.update((s) => ({
				...s,
				input: {
					...s.input,
					mistakes: s.input.mistakes + inputDiff
					// currentは更新しない（誤入力を受け付けない）
				}
			}));
			return previousInput; // UI側で処理が必要
		}

		// 正確率とスピードを更新
		updateScore();
	}

	// スコア更新（WPM計算に変更）
	function updateScore() {
		gameStore.update((state) => {
			// 正確率の計算（キーストロークベース）
			const accuracy =
				state.statistics.totalKeystrokes > 0
					? (state.statistics.correctKeystrokes / state.statistics.totalKeystrokes) * 100
					: 100;

			// WPMの計算（5文字を1単語と仮定）
			const elapsedMinutes = state.timer.elapsedTime / 60000;
			const words = state.statistics.correctKeystrokes / 5;
			const speed = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;

			return {
				...state,
				score: {
					...state.score,
					total: state.statistics.totalKeystrokes,
					accuracy: accuracy,
					speed,
					combo: state.statistics.currentCombo,
					maxCombo: state.statistics.maxCombo
				}
			};
		});
	}

	// セッションを保存
	function saveSession() {
		const state = get(gameStore);
		if (!storageService || !state.session?.isActive || !state.timer.startTime) return;

		const elapsedTime = state.timer.elapsedTime;
		const accuracy =
			state.statistics.totalKeystrokes > 0
				? (state.statistics.correctKeystrokes / state.statistics.totalKeystrokes) * 100
				: 100;

		// WPM計算
		const elapsedMinutes = elapsedTime / 60000;
		const words = state.statistics.correctKeystrokes / 5;
		const wpm = elapsedMinutes > 0 ? Math.round(words / elapsedMinutes) : 0;

		const session = {
			id: state.session.id,
			mode: state.session.mode,
			startTime: state.timer.startTime.toISOString(),
			cards: {
				current: state.cards.current,
				currentIndex: state.cards.currentIndex,
				remaining: state.cards.remaining,
				completed: state.cards.completed
			},
			score: {
				total: state.statistics.totalKeystrokes,
				accuracy,
				speed: wpm,
				combo: state.statistics.currentCombo,
				maxCombo: state.statistics.maxCombo
			},
			timer: {
				elapsedTime,
				pausedDuration: state.timer.totalPauseTime
			}
		};

		try {
			storageService.saveSession(session);
		} catch (error) {
			console.warn('Failed to save session:', error);
		}
	}

	// 自動保存を開始
	function startAutoSave() {
		stopAutoSave();
		autoSaveInterval = setInterval(() => {
			saveSession();
		}, 5000); // 5秒ごとに保存
	}

	// 自動保存を停止
	function stopAutoSave() {
		if (autoSaveInterval) {
			clearInterval(autoSaveInterval);
			autoSaveInterval = null;
		}
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

		// 自動保存も停止
		stopAutoSave();
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

		// 自動保存再開
		startAutoSave();
	}

	// セッション終了
	function endSession() {
		const state = get(gameStore);

		if (!state.session) return;

		// 最後にセッションを保存
		saveSession();

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

		// 自動保存停止
		stopAutoSave();

		// LocalStorageのセッションをクリア
		if (storageService) {
			storageService.clearSession();
		}
	}

	// セッションリセット
	function resetSession() {
		// タイマー停止
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		// 自動保存停止
		stopAutoSave();

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
		const elapsedTime = now - startTime - state.timer.pausedDuration;

		// 制限時間がある場合は残り時間を計算
		let remainingTime = 0;
		if (state.timer.timeLimit !== null) {
			remainingTime = Math.max(0, state.timer.timeLimit - elapsedTime);

			// 時間切れの場合はゲーム終了
			if (remainingTime === 0 && state.session.isActive) {
				endSession();
				return;
			}
		}

		gameStore.update((s) => ({
			...s,
			timer: {
				...s.timer,
				elapsedTime: elapsedTime,
				cardElapsedTime: now - cardStartTime,
				remainingTime: remainingTime
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

	// ゲーム実際の開始（カウントダウン後）
	function startGameAfterCountdown() {
		const state = get(gameStore);

		if (!state.session?.isActive) {
			return;
		}

		// 開始時刻をリセット（カウントダウン後の現在時刻に）
		const now = new Date();
		gameStore.update((s) => ({
			...s,
			timer: {
				...s.timer,
				startTime: now,
				cardStartTime: now,
				elapsedTime: 0,
				cardElapsedTime: 0
			}
		}));

		// タイマー開始
		startTimer();

		// 自動保存もここで開始（カウントダウン後）
		startAutoSave();
	}

	// ユーティリティ関数
	function generateSessionId(): string {
		return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
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

	// WPMを計算
	function calculateWPM(): number {
		const state = get(gameStore);
		if (!state.timer.startTime) return 0;

		const elapsedMinutes = state.timer.elapsedTime / 60000;
		if (elapsedMinutes <= 0) return 0;

		const words = state.statistics.correctKeystrokes / 5; // 5文字を1単語と仮定
		return Math.round(words / elapsedMinutes);
	}

	// 正確率を計算（キーストロークベース）
	function calculateKeystrokeAccuracy(): number {
		const state = get(gameStore);
		if (state.statistics.totalKeystrokes === 0) return 100;

		return Math.round(
			(state.statistics.correctKeystrokes / state.statistics.totalKeystrokes) * 100
		);
	}

	// クリーンアップ
	function destroy() {
		if (timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}

		// 自動保存も停止
		stopAutoSave();
	}

	return {
		gameStore,
		currentCardStore,
		progressStore,
		scoreStore,
		statisticsStore,
		startSession,
		nextCard,
		completeCard,
		updateInput,
		processKeystroke,
		pauseGame,
		resumeGame,
		endSession,
		resetSession,
		updateTimer,
		startGameAfterCountdown,
		saveSession,
		startAutoSave,
		stopAutoSave,
		calculateWPM,
		calculateKeystrokeAccuracy,
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
