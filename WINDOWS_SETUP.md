# AI-Driven Prime Minister Simulator

## Windows用起動方法

### 初回セットアップ
1. `setup.bat` をダブルクリックして実行
   - Node.jsの確認と依存関係のインストールを行います

### 開発サーバーの起動
1. `start.bat` をダブルクリックして実行
   - 開発サーバーが起動し、ブラウザで http://localhost:5173 が開きます

### プロダクションビルド
1. `build.bat` をダブルクリックして実行
   - プロダクション用のビルドを作成します

## 前提条件

- **Node.js 18以上** が必要です
  - [Node.js公式サイト](https://nodejs.org/) からダウンロード・インストールしてください
- **npm** (Node.jsと一緒にインストールされます)

## 手動でのコマンド実行

コマンドプロンプトやPowerShellでも実行できます：

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build

# ビルド済みアプリのプレビュー
npm run preview
```

## トラブルシューティング

### Node.jsが見つからない場合
- Node.jsがインストールされているか確認してください
- インストール後はコンピューターを再起動してください

### npm installが失敗する場合
```bash
# npmキャッシュをクリア
npm cache clean --force

# 再度インストール
npm install
```

### ポートが使用中の場合
- 他のアプリケーションが5173ポートを使用している可能性があります
- Viteが自動的に別のポート（5174など）を使用します

## 開発について

このプロジェクトは以下の技術スタックを使用しています：
- **React 18** - UIライブラリ
- **TypeScript** - 型安全性
- **Vite** - ビルドツール
- **Tailwind CSS** - スタイリング
- **Lucide React** - アイコン
