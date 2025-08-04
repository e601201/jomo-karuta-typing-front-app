// ========================================
// 犬棒カルタタイピングゲーム - TypeScript型定義
// ========================================

// ========================================
// 基本エンティティ
// ========================================

/**
 * 犬棒カルタの読み札データ
 */
export interface KarutaCard {
  /** 読み札ID */
  id: string;
  /** 読み札の文章（完全版） */
  text: string;
  /** 読み札の読み（ひらがな） */
  reading: string;
  /** 簡単モード用の部分文字列 */
  partialText: string;
  /** 難易度レベル（1-5） */
  difficulty: number;
  /** カテゴリ（教訓の種類など） */
  category: string;
}

/**
 * ゲーム難易度設定
 */
export interface GameDifficulty {
  /** 難易度ID */
  id: string;
  /** 難易度名 */
  name: string;
  /** 説明 */
  description: string;
  /** 完全入力が必要かどうか */
  requireFullInput: boolean;
  /** 部分入力の最小文字数 */
  minCharacters?: number;
  /** 制限時間の倍率 */
  timeMultiplier: number;
}

/**
 * ゲーム設定
 */
export interface GameSettings {
  /** 難易度設定 */
  difficulty: GameDifficulty;
  /** 制限時間（秒） */
  timeLimit: number;
  /** 音響効果の有効/無効 */
  soundEnabled: boolean;
  /** キーボードショートカットの有効/無効 */
  keyboardShortcutsEnabled: boolean;
  /** ダークモード */
  darkMode: boolean;
  /** フォントサイズ */
  fontSize: 'small' | 'medium' | 'large';
}

// ========================================
// ゲーム状態管理
// ========================================

/**
 * ゲーム状態の種別
 */
export type GameState = 
  | 'home'
  | 'settings'
  | 'gameSetup'
  | 'gaming'
  | 'paused'
  | 'gameOver'
  | 'result';

/**
 * タイピング入力の判定結果
 */
export interface TypingResult {
  /** 判定結果 */
  isCorrect: boolean;
  /** 入力された文字 */
  inputChar: string;
  /** 期待された文字 */
  expectedChar: string;
  /** 現在の入力位置 */
  position: number;
  /** 完了フラグ */
  isCompleted: boolean;
}

/**
 * 現在のゲーム進行状況
 */
export interface GameProgress {
  /** 現在の読み札 */
  currentCard: KarutaCard;
  /** 現在の入力位置 */
  currentPosition: number;
  /** 入力済みテキスト */
  inputText: string;
  /** 残り時間（秒） */
  remainingTime: number;
  /** 現在のスコア */
  currentScore: number;
  /** 完了した読み札数 */
  completedCards: number;
  /** 総読み札数 */
  totalCards: number;
  /** エラー回数 */
  errorCount: number;
}

/**
 * ゲームセッション全体の情報
 */
export interface GameSession {
  /** セッションID */
  sessionId: string;
  /** 開始時刻 */
  startTime: Date;
  /** 終了時刻 */
  endTime?: Date;
  /** 使用した設定 */
  settings: GameSettings;
  /** 進行状況 */
  progress: GameProgress;
  /** 現在の状態 */
  state: GameState;
  /** 使用する読み札リスト */
  cardList: KarutaCard[];
}

// ========================================
// スコア・記録管理
// ========================================

/**
 * タイピング精度の計算結果
 */
export interface TypingAccuracy {
  /** 正解文字数 */
  correctChars: number;
  /** 総入力文字数 */
  totalChars: number;
  /** 精度（%） */
  accuracy: number;
  /** WPM（Words Per Minute） */
  wpm: number;
  /** CPM（Characters Per Minute） */
  cpm: number;
}

/**
 * 個別カードのプレイ記録
 */
export interface CardPlayRecord {
  /** 読み札ID */
  cardId: string;
  /** 完了時間（秒） */
  completionTime: number;
  /** エラー回数 */
  errorCount: number;
  /** 精度情報 */
  accuracy: TypingAccuracy;
  /** 完了フラグ */
  completed: boolean;
}

/**
 * ゲーム結果
 */
export interface GameResult {
  /** セッションID */
  sessionId: string;
  /** プレイ日時 */
  playedAt: Date;
  /** 使用した設定 */
  settings: GameSettings;
  /** 総プレイ時間（秒） */
  totalPlayTime: number;
  /** 完了した読み札数 */
  completedCards: number;
  /** 総読み札数 */
  totalCards: number;
  /** 全体の精度情報 */
  overallAccuracy: TypingAccuracy;
  /** 各カードの記録 */
  cardRecords: CardPlayRecord[];
  /** 最終スコア */
  finalScore: number;
  /** 完了率（%） */
  completionRate: number;
}

/**
 * ハイスコア記録
 */
export interface HighScore {
  /** 記録ID */
  id: string;
  /** スコア */
  score: number;
  /** プレイ日時 */
  achievedAt: Date;
  /** 使用した難易度 */
  difficulty: string;
  /** WPM記録 */
  wpm: number;
  /** 精度記録 */
  accuracy: number;
  /** 完了率 */
  completionRate: number;
}

