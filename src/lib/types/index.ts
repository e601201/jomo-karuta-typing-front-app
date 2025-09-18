/**
 * 型定義のエクスポート
 */

// ゲーム関連
export type {
	KarutaCard,
	CardCategory,
	DifficultyLevel,
	GameMode,
	InputMode,
	GameSettings,
	GameSession,
	GameStatus,
	CardInputState,
	InputEvent,
	GameResult,
	CardResult,
	PartialInputConfig,
	PartialInputMode,
	PartialInputRange,
	PartialInputPreset,
	RandomModeDifficulty
} from './game';

// ユーザー関連
export type { UserStats, CardProgress, Achievement, UserProfile, UserSettings } from './user';

// ストレージ関連
export type { LocalStorageData, IndexedDBSchema } from './storage';

// マルチプレイヤー関連
export type {
	MatchRoom,
	MatchStatus,
	MatchSettings,
	MatchProgress,
	RealtimeMessage,
	MessageType,
	ProgressUpdatePayload
} from './multiplayer';

// API関連
export type { ApiResponse, ApiError, ResponseMetadata } from './api';

// 型ガード関数
export { isValidGameMode, isValidDifficulty, isValidInputMode } from './guards';
