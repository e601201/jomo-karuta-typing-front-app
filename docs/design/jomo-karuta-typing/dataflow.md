# データフロー図

## ゲームプレイフロー

### 基本的なゲームフロー
```mermaid
flowchart TD
    Start([開始]) --> Menu[メインメニュー]
    Menu --> SelectMode{モード選択}
    
    SelectMode --> Practice[練習モード]
    SelectMode --> Specific[特定札練習]
    SelectMode --> Random[ランダム出題]
    
    Practice --> GameInit[ゲーム初期化]
    Specific --> SelectCards[札選択画面]
    Random --> GameInit
    SelectCards --> GameInit
    
    GameInit --> DisplayCard[札表示]
    DisplayCard --> WaitInput[入力待機]
    
    WaitInput --> InputCheck{入力判定}
    InputCheck -->|正解| UpdateProgress[進捗更新]
    InputCheck -->|誤入力| ShowError[エラー表示]
    
    ShowError --> DeleteChar[誤入力文字削除]
    DeleteChar --> WaitInput
    
    UpdateProgress --> CheckComplete{全文字完了?}
    CheckComplete -->|No| WaitInput
    CheckComplete -->|Yes| NextCard{次の札あり?}
    
    NextCard -->|Yes| DisplayCard
    NextCard -->|No| ShowResult[結果表示]
    
    ShowResult --> SaveData[データ保存]
    SaveData --> Menu
```

### 入力判定の詳細フロー
```mermaid
flowchart LR
    KeyPress([キー入力]) --> ValidateKey{有効キー?}
    
    ValidateKey -->|No| Ignore[無視]
    ValidateKey -->|Yes| CheckChar{文字判定}
    
    CheckChar -->|正解| Highlight[緑ハイライト]
    CheckChar -->|不正解| ErrorHighlight[赤ハイライト]
    
    Highlight --> UpdatePos[位置更新]
    ErrorHighlight --> AutoDelete[自動削除]
    
    UpdatePos --> CheckEnd{最終文字?}
    CheckEnd -->|Yes| Complete[完了処理]
    CheckEnd -->|No| NextChar[次文字待機]
```

## データ処理フロー

### ユーザー操作とデータの流れ (Phase 1-2)
```mermaid
sequenceDiagram
    participant U as ユーザー
    participant UI as UI Layer
    participant S as Svelte Store
    participant L as Game Logic
    participant LS as LocalStorage
    participant IDB as IndexedDB
    
    U->>UI: ゲーム開始
    UI->>S: 初期状態設定
    S->>L: ゲーム初期化
    L->>LS: 設定読み込み
    LS-->>L: 設定データ
    L->>IDB: 進捗データ読み込み
    IDB-->>L: 進捗データ
    L-->>S: 初期化完了
    S-->>UI: 画面更新
    
    loop タイピング中
        U->>UI: キー入力
        UI->>L: 入力検証
        L->>L: 正誤判定
        L-->>S: 状態更新
        S-->>UI: 表示更新
    end
    
    U->>UI: ゲーム終了
    UI->>L: 結果計算
    L->>IDB: スコア保存
    L->>LS: 進捗保存
    L-->>S: 結果データ
    S-->>UI: 結果表示
```

### データ同期フロー (Phase 3-4)
```mermaid
sequenceDiagram
    participant U as ユーザー
    participant F as Frontend
    participant A as Supabase Auth
    participant D as Supabase DB
    participant R as Realtime
    participant S as Storage
    
    U->>F: ログイン
    F->>A: 認証リクエスト
    A-->>F: JWT Token
    F->>D: ユーザーデータ取得
    D-->>F: プロフィール・進捗
    
    U->>F: ゲームプレイ
    F->>F: ローカル処理
    F->>D: スコア保存
    D-->>F: 保存完了
    
    Note over R: リアルタイム同期
    D->>R: データ変更通知
    R->>F: 更新通知
    F->>F: UI更新
    
    U->>F: アバター変更
    F->>S: 画像アップロード
    S-->>F: URL返却
    F->>D: プロフィール更新
```

## 状態管理フロー

### ゲーム状態の遷移
```mermaid
stateDiagram-v2
    [*] --> Idle: アプリ起動
    
    Idle --> Menu: 初期化完了
    Menu --> Settings: 設定変更
    Settings --> Menu: 設定保存
    
    Menu --> Loading: ゲーム開始
    Loading --> Playing: データ読込完了
    
    Playing --> Paused: 一時停止
    Paused --> Playing: 再開
    Paused --> Menu: 中断
    
    Playing --> Completed: 全札完了
    Completed --> Result: スコア計算
    Result --> Menu: 結果確認
    
    Playing --> Error: エラー発生
    Error --> Menu: リカバリ
```

### データストアの相互作用
```mermaid
flowchart TD
    subgraph Frontend Stores
        GameStore[Game Store]
        UserStore[User Store]
        SettingsStore[Settings Store]
        ProgressStore[Progress Store]
    end
    
    subgraph Persistence Layer
        LocalStorage[LocalStorage]
        IndexedDB[IndexedDB]
        Memory[Memory Cache]
    end
    
    subgraph Phase3-4
        SupabaseDB[(Supabase DB)]
        SupabaseAuth[Supabase Auth]
    end
    
    GameStore <--> Memory
    UserStore <--> LocalStorage
    SettingsStore <--> LocalStorage
    ProgressStore <--> IndexedDB
    
    UserStore -.->|Phase 3-4| SupabaseAuth
    ProgressStore -.->|Phase 3-4| SupabaseDB
```

## エラーハンドリングフロー

```mermaid
flowchart TD
    Error([エラー発生]) --> ErrorType{エラー種別}
    
    ErrorType -->|ネットワーク| NetworkError[オフラインモード]
    ErrorType -->|ストレージ| StorageError[容量確認]
    ErrorType -->|入力| InputError[入力リセット]
    ErrorType -->|システム| SystemError[再起動促す]
    
    NetworkError --> Fallback[ローカル動作]
    StorageError --> Cleanup[古いデータ削除]
    InputError --> Resume[ゲーム継続]
    SystemError --> Restart[アプリ再起動]
    
    Fallback --> Log[エラーログ記録]
    Cleanup --> Log
    Resume --> Log
    Restart --> Log
    
    Log --> Report[エラー報告]
```

## リアルタイム対戦フロー (Phase 4)

```mermaid
sequenceDiagram
    participant P1 as Player 1
    participant P2 as Player 2
    participant M as Matchmaking
    participant G as Game Server
    participant R as Realtime Channel
    
    P1->>M: 対戦申込
    P2->>M: 対戦申込
    M->>M: マッチング処理
    M->>G: ルーム作成
    G->>R: チャンネル開設
    
    M-->>P1: マッチング成功
    M-->>P2: マッチング成功
    
    P1->>R: Subscribe
    P2->>R: Subscribe
    
    G->>R: ゲーム開始通知
    R-->>P1: 札データ
    R-->>P2: 札データ
    
    loop ゲーム中
        P1->>R: 入力進捗
        R-->>P2: 相手の進捗
        P2->>R: 入力進捗
        R-->>P1: 相手の進捗
    end
    
    P1->>R: 完了通知
    G->>G: 勝敗判定
    G->>R: 結果通知
    R-->>P1: 結果表示
    R-->>P2: 結果表示
```