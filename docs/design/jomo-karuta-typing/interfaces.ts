// ============================================
// 基本エンティティ定義
// ============================================

/**
 * 上毛かるたの札データ
 */
export interface KarutaCard {
	id: string; // 一意識別子
	hiragana: string; // ひらがな読み
	romaji: string; // ローマ字表記
	meaning: string; // 意味・解説
	category: CardCategory; // カテゴリー
	difficulty: DifficultyLevel; // 難易度
	imageUrl?: string; // 絵札画像URL (オプション)
	audioUrl?: string; // 音声URL (オプション)
}

/**
 * かるたのカテゴリー
 */
export type CardCategory =
	| 'history' // 歴史
	| 'geography' // 地理
	| 'culture' // 文化
	| 'nature' // 自然
	| 'industry'; // 産業

/**
 * 難易度レベル
 */
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

/**
 * ゲームモード
 */
export type GameMode =
	| 'practice' // 練習モード
	| 'specific' // 特定札練習
	| 'random' // ランダム出題
	| 'challenge' // チャレンジモード (Phase 3)
	| 'competition' // 競技モード (Phase 4)
	| 'multiplayer'; // 対戦モード (Phase 4)

/**
 * 入力モード
 */
export type InputMode =
	| 'partial' // 部分入力
	| 'complete'; // 完全入力

// ============================================
// ゲーム状態管理
// ============================================

/**
 * ゲーム設定
 */
export interface GameSettings {
	mode: GameMode;
	inputMode: InputMode;
	partialLength?: number; // 部分入力時の文字数 (3-10)
	soundEnabled: boolean;
	bgmEnabled: boolean;
	showHints: boolean;
	showRomaji: boolean;
	fontSize: 'small' | 'medium' | 'large';
	theme: 'light' | 'dark' | 'auto';
}

/**
 * ゲームセッション
 */
export interface GameSession {
	id: string;
	userId?: string; // Phase 3-4
	mode: GameMode;
	startedAt: Date;
	endedAt?: Date;
	cards: string[]; // 出題札のID配列
	currentCardIndex: number;
	status: GameStatus;
	settings: GameSettings;
	results?: GameResult;
}

/**
 * ゲーム状態
 */
export type GameStatus =
	| 'idle' // 待機中
	| 'loading' // 読み込み中
	| 'playing' // プレイ中
	| 'paused' // 一時停止
	| 'completed' // 完了
	| 'error'; // エラー

/**
 * カード入力状態
 */
export interface CardInputState {
	cardId: string;
	totalChars: number;
	inputChars: number;
	correctChars: number;
	mistakes: number;
	startTime: number;
	endTime?: number;
	inputs: InputEvent[];
}

/**
 * 入力イベント
 */
export interface InputEvent {
	char: string;
	correct: boolean;
	timestamp: number;
	position: number;
}

// ============================================
// 成績・統計データ
// ============================================

/**
 * ゲーム結果
 */
export interface GameResult {
	sessionId: string;
	totalTime: number; // 総時間（ミリ秒）
	totalCards: number; // 総札数
	completedCards: number; // 完了札数
	totalChars: number; // 総文字数
	correctChars: number; // 正解文字数
	mistakes: number; // ミス回数
	accuracy: number; // 正確率（％）
	wpm: number; // Words Per Minute
	cpm: number; // Characters Per Minute
	score: number; // スコア
	cardResults: CardResult[];
}

/**
 * 個別札の結果
 */
export interface CardResult {
	cardId: string;
	time: number; // 所要時間（ミリ秒）
	mistakes: number; // ミス回数
	accuracy: number; // 正確率（％）
	completed: boolean;
}

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

// ============================================
// ユーザー関連 (Phase 3-4)
// ============================================

/**
 * ユーザープロフィール
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

// ============================================
// 対戦機能 (Phase 4)
// ============================================

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
export type MatchStatus =
	| 'waiting' // 待機中
	| 'ready' // 準備完了
	| 'playing' // 対戦中
	| 'finished' // 終了
	| 'cancelled'; // キャンセル

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

// ============================================
// API レスポンス
// ============================================

/**
 * 汎用APIレスポンス
 */
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: ApiError;
	metadata?: ResponseMetadata;
}

/**
 * APIエラー
 */
export interface ApiError {
	code: string;
	message: string;
	details?: unknown;
}

/**
 * レスポンスメタデータ
 */
export interface ResponseMetadata {
	timestamp: string;
	version: string;
	requestId?: string;
}

// ============================================
// ストレージ関連
// ============================================

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

// ============================================
// リアルタイム通信 (Phase 3-4)
// ============================================

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

// ============================================
// 型ガード関数
// ============================================

export const isValidGameMode = (mode: unknown): mode is GameMode => {
	return (
		typeof mode === 'string' &&
		['practice', 'specific', 'random', 'challenge', 'competition', 'multiplayer'].includes(mode)
	);
};

export const isValidDifficulty = (level: unknown): level is DifficultyLevel => {
	return typeof level === 'string' && ['easy', 'medium', 'hard'].includes(level);
};

export const isValidInputMode = (mode: unknown): mode is InputMode => {
	return typeof mode === 'string' && ['partial', 'complete'].includes(mode);
};
