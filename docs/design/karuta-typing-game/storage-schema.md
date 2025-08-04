# ローカルストレージ スキーマ設計

## 概要

犬棒カルタタイピングゲームでは、ユーザーの設定やゲーム記録をブラウザのLocalStorageに保存します。外部サーバーとの通信は行わず、すべてのデータはクライアントサイドで管理されます。

## ストレージキー構成

### 基本キー設計

```typescript
const StorageKeys = {
  // ゲーム設定
  GAME_SETTINGS: 'karuta-game-settings',
  
  // ハイスコア記録
  HIGH_SCORES: 'karuta-high-scores',
  
  // プレイ履歴
  PLAY_HISTORY: 'karuta-play-history',
  
  // ユーザー設定
  USER_PREFERENCES: 'karuta-user-preferences',
  
  // バージョン管理
  SCHEMA_VERSION: 'karuta-schema-version'
} as const;
```

## データスキーマ詳細

### 1. ゲーム設定 (GAME_SETTINGS)

```json
{
  "difficulty": {
    "id": "normal",
    "name": "標準",
    "description": "完全入力が必要",
    "requireFullInput": true,
    "timeMultiplier": 1.0
  },
  "timeLimit": 300,
  "soundEnabled": true,
  "keyboardShortcutsEnabled": true,
  "darkMode": false,
  "fontSize": "medium"
}
```

**フィールド説明:**
- `difficulty`: 選択された難易度設定
- `timeLimit`: 制限時間（秒）
- `soundEnabled`: 音響効果の有効/無効
- `keyboardShortcutsEnabled`: キーボードショートカットの有効/無効
- `darkMode`: ダークモードの有効/無効
- `fontSize`: フォントサイズ（small/medium/large）

### 2. ハイスコア記録 (HIGH_SCORES)

```json
[
  {
    "id": "score_1691234567890",
    "score": 8500,
    "achievedAt": "2024-08-05T10:30:00.000Z",
    "difficulty": "normal",
    "wpm": 45.2,
    "accuracy": 94.5,
    "completionRate": 85.0
  },
  {
    "id": "score_1691234567891",
    "score": 9200,
    "achievedAt": "2024-08-05T11:15:00.000Z",
    "difficulty": "hard",
    "wpm": 52.1,
    "accuracy": 96.8,
    "completionRate": 90.0
  }
]
```

**フィールド説明:**
- `id`: 記録の一意識別子
- `score`: 最終スコア
- `achievedAt`: 記録達成日時（ISO 8601形式）
- `difficulty`: 使用した難易度
- `wpm`: Words Per Minute
- `accuracy`: タイピング精度（%）
- `completionRate`: 完了率（%）

**制約:**
- 最大100件まで保存
- 古い記録から自動削除
- スコア降順でソート

### 3. プレイ履歴 (PLAY_HISTORY)

```json
[
  {
    "sessionId": "session_1691234567890",
    "playedAt": "2024-08-05T10:30:00.000Z",
    "settings": {
      "difficulty": { "id": "normal", "name": "標準" },
      "timeLimit": 300
    },
    "totalPlayTime": 285,
    "completedCards": 17,
    "totalCards": 20,
    "overallAccuracy": {
      "correctChars": 1245,
      "totalChars": 1320,
      "accuracy": 94.3,
      "wpm": 45.2,
      "cpm": 226
    },
    "finalScore": 8500,
    "completionRate": 85.0
  }
]
```

**フィールド説明:**
- `sessionId`: セッションの一意識別子
- `playedAt`: プレイ日時
- `settings`: 使用した設定（簡略版）
- `totalPlayTime`: 総プレイ時間（秒）
- `completedCards`: 完了した読み札数
- `totalCards`: 総読み札数
- `overallAccuracy`: 全体の精度情報
- `finalScore`: 最終スコア
- `completionRate`: 完了率（%）

**制約:**
- 最大50件まで保存
- 古い履歴から自動削除

### 4. ユーザー設定 (USER_PREFERENCES)

```json
{
  "lastPlayedAt": "2024-08-05T11:15:00.000Z",
  "totalPlayTime": 12500,
  "gamesPlayed": 45,
  "favoriteCard": "card_001",
  "statistics": {
    "bestWpm": 58.2,
    "bestAccuracy": 98.5,
    "averageScore": 7200,
    "totalCharactersTyped": 45000
  },
  "achievements": [
    {
      "id": "first_game",
      "unlockedAt": "2024-07-15T09:00:00.000Z"
    },
    {
      "id": "speed_demon",
      "unlockedAt": "2024-08-01T14:30:00.000Z"
    }
  ]
}
```

