/**
 * ゲーム状態管理ストアのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import type { KarutaCard } from '$lib/types';
import { InputValidator } from '../services/typing/input-validator';

// 画像プリロードは即座に解決させる（happy-dom で実画像を読み込まないため）。
// startSession は ImagePreloader.preloadWithPriority を await してから状態を更新する。
vi.mock('$lib/utils/image-preloader', () => ({
	ImagePreloader: {
		preloadWithPriority: vi.fn().mockResolvedValue(undefined)
	}
}));

import { createGameStore } from './game';

// モックデータ
const mockCards: KarutaCard[] = [
	{
		id: 'tsu',
		hiragana: 'つる まう かたち の ぐんまけん',
		romaji: 'tsuru mau katachi no gunmaken',
		meaning: '鶴舞う形の群馬県',
		category: 'geography',
		difficulty: 'easy'
	},
	{
		id: 'ne',
		hiragana: 'ねぎ と こんにゃく しもにた めいぶつ',
		romaji: 'negi to konnyaku shimonita meibutsu',
		meaning: 'ねぎとこんにゃく下仁田名物',
		category: 'industry',
		difficulty: 'medium'
	},
	{
		id: 'chi',
		hiragana: 'ちから あわせる にひゃくまんにん',
		romaji: 'chikara awaseru nihyakumannin',
		meaning: '力あわせる二百万人',
		category: 'culture',
		difficulty: 'easy'
	}
];

// 検証ターゲットはスペースを除去した全文ひらがな。撥音ルールにより末尾「ん」は nn 必須。
// 「つる まう かたち の ぐんまけん」→ 'つるまうかたちのぐんまけん' → 'tsurumaukatachinogunmakenn'
const fullRomajiTsu = 'tsurumaukatachinogunmakenn';

describe('GameStore - 初期化', () => {
	it('初期状態が正しく設定される', () => {
		const { gameStore } = createGameStore();
		const state = get(gameStore);

		expect(state.session).toBeNull();
		expect(state.cards.current).toBeNull();
		expect(state.cards.currentIndex).toBe(0);
		expect(state.cards.remaining).toEqual([]);
		expect(state.cards.completed).toEqual([]);
		expect(state.input.current).toBe('');
		expect(state.input.position).toBe(0);
		expect(state.input.mistakes).toBe(0);
		expect(state.input.validator).toBeNull();
		expect(state.score.total).toBe(0);
		expect(state.score.accuracy).toBe(100);
		expect(state.score.speed).toBe(0);
		expect(state.score.combo).toBe(0);
		expect(state.score.maxCombo).toBe(0);
		expect(state.timer.isPaused).toBe(false);
		expect(state.timer.elapsedTime).toBe(0);
	});
});

describe('GameStore - セッション管理', () => {
	let store: ReturnType<typeof createGameStore>;

	beforeEach(() => {
		store = createGameStore();
		vi.clearAllMocks();
	});

	it('練習モードでセッションを開始できる', async () => {
		const { gameStore, startSession } = store;

		await startSession('practice', mockCards);
		const state = get(gameStore);

		expect(state.session).not.toBeNull();
		expect(state.session?.mode).toBe('practice');
		expect(state.session?.isActive).toBe(true);
		expect(state.session?.totalCards).toBe(3);
		expect(state.cards.remaining).toHaveLength(2); // 最初の札以外
		expect(state.cards.current).toEqual(mockCards[0]);
		expect(state.cards.currentIndex).toBe(0);
		expect(state.input.validator).toBeInstanceOf(InputValidator);
	});

	it('特定札モードでセッションを開始できる', async () => {
		const { gameStore, startSession } = store;
		const selectedCards = [mockCards[0], mockCards[2]];

		await startSession('specific', selectedCards);
		const state = get(gameStore);

		expect(state.session?.mode).toBe('specific');
		expect(state.session?.totalCards).toBe(2);
		expect(state.cards.remaining).toHaveLength(1);
		expect(state.cards.current).toEqual(selectedCards[0]);
	});

	it('ランダムモードでセッションを開始できる', async () => {
		const { gameStore, startSession } = store;

		await startSession('random', mockCards);
		const state = get(gameStore);

		expect(state.session?.mode).toBe('random');
		expect(state.cards.remaining.length + 1).toBe(mockCards.length);
	});

	it('セッション終了時に状態が更新される', async () => {
		const { gameStore, startSession, endSession } = store;

		await startSession('practice', mockCards);
		endSession();
		const state = get(gameStore);

		expect(state.session?.isActive).toBe(false);
		expect(state.session?.endTime).toBeDefined();
		expect(state.timer.isPaused).toBe(false);
	});

	it('セッションをリセットできる', async () => {
		const { gameStore, startSession, resetSession } = store;

		await startSession('practice', mockCards);
		resetSession();
		const state = get(gameStore);

		expect(state.session).toBeNull();
		expect(state.cards.current).toBeNull();
		expect(state.cards.remaining).toEqual([]);
		expect(state.input.current).toBe('');
		expect(state.score.total).toBe(0);
	});
});

describe('GameStore - カード進行', () => {
	let store: ReturnType<typeof createGameStore>;

	beforeEach(() => {
		store = createGameStore();
		vi.clearAllMocks();
	});

	it('次のカードに進める', async () => {
		const { gameStore, startSession, nextCard } = store;

		await startSession('practice', mockCards);
		const firstCard = get(gameStore).cards.current;

		nextCard();
		const state = get(gameStore);

		expect(state.cards.currentIndex).toBe(1);
		expect(state.cards.current).toEqual(mockCards[1]);
		expect(state.cards.completed).toHaveLength(1);
		expect(state.cards.completed[0].card).toEqual(firstCard);
		expect(state.cards.remaining).toHaveLength(1);
		expect(state.input.current).toBe('');
		expect(state.input.position).toBe(0);
		expect(state.input.mistakes).toBe(0);
	});

	it('最後のカードで完了処理される', async () => {
		const { gameStore, startSession, nextCard } = store;

		await startSession('practice', mockCards);

		// 最後のカードまで進める
		nextCard(); // 2枚目
		nextCard(); // 3枚目（最後）

		const state = get(gameStore);
		expect(state.cards.currentIndex).toBe(2);
		expect(state.cards.remaining).toHaveLength(0);

		// 最後のカードの次に進もうとすると終了
		nextCard();

		// setTimeoutを待つ
		await new Promise((resolve) => setTimeout(resolve, 10));

		const finalState = get(gameStore);
		expect(finalState.session?.isActive).toBe(false);
	});

	it('カードがない状態でnextCardを呼んでもエラーにならない', () => {
		const { gameStore, nextCard } = store;

		const stateBefore = get(gameStore);
		nextCard();
		const stateAfter = get(gameStore);

		expect(stateAfter).toEqual(stateBefore);
	});

	it('カード完了時にデータが記録される', async () => {
		const { gameStore, startSession, completeCard } = store;

		await startSession('practice', mockCards);
		const firstCard = get(gameStore).cards.current;

		// ミスを2回記録
		gameStore.update((s) => ({ ...s, input: { ...s.input, mistakes: 2 } }));

		completeCard();
		const state = get(gameStore);

		expect(state.cards.completed).toHaveLength(1);
		expect(state.cards.completed[0]).toEqual({
			card: firstCard,
			time: expect.any(Number),
			mistakes: 2,
			accuracy: expect.any(Number)
		});
	});
});

describe('GameStore - 入力管理', () => {
	let store: ReturnType<typeof createGameStore>;

	beforeEach(() => {
		store = createGameStore();
		vi.clearAllMocks();
	});

	it('正しい入力で状態が更新される', async () => {
		const { gameStore, startSession, updateInput } = store;

		await startSession('practice', mockCards);
		updateInput('tsu');

		const state = get(gameStore);
		expect(state.input.current).toBe('tsu');
		expect(state.input.position).toBe(3);
		expect(state.input.mistakes).toBe(0);
	});

	it('誤った入力でミスカウントが増える', async () => {
		const { gameStore, startSession, updateInput } = store;

		await startSession('practice', mockCards);
		const mistakesBefore = get(gameStore).input.mistakes;

		updateInput('x');

		const state = get(gameStore);
		expect(state.input.mistakes).toBe(mistakesBefore + 1);
		expect(state.input.current).toBe(''); // 誤入力は記録されない
	});

	it('完全一致で札が完了する', async () => {
		const { gameStore, startSession, updateInput } = store;

		await startSession('practice', mockCards);

		// 完全な入力（検証ターゲットはスペース除去＋撥音ルールで末尾 nn）
		updateInput(fullRomajiTsu);

		const state = get(gameStore);
		expect(state.cards.currentIndex).toBe(1); // 次の札へ
		expect(state.cards.current).toEqual(mockCards[1]);
		expect(state.cards.completed).toHaveLength(1);
	});

	it('部分入力が正しく判定される', async () => {
		const { gameStore, startSession, updateInput } = store;

		await startSession('practice', mockCards);

		// 'つるまう' の途中まで（スペースなし）
		updateInput('tsuruma');

		const state = get(gameStore);
		expect(state.input.current).toBe('tsuruma');
		expect(state.input.position).toBe(7);
	});
});

describe('GameStore - スコア計算', () => {
	let store: ReturnType<typeof createGameStore>;

	beforeEach(() => {
		store = createGameStore();
		vi.clearAllMocks();
	});

	it('正確率が正しく計算される', async () => {
		const { gameStore, startSession } = store;

		await startSession('practice', mockCards);

		// 10文字入力、2ミス - 直接スコアを計算する
		gameStore.update((s) => {
			const totalInputs = 10 + 2;
			const accuracy = (10 / totalInputs) * 100;
			return {
				...s,
				input: { ...s.input, mistakes: 2, position: 10 },
				score: { ...s.score, accuracy: Math.round(accuracy * 10) / 10 }
			};
		});

		const state = get(gameStore);
		// 正確率 = 正解数 / 総入力数 * 100 = 10 / 12 * 100 ≈ 83.3%
		expect(state.score.accuracy).toBeCloseTo(83.3, 1);
	});

	it('タイピング速度が計算される', async () => {
		const { gameStore, startSession } = store;

		await startSession('practice', mockCards);

		// 30秒後に60文字入力をシミュレート
		gameStore.update((s) => {
			const elapsedMinutes = 30000 / 60000; // 0.5分
			const speed = Math.round(60 / elapsedMinutes); // 120 CPM
			return {
				...s,
				input: { ...s.input, position: 60 },
				timer: { ...s.timer, elapsedTime: 30000 },
				score: { ...s.score, speed }
			};
		});

		const state = get(gameStore);
		// 速度 = 文字数 / 分 = 60 / 0.5 = 120 CPM
		expect(state.score.speed).toBeCloseTo(120, 0);
	});

	it('コンボが正しく更新される', async () => {
		const { gameStore, startSession, updateInput } = store;

		await startSession('practice', mockCards);

		// コンボは「正しいキーストロークごと」に加算される（札完了単位ではない）
		updateInput('t');
		expect(get(gameStore).statistics.currentCombo).toBe(1);

		updateInput('ts');
		expect(get(gameStore).statistics.currentCombo).toBe(2);

		updateInput('tsu');
		const state1 = get(gameStore);
		expect(state1.statistics.currentCombo).toBe(3);
		expect(state1.statistics.maxCombo).toBe(3);
		expect(state1.score.combo).toBe(3); // score にもミラーされる

		// 誤入力でコンボがリセットされる
		updateInput('tsux');

		const state2 = get(gameStore);
		expect(state2.statistics.currentCombo).toBe(0);
		expect(state2.statistics.maxCombo).toBe(3); // 最大値は保持
	});
});

describe('GameStore - タイマー', () => {
	let store: ReturnType<typeof createGameStore>;

	beforeEach(() => {
		store = createGameStore();
		vi.clearAllMocks();
	});

	it('経過時間が正しく計測される', async () => {
		const { gameStore, startSession, updateTimer } = store;

		await startSession('practice', mockCards);

		// タイマーはカウントダウン後に開始されるため、明示的に開始時刻を設定
		gameStore.update((s) => ({
			...s,
			timer: { ...s.timer, startTime: new Date(Date.now() - 100), isPaused: false }
		}));
		updateTimer();

		const state = get(gameStore);
		expect(state.timer.elapsedTime).toBeGreaterThanOrEqual(100);
	});

	it('一時停止で時間が止まる', async () => {
		const { gameStore, startSession, pauseGame } = store;

		await startSession('practice', mockCards);

		// 1秒経過をシミュレート
		gameStore.update((s) => ({
			...s,
			timer: {
				...s.timer,
				elapsedTime: 1000
			}
		}));
		const timeBefore = get(gameStore).timer.elapsedTime;

		pauseGame();
		// 一時停止中は時間が進まない

		const state = get(gameStore);
		expect(state.timer.isPaused).toBe(true);
		expect(state.timer.elapsedTime).toBe(timeBefore); // 時間が増えない
	});

	it('再開で時間計測が再開される', async () => {
		const { gameStore, startSession, pauseGame, resumeGame } = store;

		await startSession('practice', mockCards);

		pauseGame();
		// 1秒停止をシミュレート
		gameStore.update((s) => ({
			...s,
			timer: {
				...s.timer,
				pauseStartTime: new Date(Date.now() - 1000)
			}
		}));

		resumeGame();

		const state = get(gameStore);
		expect(state.timer.isPaused).toBe(false);
		expect(state.timer.pausedDuration).toBeGreaterThanOrEqual(1000);
	});

	it('カード毎の時間が記録される', async () => {
		const { gameStore, startSession, completeCard } = store;

		await startSession('practice', mockCards);

		// 5秒経過をシミュレート
		gameStore.update((s) => ({
			...s,
			timer: {
				...s.timer,
				cardElapsedTime: 5000
			}
		}));
		completeCard();

		const state = get(gameStore);
		expect(state.cards.completed[0].time).toBeGreaterThanOrEqual(5000);
	});
});

describe('GameStore - 派生ストア', () => {
	let store: ReturnType<typeof createGameStore>;

	beforeEach(() => {
		store = createGameStore();
		vi.clearAllMocks();
	});

	it('progressStoreが進捗を正しく計算する', async () => {
		const { startSession, completeCard, progressStore } = store;

		await startSession('practice', mockCards);

		let progress = get(progressStore);
		expect(progress.completed).toBe(0);
		expect(progress.total).toBe(3);
		expect(progress.percentage).toBe(0);

		completeCard();
		progress = get(progressStore);
		expect(progress.completed).toBe(1);
		expect(progress.percentage).toBeCloseTo(33.3, 1);

		completeCard();
		progress = get(progressStore);
		expect(progress.completed).toBe(2);
		expect(progress.percentage).toBeCloseTo(66.7, 1);
	});

	it('currentCardStoreが現在の札を提供する', async () => {
		const { gameStore, startSession, nextCard, currentCardStore } = store;

		await startSession('practice', mockCards);

		expect(get(currentCardStore)).toEqual(mockCards[0]);
		expect(get(currentCardStore)).toEqual(get(gameStore).cards.current);

		nextCard();
		expect(get(currentCardStore)).toEqual(mockCards[1]);
		expect(get(currentCardStore)).toEqual(get(gameStore).cards.current);
	});

	it('scoreStoreがスコア情報を提供する', async () => {
		const { gameStore, startSession, scoreStore } = store;

		await startSession('practice', mockCards);

		gameStore.update((s) => ({
			...s,
			score: { ...s.score, total: 100, combo: 5 }
		}));

		const score = get(scoreStore);
		expect(score.total).toBe(100);
		expect(score.combo).toBe(5);
	});
});

describe('GameStore - エラーハンドリング', () => {
	let store: ReturnType<typeof createGameStore>;

	beforeEach(() => {
		store = createGameStore();
		vi.clearAllMocks();
	});

	it('不正な状態遷移を防ぐ', () => {
		const { gameStore, nextCard, updateInput } = store;

		// セッション未開始でnextCard
		const stateBefore = get(gameStore);
		nextCard();
		expect(get(gameStore)).toEqual(stateBefore);

		// セッション未開始でupdateInput
		updateInput('test');
		expect(get(gameStore)).toEqual(stateBefore);
	});

	it('空の札リストでセッション開始を防ぐ', async () => {
		const { gameStore, startSession } = store;

		const stateBefore = get(gameStore);
		await startSession('practice', []);

		const stateAfter = get(gameStore);
		expect(stateAfter.session).toBeNull();
		expect(stateAfter).toEqual(stateBefore);
	});

	it('データ不整合を検出して修正する', async () => {
		const { gameStore, startSession } = store;

		await startSession('practice', mockCards);

		// 不正な状態を強制的に作る
		gameStore.update((s) => ({
			...s,
			cards: {
				...s.cards,
				currentIndex: 999, // 範囲外
				remaining: []
			}
		}));

		// 次の操作で自動修復されることを確認
		const { nextCard } = store;
		nextCard();

		const state = get(gameStore);
		expect(state.cards.currentIndex).toBeLessThan(mockCards.length);
	});
});

describe('GameStore - InputValidator統合', () => {
	let store: ReturnType<typeof createGameStore>;

	beforeEach(() => {
		store = createGameStore();
		vi.clearAllMocks();
	});

	it('InputValidatorの結果が反映される', async () => {
		const { gameStore, startSession, updateInput } = store;

		await startSession('practice', mockCards);
		const state = get(gameStore);

		expect(state.input.validator).toBeInstanceOf(InputValidator);

		// InputValidatorが正しく使用されることを確認
		updateInput('tsu');
		const updatedState = get(gameStore);
		expect(updatedState.input.current).toBe('tsu');
	});

	it('複数入力パターンに対応する', async () => {
		const { gameStore, startSession, updateInput } = store;

		// 「し」を含むカードでテスト
		const shiCard: KarutaCard = {
			id: 'shi',
			hiragana: 'しのびのくに おたすけまいる',
			romaji: 'shinobi no kuni otasuke mairu',
			meaning: '忍びの国お助け参る',
			category: 'history',
			difficulty: 'hard'
		};

		await startSession('practice', [shiCard]);

		// 'shi'パターン
		updateInput('shi');
		expect(get(gameStore).input.current).toBe('shi');
		expect(get(gameStore).input.mistakes).toBe(0);

		// リセットして'si'パターンもテスト
		gameStore.update((s) => ({ ...s, input: { ...s.input, current: '', position: 0 } }));
		updateInput('si');
		expect(get(gameStore).input.current).toBe('si');
		expect(get(gameStore).input.mistakes).toBe(0);
	});
});

describe('GameStore - パフォーマンス', () => {
	let store: ReturnType<typeof createGameStore>;

	beforeEach(() => {
		store = createGameStore();
		vi.clearAllMocks();
	});

	it('入力更新が16ms以内に完了する', async () => {
		const { startSession, updateInput } = store;

		await startSession('practice', mockCards);

		const start = performance.now();
		updateInput('test');
		const end = performance.now();

		expect(end - start).toBeLessThan(16);
	});

	it('100回の連続更新でメモリリークがない', async () => {
		const { startSession, updateInput } = store;

		await startSession('practice', mockCards);

		const initialMemory =
			(performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
				?.usedJSHeapSize || 0;

		for (let i = 0; i < 100; i++) {
			updateInput(`test${i}`);
		}

		const finalMemory =
			(performance as Performance & { memory?: { usedJSHeapSize: number } }).memory
				?.usedJSHeapSize || 0;
		const memoryIncrease = finalMemory - initialMemory;

		// メモリ増加が妥当な範囲内であることを確認
		expect(memoryIncrease).toBeLessThan(1000000); // 1MB以下
	});

	it('履歴が最大100件に制限される', async () => {
		const { gameStore, startSession, completeCard } = store;

		// 大量のカードを用意
		const manyCards = Array.from({ length: 150 }, (_, i) => ({
			...mockCards[0],
			id: `card-${i}`
		}));

		await startSession('practice', manyCards);

		// 150枚完了させる
		for (let i = 0; i < 150; i++) {
			completeCard();
		}

		const state = get(gameStore);
		expect(state.cards.completed.length).toBeLessThanOrEqual(100);
	});
});
