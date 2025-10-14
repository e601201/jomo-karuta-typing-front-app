import { writable, derived, get } from 'svelte/store';
import type {
	OverallStats,
	SessionStats,
	CardStats,
	FilterOptions,
	TrendData,
	GameMode
} from '$lib/types/game';
import { IndexedDBService } from '$lib/services/storage/indexed-db';

interface StatisticsState {
	overall: OverallStats;
	sessions: SessionStats[];
	cardStats: Map<string, CardStats>;
	loading: boolean;
	error: string | null;
}

interface FilteredStats {
	sessions: SessionStats[];
	overall: OverallStats;
}

function createStatisticsStore() {
	const db = new IndexedDBService();
	const initialState: StatisticsState = {
		overall: {
			totalSessions: 0,
			totalPlayTime: 0,
			totalKeysTyped: 0,
			totalCardsCompleted: 0,
			averageWPM: 0,
			maxWPM: 0,
			averageAccuracy: 0,
			maxAccuracy: 0,
			currentStreak: 0,
			longestStreak: 0,
			totalScore: 0,
			level: 1,
			rank: '未設定'
		},
		sessions: [],
		cardStats: new Map(),
		loading: false,
		error: null
	};

	const { subscribe, set, update } = writable<StatisticsState>(initialState);

	// Calculate overall statistics from sessions
	function calculateOverallStats(sessions: SessionStats[]): OverallStats {
		if (sessions.length === 0) {
			return initialState.overall;
		}

		const totalSessions = sessions.length;
		const totalPlayTime = sessions.reduce((sum, s) => sum + s.duration, 0);
		const totalKeysTyped = sessions.reduce(
			(sum, s) => sum + Math.floor(((s.wpm * s.duration) / 60000) * 5),
			0
		);
		const totalCardsCompleted = sessions.reduce((sum, s) => sum + s.cardsCompleted, 0);
		const totalScore = sessions.reduce((sum, s) => sum + s.score, 0);

		const wpmValues = sessions.map((s) => s.wpm);
		const accuracyValues = sessions.map((s) => s.accuracy);

		const averageWPM = wpmValues.reduce((sum, v) => sum + v, 0) / totalSessions;
		const maxWPM = Math.max(...wpmValues);
		const averageAccuracy = accuracyValues.reduce((sum, v) => sum + v, 0) / totalSessions;
		const maxAccuracy = Math.max(...accuracyValues);

		// Calculate streaks
		const { currentStreak, longestStreak } = calculateStreaks(sessions);

		// Calculate level and rank
		const level = calculateLevel(totalScore);
		const rank = calculateRank(averageWPM, averageAccuracy);

		return {
			totalSessions,
			totalPlayTime,
			totalKeysTyped,
			totalCardsCompleted,
			averageWPM,
			maxWPM,
			averageAccuracy,
			maxAccuracy,
			currentStreak,
			longestStreak,
			totalScore,
			level,
			rank
		};
	}

	// Calculate play streaks
	function calculateStreaks(sessions: SessionStats[]): {
		currentStreak: number;
		longestStreak: number;
	} {
		if (sessions.length === 0) {
			return { currentStreak: 0, longestStreak: 0 };
		}

		// Sort sessions by date
		const sortedSessions = [...sessions].sort(
			(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
		);

		let currentStreak = 0;
		let longestStreak = 0;
		let tempStreak = 1;
		let lastDate = new Date(sortedSessions[0].timestamp);
		lastDate.setHours(0, 0, 0, 0);

		for (let i = 1; i < sortedSessions.length; i++) {
			const currentDate = new Date(sortedSessions[i].timestamp);
			currentDate.setHours(0, 0, 0, 0);

			const dayDiff = Math.floor(
				(currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
			);

			if (dayDiff === 1) {
				tempStreak++;
			} else if (dayDiff > 1) {
				longestStreak = Math.max(longestStreak, tempStreak);
				tempStreak = 1;
			}

			lastDate = currentDate;
		}

		longestStreak = Math.max(longestStreak, tempStreak);

		// Check if current streak is still active (last play was today or yesterday)
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const lastPlayDate = new Date(sortedSessions[sortedSessions.length - 1].timestamp);
		lastPlayDate.setHours(0, 0, 0, 0);

		const daysSinceLastPlay = Math.floor(
			(today.getTime() - lastPlayDate.getTime()) / (1000 * 60 * 60 * 24)
		);

		if (daysSinceLastPlay <= 1) {
			currentStreak = tempStreak;
		} else {
			currentStreak = 0;
		}

		return { currentStreak, longestStreak };
	}

	// Calculate level from score
	function calculateLevel(score: number): number {
		const levels = [
			{ threshold: 0, level: 1 },
			{ threshold: 5000, level: 2 },
			{ threshold: 10000, level: 3 },
			{ threshold: 20000, level: 4 },
			{ threshold: 50000, level: 5 },
			{ threshold: 100000, level: 6 },
			{ threshold: 200000, level: 7 },
			{ threshold: 500000, level: 8 },
			{ threshold: 1000000, level: 9 },
			{ threshold: 2000000, level: 10 }
		];

		for (let i = levels.length - 1; i >= 0; i--) {
			if (score >= levels[i].threshold) {
				return levels[i].level;
			}
		}
		return 1;
	}

	// Calculate rank from performance
	function calculateRank(wpm: number, accuracy: number): string {
		if (wpm >= 90 && accuracy >= 98) return 'エキスパート';
		if (wpm >= 70 && accuracy >= 95) return '上級';
		if (wpm >= 50 && accuracy >= 90) return '中級';
		if (wpm >= 30 && accuracy >= 80) return '初心者';
		return '未設定';
	}

	// Calculate level progress
	function calculateLevelProgress(
		score: number,
		currentLevel: number
	): {
		currentLevel: number;
		nextLevel: number;
		progress: number;
		pointsToNext: number;
	} {
		const levelThresholds = [
			0, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000
		];

		if (currentLevel >= levelThresholds.length) {
			return {
				currentLevel,
				nextLevel: currentLevel,
				progress: 100,
				pointsToNext: 0
			};
		}

		const currentThreshold = levelThresholds[currentLevel - 1] || 0;
		const nextThreshold = levelThresholds[currentLevel] || currentThreshold;
		const pointsInLevel = score - currentThreshold;
		const pointsNeeded = nextThreshold - currentThreshold;
		const progress = (pointsInLevel / pointsNeeded) * 100;
		const pointsToNext = nextThreshold - score;

		return {
			currentLevel,
			nextLevel: currentLevel + 1,
			progress: Math.min(100, Math.max(0, progress)),
			pointsToNext: Math.max(0, pointsToNext)
		};
	}

	// Calculate trends
	function calculateTrends(period: 'week' | 'month'): TrendData {
		const state = get({ subscribe });
		const sessions = state.sessions;
		const days = period === 'week' ? 7 : 30;
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const wpmTrend: number[] = [];
		const accuracyTrend: number[] = [];
		const playTimeTrend: number[] = [];
		const labels: string[] = [];

		for (let i = days - 1; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			date.setHours(0, 0, 0, 0);

			const nextDate = new Date(date);
			nextDate.setDate(nextDate.getDate() + 1);

			const daySessions = sessions.filter((s) => {
				const sessionDate = new Date(s.timestamp);
				return sessionDate >= date && sessionDate < nextDate;
			});

			if (daySessions.length > 0) {
				const avgWPM = daySessions.reduce((sum, s) => sum + s.wpm, 0) / daySessions.length;
				const avgAccuracy =
					daySessions.reduce((sum, s) => sum + s.accuracy, 0) / daySessions.length;
				const totalTime = daySessions.reduce((sum, s) => sum + s.duration, 0);

				wpmTrend.push(Math.round(avgWPM));
				accuracyTrend.push(Math.round(avgAccuracy));
				playTimeTrend.push(Math.round(totalTime / 60000)); // Convert to minutes
			} else {
				wpmTrend.push(0);
				accuracyTrend.push(0);
				playTimeTrend.push(0);
			}

			labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
		}

		return {
			wpmTrend,
			accuracyTrend,
			playTimeTrend,
			labels
		};
	}

	return {
		subscribe,

		// Reset store
		reset: () => set(initialState),

		// Set sessions data
		setSessions: (sessions: SessionStats[]) => {
			const overall = calculateOverallStats(sessions);
			update((state) => ({
				...state,
				sessions,
				overall
			}));
		},

		// Load statistics from storage
		loadStatistics: async () => {
			update((state) => ({ ...state, loading: true, error: null }));

			try {
				// TODO: Implement getStatistics in IndexedDBService
				const data = null as any; // await db.getStatistics();
				if (data) {
					const overall = calculateOverallStats(data.sessions || []);
					update((state) => ({
						...state,
						overall: data.overall || overall,
						sessions: data.sessions || [],
						cardStats: data.cardStats || new Map(),
						loading: false
					}));
				} else {
					update((state) => ({ ...state, loading: false }));
				}
			} catch (error) {
				update((state) => ({
					...state,
					loading: false,
					error: error instanceof Error ? error.message : 'Failed to load statistics'
				}));
			}
		},

		// Save session
		saveSession: async (session: SessionStats) => {
			// Round accuracy to 2 decimal places
			const roundedSession = {
				...session,
				accuracy: Math.round(session.accuracy * 100) / 100
			};

			update((state) => {
				const newSessions = [...state.sessions, roundedSession];
				const overall = calculateOverallStats(newSessions);
				return {
					...state,
					sessions: newSessions,
					overall
				};
			});

			try {
				// TODO: Implement addSession in IndexedDBService
				// await db.addSession(roundedSession);
			} catch (error) {
				console.error('Failed to save session:', error);
			}
		},

		// Get filtered statistics
		getFilteredStats: async (filters: FilterOptions): Promise<FilteredStats> => {
			const state = get({ subscribe });
			let filteredSessions = [...state.sessions];

			// Filter by period
			if (filters.period && filters.period !== 'all') {
				const now = new Date();
				const startDate = new Date();

				switch (filters.period) {
					case 'today':
						startDate.setHours(0, 0, 0, 0);
						break;
					case 'week':
						startDate.setDate(now.getDate() - 7);
						break;
					case 'month':
						startDate.setDate(now.getDate() - 30);
						break;
				}

				filteredSessions = filteredSessions.filter((s) => new Date(s.timestamp) >= startDate);
			}

			// Filter by mode
			if (filters.mode) {
				filteredSessions = filteredSessions.filter((s) => s.mode === filters.mode);
			}

			// Filter by card
			if (filters.cardId) {
				// This would need session to track which cards were played
				// For now, we'll skip this filter
			}

			const overall = calculateOverallStats(filteredSessions);
			return { sessions: filteredSessions, overall };
		},

		// Update card statistics
		updateCardStats: async (cardId: string, stats: { time: number; accuracy: number }) => {
			update((state) => {
				const existing = state.cardStats.get(cardId);
				const now = new Date();

				if (existing) {
					const newStats: CardStats = {
						...existing,
						timesPlayed: existing.timesPlayed + 1,
						bestTime: Math.min(existing.bestTime, stats.time),
						averageTime:
							(existing.averageTime * existing.timesPlayed + stats.time) /
							(existing.timesPlayed + 1),
						accuracy:
							(existing.accuracy * existing.timesPlayed + stats.accuracy) /
							(existing.timesPlayed + 1),
						lastPlayed: now
					};
					state.cardStats.set(cardId, newStats);
				} else {
					state.cardStats.set(cardId, {
						cardId,
						timesPlayed: 1,
						bestTime: stats.time,
						averageTime: stats.time,
						accuracy: stats.accuracy,
						lastPlayed: now
					});
				}

				return { ...state };
			});

			try {
				const state = get({ subscribe });
				// TODO: Implement updateCardStats in IndexedDBService
				// await db.updateCardStats(cardId, state.cardStats.get(cardId)!);
			} catch (error) {
				console.error('Failed to save card stats:', error);
			}
		},

		// Export data
		exportData: async (format: 'json' | 'csv'): Promise<string> => {
			const state = get({ subscribe });

			if (format === 'json') {
				const exportData = {
					version: '1.0.0',
					exportDate: new Date().toISOString(),
					overall: state.overall,
					sessions: state.sessions,
					cardStats: Array.from(state.cardStats.entries()).map(([id, stats]) => ({
						...stats,
						id
					}))
				};
				return JSON.stringify(exportData, null, 2);
			} else {
				// CSV format
				const headers = 'id,timestamp,mode,duration,cardsCompleted,wpm,accuracy,score,mistakes';
				const rows = state.sessions.map(
					(s) =>
						`${s.id},${s.timestamp},${s.mode},${s.duration},${s.cardsCompleted},${s.wpm},${s.accuracy},${s.score},${s.mistakes}`
				);
				return [headers, ...rows].join('\n');
			}
		},

		// Import data
		importData: async (data: string, format: 'json' | 'csv') => {
			try {
				if (format === 'json') {
					const parsed = JSON.parse(data);
					const sessions = parsed.sessions.map((s: any) => ({
						...s,
						timestamp: new Date(s.timestamp)
					}));

					const cardStats = new Map();
					if (parsed.cardStats) {
						parsed.cardStats.forEach((stats: any) => {
							cardStats.set(stats.id || stats.cardId, {
								...stats,
								lastPlayed: new Date(stats.lastPlayed)
							});
						});
					}

					update((state) => ({
						...state,
						overall: parsed.overall || calculateOverallStats(sessions),
						sessions,
						cardStats
					}));

					// Save to storage
					// TODO: Implement saveStatistics in IndexedDBService
					// await db.saveStatistics({
					//	overall: parsed.overall,
					//	sessions,
					//	cardStats
					// });
				} else {
					// CSV import not fully implemented for this test
					throw new Error('CSV import not yet implemented');
				}
			} catch (error) {
				throw new Error(`Failed to import data: ${error}`);
			}
		}

		// Public methods for calculations
		// TODO: These functions are defined outside and need to be imported or defined
		// calculateLevel,
		// calculateRank,
		// calculateLevelProgress,
		// calculateTrends
	};
}

export const statisticsStore = createStatisticsStore();
