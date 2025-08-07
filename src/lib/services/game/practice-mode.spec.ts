/**
 * 練習モードサービスのテスト
 * TASK-301: TDD Step 3 - テスト実装 (Red)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PracticeModeService } from './practice-mode';
import { LocalStorageService } from '$lib/services/storage/local-storage';
import { getKarutaCards } from '$lib/data/karuta-cards';
import type { KarutaCard } from '$lib/types';

// モック
vi.mock('$lib/services/storage/local-storage');
vi.mock('$lib/data/karuta-cards');

describe('練習モード - 初期化', () => {
	let service: PracticeModeService;
	let mockStorage: LocalStorageService;

	beforeEach(() => {
		mockStorage = new LocalStorageService();
		vi.mocked(getKarutaCards).mockReturnValue([
			{ id: 'a', hiragana: 'あさまのいぶき かぜもさわやかに', kanji: '浅間の息吹 風も爽やかに' },
			{ id: 'i', hiragana: 'いそべのはまの あきのすなやま', kanji: '磯部の浜の 秋の砂山' },
			{ id: 'u', hiragana: 'うすいとうげの もみじのまつり', kanji: '碓氷峠の 紅葉の祭り' }
		] as KarutaCard[]);

		service = new PracticeModeService(mockStorage);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it('練習モードとして初期化される', () => {
		service.initialize();
		expect(service.getMode()).toBe('practice');
	});

	it('44枚の札が正しい順序で読み込まれる', () => {
		service.initialize();
		const cards = service.getCards();

		expect(cards).toHaveLength(3); // モックデータは3枚
		expect(cards[0].id).toBe('a');
		expect(cards[1].id).toBe('i');
		expect(cards[2].id).toBe('u');
	});

	it('初期状態が正しく設定される', () => {
		service.initialize();
		const state = service.getState();

		expect(state.currentCardIndex).toBe(0);
		expect(state.completedCards).toEqual([]);
		expect(state.statistics.totalKeystrokes).toBe(0);
		expect(state.statistics.correctKeystrokes).toBe(0);
		expect(state.statistics.mistakes).toBe(0);
	});
});

describe('練習モード - 出題ロジック', () => {
	let service: PracticeModeService;
	let mockStorage: LocalStorageService;
	const mockCards = [
		{ id: 'a', hiragana: 'あさまのいぶき かぜもさわやかに', kanji: '浅間の息吹 風も爽やかに' },
		{ id: 'i', hiragana: 'いそべのはまの あきのすなやま', kanji: '磯部の浜の 秋の砂山' },
		{ id: 'u', hiragana: 'うすいとうげの もみじのまつり', kanji: '碓氷峠の 紅葉の祭り' }
	] as KarutaCard[];

	beforeEach(() => {
		mockStorage = new LocalStorageService();
		vi.mocked(getKarutaCards).mockReturnValue(mockCards);
		service = new PracticeModeService(mockStorage);
		service.initialize();
	});

	it('札が順番に出題される', () => {
		expect(service.getCurrentCard()).toEqual(mockCards[0]);

		service.moveToNextCard();
		expect(service.getCurrentCard()).toEqual(mockCards[1]);

		service.moveToNextCard();
		expect(service.getCurrentCard()).toEqual(mockCards[2]);
	});

	it('進捗が正しく計算される', () => {
		expect(service.getProgress()).toBe('1/3');

		service.moveToNextCard();
		expect(service.getProgress()).toBe('2/3');

		service.moveToNextCard();
		expect(service.getProgress()).toBe('3/3');
	});

	it('最後の札の後はnullを返す', () => {
		service.moveToNextCard(); // 2枚目
		service.moveToNextCard(); // 3枚目
		service.moveToNextCard(); // 終了

		expect(service.getCurrentCard()).toBeNull();
		expect(service.isComplete()).toBe(true);
	});
});

describe('練習モード - 入力処理', () => {
	let service: PracticeModeService;
	let mockStorage: LocalStorageService;

	beforeEach(() => {
		mockStorage = new LocalStorageService();
		vi.mocked(getKarutaCards).mockReturnValue([
			{ id: 'a', hiragana: 'あさまのいぶき かぜもさわやかに', kanji: '浅間の息吹 風も爽やかに' }
		] as KarutaCard[]);
		service = new PracticeModeService(mockStorage);
		service.initialize();
	});

	it('正解入力で次の札に進む', () => {
		const result = service.processInput('あさまのいぶきかぜもさわやかに');

		expect(result.isCorrect).toBe(true);
		expect(result.isComplete).toBe(true);
		expect(service.getState().completedCards).toContain('a');
	});

	it('部分入力が正しく判定される', () => {
		const result = service.processInput('あさまの');

		expect(result.isCorrect).toBe(true);
		expect(result.isComplete).toBe(false);
	});

	it('間違った入力が検出される', () => {
		const result = service.processInput('あさまのやま');

		expect(result.isCorrect).toBe(false);
		expect(service.getState().statistics.mistakes).toBe(1);
	});

	it('スキップ機能が動作する', () => {
		const initialIndex = service.getState().currentCardIndex;
		service.skipCard();

		expect(service.getState().currentCardIndex).toBe(initialIndex + 1);
		expect(service.getState().completedCards).not.toContain('a');
	});
});

describe('練習モード - セッション管理', () => {
	let service: PracticeModeService;
	let mockStorage: LocalStorageService;

	beforeEach(() => {
		vi.useFakeTimers();
		mockStorage = new LocalStorageService();
		vi.mocked(getKarutaCards).mockReturnValue([
			{ id: 'a', hiragana: 'あさまのいぶき かぜもさわやかに', kanji: '浅間の息吹 風も爽やかに' },
			{ id: 'i', hiragana: 'いそべのはまの あきのすなやま', kanji: '磯部の浜の 秋の砂山' }
		] as KarutaCard[]);
		service = new PracticeModeService(mockStorage);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('5秒ごとに自動保存される', () => {
		service.initialize();
		service.startAutoSave();

		const saveSpy = vi.spyOn(mockStorage, 'saveSession');

		vi.advanceTimersByTime(5000);
		expect(saveSpy).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(5000);
		expect(saveSpy).toHaveBeenCalledTimes(2);
	});

	it('セッションデータが正しい形式で保存される', () => {
		service.initialize();
		service.processInput('あさまのいぶきかぜもさわやかに');

		const saveSpy = vi.spyOn(mockStorage, 'saveSession');
		service.saveSession();

		expect(saveSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				mode: 'practice',
				currentCardIndex: 1,
				completedCards: ['a'],
				startTime: expect.any(String),
				totalElapsedTime: expect.any(Number),
				statistics: expect.objectContaining({
					totalKeystrokes: expect.any(Number),
					correctKeystrokes: expect.any(Number),
					mistakes: 0,
					wpm: expect.any(Number),
					accuracy: expect.any(Number)
				})
			})
		);
	});

	it('セッションから復元できる', () => {
		const mockSession = {
			mode: 'practice' as const,
			currentCardIndex: 1,
			completedCards: ['a'],
			startTime: '2024-01-01T10:00:00Z',
			totalElapsedTime: 60000,
			statistics: {
				totalKeystrokes: 30,
				correctKeystrokes: 29,
				mistakes: 1,
				wpm: 75,
				accuracy: 96.7
			}
		};

		vi.mocked(mockStorage.loadSession).mockReturnValue(mockSession);

		service.resumeFromSession();
		const state = service.getState();

		expect(state.currentCardIndex).toBe(1);
		expect(state.completedCards).toEqual(['a']);
		expect(state.statistics).toEqual(mockSession.statistics);
	});

	it('ゲーム完了時にセッションがクリアされる', () => {
		service.initialize();
		vi.mocked(getKarutaCards).mockReturnValue([
			{ id: 'a', hiragana: 'あさまのいぶき かぜもさわやかに', kanji: '浅間の息吹 風も爽やかに' }
		] as KarutaCard[]);

		const clearSpy = vi.spyOn(mockStorage, 'clearSession');

		service.processInput('あさまのいぶきかぜもさわやかに');
		service.completeGame();

		expect(clearSpy).toHaveBeenCalled();
	});
});

describe('練習モード - 統計記録', () => {
	let service: PracticeModeService;
	let mockStorage: LocalStorageService;

	beforeEach(() => {
		vi.useFakeTimers();
		mockStorage = new LocalStorageService();
		vi.mocked(getKarutaCards).mockReturnValue([
			{ id: 'a', hiragana: 'あさまのいぶき かぜもさわやかに', kanji: '浅間の息吹 風も爽やかに' }
		] as KarutaCard[]);
		service = new PracticeModeService(mockStorage);
		service.initialize();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('キーストロークが正しくカウントされる', () => {
		service.processInput('あさま');
		const stats = service.getState().statistics;

		expect(stats.totalKeystrokes).toBe(3);
		expect(stats.correctKeystrokes).toBe(3);
	});

	it('正確率が正しく計算される', () => {
		service.processInput('あさま'); // 正解
		service.processInput('あさまのやま'); // 間違い

		const stats = service.getState().statistics;
		expect(stats.accuracy).toBeCloseTo(75.0, 1); // 3/4 = 75%
	});

	it('WPMが計算される', () => {
		vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));
		service.startTimer();

		vi.advanceTimersByTime(60000); // 1分経過
		service.processInput('あさまのいぶきかぜもさわやかに'); // 15文字

		const stats = service.getState().statistics;
		expect(stats.wpm).toBeGreaterThan(0);
	});

	it('札ごとの統計が記録される', () => {
		const recordSpy = vi.fn();
		service.onCardComplete = recordSpy;

		service.processInput('あさまのいぶきかぜもさわやかに');

		expect(recordSpy).toHaveBeenCalledWith({
			cardId: 'a',
			attempts: 1,
			time: expect.any(Number),
			mistakes: 0,
			accuracy: 100
		});
	});
});

describe('練習モード - 一時停止', () => {
	let service: PracticeModeService;
	let mockStorage: LocalStorageService;

	beforeEach(() => {
		vi.useFakeTimers();
		mockStorage = new LocalStorageService();
		service = new PracticeModeService(mockStorage);
		service.initialize();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('一時停止でタイマーが止まる', () => {
		service.startTimer();
		vi.advanceTimersByTime(5000);

		service.pause();
		const timeAtPause = service.getElapsedTime();

		vi.advanceTimersByTime(5000);
		expect(service.getElapsedTime()).toBe(timeAtPause);
	});

	it('再開でタイマーが再スタートする', () => {
		service.startTimer();
		vi.advanceTimersByTime(5000);
		service.pause();

		vi.advanceTimersByTime(3000);
		service.resume();

		vi.advanceTimersByTime(2000);
		expect(service.getElapsedTime()).toBeCloseTo(7000, -2); // 5秒 + 2秒
	});

	it('一時停止中は入力を受け付けない', () => {
		service.pause();
		const result = service.processInput('test');

		expect(result).toBeNull();
	});
});

describe('練習モード - 完了処理', () => {
	let service: PracticeModeService;
	let mockStorage: LocalStorageService;

	beforeEach(() => {
		mockStorage = new LocalStorageService();
		vi.mocked(getKarutaCards).mockReturnValue([
			{ id: 'a', hiragana: 'あさまのいぶき かぜもさわやかに', kanji: '浅間の息吹 風も爽やかに' }
		] as KarutaCard[]);
		service = new PracticeModeService(mockStorage);
		service.initialize();
	});

	it('全札完了で完了状態になる', () => {
		service.processInput('あさまのいぶきかぜもさわやかに');

		expect(service.isComplete()).toBe(true);
	});

	it('完了時に結果サマリーが取得できる', () => {
		service.processInput('あさまのいぶきかぜもさわやかに');
		const summary = service.getCompletionSummary();

		expect(summary).toEqual({
			totalCards: 1,
			completedCards: 1,
			skippedCards: 0,
			totalTime: expect.any(Number),
			averageWpm: expect.any(Number),
			overallAccuracy: expect.any(Number),
			difficultCards: expect.any(Array)
		});
	});

	it('完了後に結果が保存される', async () => {
		const saveSpy = vi.fn().mockResolvedValue(undefined);
		service.saveResults = saveSpy;

		service.processInput('あさまのいぶきかぜもさわやかに');
		await service.completeGame();

		expect(saveSpy).toHaveBeenCalled();
	});
});

describe('練習モード - エラーハンドリング', () => {
	let service: PracticeModeService;
	let mockStorage: LocalStorageService;

	beforeEach(() => {
		mockStorage = new LocalStorageService();
		service = new PracticeModeService(mockStorage);
	});

	it('札データ読み込みエラー時にフォールバックデータを使用', () => {
		vi.mocked(getKarutaCards).mockImplementation(() => {
			throw new Error('Failed to load cards');
		});

		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		service.initialize();

		expect(service.getCards()).toHaveLength(44); // フォールバックデータ
		consoleSpy.mockRestore();
	});

	it('セッション保存エラー時もゲーム続行可能', () => {
		vi.mocked(mockStorage.saveSession).mockImplementation(() => {
			throw new Error('Storage full');
		});

		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		service.initialize();
		service.saveSession();

		// エラーが発生してもクラッシュしない
		expect(service.getState()).toBeDefined();
		consoleSpy.mockRestore();
	});

	it('破損したセッションデータで新規開始', () => {
		vi.mocked(mockStorage.loadSession).mockReturnValue({
			mode: 'invalid' as any,
			currentCardIndex: 'not-a-number' as any
		} as any);

		service.resumeFromSession();
		const state = service.getState();

		// 新規セッションとして初期化
		expect(state.currentCardIndex).toBe(0);
		expect(state.completedCards).toEqual([]);
	});
});
