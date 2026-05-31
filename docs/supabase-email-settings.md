# Supabase メール設定ガイド

## パスワードリセットメールが送信されない場合の確認事項

### 1. Supabase Dashboard での確認

#### Authentication → Settings → Email Auth

- ✅ **Enable email confirmations** がONになっているか
- ✅ **Enable email login** がONになっているか

#### Authentication → URL Configuration

以下のURLが正しく設定されているか確認：

```
Site URL: http://localhost:5173 (開発環境)
または
Site URL: https://your-domain.vercel.app (本番環境)

Redirect URLs に以下を追加:
- http://localhost:5173/auth/callback
- http://localhost:5173/auth/reset-password
- https://your-domain.vercel.app/auth/callback
- https://your-domain.vercel.app/auth/reset-password
```

### 2. Email Templates の確認

Authentication → Email Templates → **Reset Password** で以下のテンプレートを設定：

```html
<h2>パスワードリセット</h2>
<p>以下のリンクをクリックしてパスワードをリセットしてください：</p>
<p><a href="{{ .ConfirmationURL }}">パスワードをリセット</a></p>
<p>このメールに心当たりがない場合は無視してください。</p>
```

重要な変数：

- `{{ .ConfirmationURL }}` - これが正しく設定されていることを確認

### 3. SMTP設定（カスタムSMTPを使用する場合）

Settings → Project Settings → Auth で以下を確認：

#### Supabase標準のメール送信を使用する場合：

- 何も設定不要（ただし、レート制限あり：1時間に3通まで）

#### カスタムSMTPを使用する場合：

```
SMTP Host: smtp.gmail.com (Gmailの例)
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: アプリパスワード
Sender email: your-email@gmail.com
Sender name: Your App Name
```

### 4. テスト環境での制限

開発環境では以下の制限があります：

- **無料プランの場合**: 1時間に3通までのメール送信制限
- **メールが届かない場合**: Authentication → Logs でエラーを確認

### 5. デバッグ手順

1. **Supabase Dashboard → Authentication → Logs** を確認
   - `auth.reset_password_for_email` のログを探す
   - エラーメッセージを確認

2. **ブラウザのコンソール** を確認
   - Network タブで `/auth/reset-password` へのリクエストを確認
   - Response を確認してエラーメッセージを特定

3. **サーバーログ** を確認
   - ターミナルでサーバーログを確認
   - `console.log` の出力を確認

### 6. よくある問題と解決方法

#### 問題: メールが届かない

**解決方法**:

1. スパムフォルダを確認
2. Supabase Dashboardでメール送信ログを確認
3. カスタムSMTPの設定を検討

#### 問題: Invalid email エラー

**解決方法**:

1. メールアドレスの形式を確認
2. 登録済みのメールアドレスか確認

#### 問題: Rate limit exceeded

**解決方法**:

1. 1時間待つ
2. カスタムSMTPを設定
3. 有料プランへアップグレード

### 7. 本番環境への移行時の注意

1. **Site URL** を本番URLに変更
2. **Redirect URLs** に本番URLを追加
3. **カスタムSMTP** の設定を推奨（送信制限回避のため）
4. **SPF/DKIM** レコードの設定（メール到達率向上のため）
