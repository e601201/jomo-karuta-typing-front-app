import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { goto } from '$app/navigation';
import { page } from '$app/stores';
import { get } from 'svelte/store';
import Page from './+page.svelte';

// Mock modules
vi.mock('$app/navigation');
vi.mock('$app/stores', () => ({
	page: {
		subscribe: vi.fn((callback) => {
			callback({
				url: {
					searchParams: new URLSearchParams('?mode=practice')
				}
			});
			return () => {};
		})
	}
}));

// Mock game store
vi.mock('$lib/stores/game', () => {
	const { writable } = require('svelte/store');
	const mockGameStore = writable({
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
			isPaused: false
		}
	});

	return {
		gameStore: {
			...mockGameStore,
			startSession: vi.fn(),
			nextCard: vi.fn(),
			updateInput: vi.fn(),
			completeCard: vi.fn(),
			pauseGame: vi.fn(),
			resumeGame: vi.fn(),
			endSession: vi.fn(),
			gameStore: mockGameStore
		}
	};
});

// Mock karuta cards
vi.mock('$lib/data/karuta-cards.json', () => ({
	default: [
		{
			id: 'card-1',
			hiragana: 'つるまうかたちのぐんまけん',
			romaji: 'tsuru mau katachi no gunma ken',
			meaning: 'つる舞う形の群馬県',
			category: 'geography' as const,
			difficulty: 'easy' as const
		},
		{
			id: 'card-2',
			hiragana: 'ちからあわせるにひゃくまん',
			romaji: 'chikara awaseru nihyakuman',
			meaning: '力あわせる二百万',
			category: 'culture' as const,
			difficulty: 'easy' as const
		}
	]
}));

// Mock InputValidator
vi.mock('$lib/services/typing/input-validator', () => ({
	InputValidator: vi.fn().mockImplementation(() => ({
		validateInput: vi.fn((input, expected) => ({
			isValid: input === expected,
			isComplete: false,
			progress: 0.5
		})),
		getRomajiPatterns: vi.fn(() => ['tsurumakatachinogumaken']),
		getNextExpectedInputs: vi.fn(() => ['t'])
	}))
}));

