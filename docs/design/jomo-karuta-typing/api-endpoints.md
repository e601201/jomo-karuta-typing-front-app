# API エンドポイント仕様

## 概要

Phase 3-4で実装するSupabaseベースのAPIエンドポイント仕様。Supabase JavaScript SDKを使用してフロントエンドから直接データベースにアクセスし、Row Level Security (RLS) で権限管理を行う。

## 認証 API

### Supabase Auth による認証

```typescript
// サインアップ
const { data, error } = await supabase.auth.signUp({
	email: 'user@example.com',
	password: 'password123'
});

// サインイン
const { data, error } = await supabase.auth.signInWithPassword({
	email: 'user@example.com',
	password: 'password123'
});

// ソーシャルログイン
const { data, error } = await supabase.auth.signInWithOAuth({
	provider: 'google' | 'twitter'
});

// サインアウト
const { error } = await supabase.auth.signOut();

// セッション取得
const {
	data: { session }
} = await supabase.auth.getSession();

// ユーザー情報取得
const {
	data: { user }
} = await supabase.auth.getUser();
```

## ユーザープロフィール API

### GET /rest/v1/user_profiles

現在のユーザープロフィールを取得

```typescript
const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
```

**レスポンス:**

```json
{
	"id": "uuid",
	"username": "player123",
	"display_name": "プレイヤー123",
	"avatar_url": "https://...",
	"level": 5,
	"experience": 1250,
	"created_at": "2024-01-01T00:00:00Z",
	"updated_at": "2024-01-01T00:00:00Z"
}
```

### PATCH /rest/v1/user_profiles

プロフィールを更新

```typescript
const { data, error } = await supabase
	.from('user_profiles')
	.update({
		display_name: '新しい名前',
		avatar_url: 'https://...'
	})
	.eq('id', userId);
```

## ゲームセッション API

### POST /rest/v1/game_sessions

新しいゲームセッションを開始

```typescript
const { data, error } = await supabase
  .from('game_sessions')
  .insert({
    user_id: userId,
    mode: 'practice',
    input_mode: 'complete',
    cards: ['tsu', 'ne', 'chi', ...],
    settings: { ... },
    status: 'loading'
  })
  .select()
  .single()
```

### PATCH /rest/v1/game_sessions/:id

セッション状態を更新

```typescript
const { data, error } = await supabase
	.from('game_sessions')
	.update({
		status: 'playing',
		current_card_index: 5
	})
	.eq('id', sessionId);
```

### GET /rest/v1/game_sessions

ユーザーのセッション履歴を取得

```typescript
const { data, error } = await supabase
	.from('game_sessions')
	.select(
		`
    *,
    game_results (*)
  `
	)
	.eq('user_id', userId)
	.order('started_at', { ascending: false })
	.limit(10);
```

## ゲーム結果 API

### POST /rest/v1/game_results

ゲーム結果を保存

```typescript
const { data, error } = await supabase.from('game_results').insert({
	session_id: sessionId,
	user_id: userId,
	total_time: 120000,
	total_cards: 44,
	completed_cards: 42,
	total_chars: 850,
	correct_chars: 820,
	mistakes: 30,
	accuracy: 96.47,
	wpm: 85.5,
	cpm: 425.0,
	score: 8500
});
```

### POST /rest/v1/card_results

個別札の結果を保存（バッチ挿入）

```typescript
const { data, error } = await supabase.from('card_results').insert([
	{
		session_id: sessionId,
		card_id: 'tsu',
		time_spent: 2500,
		mistakes: 0,
		accuracy: 100,
		completed: true
	}
	// ... 他の札の結果
]);
```

## 学習進捗 API

### GET /rest/v1/card_progress

ユーザーの札ごとの進捗を取得

```typescript
const { data, error } = await supabase
	.from('card_progress')
	.select(
		`
    *,
    karuta_cards (*)
  `
	)
	.eq('user_id', userId);
```

### UPSERT /rest/v1/card_progress

札の進捗を更新（存在しない場合は作成）

```typescript
const { data, error } = await supabase.from('card_progress').upsert({
	user_id: userId,
	card_id: 'tsu',
	attempts: 5,
	best_time: 2000,
	total_time: 12000,
	total_mistakes: 3,
	last_attempt_at: new Date(),
	mastered: true
});
```

## 統計 API

