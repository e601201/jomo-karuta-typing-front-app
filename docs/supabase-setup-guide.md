# Supabase 設定ガイド

## 1. Supabaseプロジェクトの基本設定

### 1.1 Authentication設定

#### メール認証の設定

1. Supabaseダッシュボード → Authentication → Providers
2. **Email**を有効化
   - ✅ Enable Email provider
   - ✅ Confirm email（推奨：メールアドレス確認を必須に）
   - ✅ Secure email change（メールアドレス変更時の確認）
   - ✅ Secure password change（パスワード変更時の確認）

#### ソーシャル認証の設定（オプション）

1. **Google認証**
   - Google Cloud Consoleで OAuth 2.0 クライアントIDを作成
   - 承認済みのリダイレクトURI: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
   - Client IDとClient Secretを Supabaseに設定

2. **GitHub認証**
   - GitHub → Settings → Developer settings → OAuth Apps
   - Authorization callback URL: `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
   - Client IDとClient Secretを Supabaseに設定

### 1.2 URL Configuration

Authentication → URL Configuration で以下を設定：

```
Site URL: https://your-domain.vercel.app (本番URL)
Redirect URLs:
  - https://your-domain.vercel.app/**
  - http://localhost:5173/** (開発環境)
  - https://*.vercel.app/** (プレビューデプロイ用)
```

### 1.3 Email Templates

Authentication → Email Templates でメールテンプレートをカスタマイズ：

#### 確認メール（Confirm signup）

```html
<h2>ジョーモカルタタイピングへようこそ！</h2>
<p>登録ありがとうございます。以下のリンクをクリックしてメールアドレスを確認してください：</p>
<p><a href="{{ .ConfirmationURL }}">メールアドレスを確認</a></p>
```

#### パスワードリセット（Reset Password）

```html
<h2>パスワードリセット</h2>
<p>以下のリンクからパスワードをリセットできます：</p>
<p><a href="{{ .ConfirmationURL }}">パスワードをリセット</a></p>
<p>このリクエストに心当たりがない場合は、このメールを無視してください。</p>
```

## 2. データベース設定

### 2.1 プロフィールテーブルの作成

SQL Editorで以下を実行：

```sql
-- プロフィールテーブルの作成
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nickname TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT CHECK (char_length(bio) <= 200),
  email_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS（Row Level Security）の有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ポリシーの作成
-- 全ユーザーがプロフィールを閲覧可能
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- ユーザーは自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ユーザーは自分のプロフィールのみ作成可能
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### 2.2 Scoreテーブルの更新

```sql
-- user_idカラムの追加
ALTER TABLE public."Score"
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_score_user_id ON public."Score"(user_id);
CREATE INDEX idx_score_difficulty ON public."Score"(difficulty);
CREATE INDEX idx_score_user_difficulty ON public."Score"(user_id, difficulty);

-- RLSポリシーの更新
-- 全ユーザーがスコアを閲覧可能
CREATE POLICY "Scores are viewable by everyone"
  ON public."Score" FOR SELECT
  USING (true);

-- ログインユーザーのみスコアを追加可能
CREATE POLICY "Authenticated users can insert scores"
  ON public."Score" FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (user_id IS NULL OR auth.uid() = user_id)
  );
```

### 2.3 トリガー関数の作成

```sql
-- プロフィール自動作成トリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, email_public)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1)),
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの設定
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_atの自動更新
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### 2.4 お気に入り機能用テーブル（オプション）

```sql
-- お気に入りカルタテーブル
CREATE TABLE public.favorite_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  card_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, card_id)
);

-- RLSの有効化
ALTER TABLE public.favorite_cards ENABLE ROW LEVEL SECURITY;

-- ポリシー
CREATE POLICY "Users can view own favorites"
  ON public.favorite_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.favorite_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.favorite_cards FOR DELETE
  USING (auth.uid() = user_id);
```

## 3. ストレージ設定（アバター画像用）

### 3.1 バケットの作成

```sql
-- アバター画像用バケット
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);
```

### 3.2 ストレージポリシー

```sql
-- アバター画像のアップロードポリシー
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- アバター画像の更新ポリシー
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- アバター画像の削除ポリシー
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 公開アクセス（誰でも閲覧可能）
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

## 4. セキュリティ設定

### 4.1 Auth設定の強化

Settings → Auth で以下を設定：

- **JWT有効期限**: 3600秒（1時間）
- **リフレッシュトークン再利用期間**: 10秒
- **パスワード最小長**: 8文字
- **メール確認要求**: 有効
- **メールアドレス変更時の再確認**: 有効

### 4.2 Rate Limiting

```sql
-- レート制限の設定（DDoS対策）
-- Supabase Dashboardの Settings → API で設定
-- または Edge Functionsで実装
```

### 4.3 CORS設定

Project Settings → API：

- 許可するオリジンを明示的に指定
- 開発環境: `http://localhost:5173`
- 本番環境: `https://your-domain.vercel.app`

## 5. 環境変数

### 5.1 必要な環境変数

プロジェクトで使用する環境変数：

```bash
# .env.local (開発環境)
PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Vercel環境変数（本番環境）
PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5.2 環境変数の取得場所

Supabaseダッシュボード → Settings → API：

- **Project URL**: `PUBLIC_SUPABASE_URL`として使用
- **anon/public key**: `PUBLIC_SUPABASE_ANON_KEY`として使用

⚠️ **注意**: service_role keyは絶対にクライアント側で使用しない

## 6. 監視とログ

### 6.1 認証ログの確認

Authentication → Logs で以下を監視：

- サインアップ成功/失敗
- ログイン試行
- パスワードリセット要求
- メール確認状況

### 6.2 データベースログ

Logs → Database で以下を確認：

- クエリパフォーマンス
- エラーログ
- スロークエリ

## 7. 本番環境移行前のチェックリスト

- [ ] RLSが全テーブルで有効化されている
- [ ] 適切なポリシーが設定されている
- [ ] メールテンプレートがカスタマイズされている
- [ ] URLホワイトリストが設定されている
- [ ] バックアップ設定が有効
- [ ] 監視アラートが設定されている
- [ ] レート制限が適切に設定されている
- [ ] SSL/TLS証明書が有効

## 8. トラブルシューティング

### よくある問題と解決方法

1. **メールが届かない**
   - Email Settingsで SMTP設定を確認
   - カスタムSMTPの設定を検討

2. **CORS エラー**
   - Redirect URLsに現在のURLが含まれているか確認
   - API設定でCORSヘッダーを確認

3. **RLSエラー**
   - ポリシーが正しく設定されているか確認
   - anon keyを使用しているか確認（service_role keyではなく）

4. **パフォーマンス問題**
   - インデックスが適切に作成されているか確認
   - Database → Performance でクエリを分析