describe('Game Page', () => {
	const user = userEvent.setup();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Initialization and Routing', () => {
		it('TC-001: should get game mode from URL parameters', async () => {
			render(Page);

			await waitFor(() => {
				const { gameStore } = require('$lib/stores/game');
				expect(gameStore.startSession).toHaveBeenCalledWith(
					expect.objectContaining({
						mode: 'practice'
					})
				);
			});
		});

		it('TC-002: should handle continue parameter', async () => {
			// Mock URL with continue parameter
			vi.mocked(page.subscribe).mockImplementation((callback) => {
				callback({
					url: {
						searchParams: new URLSearchParams('?mode=practice&continue=true')
					}
				});
				return () => {};
			});

			render(Page);

			await waitFor(() => {
				const { gameStore } = require('$lib/stores/game');
				expect(gameStore.startSession).toHaveBeenCalledWith(
					expect.objectContaining({
						mode: 'practice',
						continue: true
					})
				);
			});
		});

		it('TC-003: should handle invalid mode', async () => {
			// Mock URL with invalid mode
			vi.mocked(page.subscribe).mockImplementation((callback) => {
				callback({
					url: {
						searchParams: new URLSearchParams('?mode=invalid')
					}
				});
				return () => {};
			});

			render(Page);

			await waitFor(() => {
				expect(screen.getByText(/無効なゲームモード/)).toBeInTheDocument();
				expect(screen.getByRole('link', { name: /メインメニューに戻る/ })).toBeInTheDocument();
			});
		});
	});

	describe('Card Display', () => {
		it('TC-004: should display card information', async () => {
			const { gameStore } = await import('$lib/stores/game');

			// Set current card
			gameStore.gameStore.update((state) => ({
				...state,
				cards: {
					...state.cards,
					current: {
						id: 'card-1',
						hiragana: 'つるまうかたちのぐんまけん',
						romaji: 'tsuru mau katachi no gunma ken',
						meaning: 'つる舞う形の群馬県',
						category: 'geography',
						difficulty: 'easy'
					},
					currentIndex: 0
				},
				session: {
					id: 'test-session',
					mode: 'practice',
					totalCards: 44,
					isActive: true,
					startTime: new Date()
				}
			}));

			render(Page);

			await waitFor(() => {
				expect(screen.getByText('つる舞う形の群馬県')).toBeInTheDocument();
				expect(screen.getByText('1 / 44')).toBeInTheDocument();
				expect(screen.getByTestId('furigana')).toHaveTextContent('つるまうかたちのぐんまけん');
			});
		});

		it('TC-005: should switch to next card', async () => {
			const { gameStore } = await import('$lib/stores/game');

			render(Page);

			// Complete current card
			await gameStore.completeCard();

			await waitFor(() => {
				expect(gameStore.nextCard).toHaveBeenCalled();
			});
		});
	});

	describe('Input Processing', () => {
		it('TC-006: should process correct input', async () => {
			const { gameStore } = await import('$lib/stores/game');

			// Set current card
			gameStore.gameStore.update((state) => ({
				...state,
				cards: {
					...state.cards,
					current: {
						id: 'card-1',
						hiragana: 'つるまうかたちのぐんまけん',
						romaji: 'tsuru mau katachi no gunma ken',
						meaning: 'つる舞う形の群馬県',
						category: 'geography',
						difficulty: 'easy'
					}
				},
				session: {
					id: 'test-session',
					mode: 'practice',
					totalCards: 44,
					isActive: true,
					startTime: new Date()
				}
			}));

			render(Page);

			// Type correct character
			await user.keyboard('t');

			await waitFor(() => {
				expect(gameStore.updateInput).toHaveBeenCalledWith('t');
				const highlight = screen.getByTestId('input-highlight-0');
				expect(highlight).toHaveClass('text-green-600');
			});
		});

		it('TC-007: should process incorrect input', async () => {
			const { gameStore } = await import('$lib/stores/game');

			// Set current card
			gameStore.gameStore.update((state) => ({
				...state,
				cards: {
					...state.cards,
					current: {
						id: 'card-1',
						hiragana: 'つるまうかたちのぐんまけん',
						romaji: 'tsuru mau katachi no gunma ken',
						meaning: 'つる舞う形の群馬県',
						category: 'geography',
						difficulty: 'easy'
					}
				},
				session: {
					id: 'test-session',
					mode: 'practice',
					totalCards: 44,
					isActive: true,
					startTime: new Date()
				}
			}));

			render(Page);

			// Type incorrect character
			await user.keyboard('x');

			await waitFor(() => {
				expect(gameStore.updateInput).toHaveBeenCalledWith('x');
				const errorIndicator = screen.getByTestId('error-indicator');
				expect(errorIndicator).toHaveClass('text-red-600');
			});
		});

		it('TC-009: should handle backspace', async () => {
			const { gameStore } = await import('$lib/stores/game');

			render(Page);

			// Type and then backspace
			await user.keyboard('t');
			await user.keyboard('{Backspace}');

			await waitFor(() => {
				expect(gameStore.updateInput).toHaveBeenCalledWith('');
			});
		});
	});

	describe('Real-time Feedback', () => {
		it('TC-010: should display romaji guide', async () => {
			const { gameStore } = await import('$lib/stores/game');

			// Set current card
			gameStore.gameStore.update((state) => ({
				...state,
				cards: {
					...state.cards,
					current: {
						id: 'card-1',
						hiragana: 'つるまうかたちのぐんまけん',
						romaji: 'tsuru mau katachi no gunma ken',
						meaning: 'つる舞う形の群馬県',
						category: 'geography',
						difficulty: 'easy'
					}
				}
			}));

			render(Page);

			await waitFor(() => {
				const romajiGuide = screen.getByTestId('romaji-guide');
				expect(romajiGuide).toHaveTextContent('tsurumakatachinogumaken');
			});
		});

		it('TC-011: should update progress bar', async () => {
			const { gameStore } = await import('$lib/stores/game');

			// Set progress
			gameStore.gameStore.update((state) => ({
				...state,
				input: {
					...state.input,
					position: 5,
					current: 'tsuru'
				}
			}));

			render(Page);

			await waitFor(() => {
				const progressBar = screen.getByTestId('input-progress');
				expect(progressBar).toHaveAttribute('style', expect.stringContaining('width: 20%'));
			});
		});
	});

	describe('Score Calculation', () => {
		it('TC-012: should calculate WPM', async () => {
			const { gameStore } = await import('$lib/stores/game');

			// Set score data
			gameStore.gameStore.update((state) => ({
				...state,
				score: {
					...state.score,
					speed: 120
				}
			}));

			render(Page);

			await waitFor(() => {
				expect(screen.getByTestId('wpm-display')).toHaveTextContent('120');
			});
		});

		it('TC-013: should calculate accuracy', async () => {
			const { gameStore } = await import('$lib/stores/game');

			// Set accuracy data
			gameStore.gameStore.update((state) => ({
				...state,
				score: {
					...state.score,
					accuracy: 83.3
				}
			}));

			render(Page);

			await waitFor(() => {
				expect(screen.getByTestId('accuracy-display')).toHaveTextContent('83.3%');
			});
		});

		it('TC-014: should track combo', async () => {
			const { gameStore } = await import('$lib/stores/game');

			// Set combo
			gameStore.gameStore.update((state) => ({
				...state,
				score: {
					...state.score,
					combo: 5
				}
			}));

			render(Page);

			await waitFor(() => {
				expect(screen.getByTestId('combo-display')).toHaveTextContent('5');
			});
		});
	});

	describe('Game Controls', () => {
		it('TC-015: should pause game', async () => {
			const { gameStore } = await import('$lib/stores/game');

			render(Page);

			const pauseButton = screen.getByRole('button', { name: /一時停止/ });
			await user.click(pauseButton);

			await waitFor(() => {
				expect(gameStore.pauseGame).toHaveBeenCalled();
				expect(screen.getByText('一時停止中')).toBeInTheDocument();
			});
		});

		it('TC-016: should resume game', async () => {
			const { gameStore } = await import('$lib/stores/game');

			// Set paused state
			gameStore.gameStore.update((state) => ({
				...state,
				timer: {
					...state.timer,
					isPaused: true
				}
			}));

			render(Page);

			const resumeButton = screen.getByRole('button', { name: /再開/ });
			await user.click(resumeButton);

			await waitFor(() => {
				expect(gameStore.resumeGame).toHaveBeenCalled();
			});
		});

		it('TC-017: should skip card', async () => {
			const { gameStore } = await import('$lib/stores/game');

			render(Page);

			const skipButton = screen.getByRole('button', { name: /スキップ/ });
			await user.click(skipButton);

			await waitFor(() => {
				expect(gameStore.nextCard).toHaveBeenCalled();
			});
		});
	});

	describe('Game End', () => {
		it('TC-018: should handle all cards completed', async () => {
			const { gameStore } = await import('$lib/stores/game');

			// Set last card completed
			gameStore.gameStore.update((state) => ({
				...state,
				cards: {
					...state.cards,
					currentIndex: 43,
					completed: Array(44).fill({})
				}
			}));

			render(Page);

			await waitFor(() => {
				expect(screen.getByText('ゲーム終了！')).toBeInTheDocument();
				expect(screen.getByTestId('final-score')).toBeInTheDocument();
			});
		});

		it('TC-019: should handle early exit', async () => {
			const { gameStore } = await import('$lib/stores/game');

			render(Page);

			const exitButton = screen.getByRole('button', { name: /終了/ });
			await user.click(exitButton);

			// Confirm dialog
			await waitFor(() => {
				expect(screen.getByText('本当に終了しますか？')).toBeInTheDocument();
			});

			const confirmButton = screen.getByRole('button', { name: /はい/ });
			await user.click(confirmButton);

			await waitFor(() => {
				expect(gameStore.endSession).toHaveBeenCalled();
				expect(goto).toHaveBeenCalledWith('/');
			});
		});
	});

	describe('Responsive Design', () => {
		it('TC-022: should display correctly on mobile', () => {
			global.innerWidth = 375;
			global.dispatchEvent(new Event('resize'));

			render(Page);

			const container = screen.getByTestId('game-container');
			expect(container).toHaveClass('flex-col');
		});

		it('TC-024: should display correctly on desktop', () => {
			global.innerWidth = 1280;
			global.dispatchEvent(new Event('resize'));

			render(Page);

			const container = screen.getByTestId('game-container');
			expect(container).toHaveClass('max-w-4xl');
		});
	});

	describe('Performance', () => {
		it('TC-025: should respond to input within 30ms', async () => {
			const { gameStore } = await import('$lib/stores/game');

			render(Page);

			const startTime = performance.now();
			await user.keyboard('t');
			const endTime = performance.now();

			expect(endTime - startTime).toBeLessThan(30);
			expect(gameStore.updateInput).toHaveBeenCalled();
		});
	});
});
