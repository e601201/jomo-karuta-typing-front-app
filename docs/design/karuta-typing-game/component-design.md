# コンポーネント設計

## 概要

SvelteKit 2 + Svelte 5を使用した犬棒カルタタイピングゲームのコンポーネント設計書。Component-Based Architectureに基づき、再利用可能で保守性の高いコンポーネント構成を定義する。

## コンポーネント階層

```
src/
├── routes/
│   ├── +layout.svelte          # ルートレイアウト
│   ├── +page.svelte            # ホーム画面（メイン）
│   ├── game/
│   │   └── +page.svelte        # ゲーム画面
│   ├── settings/
│   │   └── +page.svelte        # 設定画面
│   └── result/
│       └── +page.svelte        # 結果画面
└── lib/
    ├── components/
    │   ├── screens/            # 画面レベルコンポーネント
    │   ├── game/               # ゲーム機能コンポーネント
    │   ├── ui/                 # 汎用UIコンポーネント
    │   └── layout/             # レイアウトコンポーネント
    ├── stores/                 # 状態管理
    ├── services/               # ビジネスロジック
    └── utils/                  # ユーティリティ
```

## 画面レベルコンポーネント

### 1. HomeScreen.svelte

**役割**: メイン画面・ゲーム開始・設定アクセス

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import type { GameSettings } from '$lib/types';
  import { gameStore } from '$lib/stores/gameStore';
  import { Button, Card } from '$lib/components/ui';
  
  let settings = $state<GameSettings>(gameStore.settings);
  
  const startGame = () => {
    goto('/game');
  };
  
  const openSettings = () => {
    goto('/settings');
  };
</script>
```

**Props**: なし
**State**: ローカル設定状態
**Events**: 
- `game:start` - ゲーム開始
- `settings:open` - 設定画面遷移

### 2. GameScreen.svelte

**役割**: ゲームプレイのメイン画面

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { KarutaCard, TypingInput, Timer, ScoreDisplay } from '$lib/components/game';
  import { gameEngine } from '$lib/services/gameEngine';
  import type { GameSession, GameProgress } from '$lib/types';
  
  let session = $state<GameSession | null>(null);
  let progress = $derived(session?.progress);
  
  onMount(() => {
    session = gameEngine.startNewGame();
  });
  
  onDestroy(() => {
    gameEngine.cleanup();
  });
</script>
```

**Props**: なし
**State**: ゲームセッション、進行状況
**Events**: 
- `game:pause` - ゲーム一時停止
- `game:end` - ゲーム終了

### 3. SettingsScreen.svelte

**役割**: ゲーム設定の変更

```svelte
<script lang="ts">
  import { SettingsPanel } from '$lib/components/ui';
  import { settingsStore } from '$lib/stores/settingsStore';
  import type { GameSettings } from '$lib/types';
  
  let tempSettings = $state<GameSettings>({...settingsStore.current});
  let hasChanges = $derived(/* 変更検知ロジック */);
  
  const saveSettings = () => {
    settingsStore.update(tempSettings);
  };
</script>
```

**Props**: なし
**State**: 一時設定、変更フラグ
**Events**: 
- `settings:save` - 設定保存
- `settings:reset` - 設定リセット

### 4. ResultScreen.svelte

**役割**: ゲーム結果の表示

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { ScoreCard, AchievementList, ShareButton } from '$lib/components/ui';
  import type { GameResult } from '$lib/types';
  
  let result = $state<GameResult | null>(null);
  
  $effect(() => {
    // URLクエリパラメータから結果データを取得
    const sessionId = $page.url.searchParams.get('session');
    if (sessionId) {
      result = loadGameResult(sessionId);
    }
  });
</script>
```

**Props**: なし
**State**: ゲーム結果データ
**Events**: 
- `result:share` - 結果共有
- `result:retry` - 再プレイ

## ゲーム機能コンポーネント

### 1. KarutaCard.svelte

**役割**: 読み札の表示

```svelte
<script lang="ts">
  import type { KarutaCard, DisplayState } from '$lib/types';
  
  interface Props {
    card: KarutaCard;
    displayState: DisplayState;
    showReading?: boolean;
  }
  
  let { card, displayState, showReading = false }: Props = $props();
  
  let cardElement = $state<HTMLElement>();
  
  // 入力進捗のハイライト表示ロジック
  const highlightProgress = $derived(() => {
    const { completed, current, remaining } = displayState.inputDisplay;
    return { completed, current, remaining };
  });
</script>

