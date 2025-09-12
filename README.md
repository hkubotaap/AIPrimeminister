# 🎮 AI駆動型総理大臣シミュレーター

日本の総理大臣として現代的な政治課題に対応するAI駆動型政治シミュレーションゲーム

## 🌟 特徴

### 🤖 AI駆動システム
- **Gemini API統合**: リアルタイムAI政治分析
- **ツンデレAI秘書KASUMI**: 感情豊かな政治コメント
- **動的イベント生成**: 100問のAI生成政治課題
- **インテリジェント評価**: 8つの指標による多角的評価

### 🎯 ゲーム体験
- **現実的な政治課題**: 円安、半導体戦略、少子高齢化など
- **緊急事態システム**: 地震、サイバーテロ、金融危機など
- **タイプライター演出**: KASUMIのコメントが一文字ずつ表示
- **総合ランク評価**: S+からFまでの10段階評価

### 🔒 セキュリティ
- **サーバーサイドプロキシ**: APIキーをクライアントから隠蔽
- **入力検証**: XSS防止、文字数制限
- **レート制限**: DDoS攻撃防止
- **セキュリティヘッダー**: CORS、CSP、HSTS対応

## 🚀 クイックスタート

### 1. 全体起動（推奨）
```bash
# フルスタック起動
start-full-stack.bat
```

### 2. 個別起動
```bash
# バックエンドサーバー起動
cd server
npm install
npm run dev

# フロントエンド起動（別ターミナル）
npm run dev
```

### 3. アクセス
- **ゲーム**: http://localhost:5175/
- **API**: http://localhost:3001/api/health

## 📁 プロジェクト構成

```
├── src/                    # フロントエンド
│   ├── App.tsx            # メインゲームロジック
│   ├── api-client.ts      # セキュアAPIクライアント
│   ├── security-config.ts # セキュリティ設定
│   └── event-pool.ts      # 100問イベントプール
├── server/                # バックエンド
│   ├── server.js          # Express.jsサーバー
│   ├── .env               # サーバー環境変数
│   └── package.json       # サーバー依存関係
└── public/                # 静的ファイル
```

## 🔧 環境設定

### サーバー環境変数 (server/.env)
```env
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
ALLOWED_ORIGINS=http://localhost:5175
RATE_LIMIT_MAX_REQUESTS=100
```

### Gemini APIキー取得
1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. APIキーを生成
3. `server/.env` に設定

## 🎮 ゲームプレイ

1. **ゲーム開始** → KASUMIの挨拶
2. **政治課題** → 現実的な日本の政治問題が発生
3. **政策選択** → 3つの選択肢から選択
4. **AI分析** → KASUMIのツンデレ分析コメント
5. **指標変化** → 8つの政治指標がリアルタイム変化
6. **緊急事態** → 20%確率で緊急イベント発生
7. **最終評価** → AI秘書による総括評価

## 📊 評価指標

- **支持率**: 国民からの支持
- **GDP**: 経済成長率
- **国債**: 財政健全性
- **技術力**: イノベーション
- **環境**: 環境政策
- **株価**: 市場の信頼
- **ドル円**: 為替安定性
- **外交**: 国際関係

## 🏆 ランク評価

- **S+**: 歴史的名宰相 (90点以上)
- **S**: 優秀な指導者 (85-89点)
- **A+**: 有能な総理大臣 (80-84点)
- **A**: 安定した政権運営 (75-79点)
- **B+**: 平均以上の成果 (70-74点)
- **B**: 標準的な政権 (65-69点)
- **C+**: 課題の多い政権 (60-64点)
- **C**: 困難な政権運営 (55-59点)
- **D**: 政治的混乱 (50-54点)
- **F**: 政治的失敗 (50点未満)

## 🔒 セキュリティ機能

### サーバーサイドプロキシ
- APIキーをサーバーサイドで安全に管理
- クライアントからAPIキーが見えない
- レート制限とセキュリティヘッダーを適用

### 入力検証
- XSS攻撃防止
- 文字数制限（200文字）
- 危険な文字列の検出・除去

### レート制限
- 100リクエスト/分の制限
- DDoS攻撃防止
- IP別制限

## 🚀 デプロイ

### Vercel（推奨）
```bash
# フロントエンド
vercel

# バックエンド（Vercel Functions）
cd server
vercel
```

### Docker
```bash
# バックエンド
cd server
docker build -t ai-pm-server .
docker run -p 3001:3001 ai-pm-server
```

## 🛠️ 開発

### 技術スタック
- **フロントエンド**: React + TypeScript + Vite + Tailwind CSS
- **バックエンド**: Node.js + Express.js
- **AI**: Google Gemini API
- **セキュリティ**: Helmet, CORS, Rate Limiting

### 開発コマンド
```bash
# 依存関係インストール
npm install
cd server && npm install

# 開発サーバー起動
npm run dev              # フロントエンド
cd server && npm run dev # バックエンド

# ビルド
npm run build

# プレビュー
npm run preview
```

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストやイシューを歓迎します！

---

**🎌 日本の政治を体験し、AI秘書KASUMIと一緒に最高の総理大臣を目指しましょう！**