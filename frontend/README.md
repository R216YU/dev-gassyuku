# Frontend 開発ガイド

このディレクトリには、Next.js (App Router) を使用したフロントエンドアプリケーションと、API定義が含まれています。

## ディレクトリ構成

- `app/`: Next.js アプリケーション本体
- `apigateway.yml`: API 定義 (OpenAPI v3)

## 開発環境の要件

- **Node.js**: v24 系の最新版を推奨 (nvm等で `.nvmrc` や `nvm use 24` を使用してください)
- **npm**: Node.js に付属のもの

## セットアップ手順

### 1. 依存関係のインストール

アプリケーションディレクトリに移動してインストールを行います。

```bash
cd app
npm install
```

### 2. 環境変数の設定

`.env.local` を作成し、APIのベースURLを設定します（通常、初期セットアップ時に自動作成されます）。

```bash
# app/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:4010
```

### 3. モックサーバーの起動

`apigateway.yml` の定義に基づいた Prism モックサーバーを起動します。

```bash
cd app
npm run mock
```
- **ポート**: 4010
- **エンドポイント**: `POST /upload` 等が利用可能になります。

### 4. 開発サーバーの起動

Next.js の開発サーバーを起動します。

```bash
cd app
npm run dev
```
- **ポート**: 4444 (他システムとの衝突を避けるため固定されています)
- **URL**: [http://localhost:4444](http://localhost:4444)

## S3 静的ホスティングへのデプロイ手順

このアプリケーションを S3 の静的ウェブサイトホスティングへデプロイする手順は以下の通りです。

### 1. ビルドの実行

`frontend/app` ディレクトリで以下のコマンドを実行します。

```bash
cd app
npm run build
```

実行後、`frontend/app/out/` ディレクトリに静的ファイル（HTML, CSS, JS）が生成されます。

### 2. S3 へのアップロード

生成された `out/` フォルダの中身（フォルダ自体ではなく、その**中身すべて**）を、対象の S3 バケットのルートにアップロードします。

- `_next/`
- `files/`
- `index.html`
- `404.html`
- ...

※ すでに `outputs/` フォルダが存在する場合は、それらを上書きしないように注意してください。

### 3. S3 バケットの設定（初回のみ）

S3 のコンソールで「静的ウェブサイトホスティング」を有効にし、以下の設定を行います。

- **インデックスドキュメント**: `index.html`
- **エラードキュメント**: `404.html`（または `index.html`）

### 4. （任意）outputs フォルダと list.json の準備

手動で HTML ファイルを管理したい場合は、バケットのルートに `outputs/` フォルダを作成し、その中に `list.json` を配置してください。構成の詳細は「HTML一覧表示機能」セクションを参照してください。

