/**
 * ストレージ関連の型定義
 */

import type { GameSettings, GameSession, GameResult } from './game';
import type { CardProgress, UserStats } from './user';

/**
 * ローカルストレージデータ
 */
export interface LocalStorageData {
	version: string;
	settings: GameSettings;
	lastSessionId?: string;
	lastPlayedAt?: Date;
}

/**
 * IndexedDBスキーマ
 */
export interface IndexedDBSchema {
	sessions: GameSession;
	results: GameResult;
	cardProgress: CardProgress;
	userStats: UserStats;
}