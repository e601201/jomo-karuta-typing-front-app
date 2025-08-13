# TASK-103: ローカルストレージ永続化 - 要件定義

## 概要

ブラウザのLocalStorageを使用してゲームデータを永続化するサービスの実装

## 機能要件

### 1. データ保存機能

- **ゲーム設定の保存**
  - 表示設定（テーマ、フォントサイズ等）
  - 音声設定（効果音のON/OFF、音量）
  - ゲーム設定（難易度、部分入力モード等）
- **ゲーム進捗の保存**
  - 現在のセッション状態
  - 完了した札のリスト
  - 最高スコア
  - プレイ統計

- **ユーザープロファイル**
  - ニックネーム
  - プレイ履歴
  - 成績サマリー

### 2. データ読み込み機能

- アプリ起動時の自動読み込み
- 設定の復元
- セッション再開機能

### 3. データ管理機能

- データの更新
- データの削除
- データのエクスポート/インポート
- ストレージ容量の管理

### 4. セキュリティ機能

- 簡易暗号化（Base64エンコーディング）
- データ整合性チェック
- 不正データの検出と処理

## 技術要件

### ストレージ構造

```typescript
interface LocalStorageSchema {
	// バージョン管理
	version: string;

	// ゲーム設定
	settings: GameSettings;

	// ユーザープロファイル
	profile: UserProfile;

	// ゲーム進捗
	progress: GameProgress;

	// セッション情報
	session: SavedSession | null;

	// 統計データ
	statistics: GameStatistics;
}

interface GameSettings {
	display: {
		theme: 'light' | 'dark' | 'auto';
		fontSize: 'small' | 'medium' | 'large';
		showFurigana: boolean;
	};
	sound: {
		enabled: boolean;
		volume: number; // 0-100
		effectsEnabled: boolean;
	};
	game: {
		defaultMode: 'practice' | 'specific' | 'random';
		partialInputLength: number;
		showHints: boolean;
	};
}

interface UserProfile {
	nickname: string;
	createdAt: string;
	lastPlayedAt: string;
	totalPlayTime: number; // ミリ秒
}

interface GameProgress {
	completedCards: string[]; // カードID配列
	bestScores: {
		[mode: string]: {
			score: number;
			accuracy: number;
			speed: number;
			date: string;
		};
	};
	achievements: Achievement[];
}

interface SavedSession {
	id: string;
	mode: string;
	startTime: string;
	cards: {
		current: any;
		currentIndex: number;
		remaining: any[];
		completed: any[];
	};
	score: {
		total: number;
		accuracy: number;
		speed: number;
		combo: number;
		maxCombo: number;
	};
	timer: {
		elapsedTime: number;
		pausedDuration: number;
	};
}

interface GameStatistics {
	totalGames: number;
	totalCards: number;
	totalTime: number;
	averageAccuracy: number;
	averageSpeed: number;
	cardStats: {
		[cardId: string]: {
			attempts: number;
			completions: number;
			averageTime: number;
			averageMistakes: number;
		};
	};
}

interface Achievement {
	id: string;
	unlockedAt: string;
}
```

### API設計

```typescript
class LocalStorageService {
	// 初期化
	initialize(): void;

	// 設定管理
	getSettings(): GameSettings;
	saveSettings(settings: Partial<GameSettings>): void;
	resetSettings(): void;

	// プロファイル管理
	getProfile(): UserProfile | null;
	saveProfile(profile: Partial<UserProfile>): void;

	// 進捗管理
	getProgress(): GameProgress;
	saveProgress(progress: Partial<GameProgress>): void;
	addCompletedCard(cardId: string): void;
	updateBestScore(mode: string, score: ScoreData): void;

	// セッション管理
	saveSession(session: GameState): void;
	loadSession(): SavedSession | null;
	clearSession(): void;
	hasSession(): boolean;

	// 統計管理
	getStatistics(): GameStatistics;
	updateStatistics(stats: Partial<GameStatistics>): void;
	updateCardStats(cardId: string, data: CardStatData): void;

	// データ管理
	exportData(): string;
	importData(data: string): boolean;
	clearAllData(): void;
	getStorageSize(): number;

	// ユーティリティ
	isStorageAvailable(): boolean;
	migrate(oldVersion: string, newVersion: string): void;
}
```

## データ永続化戦略

### 保存タイミング

1. **即座に保存**
   - 設定変更時
   - 札完了時
   - セッション終了時

2. **定期保存**
   - プレイ中は30秒ごと
   - 一時停止時

3. **イベント駆動**
   - ページ離脱時（beforeunload）
   - タブ非表示時（visibilitychange）

### ストレージキー

```typescript
const STORAGE_KEYS = {
	VERSION: 'jkt_version',
	SETTINGS: 'jkt_settings',
	PROFILE: 'jkt_profile',
	PROGRESS: 'jkt_progress',
	SESSION: 'jkt_session',
	STATISTICS: 'jkt_statistics'
} as const;
```

### データサイズ制限

- LocalStorage容量: 約5-10MB
- 各キーの最大サイズ: 1MB
- 古いデータの自動削除（LRU）

## エラーハンドリング

### 考慮すべきエラー

1. **ストレージ関連**
   - QuotaExceededError（容量超過）
   - SecurityError（セキュリティ制限）
   - ストレージ無効化

2. **データ関連**
   - 破損データの検出
   - バージョン不整合
   - 型不一致

3. **ブラウザ関連**
   - プライベートモード
   - Cookie無効化
   - サードパーティストレージ制限

### エラー処理方針

- フォールバック: メモリ内ストレージ
- データ修復: 部分的な復元を試みる
- ユーザー通知: 重要なエラーのみ表示

## パフォーマンス要件

1. **読み込み速度**
   - 初期化: 100ms以内
   - データ読み込み: 50ms以内

2. **保存速度**
   - 同期保存: 30ms以内
   - 非同期保存: バックグラウンド実行

3. **メモリ使用**
   - キャッシュサイズ: 最大1MB
   - メモリリークなし

## セキュリティ要件

1. **データ保護**
   - 個人情報は保存しない
   - 最小限の暗号化（Base64）
   - XSS対策（データサニタイズ）

2. **プライバシー**
   - ローカルのみで完結
   - 外部送信なし
   - クリア機能の提供

## テスト要件

### 単体テスト

1. 各メソッドの正常動作
2. エラーケースの処理
3. データ変換の正確性

### 統合テスト

1. ゲームストアとの連携
2. ブラウザイベントとの連携
3. データマイグレーション

### エッジケーステスト

1. ストレージ容量超過
2. 破損データの処理
3. プライベートモード対応

## 実装順序

1. 基本構造とインターフェース定義
2. 設定管理機能
3. プロファイル管理機能
4. 進捗管理機能
5. セッション管理機能
6. 統計管理機能
7. データ管理機能
8. エラーハンドリングとテスト

## 完了条件

- [ ] すべてのデータ型が永続化される
- [ ] ブラウザリロード後もデータが復元される
- [ ] エラーケースが適切に処理される
- [ ] テストカバレッジ90%以上
- [ ] TypeScript型チェックが通る
- [ ] パフォーマンス基準を満たす
