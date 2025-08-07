# TASK-104: IndexedDB実装 - テストケース設計

## テストケース一覧

### 1. 初期化テスト

#### TC-001: データベース初期化

```typescript
describe('IndexedDBService - 初期化', () => {
	it('データベースが正しく初期化される', async () => {
		// 期待値:
		// - Dexieインスタンスが作成される
		// - スキーマが定義される
		// - 接続が確立される
	});

	it('IndexedDBが利用できない場合にエラーを投げる', async () => {
		// 期待値:
		// - 適切なエラーメッセージ
		// - フォールバック処理の提案
	});

	it('既存のデータベースに再接続できる', async () => {
		// 期待値:
		// - 既存データが保持される
		// - バージョンが維持される
	});
});
```

### 2. ゲーム履歴テスト

#### TC-002: ゲーム履歴CRUD

```typescript
describe('IndexedDBService - ゲーム履歴', () => {
	it('ゲーム履歴を保存できる', async () => {
		// 入力: GameHistory オブジェクト
		// 期待値:
		// - 自動生成されたID
		// - 保存確認
	});

	it('ゲーム履歴を取得できる', async () => {
		// 期待値:
		// - ページネーション対応
		// - 新しい順でソート
	});

	it('モードで履歴をフィルタリングできる', async () => {
		// 入力: mode = 'practice'
		// 期待値:
		// - 該当モードのみ返される
	});

	it('古い履歴を削除できる', async () => {
		// 入力: daysToKeep = 90
		// 期待値:
		// - 90日以前のデータ削除
		// - 最近のデータは保持
	});

	it('大量データでもパフォーマンスが維持される', async () => {
		// 入力: 10000件のゲーム履歴
		// 期待値:
		// - 保存: 50ms以内
		// - 取得: 30ms以内
	});
});
```

### 3. 詳細統計テスト

#### TC-003: 統計データ管理

```typescript
describe('IndexedDBService - 詳細統計', () => {
	it('日次統計を保存できる', async () => {
		// 入力: DetailedStats
		// 期待値:
		// - 日付でユニーク
		// - 上書き更新
	});

	it('期間指定で統計を取得できる', async () => {
		// 入力: startDate, endDate
		// 期待値:
		// - 指定期間のデータ
		// - 日付順でソート
	});

	it('週次集計を計算できる', async () => {
		// 期待値:
		// - 7日分の集計
		// - 平均値計算
	});

	it('月次集計を計算できる', async () => {
		// 期待値:
		// - 月間の集計
		// - トレンド分析データ
	});
});
```

### 4. カード履歴テスト

#### TC-004: カード別履歴管理

```typescript
describe('IndexedDBService - カード履歴', () => {
	it('カードの挑戦記録を保存できる', async () => {
		// 入力: cardId, AttemptRecord
		// 期待値:
		// - 履歴に追加
		// - ベスト記録更新
	});

	it('カード履歴を取得できる', async () => {
		// 入力: cardId
		// 期待値:
		// - 全挑戦記録
		// - 統計情報
	});

	it('上位カードを取得できる', async () => {
		// 入力: limit = 10
		// 期待値:
		// - ベストタイム順
		// - 指定件数
	});

	it('苦手カードを特定できる', async () => {
		// 期待値:
		// - 精度が低いカード
		// - 時間がかかるカード
	});

	it('履歴数の上限を管理できる', async () => {
		// 入力: 101件目の記録
		// 期待値:
		// - 最古の記録削除
		// - 100件を維持
	});
});
```

### 5. データ管理テスト

#### TC-005: エクスポート/インポート

```typescript
describe('IndexedDBService - データ管理', () => {
	it('データベースをエクスポートできる', async () => {
		// 期待値:
		// - Blob形式
		// - 全テーブルデータ
		// - メタデータ含む
	});

	it('データベースをインポートできる', async () => {
		// 入力: エクスポートされたBlob
		// 期待値:
		// - データ復元
		// - スキーマ検証
	});

	it('データベースをクリアできる', async () => {
		// 期待値:
		// - 全テーブル削除
		// - スキーマは維持
	});

	it('データベースサイズを取得できる', async () => {
		// 期待値:
		// - バイト単位
		// - 各テーブルのサイズ
	});

	it('不要データを削除できる（vacuum）', async () => {
		// 期待値:
		// - 古いデータ削除
		// - インデックス再構築
		// - サイズ削減
	});
});
```

### 6. クエリ機能テスト

#### TC-006: 検索と集計

```typescript
describe('IndexedDBService - クエリ機能', () => {
	it('複合条件で検索できる', async () => {
		// 入力: mode, dateRange, minScore
		// 期待値:
		// - 全条件に一致
		// - 効率的な実行
	});

	it('統計サマリーを取得できる', async () => {
		// 期待値:
		// - 総ゲーム数
		// - 平均スコア
		// - ベスト記録
	});

	it('アチーブメント進捗を計算できる', async () => {
		// 期待値:
		// - 達成率
		// - 未達成項目
		// - 次の目標
	});

	it('インデックスを活用した高速検索', async () => {
		// 入力: 10000件から検索
		// 期待値:
		// - 30ms以内
		// - 正確な結果
	});
});
```

### 7. マイグレーションテスト

#### TC-007: スキーマ変更

```typescript
describe('IndexedDBService - マイグレーション', () => {
	it('新しいテーブルを追加できる', async () => {
		// 期待値:
		// - 既存データ保持
		// - 新テーブル作成
	});

	it('カラムを追加できる', async () => {
		// 期待値:
		// - 既存レコード更新
		// - デフォルト値設定
	});

	it('インデックスを追加できる', async () => {
		// 期待値:
		// - パフォーマンス向上
		// - 既存クエリ動作
	});

	it('後方互換性を保つ', async () => {
		// 期待値:
		// - 旧バージョンデータ読込
		// - 自動変換
	});
});
```

