# 上毛かるたタイピングゲーム

上毛かるたを題材にしたタイピングゲームです。

## セットアップ

### 環境変数の設定

1. `.env.example` を `.env` にコピー

```sh
cp .env.example .env
```

2. `.env` ファイルに Supabase の認証情報を設定

```
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 依存関係のインストール

```sh
bun install
```

## 開発

開発サーバーを起動:

```sh
bun --bun run dev

# ブラウザで自動的に開く場合
bun --bun run dev -- --open
```

## ビルド

プロダクションビルド:

```sh
bun --bun run build
```

ビルドのプレビュー:

```sh
bun --bun run preview
```

## Vercel へのデプロイ

### 環境変数の設定

1. Vercel ダッシュボードにアクセス
2. プロジェクトの **Settings** → **Environment Variables** へ移動
3. 以下の環境変数を追加:
   - `PUBLIC_SUPABASE_URL`: Supabase プロジェクトの URL
   - `PUBLIC_SUPABASE_ANON_KEY`: Supabase の匿名キー

### デプロイ

1. GitHub にコードをプッシュ
2. Vercel が自動的にビルド・デプロイを実行

> 注意: 環境変数が設定されていない場合、ビルドエラーが発生します。
