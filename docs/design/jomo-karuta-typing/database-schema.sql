-- ============================================
-- Supabase (PostgreSQL) データベーススキーマ
-- Phase 3-4 用
-- ============================================

-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ユーザー関連テーブル
-- ============================================

-- ユーザープロフィール（Supabase Authと連携）
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(30) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 100),
    experience INTEGER DEFAULT 0 CHECK (experience >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ユーザー設定
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    -- ゲーム設定
    game_mode VARCHAR(20) DEFAULT 'practice',
    input_mode VARCHAR(20) DEFAULT 'complete',
    partial_length INTEGER DEFAULT 5 CHECK (partial_length >= 3 AND partial_length <= 10),
    sound_enabled BOOLEAN DEFAULT true,
    bgm_enabled BOOLEAN DEFAULT false,
    show_hints BOOLEAN DEFAULT false,
    show_romaji BOOLEAN DEFAULT true,
    font_size VARCHAR(10) DEFAULT 'medium',
    theme VARCHAR(10) DEFAULT 'auto',
    -- アプリ設定
    notifications BOOLEAN DEFAULT true,
    email_updates BOOLEAN DEFAULT false,
    public_profile BOOLEAN DEFAULT true,
    language VARCHAR(2) DEFAULT 'ja',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- カルタデータテーブル
-- ============================================

-- カルタ札マスターデータ
CREATE TABLE karuta_cards (
    id VARCHAR(10) PRIMARY KEY,  -- 例: 'tsu', 'ne', 'chi'
    hiragana TEXT NOT NULL,
    romaji TEXT NOT NULL,
    meaning TEXT NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('history', 'geography', 'culture', 'nature', 'industry')),
    difficulty VARCHAR(10) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    image_url TEXT,
    audio_url TEXT,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ゲームセッション関連テーブル
-- ============================================

-- ゲームセッション
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL,
    input_mode VARCHAR(20) NOT NULL,
    partial_length INTEGER,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('loading', 'playing', 'paused', 'completed', 'error')),
    total_cards INTEGER NOT NULL,
    completed_cards INTEGER DEFAULT 0,
    current_card_index INTEGER DEFAULT 0,
    cards JSONB NOT NULL, -- 出題札のID配列
    settings JSONB NOT NULL, -- ゲーム設定のJSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ゲーム結果
CREATE TABLE game_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    total_time INTEGER NOT NULL, -- ミリ秒
    total_cards INTEGER NOT NULL,
    completed_cards INTEGER NOT NULL,
    total_chars INTEGER NOT NULL,
    correct_chars INTEGER NOT NULL,
    mistakes INTEGER NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
    wpm DECIMAL(6,2) NOT NULL CHECK (wpm >= 0),
    cpm DECIMAL(7,2) NOT NULL CHECK (cpm >= 0),
    score INTEGER NOT NULL CHECK (score >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 個別札の結果
CREATE TABLE card_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    card_id VARCHAR(10) NOT NULL REFERENCES karuta_cards(id),
    time_spent INTEGER NOT NULL, -- ミリ秒
    mistakes INTEGER NOT NULL DEFAULT 0,
    accuracy DECIMAL(5,2) NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
    completed BOOLEAN NOT NULL DEFAULT false,
    input_events JSONB, -- 詳細な入力イベントログ
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 学習進捗関連テーブル
-- ============================================

-- 札ごとの進捗
CREATE TABLE card_progress (
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    card_id VARCHAR(10) NOT NULL REFERENCES karuta_cards(id),
    attempts INTEGER DEFAULT 0,
    best_time INTEGER, -- ミリ秒
    total_time INTEGER DEFAULT 0, -- 累計時間
    total_mistakes INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    mastered BOOLEAN DEFAULT false,
    mastered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, card_id)
);

-- ユーザー統計サマリー
CREATE TABLE user_stats (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    total_sessions INTEGER DEFAULT 0,
    total_time INTEGER DEFAULT 0, -- ミリ秒
    total_cards INTEGER DEFAULT 0,
    total_chars INTEGER DEFAULT 0,
    total_mistakes INTEGER DEFAULT 0,
    best_wpm DECIMAL(6,2) DEFAULT 0,
    best_accuracy DECIMAL(5,2) DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_played_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 実績システム (Phase 3-4)
-- ============================================

-- 実績定義
CREATE TABLE achievements (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(100),
    category VARCHAR(30) NOT NULL,
    target_value INTEGER NOT NULL,
    points INTEGER DEFAULT 10,
    display_order INTEGER NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ユーザー実績
CREATE TABLE user_achievements (
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL REFERENCES achievements(id),
    progress INTEGER DEFAULT 0,
    unlocked BOOLEAN DEFAULT false,
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
);

-- ============================================
-- ランキング関連 (Phase 3-4)
-- ============================================

-- 週間ランキング
CREATE TABLE weekly_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    score INTEGER NOT NULL,
    total_sessions INTEGER NOT NULL,
    total_time INTEGER NOT NULL,
    best_wpm DECIMAL(6,2) NOT NULL,
    best_accuracy DECIMAL(5,2) NOT NULL,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_start)
);

