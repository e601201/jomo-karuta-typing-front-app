# TASK-206: 統計表示画面 - 要件定義

## 目的

ユーザーのプレイ履歴と成長を可視化し、モチベーション向上と練習効果の確認を支援する統計表示画面を実装する。

## 機能要件

### 1. 統計データの種類 (REQ-206-1)

#### 基本統計

- **総プレイ回数**: セッション数の累計
- **総プレイ時間**: 実際のプレイ時間の合計（一時停止時間を除く）
- **総タイプ数**: 入力した文字数の累計
- **総完了札数**: クリアした札の枚数

#### パフォーマンス統計

- **平均WPM**: 全セッションの平均速度
- **最高WPM**: 達成した最高速度
- **平均正確率**: 全セッションの平均正確率
- **最高正確率**: 達成した最高正確率

#### 成長指標

- **日別プレイ時間**: 過去7日間/30日間のプレイ時間推移
- **WPM推移**: 時系列でのWPM向上グラフ
- **正確率推移**: 時系列での正確率向上グラフ
- **ベストスコア**: 各モードでの最高スコア

#### 達成記録

- **完璧プレイ**: 100%正確率で完了した回数
- **最長連続日数**: 連続プレイ日数
- **総獲得スコア**: 累計スコア
- **レベル/ランク**: スコアに基づくランク

### 2. 表示形式 (REQ-206-2)

#### サマリーカード

- カード形式で主要統計を表示
- アイコンと数値の組み合わせ
- 前回との比較（上昇/下降インジケーター）

#### グラフ表示

- **折れ線グラフ**: WPM/正確率の推移
- **棒グラフ**: 日別プレイ時間
- **円グラフ**: モード別プレイ時間割合
- **ヒートマップ**: カレンダー形式の活動記録

#### ランキング表示

- 個人ベスト記録TOP5
- 各札の最速クリアタイム
- 難易度別の達成率

### 3. フィルタリング機能 (REQ-206-3)

- **期間選択**: 今日/週間/月間/全期間
- **モード別**: 練習/ランダム/特定札
- **札別**: 個別の札の統計
- **セッション別**: 個別セッションの詳細

### 4. データ永続化 (REQ-206-4)

- IndexedDBへの統計データ保存
- セッション終了時の自動保存
- データのエクスポート機能（JSON/CSV）
- データのインポート機能

## 技術要件

### 1. コンポーネント構造

```typescript
// StatisticsPage.svelte - メインページコンポーネント
interface StatisticsPageProps {
	// ページレベルのプロパティ
}

// StatsSummary.svelte - サマリーカード表示
interface StatsSummaryProps {
	stats: OverallStats;
	compareWith?: 'yesterday' | 'lastWeek' | 'lastMonth';
}

// StatsChart.svelte - グラフ表示コンポーネント
interface StatsChartProps {
	data: ChartData;
	type: 'line' | 'bar' | 'pie' | 'heatmap';
	options?: ChartOptions;
}

// StatsFilter.svelte - フィルタリングUI
interface StatsFilterProps {
	onFilterChange: (filters: FilterOptions) => void;
	availableFilters: string[];
}
```

### 2. データ構造

```typescript
interface OverallStats {
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

interface SessionStats {
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

interface CardStats {
	cardId: string;
	timesPlayed: number;
	bestTime: number;
	averageTime: number;
	accuracy: number;
	lastPlayed: Date;
}

interface ChartData {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		color?: string;
	}[];
}
```

### 3. ストア拡張

```typescript
// statisticsStore.ts
interface StatisticsStore {
	overall: OverallStats;
	sessions: SessionStats[];
	cardStats: Map<string, CardStats>;

	loadStatistics(): Promise<void>;
	saveSession(session: SessionStats): Promise<void>;
	getFilteredStats(filters: FilterOptions): Promise<FilteredStats>;
	exportData(format: 'json' | 'csv'): Promise<string>;
	importData(data: string, format: 'json' | 'csv'): Promise<void>;
	calculateTrends(period: 'week' | 'month'): TrendData;
}
```

## UI/UX要件

### 1. レイアウト

- **ヘッダー**: ページタイトルと期間選択
- **サマリーセクション**: 4-6個の主要統計カード
- **グラフセクション**: 2-3個のグラフを横並び/縦並び
- **詳細テーブル**: セッション履歴やカード別統計
- **エクスポートボタン**: 右上に配置

### 2. ビジュアルデザイン

- **カラーテーマ**:
  - 成功: 緑系（#10B981）
  - 改善: 青系（#3B82F6）
  - 注意: 黄系（#F59E0B）
  - エラー: 赤系（#EF4444）
- **アニメーション**:
  - 数値のカウントアップ
  - グラフの描画アニメーション
  - カードのホバーエフェクト

### 3. レスポンシブデザイン

- **デスクトップ**: 3カラムレイアウト
- **タブレット**: 2カラムレイアウト
- **モバイル**: 1カラムスタック

## パフォーマンス要件

- 初期表示: < 500ms
- グラフ描画: < 300ms
- フィルタリング: < 100ms
- データ取得: < 200ms

## アクセシビリティ要件

- グラフのスクリーンリーダー対応（代替テキスト）
- キーボードナビゲーション
- 高コントラストモード対応
- データテーブルのARIA属性

## 受け入れ基準

### 必須要件

1. [ ] 基本統計情報が正しく表示される
2. [ ] グラフが正しくレンダリングされる
3. [ ] フィルタリングが正常に動作する
4. [ ] データが永続化される
5. [ ] レスポンシブデザインが機能する

### 品質基準

1. [ ] ページ読み込みが高速
2. [ ] アニメーションが滑らか
3. [ ] エラーハンドリングが適切
4. [ ] アクセシビリティ基準を満たす

## 実装の優先順位

1. 基本統計の表示
2. データ永続化
3. サマリーカード
4. 基本的なグラフ（折れ線・棒）
5. フィルタリング機能
6. 高度なグラフ（ヒートマップ等）
7. エクスポート/インポート機能

## 将来の拡張性

- ソーシャル機能（他ユーザーとの比較）
- 目標設定機能
- 成果バッジシステム
- AIによる練習提案
- 詳細な分析レポート生成
