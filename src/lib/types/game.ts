/**
 * ゲーム関連の型定義
 */

/**
 * 上毛カルタの札データ
 */
export interface KarutaCard {
	id: string; // 一意識別子 (例: 'tsu', 'ne', 'chi')
	hiragana: string; // ひらがな読み
	romaji: string; // ローマ字表記
	meaning: string; // 意味・解説
	category: CardCategory; // カテゴリー
	difficulty: DifficultyLevel; // 難易度
	imageUrl?: string; // 絵札画像URL (オプション)
	audioUrl?: string; // 音声URL (オプション)
	images?: {
		torifuda: string; // 取り札画像パス
		yomifuda: string; // 読み札画像パス
		kaisetsu: string; // 解説画像パス
	};
}

/**
 * カルタのカテゴリー
 */
export type CardCategory = 'history' | 'geography' | 'culture' | 'nature' | 'industry';

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
export type InputMode = 'partial' | 'complete';

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
export type GameStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'completed' | 'error';

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
 * 部分入力モード設定
 */
export interface PartialInputConfig {
	enabled: boolean; // 部分入力モードの有効/無効
	characterCount: number; // 入力対象文字数
	mode: PartialInputMode; // 範囲決定モード
	highlightRange: boolean; // 範囲ハイライトの有無
}

/**
 * 部分入力モードの種類
 */
export type PartialInputMode = 'start' | 'random' | 'important';

/**
 * 部分入力範囲
 */
export interface PartialInputRange {
	start: number; // 開始位置（0ベース）
	end: number; // 終了位置（含まない）
	text: string; // 対象テキスト
	fullText: string; // 全文
}

/**
 * 部分入力プリセット
 */
export type PartialInputPreset = 'beginner' | 'intermediate' | 'advanced' | 'custom';

/**
 * 統計データ - 全体統計
 */
export interface OverallStats {
	totalSessions: number;
	totalPlayTime: number; // milliseconds
	totalKeysTyped: number;
	totalCardsCompleted: number;
	averageWPM: number;
	maxWPM: number;
	averageAccuracy: number;
	maxAccuracy: number;
	currentStreak: number;
	longestStreak: number;
	totalScore: number;
	level: number;
	rank: string;
}

/**
 * 統計データ - セッション統計
 */
export interface SessionStats {
	id: string;
	timestamp: Date;
	mode: GameMode;
	duration: number;
	cardsCompleted: number;
	wpm: number;
	accuracy: number;
	score: number;
	mistakes: number;
	partialInputUsed: boolean;
}

/**
 * 統計データ - カード別統計
 */
export interface CardStats {
	cardId: string;
	timesPlayed: number;
	bestTime: number;
	averageTime: number;
	accuracy: number;
	lastPlayed: Date;
}

/**
 * グラフ用データ構造
 */
export interface ChartData {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		color?: string;
	}[];
}

/**
 * フィルターオプション
 */
export interface FilterOptions {
	period?: 'today' | 'week' | 'month' | 'all';
	mode?: GameMode;
	cardId?: string;
}

/**
 * トレンドデータ
 */
export interface TrendData {
	wpmTrend: number[]; // 日別WPM
	accuracyTrend: number[]; // 日別正確率
	playTimeTrend: number[]; // 日別プレイ時間
	labels: string[]; // 日付ラベル
}

/**
 * ユーザー設定（GameSettingsを拡張）
 */
export interface UserSettings extends GameSettings {
	display: DisplaySettings;
	sound: SoundSettings;
	practice: PracticeSettings;
	keyboard: KeyboardSettings;
	accessibility: AccessibilitySettings;
}

/**
 * 表示設定
 */
export interface DisplaySettings {
	fontSize: 'small' | 'medium' | 'large' | 'extra-large';
	theme: 'light' | 'dark' | 'auto';
	animations: boolean;
	animationSpeed: 'slow' | 'normal' | 'fast';
	showFurigana: boolean;
	showMeaning: boolean;
	showCardImages?: boolean;
}

/**
 * サウンド設定
 */
export interface SoundSettings {
	effectsEnabled: boolean;
	effectsVolume: number; // 0-100
	bgmEnabled: boolean;
	bgmVolume: number; // 0-100
	typingSoundEnabled: boolean;
	typingSoundVolume: number; // 0-100
	voiceEnabled: boolean;
	voiceSpeed: number; // 0.5-2.0
}

/**
 * 練習設定
 */
export interface PracticeSettings {
	order: 'sequential' | 'random' | 'weak-first';
	repetitions: number; // 1-5
	timeLimit: number | null; // seconds or null for unlimited
	difficulty: 'beginner' | 'intermediate' | 'advanced' | 'custom';
}

/**
 * キーボード設定
 */
export interface KeyboardSettings {
	layout: 'JIS' | 'US';
	inputMethod: 'romaji' | 'kana';
	shortcuts: {
		pause: string;
		skip: string;
		retry: string;
	};
}

/**
 * アクセシビリティ設定
 */
export interface AccessibilitySettings {
	highContrast: boolean;
	reduceMotion: boolean;
	screenReaderMode: boolean;
	keyboardOnly: boolean;
}
