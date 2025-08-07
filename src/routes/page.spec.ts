import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { goto } from '$app/navigation';
import Page from './+page.svelte';

// Mock the navigation module
vi.mock('$app/navigation');

// Mock game store
vi.mock('$lib/stores/game', () => ({
	gameStore: {
		subscribe: vi.fn((callback) => {
			callback({
				currentMode: null,
				isLoading: false,
				error: null,
				settings: {
					soundEnabled: true,
					showFurigana: true,
					highlightNextInput: true,
					fontSize: 'medium',
					colorScheme: 'default',
					keyboardLayout: 'qwerty',
					showHints: true,
					autoAdvance: false,
					practiceMode: {
						cardOrder: 'sequential',
						repeatFailedCards: false,
						showProgress: true
					},
					gameMode: {
						enablePartialInput: false,
						partialInputLength: 5,
						showTimer: true,
						pauseEnabled: true
					}
				}
			});
			return () => {};
		}),
		setMode: vi.fn(),
		initializeGame: vi.fn()
	}
}));

// Mock IndexedDB service
vi.mock('$lib/services/storage/indexed-db', () => ({
	IndexedDBService: vi.fn().mockImplementation(() => ({
		init: vi.fn(),
		getLatestSession: vi.fn(),
		hasProgress: vi.fn()
	}))
}));

// Mock karuta cards data
vi.mock('$lib/data/karuta-cards.json', () => ({
	default: Array(44)
		.fill(null)
		.map((_, i) => ({
			id: `card-${i + 1}`,
			yomifuda: `読み札${i + 1}`,
			torifuda: `取り札${i + 1}`,
			furigana: `ふりがな${i + 1}`
		}))
}));

