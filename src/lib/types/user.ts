/**
 * ユーザー関連の型定義
 */

import type { GameSettings } from './game';

/**
 * ユーザー統計
 */
export interface UserStats {
	userId?: string; // Phase 3-4
	totalSessions: number;
	totalTime: number;
	totalCards: number;
	averageAccuracy: number;
	averageWpm: number;
	bestWpm: number;
	cardProgress: CardProgress[];
	achievements: Achievement[]; // Phase 3-4
}

/**
 * 札ごとの進捗
 */
export interface CardProgress {
	cardId: string;
	attempts: number;
	bestTime: number;
	averageTime: number;
	averageAccuracy: number;
	lastAttemptAt: Date;
	mastered: boolean;
}

/**
 * 実績 (Phase 3-4)
 */
export interface Achievement {
	id: string;
	name: string;
	description: string;
	icon: string;
	unlockedAt?: Date;
	progress: number;
	target: number;
}

/**
 * ユーザープロフィール (Phase 3-4)
 */
export interface UserProfile {
	id: string;
	email: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
	level: number;
	experience: number;
	createdAt: Date;
	updatedAt: Date;
	settings: UserSettings;
}

/**
 * ユーザー設定
 */
export interface UserSettings extends GameSettings {
	notifications: boolean;
	emailUpdates: boolean;
	publicProfile: boolean;
	language: 'ja' | 'en';
}
