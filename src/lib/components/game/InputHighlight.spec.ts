import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import InputHighlight from './InputHighlight.svelte';

describe('InputHighlight Component', () => {
	describe('Basic Display', () => {
		it('TC-001: should display initial state with all pending', () => {
			render(InputHighlight, {
				props: {
					text: 'つるまう',
					inputStates: ['pending', 'pending', 'pending', 'pending'],
					currentPosition: 0
				}
			});

			const characters = screen.getAllByTestId(/char-\d+/);
			expect(characters).toHaveLength(4);

			characters.forEach((char) => {
				expect(char).toHaveClass('text-gray-400');
			});

			const cursor = screen.getByTestId('cursor-0');
			expect(cursor).toBeInTheDocument();
		});

		it('TC-002: should highlight correct characters in green', () => {
			render(InputHighlight, {
				props: {
					text: 'つるまう',
					inputStates: ['correct', 'pending', 'pending', 'pending'],
					currentPosition: 1
				}
			});

			const firstChar = screen.getByTestId('char-0');
			expect(firstChar).toHaveClass('text-green-500');

			const cursor = screen.getByTestId('cursor-1');
			expect(cursor).toBeInTheDocument();
		});

		it('TC-003: should highlight incorrect characters in red', () => {
			render(InputHighlight, {
				props: {
					text: 'つるまう',
					inputStates: ['correct', 'incorrect', 'pending', 'pending'],
					currentPosition: 1,
					animateErrors: true
				}
			});

			const secondChar = screen.getByTestId('char-1');
			expect(secondChar).toHaveClass('text-red-500');
			expect(secondChar).toHaveClass('animate-shake');
		});
	});

	describe('Cursor Display', () => {
		it('TC-004: should display cursor at current position', () => {
			render(InputHighlight, {
				props: {
					text: 'つるまう',
					inputStates: ['correct', 'correct', 'pending', 'pending'],
					currentPosition: 2
				}
			});

			const cursor = screen.getByTestId('cursor-2');
			expect(cursor).toBeInTheDocument();
			expect(cursor).toHaveClass('animate-pulse');
		});

		it('TC-005: should move cursor smoothly', async () => {
			const { rerender } = render(InputHighlight, {
				props: {
					text: 'つるまう',
					inputStates: ['correct', 'pending', 'pending', 'pending'],
					currentPosition: 1
				}
			});

			let cursor = screen.getByTestId('cursor-1');
			expect(cursor).toBeInTheDocument();

			await rerender({
				text: 'つるまう',
				inputStates: ['correct', 'correct', 'pending', 'pending'],
				currentPosition: 2
			});

			cursor = screen.queryByTestId('cursor-1')!;
			expect(cursor).not.toBeInTheDocument();

			cursor = screen.getByTestId('cursor-2');
			expect(cursor).toBeInTheDocument();
			expect(cursor.parentElement).toHaveClass('transition-transform');
		});
	});

	describe('Romaji Display', () => {
		it('TC-006: should display romaji guide when enabled', () => {
			render(InputHighlight, {
				props: {
					text: 'つる',
					inputStates: ['pending', 'pending'],
					currentPosition: 0,
					showRomaji: true,
					romaji: 'tsuru'
				}
			});

			const romajiContainer = screen.getByTestId('romaji-container');
			expect(romajiContainer).toBeInTheDocument();
			expect(romajiContainer).toHaveTextContent('tsuru');
		});

		it('TC-007: should highlight romaji in sync with hiragana', () => {
			render(InputHighlight, {
				props: {
					text: 'つる',
					inputStates: ['correct', 'pending'],
					currentPosition: 1,
					showRomaji: true,
					romaji: 'tsuru',
					romajiStates: ['correct', 'correct', 'correct', 'pending', 'pending']
				}
			});

			const romajiChars = screen.getAllByTestId(/romaji-char-\d+/);
			expect(romajiChars[0]).toHaveClass('text-green-500'); // t
			expect(romajiChars[1]).toHaveClass('text-green-500'); // s
			expect(romajiChars[2]).toHaveClass('text-green-500'); // u
			expect(romajiChars[3]).toHaveClass('text-gray-400'); // r
			expect(romajiChars[4]).toHaveClass('text-gray-400'); // u
		});
	});

	describe('Animations', () => {
		it('TC-008: should animate color transitions', () => {
			const { rerender } = render(InputHighlight, {
				props: {
					text: 'つ',
					inputStates: ['pending'],
					currentPosition: 0
				}
			});

			const char = screen.getByTestId('char-0');
			expect(char).toHaveClass('transition-colors');
			expect(char).toHaveClass('duration-200');

			rerender({
				text: 'つ',
				inputStates: ['correct'],
				currentPosition: 1
			});

			expect(char).toHaveClass('text-green-500');
		});

		it('TC-009: should animate error shake', () => {
			render(InputHighlight, {
				props: {
					text: 'つる',
					inputStates: ['correct', 'incorrect'],
					currentPosition: 1,
					animateErrors: true
				}
			});

			const errorChar = screen.getByTestId('char-1');
			expect(errorChar).toHaveClass('animate-shake');
		});

		it('TC-010: should animate cursor blink', () => {
			render(InputHighlight, {
				props: {
					text: 'つ',
					inputStates: ['pending'],
					currentPosition: 0
				}
			});

			const cursor = screen.getByTestId('cursor-0');
			expect(cursor).toHaveClass('animate-pulse');
		});
	});

	describe('Performance', () => {
		it('TC-011: should render quickly for initial display', () => {
			const startTime = performance.now();

			render(InputHighlight, {
				props: {
					text: 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん',
					inputStates: Array(50).fill('pending'),
					currentPosition: 0
				}
			});

			const endTime = performance.now();
			expect(endTime - startTime).toBeLessThan(16);
		});

		it('TC-012: should update quickly on state change', () => {
			const { rerender } = render(InputHighlight, {
				props: {
					text: 'つる',
					inputStates: ['pending', 'pending'],
					currentPosition: 0
				}
			});

			const startTime = performance.now();

			rerender({
				text: 'つる',
				inputStates: ['correct', 'pending'],
				currentPosition: 1
			});

			const endTime = performance.now();
			expect(endTime - startTime).toBeLessThan(8);
		});
	});

	describe('Accessibility', () => {
		it('TC-015: should support colorblind mode', () => {
			render(InputHighlight, {
				props: {
					text: 'つる',
					inputStates: ['correct', 'incorrect'],
					currentPosition: 0,
					colorblindMode: true
				}
			});

			const correctChar = screen.getByTestId('char-0');
			const incorrectChar = screen.getByTestId('char-1');

			// Should have icons or patterns in addition to colors
			expect(correctChar.querySelector('.icon-check')).toBeInTheDocument();
			expect(incorrectChar.querySelector('.icon-cross')).toBeInTheDocument();
		});

		it('TC-016: should have proper ARIA labels', () => {
			render(InputHighlight, {
				props: {
					text: 'つる',
					inputStates: ['correct', 'incorrect'],
					currentPosition: 0
				}
			});

			const correctChar = screen.getByTestId('char-0');
			const incorrectChar = screen.getByTestId('char-1');

			expect(correctChar).toHaveAttribute('aria-label', 'つ: 正解');
			expect(incorrectChar).toHaveAttribute('aria-label', 'る: 不正解');
		});

		it('TC-017: should support high contrast mode', () => {
			render(InputHighlight, {
				props: {
					text: 'つる',
					inputStates: ['correct', 'incorrect'],
					currentPosition: 0,
					highContrast: true
				}
			});

			const chars = screen.getAllByTestId(/char-\d+/);
			chars.forEach((char) => {
				expect(char).toHaveClass('border');
			});
		});
	});

	describe('Responsive Design', () => {
		it('TC-019: should display correctly on mobile', () => {
			global.innerWidth = 375;

			render(InputHighlight, {
				props: {
					text: 'つるまう',
					inputStates: ['pending', 'pending', 'pending', 'pending'],
					currentPosition: 0
				}
			});

			const container = screen.getByTestId('highlight-container');
			expect(container).toHaveClass('text-2xl');
		});

		it('TC-021: should display correctly on desktop', () => {
			global.innerWidth = 1280;

			render(InputHighlight, {
				props: {
					text: 'つるまう',
					inputStates: ['pending', 'pending', 'pending', 'pending'],
					currentPosition: 0
				}
			});

			const container = screen.getByTestId('highlight-container');
			expect(container).toHaveClass('lg:text-5xl');
		});
	});

	describe('Edge Cases', () => {
		it('TC-022: should handle empty text', () => {
			render(InputHighlight, {
				props: {
					text: '',
					inputStates: [],
					currentPosition: 0
				}
			});

			const container = screen.getByTestId('highlight-container');
			expect(container).toBeEmptyDOMElement();
		});

		it('TC-023: should handle very long text', () => {
			const longText = 'あ'.repeat(200);
			const longStates = Array(200).fill('pending');

			render(InputHighlight, {
				props: {
					text: longText,
					inputStates: longStates,
					currentPosition: 0
				}
			});

			const container = screen.getByTestId('highlight-container');
			expect(container).toHaveClass('flex-wrap');
		});

		it('TC-024: should handle special characters', () => {
			render(InputHighlight, {
				props: {
					text: 'ー々・',
					inputStates: ['pending', 'pending', 'pending'],
					currentPosition: 0
				}
			});

			expect(screen.getByText('ー')).toBeInTheDocument();
			expect(screen.getByText('々')).toBeInTheDocument();
			expect(screen.getByText('・')).toBeInTheDocument();
		});
	});
});