**フィールド説明:**
- `lastPlayedAt`: 最後にプレイした日時
- `totalPlayTime`: 累計プレイ時間（秒）
- `gamesPlayed`: プレイ回数
- `favoriteCard`: お気に入りの読み札ID
- `statistics`: 統計情報
- `achievements`: 達成実績

### 5. スキーマバージョン (SCHEMA_VERSION)

```json
{
  "version": "1.0.0",
  "lastMigration": "2024-08-05T00:00:00.000Z"
}
```

## データ管理戦略

### サイズ制限

| データ種別 | 最大件数 | 推定サイズ | 制限理由 |
|-----------|----------|-----------|---------|
| ハイスコア | 100件 | ~10KB | パフォーマンス |
| プレイ履歴 | 50件 | ~25KB | ストレージ容量 |
| 設定 | - | ~1KB | 単一オブジェクト |
| ユーザー設定 | - | ~2KB | 単一オブジェクト |

### データクリーンアップ

```typescript
// 古いデータの自動削除ロジック
const cleanupOldData = () => {
  // ハイスコア: 100件超過時に古い記録削除
  if (highScores.length > 100) {
    highScores.splice(100);
  }
  
  // プレイ履歴: 50件超過時に古い履歴削除
  if (playHistory.length > 50) {
    playHistory.splice(50);
  }
  
  // 30日以上古い一時データの削除
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  // 実装詳細...
};
```

## バックアップ・復元

### データエクスポート形式

```json
{
  "exportVersion": "1.0.0",
  "exportedAt": "2024-08-05T12:00:00.000Z",
  "data": {
    "settings": { /* 設定データ */ },
    "highScores": [ /* ハイスコアデータ */ ],
    "playHistory": [ /* プレイ履歴データ */ ],
    "userPreferences": { /* ユーザー設定データ */ }
  },
  "checksum": "sha256_hash_value"
}
```

### インポート時の検証

1. **スキーマ検証**: エクスポートされたデータの形式確認
2. **データ整合性**: チェックサムによる改ざん検証
3. **バージョン互換性**: エクスポート元バージョンとの互換性確認
4. **データマージ**: 既存データとの統合方針

## エラーハンドリング

### LocalStorage利用不可時の対応

```typescript
const fallbackStorage = {
  // メモリ内ストレージとして動作
  data: new Map<string, any>(),
  
  get(key: string) {
    return this.data.get(key) || null;
  },
  
  set(key: string, value: any) {
    this.data.set(key, value);
    console.warn('LocalStorage unavailable, using memory storage');
  }
};
```

### データ破損時の対応

1. **バリデーション**: 読み込み時のデータ形式確認
2. **自動修復**: 可能な範囲での自動修復
3. **デフォルト復元**: 修復不可能時はデフォルト値で初期化
4. **ユーザー通知**: データリセットの通知表示

## プライバシー考慮事項

### 収集するデータ

- ✅ ゲーム設定・スコア（ローカル保存のみ）
- ✅ プレイ統計（ローカル保存のみ）
- ❌ 個人識別情報（収集しない）
- ❌ 外部送信（行わない）

### データの取り扱い

1. **ローカル保存のみ**: すべてのデータはユーザーのブラウザ内のみに保存
2. **外部送信なし**: データの外部サーバーへの送信は一切行わない
3. **ユーザー制御**: データの削除・エクスポートはユーザーが制御可能
4. **透明性**: データの保存内容・用途を明確に説明

## マイグレーション戦略

### バージョン管理

```typescript
const SCHEMA_VERSIONS = {
  '1.0.0': {
    migrate: (oldData: any) => {
      // 初期版のため変換処理なし
      return oldData;
    }
  },
  '1.1.0': {
    migrate: (oldData: any) => {
      // 新機能追加時のデータ変換
      return {
        ...oldData,
        newField: defaultValue
      };
    }
  }
};
```

### 段階的マイグレーション

1. **スキーマバージョン確認**
2. **必要なマイグレーション特定**
3. **順次マイグレーション実行**
4. **データ整合性確認**
5. **新バージョン記録**