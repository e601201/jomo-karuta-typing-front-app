import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import PartialInputSettings from './PartialInputSettings.svelte';

describe('PartialInputSettings Component', () => {
	const mockOnChange = vi.fn();

	beforeEach(() => {
		mockOnChange.mockClear();
	});

	describe('UI Display', () => {
		it('TC-010: should display all setting controls', () => {
			render(PartialInputSettings, {
				props: {
					config: {
						enabled: false,
						characterCount: 5,
						mode: 'start',
						highlightRange: true
					},
					onChange: mockOnChange
				}
			});

			// Check for toggle
			expect(screen.getByRole('switch')).toBeInTheDocument();
			expect(screen.getByText('部分入力モード')).toBeInTheDocument();

			// Check for slider
			expect(screen.getByRole('slider')).toBeInTheDocument();
			expect(screen.getByText('5文字')).toBeInTheDocument();

			// Check for preset buttons
			expect(screen.getByText('初心者')).toBeInTheDocument();
			expect(screen.getByText('中級')).toBeInTheDocument();
			expect(screen.getByText('上級')).toBeInTheDocument();

			// Check for mode selection
			expect(screen.getByLabelText('先頭から')).toBeInTheDocument();
			expect(screen.getByLabelText('ランダム')).toBeInTheDocument();
		});

		it('TC-011: should show preview of partial range', () => {
			render(PartialInputSettings, {
				props: {
					config: {
						enabled: true,
						characterCount: 5,
						mode: 'start',
						highlightRange: true
					},
					previewText: 'つるまうかたちのぐんまけん',
					onChange: mockOnChange
				}
			});

			const preview = screen.getByTestId('partial-preview');
			expect(preview).toBeInTheDocument();
			expect(preview).toHaveTextContent('つるまうか');

			// Check visual distinction
			const targetChars = screen.getByTestId('preview-target');
			const nonTargetChars = screen.getByTestId('preview-non-target');
			expect(targetChars).toHaveClass('text-black');
			expect(nonTargetChars).toHaveClass('text-gray-400');
		});

		it('should disable controls when mode is off', () => {
			render(PartialInputSettings, {
				props: {
					config: {
						enabled: false,
						characterCount: 5,
						mode: 'start',
						highlightRange: true
					},
					onChange: mockOnChange
				}
			});

			const slider = screen.getByRole('slider');
			expect(slider).toBeDisabled();

			const radioButtons = screen.getAllByRole('radio');
			radioButtons.forEach((radio) => {
				expect(radio).toBeDisabled();
			});
		});
	});

	describe('User Interactions', () => {
		it('should toggle partial input mode', async () => {
			render(PartialInputSettings, {
				props: {
					config: {
						enabled: false,
						characterCount: 5,
						mode: 'start',
						highlightRange: true
					},
					onChange: mockOnChange
				}
			});

			const toggle = screen.getByRole('switch');
			await fireEvent.click(toggle);

			expect(mockOnChange).toHaveBeenCalledWith({
				enabled: true,
				characterCount: 5,
				mode: 'start',
				highlightRange: true
			});
		});

		it('should update character count with slider', async () => {
			render(PartialInputSettings, {
				props: {
					config: {
						enabled: true,
						characterCount: 5,
						mode: 'start',
						highlightRange: true
					},
					onChange: mockOnChange
				}
			});

			const slider = screen.getByRole('slider');
			await fireEvent.input(slider, { target: { value: '10' } });

			expect(mockOnChange).toHaveBeenCalledWith({
				enabled: true,
				characterCount: 10,
				mode: 'start',
				highlightRange: true
			});
		});

		it('TC-016: should apply presets', async () => {
			render(PartialInputSettings, {
				props: {
					config: {
						enabled: true,
						characterCount: 8,
						mode: 'start',
						highlightRange: true
					},
					onChange: mockOnChange
				}
			});

			// Click beginner preset
			const beginnerBtn = screen.getByText('初心者');
			await fireEvent.click(beginnerBtn);

			expect(mockOnChange).toHaveBeenCalledWith({
				enabled: true,
				characterCount: 5,
				mode: 'start',
				highlightRange: true
			});

			// Click intermediate preset
			const intermediateBtn = screen.getByText('中級');
			await fireEvent.click(intermediateBtn);

			expect(mockOnChange).toHaveBeenCalledWith({
				enabled: true,
				characterCount: 10,
				mode: 'start',
				highlightRange: true
			});

			// Click advanced preset (disables partial input)
			const advancedBtn = screen.getByText('上級');
			await fireEvent.click(advancedBtn);

			expect(mockOnChange).toHaveBeenCalledWith({
				enabled: false,
				characterCount: 10,
				mode: 'start',
				highlightRange: true
			});
		});

		it('should change mode selection', async () => {
			render(PartialInputSettings, {
				props: {
					config: {
						enabled: true,
						characterCount: 5,
						mode: 'start',
						highlightRange: true
					},
					onChange: mockOnChange
				}
			});

			const randomRadio = screen.getByLabelText('ランダム');
			await fireEvent.click(randomRadio);

			expect(mockOnChange).toHaveBeenCalledWith({
				enabled: true,
				characterCount: 5,
				mode: 'random',
				highlightRange: true
			});
		});
	});

	describe('Preview Updates', () => {
		it('should update preview when config changes', async () => {
			const { rerender } = render(PartialInputSettings, {
				props: {
					config: {
						enabled: true,
						characterCount: 3,
						mode: 'start',
						highlightRange: true
					},
					previewText: 'つるまうかたちの',
					onChange: mockOnChange
				}
			});

			let preview = screen.getByTestId('preview-target');
			expect(preview).toHaveTextContent('つるま');

			await rerender({
				config: {
					enabled: true,
					characterCount: 5,
					mode: 'start',
					highlightRange: true
				},
				previewText: 'つるまうかたちの',
				onChange: mockOnChange
			});

			preview = screen.getByTestId('preview-target');
			expect(preview).toHaveTextContent('つるまうか');
		});

		it('should show random preview indicator', () => {
			render(PartialInputSettings, {
				props: {
					config: {
						enabled: true,
						characterCount: 3,
						mode: 'random',
						highlightRange: true
					},
					previewText: 'つるまうかたちの',
					onChange: mockOnChange
				}
			});

			const randomIndicator = screen.getByText(/ランダムな位置から/);
			expect(randomIndicator).toBeInTheDocument();
		});
	});

	describe('Accessibility', () => {
		it('TC-030: should support keyboard navigation', async () => {
			render(PartialInputSettings, {
				props: {
					config: {
						enabled: true,
						characterCount: 5,
						mode: 'start',
						highlightRange: true
					},
					onChange: mockOnChange
				}
			});

			const slider = screen.getByRole('slider');

			// Test arrow key navigation
			slider.focus();
			await fireEvent.keyDown(slider, { key: 'ArrowRight' });
			expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ characterCount: 6 }));

			await fireEvent.keyDown(slider, { key: 'ArrowLeft' });
			expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ characterCount: 4 }));
		});

		it('should have proper ARIA labels', () => {
			render(PartialInputSettings, {
				props: {
					config: {
						enabled: true,
						characterCount: 5,
						mode: 'start',
						highlightRange: true
					},
					onChange: mockOnChange
				}
			});

			const slider = screen.getByRole('slider');
			expect(slider).toHaveAttribute('aria-label', '入力文字数');
			expect(slider).toHaveAttribute('aria-valuemin', '1');
			expect(slider).toHaveAttribute('aria-valuemax', '20');
			expect(slider).toHaveAttribute('aria-valuenow', '5');
		});
	});

	describe('Responsive Design', () => {
		it('TC-037: should be usable on mobile', () => {
			global.innerWidth = 375;

			render(PartialInputSettings, {
				props: {
					config: {
						enabled: true,
						characterCount: 5,
						mode: 'start',
						highlightRange: true
					},
					onChange: mockOnChange
				}
			});

			const container = screen.getByTestId('settings-container');
			expect(container).toHaveClass('flex-col');

			// Check touch target sizes
			const buttons = screen.getAllByRole('button');
			buttons.forEach((button) => {
				const styles = window.getComputedStyle(button);
				const height = parseInt(styles.height);
				expect(height).toBeGreaterThanOrEqual(44); // Minimum touch target
			});
		});
	});
});