<div class="karuta-card" bind:this={cardElement}>
  <div class="card-text">
    <span class="completed">{highlightProgress.completed}</span>
    <span class="current">{highlightProgress.current}</span>
    <span class="remaining">{highlightProgress.remaining}</span>
  </div>
  
  {#if showReading}
    <div class="card-reading">{card.reading}</div>
  {/if}
</div>
```

**Props**: 
- `card` - 表示する読み札データ
- `displayState` - 表示状態
- `showReading` - 読み表示フラグ

**State**: DOM要素参照
**Events**: なし

### 2. TypingInput.svelte

**役割**: タイピング入力の処理と表示

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { TypingResult, KeyInputEvent } from '$lib/types';
  
  interface Props {
    disabled?: boolean;
    placeholder?: string;
  }
  
  let { disabled = false, placeholder = 'ここにタイピング...' }: Props = $props();
  
  const dispatch = createEventDispatcher<{
    input: TypingResult;
    keydown: KeyInputEvent;
  }>();
  
  let inputElement = $state<HTMLInputElement>();
  let currentInput = $state('');
  
  const handleKeyDown = (event: KeyboardEvent) => {
    const keyEvent: KeyInputEvent = {
      key: event.key,
      modifiers: {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey
      },
      timestamp: Date.now()
    };
    
    dispatch('keydown', keyEvent);
  };
  
  const handleInput = (event: Event) => {
    const target = event.target as HTMLInputElement;
    currentInput = target.value;
    
    // タイピング判定ロジック（詳細は GameEngine で処理）
    const result: TypingResult = {
      isCorrect: true, // 判定結果
      inputChar: currentInput.slice(-1),
      expectedChar: 'expected', // 期待文字
      position: currentInput.length,
      isCompleted: false
    };
    
    dispatch('input', result);
  };
</script>

<div class="typing-input-container">
  <input
    bind:this={inputElement}
    bind:value={currentInput}
    on:keydown={handleKeyDown}
    on:input={handleInput}
    {disabled}
    {placeholder}
    class="typing-input"
    autocomplete="off"
    spellcheck="false"
  />
</div>
```

**Props**: 
- `disabled` - 入力無効フラグ
- `placeholder` - プレースホルダー

**State**: 入力値、DOM要素参照
**Events**: 
- `input` - 入力イベント
- `keydown` - キー押下イベント

### 3. Timer.svelte

**役割**: 制限時間の表示と管理

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  
  interface Props {
    initialTime: number;
    isRunning?: boolean;
    warningThreshold?: number;
  }
  
  let { 
    initialTime, 
    isRunning = false, 
    warningThreshold = 30 
  }: Props = $props();
  
  const dispatch = createEventDispatcher<{
    timeup: void;
    warning: number;
    tick: number;
  }>();
  
  let remainingTime = $state(initialTime);
  let intervalId: NodeJS.Timeout | null = null;
  
  const formattedTime = $derived(() => {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  });
  
  const isWarning = $derived(remainingTime <= warningThreshold);
  
  $effect(() => {
    if (isRunning && !intervalId) {
      intervalId = setInterval(() => {
        remainingTime--;
        dispatch('tick', remainingTime);
        
        if (remainingTime === warningThreshold) {
          dispatch('warning', remainingTime);
        }
        
        if (remainingTime <= 0) {
          dispatch('timeup');
          isRunning = false;
        }
      }, 1000);
    } else if (!isRunning && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  });
  
  onDestroy(() => {
    if (intervalId) {
      clearInterval(intervalId);
    }
  });
</script>

<div class="timer" class:warning={isWarning}>
  <div class="time-display">{formattedTime}</div>
  <div class="time-progress">
    <div 
      class="progress-bar" 
      style:width="{(remainingTime / initialTime) * 100}%"
    ></div>
  </div>
</div>
```

**Props**: 
- `initialTime` - 初期時間（秒）
- `isRunning` - 実行中フラグ
- `warningThreshold` - 警告閾値（秒）

**State**: 残り時間、インターバルID
**Events**: 
- `timeup` - 時間切れ
- `warning` - 警告時間到達
- `tick` - 1秒経過

### 4. ScoreDisplay.svelte

**役割**: スコア・進捗の表示

```svelte
<script lang="ts">
  import type { GameProgress, TypingAccuracy } from '$lib/types';
  
  interface Props {
    progress: GameProgress;
    accuracy: TypingAccuracy;
    animated?: boolean;
  }
  
  let { progress, accuracy, animated = true }: Props = $props();
  
  const completionPercentage = $derived(
    (progress.completedCards / progress.totalCards) * 100
  );
  
  const scoreGrade = $derived(() => {
    if (accuracy.accuracy >= 95) return 'S';
    if (accuracy.accuracy >= 90) return 'A';
    if (accuracy.accuracy >= 80) return 'B';
    if (accuracy.accuracy >= 70) return 'C';
    return 'D';
  });
</script>

<div class="score-display">
  <div class="score-main">
    <div class="current-score">
      <span class="score-value">{progress.currentScore.toLocaleString()}</span>
      <span class="score-label">スコア</span>
    </div>
    <div class="grade" class:grade-{scoreGrade.toLowerCase()}>{scoreGrade}</div>
  </div>
  
  <div class="progress-section">
    <div class="progress-bar-container">
      <div 
        class="progress-bar" 
        class:animated
        style:width="{completionPercentage}%"
      ></div>
    </div>
    <div class="progress-text">
      {progress.completedCards} / {progress.totalCards} 完了
    </div>
  </div>
  
  <div class="stats-grid">
    <div class="stat-item">
      <span class="stat-value">{accuracy.wpm.toFixed(1)}</span>
      <span class="stat-label">WPM</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">{accuracy.accuracy.toFixed(1)}%</span>
      <span class="stat-label">精度</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">{progress.errorCount}</span>
      <span class="stat-label">エラー</span>
    </div>
  </div>
</div>
```

**Props**: 
- `progress` - ゲーム進行状況
- `accuracy` - タイピング精度
- `animated` - アニメーション有効フラグ

**State**: なし（派生値のみ）
**Events**: なし

## 汎用UIコンポーネント

### 1. Button.svelte

```svelte
<script lang="ts">
  interface Props {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
  }
  
  let { 
    variant = 'primary', 
    size = 'md', 
    disabled = false,
    loading = false,
    fullWidth = false
  }: Props = $props();
</script>

<button 
  class="btn btn-{variant} btn-{size}"
  class:btn-full={fullWidth}
  class:btn-loading={loading}
  {disabled}
  on:click
>
  {#if loading}
    <span class="loading-spinner"></span>
  {/if}
  <slot />
</button>
```

### 2. Modal.svelte

```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  interface Props {
    open?: boolean;
    title?: string;
    closable?: boolean;
  }
  
  let { open = false, title, closable = true }: Props = $props();
  
  const dispatch = createEventDispatcher<{
    close: void;
    open: void;
  }>();
  
  const closeModal = () => {
    if (closable) {
      dispatch('close');
    }
  };
  
  $effect(() => {
    if (open) {
      dispatch('open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  });
</script>

{#if open}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      {#if title}
        <div class="modal-header">
          <h2 class="modal-title">{title}</h2>
          {#if closable}
            <button class="modal-close" on:click={closeModal}>×</button>
          {/if}
        </div>
      {/if}
      
      <div class="modal-body">
        <slot />
      </div>
      
      <div class="modal-footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
{/if}
```

## コンポーネント通信

### イベントフロー

```typescript
// 子コンポーネント → 親コンポーネント
dispatch('event-name', eventData);

// 兄弟コンポーネント間 → Store経由
import { gameStore } from '$lib/stores/gameStore';
gameStore.updateScore(newScore);

// グローバルイベント → カスタムイベント
import { createEventTarget } from '$lib/utils/events';
const gameEvents = createEventTarget();
gameEvents.dispatchEvent(new CustomEvent('game:start'));
```

### Props設計原則

1. **単一責任**: 各Propは明確な目的を持つ
2. **型安全性**: TypeScriptの型定義を活用
3. **デフォルト値**: 適切なデフォルト値を設定
4. **バリデーション**: 必要に応じて入力値を検証

### State管理戦略

```typescript
// ローカルState（コンポーネント内のみ）
let localValue = $state(initialValue);

// 派生State（他の値から計算）
let derivedValue = $derived(computation);

// グローバルState（複数コンポーネント間共有）
import { gameStore } from '$lib/stores/gameStore';
let globalValue = $state(gameStore.value);
```

## スタイリング戦略

### CSS設計原則

1. **BEM記法**: Block-Element-Modifier
2. **Tailwind優先**: ユーティリティファーストアプローチ
3. **コンポーネント固有スタイル**: 必要な場合のみ
4. **レスポンシブ**: モバイルファーストデザイン

### テーマ対応

```svelte
<style>
  .component {
    @apply bg-white dark:bg-gray-800;
    @apply text-gray-900 dark:text-gray-100;
    @apply border border-gray-200 dark:border-gray-700;
  }
</style>
```

## テスト戦略

### 単体テスト

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import Button from './Button.svelte';

test('Button renders with correct text', () => {
  const { getByText } = render(Button, { 
    props: { children: 'Click me' } 
  });
  
  expect(getByText('Click me')).toBeInTheDocument();
});
```

### 統合テスト

```typescript
import { render, fireEvent } from '@testing-library/svelte';
import GameScreen from './GameScreen.svelte';

test('GameScreen handles typing input correctly', async () => {
  const { getByRole } = render(GameScreen);
  const input = getByRole('textbox');
  
  await fireEvent.input(input, { target: { value: 'test' } });
  // アサーション...
});
```