# S3ファイルシステム－Lambda連携環境構築手順

## 概要

1つの CloudFormation スタックで、Lambda → S3 Files（NFSv4.1）連携環境を構築する。

```
nfs-stack.yaml
  VPC・サブネット・セキュリティグループ
  S3バケット・S3 Filesファイルシステム・IAMロール
  Lambda関数・IAMロール
```

---

## 前提条件

- AWS コンソールへのアクセス権限（CloudFormation・IAM・EC2・Lambda・S3・S3 Files）
- 使用リージョン: **ap-northeast-1（東京）**

---

## Step 1: Lambda ZIP ファイルのアップロード

デプロイ前に Lambda 関数のコードを ZIP 化して S3 バケットにアップロードする。

1. `lambda_function.py` を作成する（`nfs/lambda_function.py` を使用可）

2. ZIP 化する

   ```bash
   zip lambda_function.zip lambda_function.py
   ```

3. S3 バケットにアップロードする

   ```bash
   aws s3 cp lambda_function.zip s3://dev-gassyuku-tokyo/lambda/lambda_function.zip --region ap-northeast-1
   ```

---

## Step 2: nfs-stack.yaml のデプロイ

### パラメーター

| パラメーター | デフォルト値 | 説明 |
|---|---|---|
| `ProjectName` | `dev-gassyuku-nfs` | タグ・リソース名のプレフィックス |
| `VpcCidr` | `10.0.0.0/16` | VPC の CIDR ブロック |
| `PrivateSubnet1Cidr` | `10.0.10.0/24` | プライベートサブネットの CIDR |
| `S3BucketName` | `dev-gassyuku-nfs` | S3 バケット名 |
| `LambdaFunctionName` | `nfs-cfn` | Lambda 関数名 |
| `LambdaRoleName` | `nfs-role` | Lambda IAM ロール名 |
| `LambdaCodeS3Bucket` | ― | ZIP をアップロードした S3 バケット名 |
| `LambdaCodeS3Key` | ― | ZIP のオブジェクトキー（例: `lambda/lambda_function.zip`） |

### デプロイ手順

#### コンソール

1. CloudFormation コンソール → **「スタックの作成」**
2. テンプレートのアップロード → `nfs-stack.yaml` を選択
3. スタック名: 任意（例: `nfs-stack`）
4. パラメーターを入力して **「次へ」**
5. **「IAM リソースの作成を承認する」** にチェックを入れて **「送信」**

#### AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name nfs-stack \
  --template-body file://nfs/nfs-stack.yaml \
  --parameters file://nfs/nfs-stack-parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-northeast-1
```

### マウントターゲットの完了確認

S3 Files マウントターゲットの作成完了後に Lambda が作成される（`DependsOn` 制御済み）。  
`create-stack` 実行後、スタック全体の完了前に以下で S3FilesMountTarget の状態を確認できる。

```bash
aws cloudformation describe-stack-resource \
  --stack-name nfs-stack \
  --logical-resource-id S3FilesMountTarget \
  --query "StackResourceDetail.ResourceStatus" \
  --output text \
  --region ap-northeast-1
```

`CREATE_COMPLETE` になったら Lambda の作成が始まる。

### Lambda が CREATE_FAILED になった場合

マウントターゲットの準備が間に合わなかった場合は、数分待ってから `update-stack` で再試行する。

```bash
aws cloudformation update-stack \
  --stack-name nfs-stack \
  --template-body file://nfs/nfs-stack.yaml \
  --parameters file://nfs/nfs-stack-parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-northeast-1
```

---

## 動作確認

### Lambda テスト実行

1. Lambda コンソール → **nfs-cfn**
2. 「テスト」タブ → テストイベントを作成（デフォルト設定で可）
3. **「テスト」** を実行
4. ステータスが `Succeeded` になることを確認

### S3 バケット確認

1. S3 コンソール → **dev-gassyuku-nfs**
2. `lambda/test/` フォルダが作成されていることを確認

---

## スタック削除手順

```bash
aws cloudformation delete-stack --stack-name nfs-stack --region ap-northeast-1
```

> **注意:** S3 バケットにオブジェクトが残っている場合、スタック削除前に手動でバケットを空にする必要がある。

---

## 構成ファイル一覧

| ファイル | 用途 |
|---|---|
| `nfs-stack.yaml` | 全リソース（VPC・S3 Files・Lambda） |
| `nfs-stack-parameters.json` | スタック用パラメーター |
| `lambda_function.py` | Lambda 関数ソースコード |