### GET /rest/v1/user_stats

ユーザー統計を取得

```typescript
const { data, error } = await supabase
	.from('user_stats')
	.select('*')
	.eq('user_id', userId)
	.single();
```

### RPC: calculate_user_ranking

ユーザーのランキングを計算（ストアドプロシージャ）

```typescript
const { data, error } = await supabase.rpc('calculate_user_ranking', {
	user_id: userId,
	period: 'weekly' | 'monthly'
});
```

## ランキング API

### GET /rest/v1/weekly_rankings

週間ランキングを取得

```typescript
const { data, error } = await supabase
	.from('weekly_rankings')
	.select(
		`
    *,
    user_profiles (username, display_name, avatar_url)
  `
	)
	.eq('week_start', weekStart)
	.order('rank', { ascending: true })
	.limit(100);
```

## 実績 API

### GET /rest/v1/user_achievements

ユーザーの実績を取得

```typescript
const { data, error } = await supabase
	.from('user_achievements')
	.select(
		`
    *,
    achievements (*)
  `
	)
	.eq('user_id', userId);
```

### RPC: check_achievements

実績の達成状況をチェック（ストアドプロシージャ）

```typescript
const { data, error } = await supabase.rpc('check_achievements', {
	user_id: userId,
	session_id: sessionId
});
```

## 対戦機能 API (Phase 4)

### POST /rest/v1/match_rooms

対戦ルームを作成

```typescript
const { data, error } = await supabase
	.from('match_rooms')
	.insert({
		host_id: userId,
		room_code: generateRoomCode(),
		mode: 'realtime',
		card_count: 10,
		status: 'waiting'
	})
	.select()
	.single();
```

### PATCH /rest/v1/match_rooms/:room_code

ルームに参加

```typescript
const { data, error } = await supabase
	.from('match_rooms')
	.update({
		guest_id: userId,
		status: 'ready'
	})
	.eq('room_code', roomCode)
	.is('guest_id', null);
```

## リアルタイム通信 (Supabase Realtime)

### 対戦中の進捗同期

```typescript
// チャンネルの購読
const channel = supabase
	.channel(`match:${roomId}`)
	.on(
		'postgres_changes',
		{
			event: 'UPDATE',
			schema: 'public',
			table: 'match_progress',
			filter: `room_id=eq.${roomId}`
		},
		(payload) => {
			// 相手の進捗を画面に反映
			updateOpponentProgress(payload.new);
		}
	)
	.subscribe();

// 自分の進捗を送信
await supabase.from('match_progress').upsert({
	room_id: roomId,
	player_id: userId,
	current_card: 5,
	current_position: 10,
	mistakes: 2
});
```

### プレゼンス機能（オンライン状態）

```typescript
// プレゼンスチャンネル
const presenceChannel = supabase.channel('online_users');

// 自分の状態を送信
presenceChannel
	.on('presence', { event: 'sync' }, () => {
		const state = presenceChannel.presenceState();
	})
	.subscribe(async (status) => {
		if (status === 'SUBSCRIBED') {
			await presenceChannel.track({
				user_id: userId,
				online_at: new Date().toISOString()
			});
		}
	});
```

## エッジファンクション (Supabase Edge Functions)

### POST /functions/v1/calculate-score

複雑なスコア計算をサーバーサイドで実行

```typescript
const { data, error } = await supabase.functions.invoke('calculate-score', {
	body: {
		session_id: sessionId,
		results: cardResults
	}
});
```

### POST /functions/v1/generate-challenge

日替わりチャレンジを生成

```typescript
const { data, error } = await supabase.functions.invoke('generate-challenge', {
	body: {
		user_id: userId,
		difficulty: 'medium'
	}
});
```

## エラーレスポンス

すべてのAPIエラーは以下の形式で返される：

```json
{
	"error": {
		"code": "PGRST116",
		"message": "認証が必要です",
		"details": "JWT token is missing or invalid",
		"hint": null
	}
}
```

## レート制限

- 認証API: 5回/分
- データ取得API: 100回/分
- データ更新API: 30回/分
- リアルタイム接続: 100接続/ユーザー

## セキュリティ

- すべてのAPIはHTTPS経由でのみアクセス可能
- JWTトークンによる認証が必須
- Row Level Security (RLS) によるデータアクセス制御
- APIキーは環境変数で管理
