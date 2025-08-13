# TASK-104: IndexedDB実装 - 要件定義

## 概要

Dexie.jsを使用してIndexedDBによる大容量データの永続化機能を実装する。LocalStorageの制限を超える詳細な成績データやゲーム履歴を保存可能にする。

## 機能要件

### 1. データベース設計

- **データベース名**: `JomoKarutaDB`
- **バージョン管理**: スキーマ変更時の自動マイグレーション
- **テーブル構造**:
  - `gameHistory`: ゲーム履歴
  - `detailedStats`: 詳細統計
  - `cardHistory`: カード別履歴
  - `achievements`: アチーブメント詳細
  - `sessions`: セッション詳細データ

### 2. データモデル

```typescript
interface GameHistory {
	id?: number; // auto-increment
	sessionId: string;
	mode: 'practice' | 'specific' | 'random';
	startTime: Date;
	endTime: Date;
	cards: CardResult[];
	score: {
		total: number;
		accuracy: number;
		speed: number;
		maxCombo: number;
	};
	settings: GameSettings;
}

interface CardResult {
	cardId: string;
	startTime: Date;
	endTime: Date;
	inputHistory: InputEvent[];
	mistakes: number;
	wpm: number;
	accuracy: number;
}

interface InputEvent {
	timestamp: Date;
	input: string;
	expected: string;
	correct: boolean;
	position: number;
}

interface DetailedStats {
	id?: number;
	date: Date;
	dailyStats: {
		gamesPlayed: number;
		cardsCompleted: number;
		totalTime: number;
		averageAccuracy: number;
		averageSpeed: number;
		bestScore: number;
	};
	weeklyAggregates?: WeeklyStats;
	monthlyAggregates?: MonthlyStats;
}

interface CardHistory {
	id?: number;
	cardId: string;
	attempts: AttemptRecord[];
	bestTime: number;
	bestAccuracy: number;
	lastAttempt: Date;
}

interface AttemptRecord {
	date: Date;
	time: number;
	accuracy: number;
	mistakes: number;
	wpm: number;
}
```

### 3. API設計

```typescript
class IndexedDBService {
	private db: Dexie;

	// 初期化
	async initialize(): Promise<void>;

	// ゲーム履歴
	async saveGameHistory(history: GameHistory): Promise<number>;
	async getGameHistory(limit?: number, offset?: number): Promise<GameHistory[]>;
	async getGameHistoryByMode(mode: string): Promise<GameHistory[]>;
	async deleteOldHistory(daysToKeep: number): Promise<void>;

	// 詳細統計
	async saveDailyStats(stats: DetailedStats): Promise<void>;
	async getDailyStats(date: Date): Promise<DetailedStats | null>;
	async getStatsRange(startDate: Date, endDate: Date): Promise<DetailedStats[]>;
	async aggregateWeeklyStats(weekStart: Date): Promise<WeeklyStats>;
	async aggregateMonthlyStats(month: Date): Promise<MonthlyStats>;

	// カード履歴
	async saveCardAttempt(cardId: string, attempt: AttemptRecord): Promise<void>;
	async getCardHistory(cardId: string): Promise<CardHistory | null>;
	async getTopCards(limit: number): Promise<CardHistory[]>;
	async getStruggleCards(limit: number): Promise<CardHistory[]>;

	// データ管理
	async exportDatabase(): Promise<Blob>;
	async importDatabase(data: Blob): Promise<void>;
	async clearDatabase(): Promise<void>;
	async getDatabaseSize(): Promise<number>;
	async vacuum(): Promise<void>; // 不要データの削除

	// クエリ機能
	async searchHistory(query: SearchQuery): Promise<GameHistory[]>;
	async getStatsSummary(): Promise<StatsSummary>;
	async getAchievementProgress(): Promise<AchievementProgress[]>;
}
```

### 4. インデックス設計

効率的なクエリのためのインデックス:

- `gameHistory`: `[mode+startTime]`, `sessionId`, `startTime`
- `detailedStats`: `date`, `[date+dailyStats.gamesPlayed]`
- `cardHistory`: `cardId`, `[cardId+lastAttempt]`, `bestTime`

### 5. パフォーマンス要件

- **初期化時間**: 200ms以内
- **データ保存**: 50ms以内
- **クエリ実行**:
  - 単純クエリ: 30ms以内
  - 集計クエリ: 100ms以内
  - 範囲クエリ: 150ms以内
- **メモリ使用**: 最大50MB
- **ストレージ使用**: 最大500MB（自動削除機能あり）

### 6. データ管理戦略

#### 自動削除ポリシー

- ゲーム履歴: 90日以上前のデータを自動削除
- 詳細統計: 日次データは30日、集計データは永続保存
- カード履歴: 最新100件のみ保持

#### バックアップ戦略

- 週次で自動エクスポート（LocalStorageに最終バックアップ日時を記録）
- 手動エクスポート/インポート機能

#### データ整合性

- トランザクション使用による整合性保証
- 破損データの自動検出と修復
- LocalStorageとの同期（重要データのみ）

## 技術要件

### 依存関係

```json
{
	"dependencies": {
		"dexie": "^4.0.0"
	}
}
```

### ブラウザ要件

- Chrome 24+
- Firefox 16+
- Safari 15+
- Edge 79+

### エラーハンドリング

#### 考慮すべきエラー

1. **容量超過**
   - QuotaExceededError
   - 古いデータの自動削除で対応

2. **ブラウザサポート**
   - IndexedDB非対応
   - LocalStorageへフォールバック

3. **データ破損**
   - 不正なデータ形式
   - スキーマ不一致
   - 自動修復またはリセット

4. **同時アクセス**
   - 複数タブからのアクセス
   - トランザクション管理で対応

## テスト要件

### 単体テスト

1. **CRUD操作**
   - 各テーブルの作成・読込・更新・削除
   - トランザクション処理
   - インデックス検索

2. **クエリ機能**
   - 範囲検索
   - 集計処理
   - ソート・フィルタリング

3. **データ管理**
   - 自動削除
   - エクスポート/インポート
   - サイズ計算

### 統合テスト

1. **マイグレーション**
   - スキーマバージョンアップ
   - データ変換
   - 後方互換性

2. **パフォーマンス**
   - 大量データでの動作
   - メモリリーク検証
   - 応答時間測定

3. **エラー処理**
   - 容量超過シミュレーション
   - ブラウザ非対応環境
   - データ破損対応

### エッジケース

- 100,000件以上のデータ
- 500MB超のストレージ使用
- 複数タブでの同時操作
- オフライン環境での動作

## 実装順序

1. Dexie.jsのインストールと基本設定
2. データベーススキーマ定義
3. 基本的なCRUD操作の実装
4. インデックスとクエリ機能
5. データ管理機能（削除、バックアップ）
6. パフォーマンス最適化
7. エラーハンドリングとフォールバック
8. テストの実装

## 完了条件

- [ ] Dexie.jsを使用したIndexedDB実装が完了
- [ ] 全てのCRUD操作が正常に動作
- [ ] データマイグレーションが実装されている
- [ ] 自動削除機能が動作する
- [ ] パフォーマンス基準を満たす
- [ ] テストカバレッジ90%以上
- [ ] TypeScript型チェックが通る
- [ ] エラーハンドリングが適切に実装されている