### 8. エラーハンドリングテスト

#### TC-008: エラー処理

```typescript
describe('IndexedDBService - エラーハンドリング', () => {
	it('容量超過エラーを処理できる', async () => {
		// シナリオ: QuotaExceededError
		// 期待値:
		// - 古いデータ自動削除
		// - 再試行成功
	});

	it('破損データを検出できる', async () => {
		// シナリオ: 不正なデータ形式
		// 期待値:
		// - エラーログ
		// - スキップして継続
	});

	it('同時アクセスを処理できる', async () => {
		// シナリオ: 複数タブから同時更新
		// 期待値:
		// - トランザクション管理
		// - データ整合性維持
	});

	it('ブラウザ非対応を検出できる', async () => {
		// 期待値:
		// - 適切なエラーメッセージ
		// - フォールバック提案
	});
});
```

### 9. パフォーマンステスト

#### TC-009: パフォーマンス

```typescript
describe('IndexedDBService - パフォーマンス', () => {
	it('初期化が200ms以内に完了する', async () => {
		// 計測: initialize()
	});

	it('単純クエリが30ms以内に完了する', async () => {
		// 計測: 単一条件検索
	});

	it('集計クエリが100ms以内に完了する', async () => {
		// 計測: 統計計算
	});

	it('範囲クエリが150ms以内に完了する', async () => {
		// 計測: 期間指定検索
	});

	it('メモリ使用量が50MB以内', async () => {
		// 計測: 10000件ロード時
	});

	it('並行処理でもパフォーマンス維持', async () => {
		// シナリオ: 10個の同時クエリ
		// 期待値: 各クエリ100ms以内
	});
});
```

### 10. 統合テスト

#### TC-010: LocalStorageとの連携

```typescript
describe('IndexedDBService - 統合', () => {
	it('重要データをLocalStorageと同期する', async () => {
		// 期待値:
		// - 設定データの同期
		// - 最新セッション情報
	});

	it('LocalStorageフォールバック動作', async () => {
		// シナリオ: IndexedDB無効
		// 期待値:
		// - LocalStorage使用
		// - 機能制限の通知
	});

	it('データ整合性を保つ', async () => {
		// 期待値:
		// - 両ストレージで一致
		// - 競合解決
	});
});
```

## モックデータ

```typescript
// テスト用ゲーム履歴
const mockGameHistory: GameHistory = {
	sessionId: 'session-123',
	mode: 'practice',
	startTime: new Date('2024-01-01T10:00:00'),
	endTime: new Date('2024-01-01T10:30:00'),
	cards: [
		{
			cardId: 'tsu',
			startTime: new Date('2024-01-01T10:00:00'),
			endTime: new Date('2024-01-01T10:02:00'),
			inputHistory: [],
			mistakes: 2,
			wpm: 120,
			accuracy: 95.5
		}
	],
	score: {
		total: 5000,
		accuracy: 95.5,
		speed: 120,
		maxCombo: 10
	},
	settings: {
		display: { theme: 'dark', fontSize: 'medium', showFurigana: false },
		sound: { enabled: true, volume: 50, effectsEnabled: true },
		game: { defaultMode: 'practice', partialInputLength: 5, showHints: false }
	}
};

// テスト用統計データ
const mockDailyStats: DetailedStats = {
	date: new Date('2024-01-01'),
	dailyStats: {
		gamesPlayed: 10,
		cardsCompleted: 440,
		totalTime: 3600000,
		averageAccuracy: 92.5,
		averageSpeed: 115,
		bestScore: 8500
	}
};

// テスト用カード履歴
const mockCardHistory: CardHistory = {
	cardId: 'tsu',
	attempts: [
		{
			date: new Date('2024-01-01T10:00:00'),
			time: 120000,
			accuracy: 95.5,
			mistakes: 2,
			wpm: 120
		}
	],
	bestTime: 120000,
	bestAccuracy: 95.5,
	lastAttempt: new Date('2024-01-01T10:00:00')
};

// Dexieモック
class DexieMock {
	version = vi.fn().mockReturnThis();
	stores = vi.fn().mockReturnThis();
	open = vi.fn().mockResolvedValue(undefined);
	table = vi.fn().mockReturnValue({
		add: vi.fn().mockResolvedValue(1),
		get: vi.fn(),
		where: vi.fn().mockReturnThis(),
		equals: vi.fn().mockReturnThis(),
		toArray: vi.fn(),
		delete: vi.fn(),
		clear: vi.fn()
	});
}
```

## テスト実装順序

1. **Phase 1: 基本機能**
   - TC-001: 初期化
   - TC-002: ゲーム履歴CRUD
   - TC-005: データ管理

2. **Phase 2: 高度な機能**
   - TC-003: 詳細統計
   - TC-004: カード履歴
   - TC-006: クエリ機能

3. **Phase 3: 品質保証**
   - TC-007: マイグレーション
   - TC-008: エラーハンドリング
   - TC-009: パフォーマンス
   - TC-010: 統合テスト

## カバレッジ目標

- ライン: 90%以上
- ブランチ: 85%以上
- 関数: 95%以上
- ステートメント: 90%以上

## 注意事項

- IndexedDBは非同期APIなので、全てのテストで`async/await`を使用
- トランザクションの完了を適切に待つ
- テスト間でデータベースをクリーンアップ
- ブラウザ環境でのみテスト実行（Node.jsでは fake-indexeddb を使用）
