-- Prime Minister Simulator Rankings Table
-- Supabaseで実行するSQL

-- テーブル作成
CREATE TABLE IF NOT EXISTS prime_minister_rankings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  player_name VARCHAR(20) NOT NULL,
  total_score DECIMAL(5,2) NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  rank_title JSONB NOT NULL,
  final_turn INTEGER DEFAULT 5,
  approval_rating INTEGER DEFAULT 50,
  gdp DECIMAL(6,1) DEFAULT 540.0,
  national_debt DECIMAL(6,1) DEFAULT 1100.0,
  diplomacy INTEGER DEFAULT 55,
  environment INTEGER DEFAULT 50,
  technology INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス作成（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_rankings_score
ON prime_minister_rankings (total_score DESC);

CREATE INDEX IF NOT EXISTS idx_rankings_created_at
ON prime_minister_rankings (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rankings_player_name
ON prime_minister_rankings (player_name);

-- RLS (Row Level Security) 設定
ALTER TABLE prime_minister_rankings ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY IF NOT EXISTS "Rankings are viewable by everyone"
ON prime_minister_rankings FOR SELECT
USING (true);

-- 全ユーザーが新規作成可能
CREATE POLICY IF NOT EXISTS "Rankings can be created by everyone"
ON prime_minister_rankings FOR INSERT
WITH CHECK (true);

-- サンプルデータ（開発・テスト用）
INSERT INTO prime_minister_rankings
(player_name, total_score, rank_title, final_turn, approval_rating, gdp, national_debt, diplomacy, environment, technology)
VALUES
('田中総理', 88.5, '{"title": "S", "label": "優秀な指導者"}', 5, 78, 580.0, 950.0, 72, 68, 75),
('佐藤首相', 76.2, '{"title": "A", "label": "安定した政権運営"}', 5, 65, 545.0, 1080.0, 58, 52, 63),
('山田宰相', 82.1, '{"title": "A+", "label": "有能な総理大臣"}', 5, 71, 562.0, 1020.0, 64, 59, 69),
('鈴木総裁', 69.8, '{"title": "B+", "label": "平均以上の成果"}', 5, 58, 538.0, 1150.0, 55, 48, 61),
('高橋首相', 91.3, '{"title": "S+", "label": "歴史的名宰相"}', 5, 85, 595.0, 890.0, 78, 74, 82)
ON CONFLICT DO NOTHING;

-- 統計用ビュー作成
CREATE OR REPLACE VIEW ranking_stats AS
SELECT
  COUNT(*) as total_players,
  ROUND(AVG(total_score), 2) as average_score,
  MAX(total_score) as highest_score,
  MIN(total_score) as lowest_score,
  COUNT(CASE WHEN total_score >= 90 THEN 1 END) as s_plus_count,
  COUNT(CASE WHEN total_score >= 85 AND total_score < 90 THEN 1 END) as s_count,
  COUNT(CASE WHEN total_score >= 80 AND total_score < 85 THEN 1 END) as a_plus_count
FROM prime_minister_rankings;