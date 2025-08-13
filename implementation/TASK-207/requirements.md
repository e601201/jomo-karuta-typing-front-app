# TASK-207: 設定画面 - 要件定義

## 目的

ユーザーがゲームプレイの設定をカスタマイズできる画面を実装し、個人の好みや学習レベルに合わせた最適な環境を提供する。

## 機能要件

### 1. ゲームプレイ設定 (REQ-207-1)

#### 入力モード設定

- **部分入力モード**: 有効/無効の切り替え
- **入力文字数**: 3-10文字のスライダー
- **入力範囲**: 先頭から/ランダム/重要部分

#### 表示設定

- **ローマ字表示**: 表示/非表示
- **ひらがな表示**: 表示/非表示
- **ヒント表示**: 表示/非表示
- **意味説明表示**: 表示/非表示

### 2. サウンド設定 (REQ-207-2)

- **効果音**: ON/OFF、音量調整（0-100%）
- **BGM**: ON/OFF、音量調整（0-100%）
- **タイプ音**: ON/OFF、音量調整（0-100%）
- **読み上げ音声**: ON/OFF、速度調整（0.5x-2.0x）

### 3. 表示設定 (REQ-207-3)

#### フォントサイズ

- **小**: 14px
- **中**: 18px（デフォルト）
- **大**: 22px
- **特大**: 26px

#### テーマ設定

- **ライトモード**: 明るいテーマ
- **ダークモード**: 暗いテーマ
- **自動**: システム設定に従う

#### アニメーション

- **有効/無効**: トランジションやエフェクトの切り替え
- **速度**: 遅い/標準/速い

### 4. 練習設定 (REQ-207-4)

#### 出題設定

- **出題順序**: 順番/ランダム/苦手札優先
- **繰り返し回数**: 1-5回
- **制限時間**: なし/30秒/60秒/120秒

#### 難易度設定

- **初級**: ひらがな表示、ヒントあり、部分入力
- **中級**: ローマ字表示、ヒントなし
- **上級**: 制限時間あり、ミス即終了

### 5. キーボード設定 (REQ-207-5)

- **キーボードレイアウト**: JIS/US
- **入力方式**: ローマ字/かな入力
- **ショートカットキー**: カスタマイズ可能
  - 一時停止: ESC（デフォルト）
  - スキップ: Tab
  - リトライ: Ctrl+R

### 6. データ管理 (REQ-207-6)

- **データエクスポート**: JSON/CSV形式
- **データインポート**: 設定の復元
- **データリセット**:
  - 設定のリセット
  - 成績データのリセット
  - 全データのリセット

## 技術要件

### 1. 設定データ構造

```typescript
interface UserSettings extends GameSettings {
	// GameSettingsを拡張
	display: DisplaySettings;
	sound: SoundSettings;
	practice: PracticeSettings;
	keyboard: KeyboardSettings;
	accessibility: AccessibilitySettings;
}

interface DisplaySettings {
	fontSize: 'small' | 'medium' | 'large' | 'extra-large';
	theme: 'light' | 'dark' | 'auto';
	animations: boolean;
	animationSpeed: 'slow' | 'normal' | 'fast';
	showFurigana: boolean;
	showMeaning: boolean;
}

interface SoundSettings {
	effectsEnabled: boolean;
	effectsVolume: number; // 0-100
	bgmEnabled: boolean;
	bgmVolume: number; // 0-100
	typingSoundEnabled: boolean;
	typingSoundVolume: number; // 0-100
	voiceEnabled: boolean;
	voiceSpeed: number; // 0.5-2.0
}

interface PracticeSettings {
	order: 'sequential' | 'random' | 'weak-first';
	repetitions: number; // 1-5
	timeLimit: number | null; // seconds or null for unlimited
	difficulty: 'beginner' | 'intermediate' | 'advanced' | 'custom';
}

interface KeyboardSettings {
	layout: 'JIS' | 'US';
	inputMethod: 'romaji' | 'kana';
	shortcuts: {
		pause: string;
		skip: string;
		retry: string;
	};
}

interface AccessibilitySettings {
	highContrast: boolean;
	reduceMotion: boolean;
	screenReaderMode: boolean;
	keyboardOnly: boolean;
}
```

