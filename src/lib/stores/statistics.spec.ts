import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { statisticsStore } from './statistics';
import type { SessionStats, OverallStats, CardStats, FilterOptions } from '$lib/types/game';

// Mock IndexedDB service
vi.mock('$lib/services/storage/indexed-db', () => ({
	IndexedDBService: vi.fn().mockImplementation(() => ({
		getStatistics: vi.fn(),
		saveStatistics: vi.fn(),
		addSession: vi.fn(),
		updateCardStats: vi.fn()
	}))
}));

describe('Statistics Store', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		statisticsStore.reset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Overall Statistics', () => {
		it('TC-001: should calculate basic statistics from sessions', async () => {
			const sessions: SessionStats[] = [
				{
					id: '1',
					timestamp: new Date('2024-01-01'),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 50,
					accuracy: 90,
					score: 1000,
					mistakes: 5,
					partialInputUsed: false
				},
				{
					id: '2',
					timestamp: new Date('2024-01-02'),
					mode: 'random',
					duration: 120000,
					cardsCompleted: 20,
					wpm: 60,
					accuracy: 95,
					score: 2000,
					mistakes: 3,
					partialInputUsed: false
				}
			];

			await statisticsStore.loadStatistics();
			statisticsStore.setSessions(sessions);

			const stats = get(statisticsStore).overall;
			expect(stats.totalSessions).toBe(2);
			expect(stats.totalPlayTime).toBe(180000);
			expect(stats.totalCardsCompleted).toBe(30);
			expect(stats.averageWPM).toBe(55);
			expect(stats.averageAccuracy).toBe(92.5);
		});

		it('TC-002: should handle empty data gracefully', () => {
			const stats = get(statisticsStore).overall;
			expect(stats.totalSessions).toBe(0);
			expect(stats.totalPlayTime).toBe(0);
			expect(stats.averageWPM).toBe(0);
			expect(stats.averageAccuracy).toBe(0);
		});

		it('TC-003: should calculate performance statistics correctly', async () => {
			const sessions: SessionStats[] = [
				{
					id: '1',
					timestamp: new Date(),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 50,
					accuracy: 90,
					score: 1000,
					mistakes: 5,
					partialInputUsed: false
				},
				{
					id: '2',
					timestamp: new Date(),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 60,
					accuracy: 95,
					score: 1500,
					mistakes: 3,
					partialInputUsed: false
				},
				{
					id: '3',
					timestamp: new Date(),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 70,
					accuracy: 100,
					score: 2000,
					mistakes: 0,
					partialInputUsed: false
				}
			];

			statisticsStore.setSessions(sessions);
			const stats = get(statisticsStore).overall;

			expect(stats.averageWPM).toBe(60);
			expect(stats.maxWPM).toBe(70);
			expect(stats.averageAccuracy).toBe(95);
			expect(stats.maxAccuracy).toBe(100);
		});

		it('TC-004: should calculate streak correctly', async () => {
			const sessions: SessionStats[] = [
				{
					id: '1',
					timestamp: new Date('2024-01-01'),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 50,
					accuracy: 90,
					score: 1000,
					mistakes: 5,
					partialInputUsed: false
				},
				{
					id: '2',
					timestamp: new Date('2024-01-02'),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 50,
					accuracy: 90,
					score: 1000,
					mistakes: 5,
					partialInputUsed: false
				},
				{
					id: '3',
					timestamp: new Date('2024-01-03'),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 50,
					accuracy: 90,
					score: 1000,
					mistakes: 5,
					partialInputUsed: false
				},
				// Gap
				{
					id: '4',
					timestamp: new Date('2024-01-05'),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 50,
					accuracy: 90,
					score: 1000,
					mistakes: 5,
					partialInputUsed: false
				},
				{
					id: '5',
					timestamp: new Date('2024-01-06'),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 50,
					accuracy: 90,
					score: 1000,
					mistakes: 5,
					partialInputUsed: false
				}
			];

			statisticsStore.setSessions(sessions);
			const stats = get(statisticsStore).overall;

			expect(stats.currentStreak).toBe(2);
			expect(stats.longestStreak).toBe(3);
		});
	});

	describe('Session Management', () => {
		it('TC-025: should save session to storage', async () => {
			const session: SessionStats = {
				id: 'test-1',
				timestamp: new Date(),
				mode: 'practice',
				duration: 60000,
				cardsCompleted: 10,
				wpm: 55,
				accuracy: 92,
				score: 1200,
				mistakes: 4,
				partialInputUsed: false
			};

			await statisticsStore.saveSession(session);
			const sessions = get(statisticsStore).sessions;
			expect(sessions).toContainEqual(session);
		});

		it('TC-026: should load statistics from storage', async () => {
			const mockStats = {
				overall: {
					totalSessions: 5,
					totalPlayTime: 300000,
					totalKeysTyped: 500,
					totalCardsCompleted: 50,
					averageWPM: 55,
					maxWPM: 70,
					averageAccuracy: 93,
					maxAccuracy: 100,
					currentStreak: 2,
					longestStreak: 5,
					totalScore: 5000,
					level: 3,
					rank: '中級'
				},
				sessions: [],
				cardStats: new Map()
			};

			const { IndexedDBService } = await import('$lib/services/storage/indexed-db');
			const mockInstance = new IndexedDBService();
			vi.mocked(mockInstance.getStatistics).mockResolvedValue(mockStats);

			await statisticsStore.loadStatistics();
			const stats = get(statisticsStore).overall;
			expect(stats.totalSessions).toBe(5);
			expect(stats.totalPlayTime).toBe(300000);
		});
	});

	describe('Filtering', () => {
		beforeEach(() => {
			const sessions: SessionStats[] = [
				{
					id: '1',
					timestamp: new Date('2024-01-01'),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 50,
					accuracy: 90,
					score: 1000,
					mistakes: 5,
					partialInputUsed: false
				},
				{
					id: '2',
					timestamp: new Date('2024-01-02'),
					mode: 'random',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 60,
					accuracy: 95,
					score: 1500,
					mistakes: 3,
					partialInputUsed: false
				},
				{
					id: '3',
					timestamp: new Date(),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 70,
					accuracy: 100,
					score: 2000,
					mistakes: 0,
					partialInputUsed: false
				}
			];
			statisticsStore.setSessions(sessions);
		});

		it('TC-013: should filter by today', async () => {
			const filters: FilterOptions = { period: 'today' };
			const filtered = await statisticsStore.getFilteredStats(filters);
			expect(filtered.sessions.length).toBe(1);
			expect(filtered.sessions[0].id).toBe('3');
		});

		it('TC-015: should filter by mode', async () => {
			const filters: FilterOptions = { mode: 'practice' };
			const filtered = await statisticsStore.getFilteredStats(filters);
			expect(filtered.sessions.length).toBe(2);
			expect(filtered.sessions.every((s) => s.mode === 'practice')).toBe(true);
		});

		it('TC-016: should apply multiple filters', async () => {
			const filters: FilterOptions = { period: 'all', mode: 'random' };
			const filtered = await statisticsStore.getFilteredStats(filters);
			expect(filtered.sessions.length).toBe(1);
			expect(filtered.sessions[0].mode).toBe('random');
		});
	});

	describe('Card Statistics', () => {
		it('TC-022: should track card statistics', async () => {
			const cardId = 'tsu';
			await statisticsStore.updateCardStats(cardId, {
				time: 5000,
				accuracy: 95
			});

			const cardStats = get(statisticsStore).cardStats.get(cardId);
			expect(cardStats).toBeDefined();
			expect(cardStats?.timesPlayed).toBe(1);
			expect(cardStats?.bestTime).toBe(5000);
			expect(cardStats?.averageTime).toBe(5000);
			expect(cardStats?.accuracy).toBe(95);
		});

		it('TC-023: should handle unplayed cards', () => {
			const cardStats = get(statisticsStore).cardStats.get('unknown');
			expect(cardStats).toBeUndefined();
		});

		it('TC-024: should update best time for card', async () => {
			const cardId = 'ne';

			// First play
			await statisticsStore.updateCardStats(cardId, {
				time: 6000,
				accuracy: 90
			});

			// Better time
			await statisticsStore.updateCardStats(cardId, {
				time: 4000,
				accuracy: 95
			});

			const cardStats = get(statisticsStore).cardStats.get(cardId);
			expect(cardStats?.bestTime).toBe(4000);
			expect(cardStats?.timesPlayed).toBe(2);
			expect(cardStats?.averageTime).toBe(5000);
		});
	});

	describe('Data Export/Import', () => {
		it('TC-027: should export data as JSON', async () => {
			const sessions: SessionStats[] = [
				{
					id: '1',
					timestamp: new Date('2024-01-01'),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 50,
					accuracy: 90,
					score: 1000,
					mistakes: 5,
					partialInputUsed: false
				}
			];
			statisticsStore.setSessions(sessions);

			const json = await statisticsStore.exportData('json');
			const parsed = JSON.parse(json);

			expect(parsed.overall).toBeDefined();
			expect(parsed.sessions).toHaveLength(1);
			expect(parsed.version).toBeDefined();
		});

		it('TC-028: should export data as CSV', async () => {
			const sessions: SessionStats[] = [
				{
					id: '1',
					timestamp: new Date('2024-01-01'),
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 50,
					accuracy: 90,
					score: 1000,
					mistakes: 5,
					partialInputUsed: false
				}
			];
			statisticsStore.setSessions(sessions);

			const csv = await statisticsStore.exportData('csv');
			expect(csv).toContain(
				'id,timestamp,mode,duration,cardsCompleted,wpm,accuracy,score,mistakes'
			);
			expect(csv).toContain('1,');
			expect(csv).toContain('practice');
		});

		it('TC-029: should import JSON data', async () => {
			const exportData = {
				version: '1.0.0',
				overall: {
					totalSessions: 3,
					totalPlayTime: 180000,
					totalKeysTyped: 300,
					totalCardsCompleted: 30,
					averageWPM: 55,
					maxWPM: 65,
					averageAccuracy: 92,
					maxAccuracy: 98,
					currentStreak: 1,
					longestStreak: 3,
					totalScore: 3000,
					level: 2,
					rank: '初級'
				},
				sessions: [
					{
						id: '1',
						timestamp: '2024-01-01',
						mode: 'practice',
						duration: 60000,
						cardsCompleted: 10,
						wpm: 50,
						accuracy: 90,
						score: 1000,
						mistakes: 5,
						partialInputUsed: false
					}
				],
				cardStats: []
			};

			await statisticsStore.importData(JSON.stringify(exportData), 'json');
			const stats = get(statisticsStore).overall;
			expect(stats.totalSessions).toBe(3);
			expect(stats.totalPlayTime).toBe(180000);
		});
	});

	describe('Level and Rank System', () => {
		it('TC-030: should calculate level from score', () => {
			const levels = [
				{ score: 0, expectedLevel: 1 },
				{ score: 1000, expectedLevel: 1 },
				{ score: 5000, expectedLevel: 2 },
				{ score: 10000, expectedLevel: 3 },
				{ score: 20000, expectedLevel: 4 },
				{ score: 50000, expectedLevel: 5 }
			];

			levels.forEach(({ score, expectedLevel }) => {
				const level = statisticsStore.calculateLevel(score);
				expect(level).toBe(expectedLevel);
			});
		});

		it('TC-031: should determine rank from stats', () => {
			const testCases = [
				{ wpm: 30, accuracy: 80, expectedRank: '初心者' },
				{ wpm: 50, accuracy: 90, expectedRank: '中級' },
				{ wpm: 70, accuracy: 95, expectedRank: '上級' },
				{ wpm: 90, accuracy: 98, expectedRank: 'エキスパート' }
			];

			testCases.forEach(({ wpm, accuracy, expectedRank }) => {
				const rank = statisticsStore.calculateRank(wpm, accuracy);
				expect(rank).toBe(expectedRank);
			});
		});

		it('TC-032: should calculate progress to next level', () => {
			const progress = statisticsStore.calculateLevelProgress(7500, 2);
			expect(progress.currentLevel).toBe(2);
			expect(progress.nextLevel).toBe(3);
			expect(progress.progress).toBe(50); // 2500/5000 = 50%
			expect(progress.pointsToNext).toBe(2500);
		});
	});

	describe('Trend Calculation', () => {
		it('should calculate weekly trends', () => {
			const sessions: SessionStats[] = [];
			const today = new Date();

			for (let i = 6; i >= 0; i--) {
				const date = new Date(today);
				date.setDate(date.getDate() - i);
				sessions.push({
					id: `session-${i}`,
					timestamp: date,
					mode: 'practice',
					duration: 60000,
					cardsCompleted: 10,
					wpm: 50 + i * 2,
					accuracy: 90 + i,
					score: 1000,
					mistakes: 5,
					partialInputUsed: false
				});
			}

			statisticsStore.setSessions(sessions);
			const trends = statisticsStore.calculateTrends('week');

			expect(trends.wpmTrend).toHaveLength(7);
			expect(trends.accuracyTrend).toHaveLength(7);
			expect(trends.playTimeTrend).toHaveLength(7);
			expect(trends.labels).toHaveLength(7);
			expect(trends.wpmTrend[6]).toBe(62); // Latest day
			expect(trends.accuracyTrend[6]).toBe(96); // Latest day
		});
	});
});
