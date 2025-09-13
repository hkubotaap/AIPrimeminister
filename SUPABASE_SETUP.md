# Supabase ランキングシステム設定手順

## 概要
本アプリケーションはランキング機能の永続化にSupabaseを使用します。Supabase設定なしでも動作しますが、ランキングデータは保存されません。

## Supabase設定手順

### 1. Supabaseプロジェクト作成
1. https://supabase.com にアクセス
2. 「Start your project」をクリック
3. 新しいプロジェクトを作成
4. プロジェクト名: `prime-minister-simulator`
5. データベースパスワードを設定

### 2. データベーステーブル作成
1. Supabaseダッシュボードの「SQL Editor」を開く
2. `supabase-schema.sql` の内容をコピー&ペースト
3. 「RUN」をクリックしてテーブルとサンプルデータを作成

### 3. 環境変数設定

#### Vercelでの設定 (本番環境)
1. Vercelプロジェクト設定の「Environment Variables」を開く
2. 以下の変数を追加:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

#### ローカル開発環境での設定
`.env` ファイルを作成:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### 4. APIキー取得方法

#### Supabaseキー
1. Supabaseダッシュボードの「Settings」→「API」を開く
2. 「Project URL」をコピー→ `SUPABASE_URL`
3. 「anon public」キーをコピー→ `SUPABASE_ANON_KEY`

#### Gemini API キー
1. https://makersuite.google.com/app/apikey にアクセス
2. 「Create API Key」をクリック
3. 生成されたキーをコピー→ `GEMINI_API_KEY`

## フォールバック機能

環境変数が設定されていない場合：
- **ランキング**: 空のランキングが表示されます
- **AI生成**: フォールバックの固定コンテンツが使用されます
- **機能**: 基本的なゲーム機能は正常に動作します

## テーブル構造

```sql
CREATE TABLE prime_minister_rankings (
  id UUID PRIMARY KEY,
  player_name VARCHAR(20) NOT NULL,
  total_score DECIMAL(5,2) NOT NULL,
  rank_title JSONB NOT NULL,
  final_turn INTEGER DEFAULT 5,
  approval_rating INTEGER DEFAULT 50,
  gdp DECIMAL(6,1) DEFAULT 540.0,
  national_debt DECIMAL(6,1) DEFAULT 1100.0,
  diplomacy INTEGER DEFAULT 55,
  environment INTEGER DEFAULT 50,
  technology INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API エンドポイント

### スコア登録
```bash
POST /api/submit-score
{
  "playerName": "総理大臣名",
  "totalScore": 75.5,
  "gameData": {
    "turn": 5,
    "approvalRating": 65,
    "gdp": 545,
    "nationalDebt": 1100,
    "diplomacy": 58,
    "environment": 52,
    "technology": 63
  }
}
```

### ランキング取得
```bash
GET /api/get-rankings?limit=20&offset=0
```

## デバッグ・確認方法

### 1. APIテスト
```bash
# ランキング確認
curl https://your-app.vercel.app/api/get-rankings

# スコア登録テスト（要認証設定）
curl -X POST https://your-app.vercel.app/api/submit-score \
-H "Content-Type: application/json" \
-d '{"playerName":"テスト総理","totalScore":80,"gameData":{"turn":5}}'
```

### 2. Supabase確認
```sql
-- レコード数確認
SELECT COUNT(*) FROM prime_minister_rankings;

-- 上位10位確認
SELECT player_name, total_score, rank_title
FROM prime_minister_rankings
ORDER BY total_score DESC
LIMIT 10;
```

### 3. ログ確認
- Vercel Functions ログで「🏆 スコア登録成功 (Supabase)」を確認
- 「📊 ランキング取得成功 (Supabase)」を確認
- エラー時は「⚠️ Supabase not configured」メッセージを確認

## トラブルシューティング

### ランキングが表示されない
1. Supabase環境変数が正しく設定されているか確認
2. Supabaseプロジェクトがアクティブか確認
3. テーブルが正しく作成されているか確認

### スコア登録ができない
1. Vercelの認証設定を確認
2. RLS (Row Level Security) ポリシーを確認
3. APIキーの権限を確認

### AI生成が動作しない
1. Gemini API キーが正しく設定されているか確認
2. API使用量上限に達していないか確認
3. フォールバック機能で基本動作は維持されます