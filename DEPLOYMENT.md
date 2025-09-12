# 🚀 デプロイメントガイド

## セキュリティ要件

### ⚠️ 重要なセキュリティ注意事項

1. **APIキーの管理**
   - Claude APIキーは環境変数で管理
   - 本番環境では`.env`ファイルをgitignoreに追加
   - 可能であればサーバーサイドプロキシを使用

2. **推奨デプロイ環境**
   - Vercel (推奨)
   - Netlify
   - AWS Amplify

## デプロイ手順

### Vercelでのデプロイ

1. **リポジトリをVercelに接続**
```bash
npm install -g vercel
vercel login
vercel
```

2. **環境変数の設定**
Vercelダッシュボードで以下を設定：
```
VITE_CLAUDE_API_KEY=your_actual_api_key
```

3. **ビルド設定**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

### Netlifyでのデプロイ

1. **ビルド設定**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
```

2. **環境変数**
Netlifyダッシュボードで設定：
- `VITE_CLAUDE_API_KEY`

## セキュリティチェックリスト

- [ ] APIキーが環境変数で管理されている
- [ ] `.env`ファイルが`.gitignore`に追加されている
- [ ] セキュリティヘッダーが設定されている
- [ ] 入力検証が実装されている
- [ ] レート制限が設定されている
- [ ] HTTPS接続が強制されている

## 本番環境での制限事項

1. **Claude API使用制限**
   - 現在の実装はクライアントサイドでAPIキーを使用
   - セキュリティ向上のため、サーバーサイドプロキシの実装を推奨

2. **推奨改善点**
   - バックエンドAPIサーバーの実装
   - ユーザー認証の追加
   - ゲームデータの永続化

## 監視とメンテナンス

- アクセスログの監視
- エラーレートの監視
- APIキーの定期的な更新
- セキュリティアップデートの適用