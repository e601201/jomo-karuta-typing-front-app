/**
 * マルチプレイヤー関連の型定義 (Phase 4)
 */

/**
 * 対戦ルーム
 */
export interface MatchRoom {
	id: string;
	hostId: string;
	guestId?: string;
	status: MatchStatus;
	settings: MatchSettings;
	createdAt: Date;
	startedAt?: Date;
	endedAt?: Date;
}

/**
 * 対戦状態
 */
export type MatchStatus = 'waiting' | 'ready' | 'playing' | 'finished' | 'cancelled';

/**
 * 対戦設定
 */
export interface MatchSettings {
	mode: 'realtime' | 'turn';
	cardCount: number;
	timeLimit?: number;
	allowSpectators: boolean;
}

/**
 * 対戦進捗
 */
export interface MatchProgress {
	roomId: string;
	playerId: string;
	currentCard: number;
	currentPosition: number;
	mistakes: number;
	completed: boolean;
}

/**
 * リアルタイムメッセージ
 */
export interface RealtimeMessage<T = unknown> {
	type: MessageType;
	payload: T;
	timestamp: number;
	senderId?: string;
}

/**
 * メッセージタイプ
 */
export type MessageType =
	| 'player_joined'
	| 'player_left'
	| 'game_start'
	| 'game_end'
	| 'progress_update'
	| 'chat_message';

/**
 * プログレス更新ペイロード
 */
export interface ProgressUpdatePayload {
	playerId: string;
	cardIndex: number;
	charIndex: number;
	accuracy: number;
}