describe('MainMenu Page', () => {
	const user = userEvent.setup();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('Initial Display', () => {
		it('TC-001: should display page title and header', () => {
			render(Page);

			expect(screen.getByText('上毛カルタタイピング')).toBeInTheDocument();
			expect(screen.getByText('群馬の郷土カルタでタイピング練習')).toBeInTheDocument();
		});

		it('TC-002: should show loading state when data is loading', async () => {
			// Mock loading state
			const { gameStore } = await import('$lib/stores/game');
			vi.mocked(gameStore.subscribe).mockImplementation((callback) => {
				callback({
					currentMode: null,
					isLoading: true,
					error: null,
					settings: {} as any
				});
				return () => {};
			});

			render(Page);

			expect(screen.getByText('読み込み中...')).toBeInTheDocument();
			expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
		});
	});

	describe('Game Mode Selection', () => {
		it('TC-003: should display and navigate to practice mode', async () => {
			render(Page);

			const practiceButton = screen.getByRole('button', { name: /練習モード/i });
			expect(practiceButton).toBeInTheDocument();
			expect(screen.getByText('全44札を順番に練習')).toBeInTheDocument();

			await user.click(practiceButton);

			expect(goto).toHaveBeenCalledWith('/game?mode=practice');
		});

		it('TC-004: should display and navigate to specific cards practice mode', async () => {
			render(Page);

			const specificButton = screen.getByRole('button', { name: /特定札練習/i });
			expect(specificButton).toBeInTheDocument();
			expect(screen.getByText('選択した札のみを練習')).toBeInTheDocument();

			await user.click(specificButton);

			expect(goto).toHaveBeenCalledWith('/game?mode=specific');
		});

		it('TC-005: should display and navigate to random mode', async () => {
			render(Page);

			const randomButton = screen.getByRole('button', { name: /ランダム出題/i });
			expect(randomButton).toBeInTheDocument();
			expect(screen.getByText('ランダムな順序で練習')).toBeInTheDocument();

			await user.click(randomButton);

			expect(goto).toHaveBeenCalledWith('/game?mode=random');
		});
	});

	describe('Navigation', () => {
		it('TC-006: should navigate to settings page', async () => {
			render(Page);

			const settingsLink = screen.getByRole('link', { name: /設定/i });
			expect(settingsLink).toBeInTheDocument();

			await user.click(settingsLink);

			expect(goto).toHaveBeenCalledWith('/settings');
		});

		it('TC-007: should navigate to stats page', async () => {
			render(Page);

			const statsLink = screen.getByRole('link', { name: /成績/i });
			expect(statsLink).toBeInTheDocument();

			await user.click(statsLink);

			expect(goto).toHaveBeenCalledWith('/stats');
		});
	});

	describe('Data Loading', () => {
		it('TC-008: should load karuta data successfully', async () => {
			render(Page);

			await waitFor(() => {
				expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
			});

			// All game mode buttons should be enabled
			expect(screen.getByRole('button', { name: /練習モード/i })).not.toBeDisabled();
			expect(screen.getByRole('button', { name: /特定札練習/i })).not.toBeDisabled();
			expect(screen.getByRole('button', { name: /ランダム出題/i })).not.toBeDisabled();
		});

		it('TC-009: should handle data loading error', async () => {
			// Mock error state
			const { gameStore } = await import('$lib/stores/game');
			vi.mocked(gameStore.subscribe).mockImplementation((callback) => {
				callback({
					currentMode: null,
					isLoading: false,
					error: 'データの読み込みに失敗しました',
					settings: {} as any
				});
				return () => {};
			});

			render(Page);

			expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /再試行/i })).toBeInTheDocument();

			// Game mode buttons should be disabled
			expect(screen.getByRole('button', { name: /練習モード/i })).toBeDisabled();
			expect(screen.getByRole('button', { name: /特定札練習/i })).toBeDisabled();
			expect(screen.getByRole('button', { name: /ランダム出題/i })).toBeDisabled();
		});
	});

	describe('Accessibility', () => {
		it('TC-010: should support keyboard navigation', async () => {
			render(Page);

			const practiceButton = screen.getByRole('button', { name: /練習モード/i });
			const specificButton = screen.getByRole('button', { name: /特定札練習/i });
			const randomButton = screen.getByRole('button', { name: /ランダム出題/i });

			// Tab through elements
			await user.tab();
			expect(practiceButton).toHaveFocus();

			await user.tab();
			expect(specificButton).toHaveFocus();

			await user.tab();
			expect(randomButton).toHaveFocus();

			// Activate with Enter key
			await user.keyboard('{Enter}');
			expect(goto).toHaveBeenCalledWith('/game?mode=random');
		});

		it('TC-011: should have proper ARIA attributes', () => {
			render(Page);

			const practiceButton = screen.getByRole('button', { name: /練習モード/i });
			expect(practiceButton).toHaveAttribute('aria-label');
			expect(practiceButton).toHaveAttribute('aria-describedby');

			const main = screen.getByRole('main');
			expect(main).toBeInTheDocument();

			const navigation = screen.getByRole('navigation');
			expect(navigation).toBeInTheDocument();
		});
	});

	describe('Responsive Design', () => {
		it('TC-012: should display correctly on mobile', () => {
			// Set viewport to mobile size
			global.innerWidth = 375;
			global.dispatchEvent(new Event('resize'));

			render(Page);

			const container = screen.getByTestId('game-modes-container');
			expect(container).toHaveClass('flex-col');

			// Check touch target size
			const buttons = screen.getAllByRole('button');
			buttons.forEach((button) => {
				const styles = getComputedStyle(button);
				expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
			});
		});

		it('TC-013: should display correctly on tablet', () => {
			// Set viewport to tablet size
			global.innerWidth = 768;
			global.dispatchEvent(new Event('resize'));

			render(Page);

			const container = screen.getByTestId('game-modes-container');
			expect(container).toHaveClass('sm:grid', 'sm:grid-cols-2');
		});

		it('TC-014: should display correctly on desktop', () => {
			// Set viewport to desktop size
			global.innerWidth = 1280;
			global.dispatchEvent(new Event('resize'));

			render(Page);

			const container = screen.getByTestId('game-modes-container');
			expect(container).toHaveClass('lg:grid-cols-3');
		});
	});

	describe('Store Integration', () => {
		it('TC-016: should load game settings from storage', async () => {
			const { gameStore } = await import('$lib/stores/game');

			render(Page);

			await waitFor(() => {
				expect(gameStore.initializeGame).toHaveBeenCalled();
			});
		});

		it('TC-017: should display continue option when progress exists', async () => {
			// Mock existing progress
			const { IndexedDBService } = await import('$lib/services/storage/indexed-db');
			const mockInstance = new IndexedDBService();
			vi.mocked(mockInstance.hasProgress).mockResolvedValue(true);
			vi.mocked(mockInstance.getLatestSession).mockResolvedValue({
				id: 'session-1',
				mode: 'practice',
				startedAt: new Date(),
				completedCards: 10,
				totalCards: 44
			} as any);

			render(Page);

			await waitFor(() => {
				expect(screen.getByText('続きから')).toBeInTheDocument();
				expect(screen.getByText('10/44 完了')).toBeInTheDocument();
			});

			const continueButton = screen.getByRole('button', { name: /続きから/i });
			await user.click(continueButton);

			expect(goto).toHaveBeenCalledWith('/game?mode=practice&continue=true');
		});
	});
});