### 2. コンポーネント構造

```typescript
// SettingsPage.svelte - メインページ
interface SettingsPageProps {
	initialSettings?: UserSettings;
}

// SettingsSection.svelte - 設定セクション
interface SettingsSectionProps {
	title: string;
	description?: string;
	collapsible?: boolean;
}

// SettingItem.svelte - 個別設定項目
interface SettingItemProps {
	label: string;
	description?: string;
	type: 'toggle' | 'slider' | 'select' | 'radio';
	value: any;
	options?: any[];
	onChange: (value: any) => void;
}

// SettingsPreview.svelte - プレビュー表示
interface SettingsPreviewProps {
	settings: UserSettings;
}
```

### 3. ストア設計

```typescript
// settingsStore.ts
interface SettingsStore {
	settings: UserSettings;
	defaultSettings: UserSettings;
	hasChanges: boolean;

	loadSettings(): Promise<void>;
	saveSettings(): Promise<void>;
	updateSetting(path: string, value: any): void;
	resetToDefault(): void;
	resetSection(section: string): void;
	exportSettings(): string;
	importSettings(data: string): Promise<void>;
}
```

## UI/UX要件

### 1. レイアウト

- **サイドバーナビゲーション**: 設定カテゴリー
- **メインコンテンツ**: 設定項目
- **プレビューエリア**: リアルタイムプレビュー（オプション）
- **アクションバー**: 保存/キャンセル/リセット

### 2. インタラクション

- **即座の反映**: 一部設定は即座にプレビュー
- **変更インジケーター**: 変更された項目にマーク
- **確認ダイアログ**:
  - 保存せずに離脱時
  - リセット実行時
  - データ削除時

### 3. バリデーション

- **リアルタイムバリデーション**: 入力時に検証
- **エラー表示**: 不正な値の場合はエラーメッセージ
- **範囲制限**: スライダーやナンバー入力の範囲制限

### 4. レスポンシブデザイン

- **デスクトップ**: 2カラムレイアウト（サイドバー + メイン）
- **タブレット**: 折りたたみ可能なサイドバー
- **モバイル**: タブ形式またはアコーディオン

## パフォーマンス要件

- 設定変更の反映: < 100ms
- 設定の保存: < 500ms
- 設定の読み込み: < 300ms
- プレビュー更新: < 50ms

## アクセシビリティ要件

- キーボードナビゲーション対応
- スクリーンリーダー対応
- 高コントラストモード対応
- フォーカス管理
- ARIA属性の適切な使用

## セキュリティ要件

- 入力値のサニタイゼーション
- インポートデータの検証
- XSS対策
- ローカルストレージの暗号化（オプション）

## 受け入れ基準

### 必須要件

1. [ ] すべての設定項目が変更可能
2. [ ] 設定がローカルストレージに永続化される
3. [ ] デフォルト値へのリセット機能
4. [ ] 設定のエクスポート/インポート機能
5. [ ] バリデーションエラーの適切な表示

### 品質基準

1. [ ] レスポンシブデザインが機能する
2. [ ] アクセシビリティ基準を満たす
3. [ ] パフォーマンス要件を満たす
4. [ ] エラーハンドリングが適切

## 実装の優先順位

1. 基本的な設定項目のUI
2. 設定の保存/読み込み
3. バリデーション
4. プレビュー機能
5. エクスポート/インポート
6. アクセシビリティ設定
7. 高度なカスタマイズ機能

## 将来の拡張性

- プリセット機能（設定のテンプレート）
- クラウド同期（アカウント機能実装後）
- 設定の履歴管理
- A/Bテスト用の設定切り替え
- プロファイル機能（複数の設定セット）
