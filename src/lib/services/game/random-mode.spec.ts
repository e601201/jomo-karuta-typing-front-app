import { describe, it, expect, beforeEach } from 'vitest';
import { RandomModeService } from './random-mode';
import { karutaCards } from '$lib/data/karuta-cards';

describe('RandomModeService', () => {
	let service: RandomModeService;

	beforeEach(() => {
		service = new RandomModeService();
	});

	describe('シャッフル機能', () => {
		it('TC-001: 基本的なシャッフル動作 - 44枚すべてのカードが含まれる', () => {
			const shuffled = service.shuffleCards([...karutaCards]);

			expect(shuffled).toHaveLength(44);

			// すべてのカードが含まれることを確認
			karutaCards.forEach((card) => {
				expect(shuffled).toContainEqual(card);
			});
		});

		it('TC-002: シャッフルのランダム性 - 毎回異なる結果を生成', () => {
			const results: string[] = [];

			for (let i = 0; i < 10; i++) {
				const shuffled = service.shuffleCards([...karutaCards]);
				const signature = shuffled.map((c) => c.id).join(',');
				results.push(signature);
			}

			// 少なくとも2つ以上の異なる順序が生成されることを確認
			const uniqueResults = new Set(results);
			expect(uniqueResults.size).toBeGreaterThan(1);
		});

		it('TC-005: カード数の整合性 - シャッフル前後でカード数が一致', () => {
			const original = [...karutaCards];
			const shuffled = service.shuffleCards([...karutaCards]);

			expect(shuffled).toHaveLength(original.length);
			expect(shuffled).toHaveLength(44);
		});
	});

	describe('重複なし保証', () => {
		it('TC-004: 同一セッション内での重複チェック', async () => {
			await service.startSession([...karutaCards]);
			const usedCards = new Set<string>();

			for (let i = 0; i < 44; i++) {
				const card = service.getNextCard();
				expect(card).toBeDefined();

				if (card) {
					expect(usedCards.has(card.id)).toBe(false);
					usedCards.add(card.id);
				}
			}

			expect(usedCards.size).toBe(44);
		});
	});

	describe('セッション管理', () => {
		it('TC-006: セッション開始時のシャッフル', async () => {
			await service.startSession([...karutaCards]);
			service.getNextCard();

			// セッションを複数回実行して、異なる順序になることを確認
			const firstCards: string[] = [];
			for (let i = 0; i < 5; i++) {
				await service.startSession([...karutaCards]);
				const card = service.getNextCard();
				if (card) firstCards.push(card.id);
			}

			// 少なくとも2つ以上の異なる最初のカードが出ることを確認
			const uniqueFirstCards = new Set(firstCards);
			expect(uniqueFirstCards.size).toBeGreaterThan(1);
		});

		it('TC-007: セッション途中終了と再開', async () => {
			await service.startSession([...karutaCards]);

			// 10枚まで進行
			const firstTenCards: KarutaCard[] = [];
			for (let i = 0; i < 10; i++) {
				const card = service.getNextCard();
				if (card) firstTenCards.push(card);
			}

			// セッション状態を保存
			const sessionState = service.getSessionState();

			// 新規インスタンスで復元
			const newService = new RandomModeService();
			newService.restoreSession(sessionState);

			// 残り34枚を取得
			const remainingCards: KarutaCard[] = [];
			for (let i = 0; i < 34; i++) {
				const card = newService.getNextCard();
				if (card) remainingCards.push(card);
			}

			// 合計44枚で重複なし
			const allCards = [...firstTenCards, ...remainingCards];
			expect(allCards).toHaveLength(44);

			const uniqueIds = new Set(allCards.map((c) => c.id));
			expect(uniqueIds.size).toBe(44);
		});

		it('TC-008: セッション完了の検出', async () => {
			await service.startSession([...karutaCards]);

			// 43枚まで進行
			for (let i = 0; i < 43; i++) {
				service.getNextCard();
				expect(service.isSessionComplete()).toBe(false);
			}

			// 44枚目
			service.getNextCard();
			expect(service.isSessionComplete()).toBe(true);

			// 45枚目の取得試行
			const extraCard = service.getNextCard();
			expect(extraCard).toBeNull();
		});
	});

	describe('エッジケース', () => {
		it('TC-009: 空のカードデックでの初期化', () => {
			const shuffled = service.shuffleCards([]);
			expect(shuffled).toEqual([]);
			expect(() => service.shuffleCards([])).not.toThrow();
		});

		it('TC-010: 1枚のカードでのシャッフル', () => {
			const singleCard = [karutaCards[0]];
			const shuffled = service.shuffleCards([...singleCard]);

			expect(shuffled).toHaveLength(1);
			expect(shuffled[0]).toEqual(singleCard[0]);
			expect(() => service.shuffleCards([...singleCard])).not.toThrow();
		});
	});

	describe('パフォーマンス', () => {
		it('TC-011: シャッフル処理時間が100ms以内', () => {
			const startTime = performance.now();
			service.shuffleCards([...karutaCards]);
			const endTime = performance.now();

			const elapsedTime = endTime - startTime;
			expect(elapsedTime).toBeLessThan(100);
		});
	});

	describe('統計的テスト', () => {
		it('TC-003: 分布の均等性（簡易版）', () => {
			// 特定の位置（最初）に各カードが出現する回数をカウント
			const firstPositionCount = new Map<string, number>();
			const iterations = 100;

			for (let i = 0; i < iterations; i++) {
				const shuffled = service.shuffleCards([...karutaCards]);
				const firstCard = shuffled[0];
				const count = firstPositionCount.get(firstCard.id) || 0;
				firstPositionCount.set(firstCard.id, count + 1);
			}

			// 各カードが少なくとも1回は最初の位置に出現することを確認
			// （100回の試行で44枚のカードなので、平均2.27回）
			let atLeastOnce = 0;
			firstPositionCount.forEach((count) => {
				if (count > 0) atLeastOnce++;
			});

			// 少なくとも20枚以上のカードが最初の位置に出現することを期待
			expect(atLeastOnce).toBeGreaterThan(20);
		});
	});
});
