import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import StatsSummary from './StatsSummary.svelte';
import type { OverallStats } from '$lib/types/game';

describe('StatsSummary Component', () => {
	const defaultStats: OverallStats = {
		totalSessions: 10,
		totalPlayTime: 3661000, // 1 hour 1 minute 1 second
		totalKeysTyped: 1500,
		totalCardsCompleted: 100,
		averageWPM: 55,
		maxWPM: 70,
		averageAccuracy: 92.5,
		maxAccuracy: 100,
		currentStreak: 3,
		longestStreak: 7,
		totalScore: 15000,
		level: 3,
		rank: '中級'
	};

	describe('Display Tests', () => {
		it('TC-005: should display summary cards', () => {
			render(StatsSummary, {
				props: {
					stats: defaultStats
				}
			});

			// Check for main stat cards
			expect(screen.getByTestId('stat-card-sessions')).toBeInTheDocument();
			expect(screen.getByTestId('stat-card-playtime')).toBeInTheDocument();
			expect(screen.getByTestId('stat-card-wpm')).toBeInTheDocument();
			expect(screen.getByTestId('stat-card-accuracy')).toBeInTheDocument();

			// Check values
			expect(screen.getByText('10')).toBeInTheDocument(); // sessions
			expect(screen.getByText('55')).toBeInTheDocument(); // average WPM
			expect(screen.getByText('92.5%')).toBeInTheDocument(); // accuracy
		});

		it('TC-006: should show comparison indicators', () => {
			render(StatsSummary, {
				props: {
					stats: defaultStats,
					compareWith: 'yesterday',
					previousStats: {
						...defaultStats,
						averageWPM: 50,
						averageAccuracy: 90
					}
				}
			});

			// Check for increase indicators
			const wpmIndicator = screen.getByTestId('wpm-indicator');
			expect(wpmIndicator).toHaveClass('text-green-600');
			expect(wpmIndicator).toContainHTML('↑');
			expect(screen.getByText('+5')).toBeInTheDocument();

			const accuracyIndicator = screen.getByTestId('accuracy-indicator');
			expect(accuracyIndicator).toHaveClass('text-green-600');
			expect(screen.getByText('+2.5%')).toBeInTheDocument();
		});

		it('TC-007: should format time correctly', () => {
			render(StatsSummary, {
				props: {
					stats: defaultStats
				}
			});

			// 3661000ms = 1時間1分1秒
			expect(screen.getByTestId('playtime-display')).toHaveTextContent('1時間1分');
		});

		it('TC-008: should handle zero values', () => {
			const emptyStats: OverallStats = {
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
			};

			render(StatsSummary, {
				props: {
					stats: emptyStats
				}
			});

			expect(screen.getByText('データなし')).toBeInTheDocument();
			expect(screen.getByTestId('stat-card-sessions')).toHaveTextContent('0回');
		});
	});

	describe('Level and Rank Display', () => {
		it('TC-031: should display rank', () => {
			render(StatsSummary, {
				props: {
					stats: defaultStats
				}
			});

			expect(screen.getByTestId('rank-display')).toHaveTextContent('中級');
			expect(screen.getByTestId('level-display')).toHaveTextContent('レベル 3');
		});

		it('TC-032: should show level progress', () => {
			render(StatsSummary, {
				props: {
					stats: defaultStats,
					levelProgress: {
						currentLevel: 3,
						nextLevel: 4,
						progress: 75,
						pointsToNext: 5000
					}
				}
			});

			const progressBar = screen.getByTestId('level-progress-bar');
			expect(progressBar).toHaveStyle({ width: '75%' });
			expect(screen.getByText('次のレベルまで 5000 ポイント')).toBeInTheDocument();
		});
	});

	describe('Streak Display', () => {
		it('should display current and longest streaks', () => {
			render(StatsSummary, {
				props: {
					stats: defaultStats
				}
			});

			expect(screen.getByTestId('current-streak')).toHaveTextContent('3日');
			expect(screen.getByTestId('longest-streak')).toHaveTextContent('最長: 7日');
		});

		it('should show fire emoji for active streaks', () => {
			render(StatsSummary, {
				props: {
					stats: {
						...defaultStats,
						currentStreak: 7
					}
				}
			});

			expect(screen.getByTestId('streak-fire')).toBeInTheDocument();
		});
	});

	describe('Responsive Design', () => {
		it('TC-033: should adjust layout for mobile', () => {
			global.innerWidth = 375;

			render(StatsSummary, {
				props: {
					stats: defaultStats
				}
			});

			const container = screen.getByTestId('stats-summary-container');
			expect(container).toHaveClass('grid-cols-1', 'sm:grid-cols-2');
		});

		it('TC-035: should use full grid on desktop', () => {
			global.innerWidth = 1280;

			render(StatsSummary, {
				props: {
					stats: defaultStats
				}
			});

			const container = screen.getByTestId('stats-summary-container');
			expect(container).toHaveClass('lg:grid-cols-4');
		});
	});

	describe('Animation', () => {
		it('TC-036: should have count-up animation class', () => {
			render(StatsSummary, {
				props: {
					stats: defaultStats,
					animate: true
				}
			});

			const scoreDisplay = screen.getByTestId('score-display');
			expect(scoreDisplay).toHaveClass('animate-count-up');
		});

		it('TC-038: should have hover effects on cards', () => {
			render(StatsSummary, {
				props: {
					stats: defaultStats
				}
			});

			const card = screen.getByTestId('stat-card-sessions');
			expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow');
		});
	});
});
