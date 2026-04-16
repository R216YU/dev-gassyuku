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

## アプリケーションの機能

- **ファイルアップロード**: 画像および動画ファイルのアップロードが可能です。
- **バリデーション**: フロントエンドで画像・動画以外のファイルを選択できないよう制御しています。
- **プレビュー**: アップロード前に画像のサムネイル表示が可能です。

## デプロイ設定

`dev` 環境へのデプロイ時は `app/.env.development` の `NEXT_PUBLIC_API_BASE_URL` を実際のAPIドメインに書き換えてください。
