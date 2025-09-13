# Vercelデプロイガイド

## 🚀 デプロイ手順

### 1. 準備
1. [Vercel](https://vercel.com/) アカウントを作成
2. GitHubリポジトリにプロジェクトをプッシュ

### 2. フロントエンドのデプロイ
```bash
# Vercel CLIをインストール（初回のみ）
npm i -g vercel

# プロジェクトルートでデプロイ
vercel

# 初回デプロイ時の設定
# - Set up and deploy: Yes
# - Which scope: 個人アカウント選択
# - Link to existing project: No
# - What's your project's name: ai-prime-minister-simulator
# - In which directory: ./
# - Want to override settings: No
```

### 3. バックエンドAPIのデプロイ
```bash
# serverディレクトリに移動
cd server

# Vercelでデプロイ
vercel

# 設定
# - Set up and deploy: Yes
# - Which scope: 個人アカウント選択
# - Link to existing project: No
# - What's your project's name: ai-prime-minister-api
# - In which directory: ./
# - Want to override settings: No
```

### 4. 環境変数の設定

#### フロントエンド
Vercelダッシュボードで以下を設定：
- `VITE_API_BASE_URL`: `/api` (本番環境では相対パス)

#### バックエンド
Vercelダッシュボードで以下を設定：
- `GEMINI_API_KEY`: あなたのGemini APIキー
- `NODE_ENV`: `production`
- `ALLOWED_ORIGINS`: フロントエンドのVercel URL
- `RATE_LIMIT_WINDOW_MS`: `60000`
- `RATE_LIMIT_MAX_REQUESTS`: `100`

### 5. ドメイン設定の更新
バックエンドがデプロイされたら、フロントエンドの`vite.config.ts`を更新：

```typescript
proxy: {
  '/api': {
    target: process.env.NODE_ENV === 'production' 
      ? 'https://your-actual-api-domain.vercel.app'
      : 'http://localhost:3001',
    changeOrigin: true,
    secure: false
  }
}
```

### 6. 再デプロイ
```bash
# フロントエンドを再デプロイ
vercel --prod
```

## 🔧 トラブルシューティング

### APIエラーが発生する場合
1. Vercel Functions の制限を確認（10秒タイムアウト）
2. 環境変数が正しく設定されているか確認
3. CORS設定を確認

### ビルドエラーが発生する場合
1. TypeScriptエラーを解決
2. 依存関係を確認
3. ローカルでビルドが成功するか確認

### 環境変数が反映されない場合
1. Vercelダッシュボードで設定を確認
2. 再デプロイを実行
3. プレビューとプロダクションの環境変数を分ける

## 📊 パフォーマンス最適化

### 自動設定済み
- ✅ ソースマップ無効化
- ✅ チャンク分割（vendor, ui）
- ✅ 開発モード無効化

### 追加推奨設定
- CDN最適化（Vercel自動）
- 画像最適化（必要に応じて）
- エッジ関数の活用（高度な最適化）

## 🛡️ セキュリティ

### 実装済み
- ✅ APIキーのサーバーサイド管理
- ✅ CORS設定
- ✅ レート制限
- ✅ セキュリティヘッダー

### Vercel追加設定
1. カスタムドメイン設定
2. SSL証明書自動更新
3. DDoS保護（Pro以上）

## 🎯 成功確認

デプロイ後、以下を確認：
1. フロントエンドが正常に表示される
2. APIが正常に動作する
3. ゲームが正常にプレイできる
4. KASUMIが正常に応答する

## 📝 メンテナンス

### 定期タスク
- APIキーの更新
- 依存関係の更新
- セキュリティパッチ適用
- パフォーマンス監視

### 監視設定
- Vercel Analytics（推奨）
- エラー監視
- パフォーマンス監視