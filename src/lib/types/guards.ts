/**
 * 型ガード関数
 */

import type { GameMode, DifficultyLevel, InputMode } from './game';

/**
 * 有効なゲームモードかチェック
 */
export const isValidGameMode = (mode: unknown): mode is GameMode => {
	return (
		typeof mode === 'string' &&
		['practice', 'specific', 'random', 'challenge', 'competition', 'multiplayer'].includes(mode)
	);
};

/**
 * 有効な難易度レベルかチェック
 */
export const isValidDifficulty = (level: unknown): level is DifficultyLevel => {
	return typeof level === 'string' && ['easy', 'medium', 'hard'].includes(level);
};

/**
 * 有効な入力モードかチェック
 */
export const isValidInputMode = (mode: unknown): mode is InputMode => {
	return typeof mode === 'string' && ['partial', 'complete'].includes(mode);
};