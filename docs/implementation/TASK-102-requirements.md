# TASK-102: ゲーム状態管理ストア - 要件定義

## 概要

Svelte Storeを使用したゲーム状態管理システムの実装

## 機能要件

### 1. ゲームセッション管理

- **セッション情報**
  - sessionId: 一意のセッションID
  - mode: ゲームモード（practice/specific/random）
  - startTime: 開始時刻
  - endTime: 終了時刻（オプション）
  - isActive: アクティブ状態

### 2. ゲーム進行状態

- **現在の状態**
  - currentCardIndex: 現在の札インデックス
  - currentCard: 現在の札データ
  - remainingCards: 残りの札リスト
  - completedCards: 完了済み札リスト
- **入力状態**
  - currentInput: 現在の入力文字列
  - inputPosition: 入力位置
  - mistakes: ミスタイプ回数

### 3. スコア管理

- **リアルタイムスコア**
  - totalScore: 合計スコア
  - accuracy: 正確率（％）
  - speed: タイピング速度（文字/分）
  - combo: 連続正解数
  - maxCombo: 最大連続正解数

### 4. タイマー管理

- **時間追跡**
  - elapsedTime: 経過時間
  - cardStartTime: 現在の札の開始時刻
  - cardElapsedTime: 現在の札の経過時間
  - isPaused: 一時停止状態
  - pausedDuration: 一時停止時間の合計

## 技術要件

### Svelte Store構成

```typescript
// メインゲームストア
gameStore: Writable<GameState>;

// 派生ストア
currentCardStore: Readable<KarutaCard | null>;
progressStore: Readable<GameProgress>;
scoreStore: Readable<GameScore>;
```

### 状態更新メソッド

- `startSession(mode: GameMode, cards: KarutaCard[]): void`
- `nextCard(): void`
- `updateInput(input: string): void`
- `completeCard(): void`
- `pauseGame(): void`
- `resumeGame(): void`
- `endSession(): void`
- `resetSession(): void`

### InputValidatorとの統合

- InputValidatorインスタンスの管理
- 入力検証結果の反映
- リアルタイムフィードバック

## インターフェース定義

```typescript
interface GameState {
	session: GameSession | null;
	cards: {
		current: KarutaCard | null;
		currentIndex: number;
		remaining: KarutaCard[];
		completed: CompletedCard[];
	};
	input: {
		current: string;
		position: number;
		mistakes: number;
		validator: InputValidator | null;
	};
	score: GameScore;
	timer: GameTimer;
}

interface GameSession {
	id: string;
	mode: GameMode;
	startTime: Date;
	endTime?: Date;
	isActive: boolean;
	totalCards: number;
}

interface CompletedCard {
	card: KarutaCard;
	time: number;
	mistakes: number;
	accuracy: number;
}

interface GameScore {
	total: number;
	accuracy: number;
	speed: number;
	combo: number;
	maxCombo: number;
}

interface GameTimer {
	startTime: Date | null;
	elapsedTime: number;
	cardStartTime: Date | null;
	cardElapsedTime: number;
	isPaused: boolean;
	pausedDuration: number;
}

interface GameProgress {
	completed: number;
	total: number;
	percentage: number;
}
```

## エラーハンドリング

### 考慮すべきエラーケース

1. **初期化エラー**
   - カードデータの読み込み失敗
   - InputValidatorの初期化失敗

2. **状態遷移エラー**
   - 不正な状態遷移（例：未開始状態でnextCard）
   - インデックス範囲外アクセス

3. **データ整合性エラー**
   - 状態の不整合
   - タイマーの同期ずれ

## パフォーマンス要件

1. **更新頻度**
   - 入力更新: 即座（< 16ms）
   - スコア計算: 100ms以内
   - タイマー更新: 100ms間隔

2. **メモリ管理**
   - 不要なリスナーの自動解除
   - 大量の履歴データの制限（最大100件）

## テスト観点

### 単体テスト

1. **初期化**
   - 初期状態の検証
   - セッション開始時の状態

2. **状態遷移**
   - 正常な遷移パス
   - エラーケースの処理

3. **スコア計算**
   - 正確率の計算
   - スピードの計算
   - コンボの更新

4. **タイマー管理**
   - 一時停止/再開
   - 経過時間の正確性

### 統合テスト

1. **InputValidatorとの連携**
   - 入力検証の反映
   - エラーハンドリング

2. **リアクティブ更新**
   - ストアの購読と更新
   - 派生ストアの動作

## 実装順序

1. 基本的なストア構造とインターフェース
2. セッション管理機能
3. カード進行管理
4. 入力状態管理とInputValidator統合
5. スコア計算ロジック
6. タイマー管理
7. 派生ストアの実装
8. エラーハンドリング

## 完了条件

- [ ] すべての状態管理機能が実装されている
- [ ] InputValidatorと正しく統合されている
- [ ] リアクティブな更新が動作する
- [ ] テストカバレッジ90%以上
- [ ] TypeScript型チェックが通る
- [ ] パフォーマンス基準を満たす