// ========================================
// UI・イベント関連
// ========================================

/**
 * キーボード入力イベント
 */
export interface KeyInputEvent {
  /** 入力キー */
  key: string;
  /** 修飾キー情報 */
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  };
  /** イベント発生時刻 */
  timestamp: number;
}

/**
 * ゲーム画面の表示状態
 */
export interface DisplayState {
  /** 現在表示中の読み札 */
  displayedCard: KarutaCard | null;
  /** 入力中のテキスト表示用情報 */
  inputDisplay: {
    /** 完了済み部分 */
    completed: string;
    /** 現在入力位置の文字 */
    current: string;
    /** 残り部分 */
    remaining: string;
  };
  /** タイマー表示 */
  timerDisplay: {
    /** 残り時間（秒） */
    remainingTime: number;
    /** 時間表示形式（MM:SS） */
    formattedTime: string;
    /** 警告状態（残り時間少ない） */
    isWarning: boolean;
  };
  /** スコア表示 */
  scoreDisplay: {
    /** 現在スコア */
    current: number;
    /** 進捗率（%） */
    progress: number;
    /** エラー回数 */
    errors: number;
    /** WPM */
    wpm: number;
  };
}

/**
 * 設定画面のフォーム状態
 */
export interface SettingsFormState {
  /** 一時的な設定値 */
  tempSettings: GameSettings;
  /** 変更があったかどうか */
  hasChanges: boolean;
  /** バリデーションエラー */
  validationErrors: Record<string, string>;
  /** 保存中フラグ */
  isSaving: boolean;
}

// ========================================
// データサービス関連
// ========================================

/**
 * ローカルストレージのキー定義
 */
export const StorageKeys = {
  GAME_SETTINGS: 'karuta-game-settings',
  HIGH_SCORES: 'karuta-high-scores',
  PLAY_HISTORY: 'karuta-play-history',
  USER_PREFERENCES: 'karuta-user-preferences'
} as const;

/**
 * ストレージに保存するデータの型
 */
export interface StorageData {
  [StorageKeys.GAME_SETTINGS]: GameSettings;
  [StorageKeys.HIGH_SCORES]: HighScore[];
  [StorageKeys.PLAY_HISTORY]: GameResult[];
  [StorageKeys.USER_PREFERENCES]: {
    lastPlayedAt?: Date;
    totalPlayTime: number;
    gamesPlayed: number;
    favoriteCard?: string;
  };
}

/**
 * ストレージサービスのインターフェース
 */
export interface StorageService {
  /** データ取得 */
  get<K extends keyof StorageData>(key: K): StorageData[K] | null;
  /** データ保存 */
  set<K extends keyof StorageData>(key: K, value: StorageData[K]): void;
  /** データ削除 */
  remove<K extends keyof StorageData>(key: K): void;
  /** 全データクリア */
  clear(): void;
  /** ストレージ利用可能チェック */
  isAvailable(): boolean;
}

// ========================================
// エラー・例外関連
// ========================================

/**
 * ゲーム関連のエラー種別
 */
export type GameErrorType =
  | 'STORAGE_ERROR'
  | 'CARD_DATA_ERROR'
  | 'TIMER_ERROR'
  | 'INPUT_ERROR'
  | 'SETTINGS_ERROR';

/**
 * ゲームエラー
 */
export interface GameError {
  /** エラー種別 */
  type: GameErrorType;
  /** エラーメッセージ */
  message: string;
  /** エラー詳細 */
  details?: string;
  /** エラー発生時刻 */
  timestamp: Date;
  /** 復旧可能かどうか */
  recoverable: boolean;
}

// ========================================
// ユーティリティ型
// ========================================

/**
 * デフォルト設定値
 */
export interface DefaultValues {
  GAME_SETTINGS: GameSettings;
  DIFFICULTIES: GameDifficulty[];
  TIME_LIMITS: number[];
  CARD_CATEGORIES: string[];
}

/**
 * API応答の共通形式（将来の拡張用）
 */
export interface ApiResponse<T> {
  /** 成功フラグ */
  success: boolean;
  /** データ */
  data?: T;
  /** エラー情報 */
  error?: {
    /** エラーコード */
    code: string;
    /** エラーメッセージ */
    message: string;
    /** エラー詳細 */
    details?: Record<string, unknown>;
  };
  /** タイムスタンプ */
  timestamp: Date;
}

/**
 * イベント発火用の型定義
 */
export interface GameEvents {
  /** ゲーム開始 */
  'game:start': GameSession;
  /** ゲーム終了 */
  'game:end': GameResult;
  /** ゲーム一時停止 */
  'game:pause': GameSession;
  /** ゲーム再開 */
  'game:resume': GameSession;
  /** 文字入力 */
  'typing:input': TypingResult;
  /** カード完了 */
  'card:complete': CardPlayRecord;
  /** スコア更新 */
  'score:update': number;
  /** 設定変更 */
  'settings:change': GameSettings;
  /** エラー発生 */
  'game:error': GameError;
}