# TASK-102: ゲーム状態管理ストア - テストケース設計

## テストケース一覧

### 1. ストア初期化テスト

#### TC-001: 初期状態の検証

```typescript
describe('GameStore - 初期化', () => {
	it('初期状態が正しく設定される', () => {
		// 期待値:
		// - session: null
		// - cards.current: null
		// - cards.currentIndex: 0
		// - cards.remaining: []
		// - cards.completed: []
		// - input.current: ''
		// - input.position: 0
		// - input.mistakes: 0
		// - score.total: 0
		// - timer.isPaused: false
	});
});
```

### 2. セッション管理テスト

#### TC-002: セッション開始

```typescript
describe('GameStore - セッション管理', () => {
	it('練習モードでセッションを開始できる', () => {
		// 入力: mode='practice', cards=44枚
		// 期待値:
		// - session.modeが'practice'
		// - session.isActiveがtrue
		// - cards.remainingに44枚設定
		// - cards.currentに最初の札が設定
	});

	it('特定札モードでセッションを開始できる', () => {
		// 入力: mode='specific', cards=選択した5枚
		// 期待値: 選択した札のみで開始
	});

	it('セッション終了時に状態がリセットされる', () => {
		// 期待値: endTimeが設定され、isActiveがfalse
	});
});
```

### 3. カード進行管理テスト

#### TC-003: カード遷移

```typescript
describe('GameStore - カード進行', () => {
	it('次のカードに進める', () => {
		// 前提: セッション開始済み、残り札あり
		// 期待値:
		// - currentIndexが増加
		// - currentCardが更新
		// - completedCardsに前の札が追加
	});

	it('最後のカードで完了処理される', () => {
		// 前提: 最後の札
		// 期待値: セッション終了
	});

	it('カードがない状態でnextCardを呼んでもエラーにならない', () => {
		// 期待値: エラーなし、状態変化なし
	});
});
```

### 4. 入力状態管理テスト

#### TC-004: 入力更新と検証

```typescript
describe('GameStore - 入力管理', () => {
	it('正しい入力で状態が更新される', () => {
		// 入力: 'tsu'（「つる」の部分入力）
		// 期待値:
		// - input.currentが'tsu'
		// - input.positionが3
		// - mistakesが増えない
	});

	it('誤った入力でミスカウントが増える', () => {
		// 入力: 'x'（誤入力）
		// 期待値:
		// - mistakesが1増加
		// - currentは変わらない
	});

	it('完全一致で札が完了する', () => {
		// 入力: 完全な入力文字列
		// 期待値:
		// - completeCard()が呼ばれる
		// - 次の札に自動遷移
	});
});
```

### 5. スコア計算テスト

#### TC-005: スコア更新

```typescript
describe('GameStore - スコア計算', () => {
	it('正確率が正しく計算される', () => {
		// 入力: 10文字入力、2ミス
		// 期待値: accuracy = 80%
	});

	it('タイピング速度が計算される', () => {
		// 入力: 60文字を30秒で入力
		// 期待値: speed = 120 CPM
	});

	it('コンボが正しく更新される', () => {
		// シナリオ: 3札連続正解→ミス→2札正解
		// 期待値:
		// - combo: 2
		// - maxCombo: 3
	});
});
```

### 6. タイマー管理テスト

#### TC-006: タイマー動作

```typescript
describe('GameStore - タイマー', () => {
	it('経過時間が正しく計測される', () => {
		// 期待値: 100ms毎に更新
	});

	it('一時停止で時間が止まる', () => {
		// 期待値:
		// - isPausedがtrue
		// - elapsedTimeが増えない
	});

	it('再開で時間計測が再開される', () => {
		// 期待値:
		// - isPausedがfalse
		// - pausedDurationが更新
	});

	it('カード毎の時間が記録される', () => {
		// 期待値: completedCardにtimeが記録
	});
});
```

### 7. 派生ストアテスト

#### TC-007: 派生ストアの動作

```typescript
describe('GameStore - 派生ストア', () => {
	it('progressStoreが進捗を正しく計算する', () => {
		// 状態: 44枚中10枚完了
		// 期待値:
		// - completed: 10
		// - total: 44
		// - percentage: 22.7
	});

	it('currentCardStoreが現在の札を提供する', () => {
		// 期待値: gameStore.cards.currentと同期
	});
});
```

### 8. エラーハンドリングテスト

#### TC-008: エラー処理

```typescript
describe('GameStore - エラーハンドリング', () => {
	it('不正な状態遷移を防ぐ', () => {
		// シナリオ: セッション未開始でnextCard
		// 期待値: エラーなし、状態変化なし
	});

	it('InputValidator初期化失敗を処理する', () => {
		// 期待値: フォールバック動作
	});

	it('データ不整合を検出して修正する', () => {
		// 期待値: 自動修復または安全な状態へ
	});
});
```

### 9. 統合テスト

#### TC-009: InputValidatorとの統合

```typescript
describe('GameStore - InputValidator統合', () => {
	it('InputValidatorの結果が反映される', () => {
		// 期待値: validateInput結果がstoreに反映
	});

	it('複数入力パターンに対応する', () => {
		// 入力: 'shi'と'si'（両方正解）
		// 期待値: 両方受け入れられる
	});
});
```

### 10. パフォーマンステスト

#### TC-010: パフォーマンス

```typescript
describe('GameStore - パフォーマンス', () => {
	it('入力更新が16ms以内に完了する', () => {
		// 計測: updateInput()の実行時間
	});

	it('100回の連続更新でメモリリークがない', () => {
		// 計測: メモリ使用量の変化
	});

	it('1000件の履歴でも動作する', () => {
		// 期待値: 制限により古いデータが削除
	});
});
```

## テスト実装順序

1. **Phase 1: 基本機能**
   - TC-001: 初期化
   - TC-002: セッション管理
   - TC-003: カード進行

2. **Phase 2: 入力とスコア**
   - TC-004: 入力管理
   - TC-005: スコア計算
   - TC-009: InputValidator統合

3. **Phase 3: タイマーと派生**
   - TC-006: タイマー
   - TC-007: 派生ストア

4. **Phase 4: 品質保証**
   - TC-008: エラーハンドリング
   - TC-010: パフォーマンス

## モックデータ

```typescript
// テスト用カードデータ
const mockCards: KarutaCard[] = [
	{
		id: 'tsu',
		hiragana: 'つる まう かたち の ぐんまけん',
		romaji: 'tsuru mau katachi no gunmaken',
		meaning: '鶴舞う形の群馬県',
		category: 'geography',
		difficulty: 'easy'
	}
	// ... 他のテストデータ
];

// テスト用InputValidator
const mockValidator = {
	getRomajiPatterns: jest.fn(),
	validateInput: jest.fn(),
	setTarget: jest.fn(),
	validateChar: jest.fn(),
	getCurrentPosition: jest.fn(),
	getMistakeCount: jest.fn(),
	reset: jest.fn()
};
```

## カバレッジ目標

- ライン: 90%以上
- ブランチ: 85%以上
- 関数: 95%以上
- ステートメント: 90%以上
