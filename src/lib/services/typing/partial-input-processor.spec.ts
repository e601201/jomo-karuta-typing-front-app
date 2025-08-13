import { describe, it, expect, beforeEach } from 'vitest';
import { PartialInputProcessor } from './partial-input-processor';
import type { PartialInputConfig, PartialInputRange } from '$lib/types';

describe('PartialInputProcessor', () => {
	let processor: PartialInputProcessor;

	beforeEach(() => {
		processor = new PartialInputProcessor();
	});

	describe('Range Calculation', () => {
		it('TC-001: should calculate range from start', () => {
			const config: PartialInputConfig = {
				enabled: true,
				characterCount: 5,
				mode: 'start',
				highlightRange: true
			};

			const range = processor.calculateRange('つるまうかたちのぐんまけん', config);

			expect(range).toEqual({
				start: 0,
				end: 5,
				text: 'つるまうか',
				fullText: 'つるまうかたちのぐんまけん'
			});
		});

		it('TC-002: should handle count exceeding text length', () => {
			const config: PartialInputConfig = {
				enabled: true,
				characterCount: 10,
				mode: 'start',
				highlightRange: true
			};

			const range = processor.calculateRange('つる', config);

			expect(range).toEqual({
				start: 0,
				end: 2,
				text: 'つる',
				fullText: 'つる'
			});
		});

		it('TC-003: should calculate random range', () => {
			const config: PartialInputConfig = {
				enabled: true,
				characterCount: 3,
				mode: 'random',
				highlightRange: true
			};

			const range = processor.calculateRange('つるまうかたちの', config);

			expect(range.text).toHaveLength(3);
			expect(range.fullText).toBe('つるまうかたちの');
			expect(range.end - range.start).toBe(3);
		});

		it('TC-004: should handle single character partial input', () => {
			const config: PartialInputConfig = {
				enabled: true,
				characterCount: 1,
				mode: 'start',
				highlightRange: true
			};

			const range = processor.calculateRange('つるまう', config);

			expect(range).toEqual({
				start: 0,
				end: 1,
				text: 'つ',
				fullText: 'つるまう'
			});
		});

		it('should return full text when disabled', () => {
			const config: PartialInputConfig = {
				enabled: false,
				characterCount: 5,
				mode: 'start',
				highlightRange: true
			};

			const range = processor.calculateRange('つるまう', config);

			expect(range).toEqual({
				start: 0,
				end: 4,
				text: 'つるまう',
				fullText: 'つるまう'
			});
		});
	});

	describe('Input Validation', () => {
		it('TC-005: should validate input within range', () => {
			const range: PartialInputRange = {
				start: 0,
				end: 3,
				text: 'つるま',
				fullText: 'つるまうかたちの'
			};

			processor.setRange(range);

			expect(processor.isWithinRange(0)).toBe(true);
			expect(processor.isWithinRange(2)).toBe(true);
			expect(processor.isWithinRange(3)).toBe(false);
		});

		it('TC-006: should reject input outside range', () => {
			const range: PartialInputRange = {
				start: 0,
				end: 2,
				text: 'つる',
				fullText: 'つるまう'
			};

			processor.setRange(range);

			expect(processor.isWithinRange(2)).toBe(false);
			expect(processor.isWithinRange(3)).toBe(false);
		});

		it('TC-007: should detect completion', () => {
			const range: PartialInputRange = {
				start: 0,
				end: 5,
				text: 'つるまうか',
				fullText: 'つるまうかたちの'
			};

			processor.setRange(range);

			expect(processor.isComplete(4)).toBe(false);
			expect(processor.isComplete(5)).toBe(true);
		});
	});

	describe('Progress Calculation', () => {
		it('should calculate progress within partial range', () => {
			const range: PartialInputRange = {
				start: 0,
				end: 5,
				text: 'つるまうか',
				fullText: 'つるまうかたちのぐんまけん'
			};

			processor.setRange(range);

			expect(processor.calculateProgress(0)).toBe(0);
			expect(processor.calculateProgress(3)).toBe(60); // 3/5 * 100
			expect(processor.calculateProgress(5)).toBe(100);
		});

		it('should handle mid-text ranges', () => {
			const range: PartialInputRange = {
				start: 3,
				end: 6,
				text: 'うかた',
				fullText: 'つるまうかたちの'
			};

			processor.setRange(range);

			expect(processor.calculateProgress(3)).toBe(0);
			expect(processor.calculateProgress(4)).toBe(33.33);
			expect(processor.calculateProgress(6)).toBe(100);
		});
	});

	describe('Configuration Management', () => {
		it('TC-015: should have correct defaults', () => {
			const config = processor.getDefaultConfig();

			expect(config).toEqual({
				enabled: false,
				characterCount: 5,
				mode: 'start',
				highlightRange: true
			});
		});

		it('TC-016: should apply presets', () => {
			const config = processor.applyPreset('beginner');

			expect(config).toEqual({
				enabled: true,
				characterCount: 5,
				mode: 'start',
				highlightRange: true
			});

			const intermediateConfig = processor.applyPreset('intermediate');
			expect(intermediateConfig.characterCount).toBe(10);

			const advancedConfig = processor.applyPreset('advanced');
			expect(advancedConfig.enabled).toBe(false);
		});
	});

	describe('Edge Cases', () => {
		it('TC-032: should handle empty text', () => {
			const config: PartialInputConfig = {
				enabled: true,
				characterCount: 5,
				mode: 'start',
				highlightRange: true
			};

			const range = processor.calculateRange('', config);

			expect(range).toEqual({
				start: 0,
				end: 0,
				text: '',
				fullText: ''
			});
		});

		it('TC-033: should handle single character text', () => {
			const config: PartialInputConfig = {
				enabled: true,
				characterCount: 5,
				mode: 'start',
				highlightRange: true
			};

			const range = processor.calculateRange('あ', config);

			expect(range).toEqual({
				start: 0,
				end: 1,
				text: 'あ',
				fullText: 'あ'
			});
		});

		it('TC-034: should handle special characters', () => {
			const config: PartialInputConfig = {
				enabled: true,
				characterCount: 3,
				mode: 'start',
				highlightRange: true
			};

			const range = processor.calculateRange('ーあ々', config);

			expect(range).toEqual({
				start: 0,
				end: 3,
				text: 'ーあ々',
				fullText: 'ーあ々'
			});
		});
	});
});
