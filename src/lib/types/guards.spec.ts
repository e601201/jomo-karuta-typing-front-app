/**
 * 型ガード関数のテスト
 */

import { describe, it, expect } from 'vitest';
import { isValidGameMode, isValidDifficulty, isValidInputMode } from './guards';

describe('型ガード関数', () => {
	describe('isValidGameMode', () => {
		it('有効なゲームモードを正しく判定する', () => {
			expect(isValidGameMode('practice')).toBe(true);
			expect(isValidGameMode('specific')).toBe(true);
			expect(isValidGameMode('random')).toBe(true);
			expect(isValidGameMode('challenge')).toBe(true);
			expect(isValidGameMode('competition')).toBe(true);
			expect(isValidGameMode('multiplayer')).toBe(true);
		});

		it('無効なゲームモードを正しく判定する', () => {
			expect(isValidGameMode('invalid')).toBe(false);
			expect(isValidGameMode('')).toBe(false);
			expect(isValidGameMode(123)).toBe(false);
			expect(isValidGameMode(null)).toBe(false);
			expect(isValidGameMode(undefined)).toBe(false);
			expect(isValidGameMode({})).toBe(false);
		});
	});

	describe('isValidDifficulty', () => {
		it('有効な難易度を正しく判定する', () => {
			expect(isValidDifficulty('easy')).toBe(true);
			expect(isValidDifficulty('medium')).toBe(true);
			expect(isValidDifficulty('hard')).toBe(true);
		});

		it('無効な難易度を正しく判定する', () => {
			expect(isValidDifficulty('very-hard')).toBe(false);
			expect(isValidDifficulty('')).toBe(false);
			expect(isValidDifficulty(1)).toBe(false);
			expect(isValidDifficulty(null)).toBe(false);
			expect(isValidDifficulty(undefined)).toBe(false);
		});
	});

	describe('isValidInputMode', () => {
		it('有効な入力モードを正しく判定する', () => {
			expect(isValidInputMode('partial')).toBe(true);
			expect(isValidInputMode('complete')).toBe(true);
		});

		it('無効な入力モードを正しく判定する', () => {
			expect(isValidInputMode('full')).toBe(false);
			expect(isValidInputMode('')).toBe(false);
			expect(isValidInputMode(true)).toBe(false);
			expect(isValidInputMode(null)).toBe(false);
			expect(isValidInputMode(undefined)).toBe(false);
		});
	});
});