-- 月間ランキング
CREATE TABLE monthly_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    month_start DATE NOT NULL,
    score INTEGER NOT NULL,
    total_sessions INTEGER NOT NULL,
    total_time INTEGER NOT NULL,
    best_wpm DECIMAL(6,2) NOT NULL,
    best_accuracy DECIMAL(5,2) NOT NULL,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month_start)
);

-- ============================================
-- 対戦機能 (Phase 4)
-- ============================================

-- 対戦ルーム
CREATE TABLE match_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_code VARCHAR(6) UNIQUE NOT NULL, -- 6桁のルームコード
    host_id UUID NOT NULL REFERENCES user_profiles(id),
    guest_id UUID REFERENCES user_profiles(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('waiting', 'ready', 'playing', 'finished', 'cancelled')),
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('realtime', 'turn')),
    card_count INTEGER NOT NULL DEFAULT 10,
    time_limit INTEGER, -- 秒
    allow_spectators BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE
);

-- 対戦結果
CREATE TABLE match_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES match_rooms(id) ON DELETE CASCADE,
    winner_id UUID REFERENCES user_profiles(id),
    loser_id UUID REFERENCES user_profiles(id),
    is_draw BOOLEAN DEFAULT false,
    winner_score INTEGER,
    loser_score INTEGER,
    duration INTEGER, -- 秒
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 対戦進捗（リアルタイム同期用）
CREATE TABLE match_progress (
    room_id UUID NOT NULL REFERENCES match_rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES user_profiles(id),
    current_card INTEGER DEFAULT 0,
    current_position INTEGER DEFAULT 0,
    mistakes INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    last_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, player_id)
);

-- ============================================
-- インデックス
-- ============================================

-- ユーザー関連
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_level ON user_profiles(level DESC);
CREATE INDEX idx_user_profiles_experience ON user_profiles(experience DESC);

-- ゲームセッション関連
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);
CREATE INDEX idx_game_sessions_started_at ON game_sessions(started_at DESC);
CREATE INDEX idx_game_results_user_id ON game_results(user_id);
CREATE INDEX idx_game_results_score ON game_results(score DESC);
CREATE INDEX idx_card_results_session_id ON card_results(session_id);

-- 進捗関連
CREATE INDEX idx_card_progress_user_id ON card_progress(user_id);
CREATE INDEX idx_card_progress_mastered ON card_progress(mastered);
CREATE INDEX idx_user_stats_best_score ON user_stats(best_score DESC);
CREATE INDEX idx_user_stats_best_wpm ON user_stats(best_wpm DESC);

-- 実績関連
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_unlocked ON user_achievements(unlocked);

-- ランキング関連
CREATE INDEX idx_weekly_rankings_week ON weekly_rankings(week_start DESC);
CREATE INDEX idx_weekly_rankings_score ON weekly_rankings(score DESC);
CREATE INDEX idx_monthly_rankings_month ON monthly_rankings(month_start DESC);
CREATE INDEX idx_monthly_rankings_score ON monthly_rankings(score DESC);

-- 対戦関連
CREATE INDEX idx_match_rooms_status ON match_rooms(status);
CREATE INDEX idx_match_rooms_room_code ON match_rooms(room_code);
CREATE INDEX idx_match_rooms_host_id ON match_rooms(host_id);
CREATE INDEX idx_match_results_room_id ON match_results(room_id);

-- ============================================
-- Row Level Security (RLS) ポリシー
-- ============================================

-- RLSを有効化
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_progress ENABLE ROW LEVEL SECURITY;

-- ユーザープロフィールのポリシー
CREATE POLICY "Users can view all profiles" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- ユーザー設定のポリシー
CREATE POLICY "Users can view own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ゲームセッションのポリシー
CREATE POLICY "Users can view own sessions" ON game_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON game_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON game_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- トリガー関数
-- ============================================

-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atトリガーの設定
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_progress_updated_at BEFORE UPDATE ON card_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stats_updated_at BEFORE UPDATE ON user_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_achievements_updated_at BEFORE UPDATE ON user_achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 初期データ投入
-- ============================================

-- 上毛カルタの札データ（サンプル）
INSERT INTO karuta_cards (id, hiragana, romaji, meaning, category, difficulty, display_order) VALUES
('tsu', 'つる まう かたちの ぐんまけん', 'tsuru mau katachi no gunmaken', '鶴舞う形の群馬県', 'geography', 'easy', 1),
('ne', 'ねぎと こんにゃく しもにた めいぶつ', 'negi to konnyaku shimonita meibutsu', 'ねぎとこんにゃく下仁田名物', 'industry', 'medium', 2),
('chi', 'ちからあわせる にひゃくまんにん', 'chikara awaseru nihyakumannin', '力あわせる二百万人', 'culture', 'easy', 3);
-- 他41枚は実装時に追加

-- 実績定義のサンプル
INSERT INTO achievements (id, name, description, category, target_value, points, display_order) VALUES
('first_session', '初めての一歩', '初めてゲームをプレイする', 'beginner', 1, 10, 1),
('speed_demon', 'スピードデーモン', 'WPM100以上を達成', 'skill', 100, 50, 2),
('perfect_accuracy', '完璧主義者', '正確率100%で10枚完走', 'skill', 10, 100, 3),
('daily_player', '毎日練習', '7日連続でプレイ', 'dedication', 7, 30, 4),
('karuta_master', 'カルタマスター', '全44枚をマスター', 'completion', 44, 200, 5);