# 上級者モード実装仕様書

## 概要

上級者モード（競技かるたモード）は、取り札の画像のみを見て、読み札を完全に記憶している前提でタイピングする上級者向けのゲームモードです。

## 1. 難易度レベルの定義

| 難易度                 | 表示内容                                           | 対象ユーザー     |
| ---------------------- | -------------------------------------------------- | ---------------- |
| 初心者（beginner）     | 短縮版テキスト＋ローマ字ガイド表示                 | かるた初心者     |
| 標準（standard）       | 読み札全文＋ローマ字ガイド表示                     | 一般プレイヤー   |
| **上級者（advanced）** | **取り札画像のみ（テキスト・ローマ字完全非表示）** | **かるた熟練者** |

## 2. ゲーム画面の構成

### 表示要素

- 取り札画像（`/images/karuta/torifuda/[cardId].webp`）
- 解説画像（`/images/karuta/kaisetsu/[cardId].webp`）
- 正解した文字列の表示（ひらがな）
- 入力したローマ字の表示
- 入力進捗インジケーター（プログレスバー）
- 現在の位置表示（例：5/17文字）
- スコア・統計情報

### 非表示要素

- 読み札テキスト（ひらがな）
- ローマ字ガイド
- 正解テキストのハイライト
- 入力中の文字列

## 3. 画面レイアウト

```
┌──────────────────────────────────────────────┐
│            スコア: 1234  3/44枚              │
├──────────────────────────────────────────────┤
│                                              │
│   ┌──────────────┐    ┌──────────────┐      │
│   │              │    │              │      │
│   │   取り札画像  │    │   解説画像    │      │
│   │   (350x350)  │    │   (350x350)  │      │
│   │              │    │              │      │
│   └──────────────┘    └──────────────┘      │
│                                              │
│          つるま________                      │
│          TURUMA                              │
│          ━━━━━━━━━━━━━━                    │
│          進捗: 5/17文字                      │
│                                              │
└──────────────────────────────────────────────┘
```

## 4. 実装ファイル一覧

### 修正が必要なファイル

#### 1. 型定義の更新

**`src/lib/types/game.ts`**

```typescript
// RandomModeDifficultyに'advanced'を追加
export type RandomModeDifficulty = 'beginner' | 'standard' | 'advanced';
```

#### 2. 難易度選択モーダルの更新

**`src/lib/components/main-menu/DifficultySelectModal.svelte`**

- 上級者モードの選択ボタンを追加
- アイコン: ⚡
- 説明文: "競技かるた式・取り札のみ表示・読み札の暗記必須"

#### 3. ゲーム画面の修正

**`src/routes/game/+page.svelte`**

- 難易度による表示切り替えロジックの追加
- 上級者モード用のレイアウト実装

#### 4. カード表示コンポーネントの修正

**`src/lib/components/game/CardDisplay.svelte`**

- 上級者モード時は取り札画像のみ表示
- テキスト要素を条件付きで非表示

#### 5. 入力表示コンポーネントの修正

**`src/lib/components/game/InputHighlight.svelte`**

- 上級者モード時はテキストを非表示
- 進捗表示のみに切り替え

### 新規作成ファイル

#### 1. ブラインド入力表示コンポーネント

**`src/lib/components/game/BlindInputDisplay.svelte`**

```svelte
<script lang="ts">
	interface Props {
		totalChars: number;
		currentPosition: number;
		isCorrect: boolean;
	}

	let { totalChars, currentPosition, isCorrect }: Props = $props();
</script>

<div class="blind-input-container">
	<!-- 進捗バー -->
	<div class="progress-indicator">
		<div
			class="progress-bar"
			style="width: {(currentPosition / totalChars) * 100}%"
			class:correct={isCorrect}
			class:incorrect={!isCorrect}
		/>
	</div>

	<!-- 位置表示 -->
	<div class="position-display">
		{currentPosition} / {totalChars}文字
	</div>
</div>

<style>
	.blind-input-container {
		@apply flex flex-col items-center gap-4 p-8;
	}

	.progress-indicator {
		@apply h-2 w-full max-w-md overflow-hidden rounded-full bg-gray-200;
	}

	.progress-bar {
		@apply h-full bg-green-500 transition-all duration-200;
	}

	.progress-bar.incorrect {
		@apply bg-red-500;
	}

	.position-display {
		@apply font-mono text-lg text-gray-600;
	}
</style>
```

#### 2. 上級者モード設定

**`src/lib/types/advanced-mode.ts`**

```typescript
export interface AdvancedModeOptions {
	showProgress: boolean; // 進捗バー表示
	showCharCount: boolean; // 文字数表示
	enableHints: boolean; // ヒント機能の有効化
	soundFeedback: boolean; // 音声フィードバック
	hintPenalty: number; // ヒント使用時のスコアペナルティ率
}

export const defaultAdvancedModeOptions: AdvancedModeOptions = {
	showProgress: true,
	showCharCount: true,
	enableHints: false,
	soundFeedback: true,
	hintPenalty: 0.2
};
```

## 5. ゲームフロー

### 5.1 ゲーム開始時

1. 難易度選択で「上級者」を選択
2. 取り札画像を事前読み込み
3. ゲーム画面へ遷移

### 5.2 プレイ中

1. 取り札画像を中央に表示
2. プレイヤーは記憶を頼りにタイピング
3. 正誤は音と進捗バーの色でフィードバック
4. 文字位置は数値で表示

### 5.3 札の完了時

1. 正解の読み札を一時表示（2秒間）
2. スコア加算（基本スコア × 2.5倍）
3. 次の札へ自動遷移

## 6. オプション機能

### ヘルプ機能（設定で有効化可能）

- **Hキー長押し**: 読み札を一時表示（スコア20%減）
- **Tabキー**: 最初の3文字だけヒント表示（スコア10%減）

### 音声フィードバック

- 正解音: 軽快な効果音
- ミス音: ブザー音
- 完了音: 達成音

## 7. スコアリング

### 基本計算式

```typescript
const baseScore = calculateBaseScore(time, accuracy, charCount);
const advancedMultiplier = 2.5;
let finalScore = baseScore * advancedMultiplier;

// ヒント使用によるペナルティ
if (hintsUsed > 0) {
	finalScore *= Math.max(0.5, 1 - hintsUsed * 0.1);
}
```

### ボーナス要素

- ノーミスクリア: +500点
- 高速クリア（10秒以内）: +300点
- 連続正解: コンボボーナス

## 8. 実装優先順位

### Phase 1（必須機能）

- [ ] 型定義に`advanced`を追加
- [ ] 難易度選択モーダルに上級者モード追加
- [ ] 取り札画像のみ表示機能
- [ ] テキスト・ローマ字非表示機能
- [ ] 進捗表示機能

### Phase 2（ゲーム性向上）

- [ ] 音声フィードバック実装
- [ ] ヒント機能（ペナルティ付き）
- [ ] スコア倍率の実装
- [ ] 視覚的フィードバック（振動エフェクト等）

### Phase 3（統計・分析）

- [ ] 上級者モード専用統計
- [ ] 専用ランキングボード
- [ ] 成績分析機能

## 9. テスト項目

### 機能テスト

- [ ] 難易度選択で上級者モードが選択できる
- [ ] 取り札画像が正しく表示される
- [ ] テキスト・ローマ字が表示されない
- [ ] 進捗バーが正しく動作する
- [ ] スコアが2.5倍で計算される

### エッジケース

- [ ] 画像が読み込めない場合のフォールバック
- [ ] ブラウザバックした場合の状態保持
- [ ] 途中終了時のデータ保存

## 10. 必要なアセット

### 画像ファイル

```
/static/images/karuta/torifuda/
  ├── a.webp
  ├── i.webp
  ├── u.webp
  ├── e.webp
  ├── o.webp
  ├── ka.webp
  ├── ki.webp
  ├── ku.webp
  ├── ke.webp
  ├── ko.webp
  ├── sa.webp
  ├── shi.webp
  ├── su.webp
  ├── se.webp
  ├── so.webp
  ├── ta.webp
  ├── chi.webp
  ├── tsu.webp
  ├── te.webp
  ├── to.webp
  ├── na.webp
  ├── ni.webp
  ├── nu.webp
  ├── ne.webp
  ├── no.webp
  ├── ha.webp
  ├── hi.webp
  ├── fu.webp
  ├── he.webp
  ├── ho.webp
  ├── ma.webp
  ├── mi.webp
  ├── mu.webp
  ├── me.webp
  ├── mo.webp
  ├── ya.webp
  ├── yu.webp
  ├── yo.webp
  ├── ra.webp
  ├── ri.webp
  ├── ru.webp
  ├── re.webp
  └── ro.webp
```

### 音声ファイル（オプション）

- 正解音: `/sounds/correct.mp3`
- ミス音: `/sounds/incorrect.mp3`
- 完了音: `/sounds/complete.mp3`

## 11. 注意事項

### パフォーマンス

- 取り札画像は事前読み込みしてキャッシュ
- 画像サイズは最適化（300x400px程度）
- 不要なレンダリングを避ける

### アクセシビリティ

- キーボードのみで操作可能
- スクリーンリーダー対応（aria-label等）
- 色覚異常者への配慮（色だけでなく形状でも判別）

### ユーザビリティ

- 初回プレイ時に説明モーダル表示
- ギブアップ機能の実装
- 設定で細かいカスタマイズ可能
