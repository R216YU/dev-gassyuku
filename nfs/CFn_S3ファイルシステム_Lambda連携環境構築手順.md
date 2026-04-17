# S3ファイルシステム－Lambda連携環境構築手順

## 概要

3つの CloudFormation スタックを順番にデプロイして、Lambda → S3 Files（NFSv4.1）連携環境を構築する。

```
デプロイ順序

1. vpc-nfs.yaml          VPC・サブネット・セキュリティグループ
        ↓
2. s3files-nfs.yaml          S3バケット・S3 Filesファイルシステム・IAMロール
        ↓
3. lambda-connect-nfs.yaml   Lambda関数・IAMロール
```

---

## 前提条件

- AWS コンソールへのアクセス権限（CloudFormation・IAM・EC2・Lambda・S3・S3 Files）
- 使用リージョン: **ap-northeast-1（東京）**

---

## Step 1: vpc-nfs.yaml のデプロイ

### パラメーター

デフォルト値があるため、変更不要（必要に応じて調整可）。

| パラメーター | デフォルト値 | 説明 |
|---|---|---|
| `VpcCidr` | `10.0.0.0/16` | VPC の CIDR ブロック |
| `PrivateSubnet1Cidr` | `10.0.10.0/24` | プライベートサブネットの CIDR |
| `ProjectName` | `dev-gassyuku` | タグ・エクスポート名のプレフィックス |

### デプロイ手順

#### コンソール

1. CloudFormation コンソール → **「スタックの作成」**
2. テンプレートのアップロード → `vpc-nfs.yaml` を選択
3. スタック名: 任意（例: `vpc-nfs`）
4. パラメーターを確認して **「送信」**

#### AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name dev-vpc-update-nfs \
  --template-body file://nfs/vpc-nfs.yaml \
  --parameters file://nfs/vpc-nfs-parameters.json \
  --region ap-northeast-1
```

### デプロイ後に確認する値

スタックの **「出力」タブ** から以下を控える（Step 2 で使用）。

| エクスポート名 | 使用先 |
|---|---|
| `dev-gassyuku-PrivateSubnets` | s3files-nfs.yaml の `MountTargetSubnetId` |
| `dev-gassyuku-MountTargetSG` | s3files-nfs.yaml の `MountTargetSecurityGroupId` |

---

## Step 2: s3files-nfs.yaml のデプロイ

### パラメーター

| パラメーター | 値 | 取得元 |
|---|---|---|
| `MountTargetSubnetId` | Step 1 の出力 `dev-gassyuku-PrivateSubnets` の値 | vpc-nfs スタック「出力」タブ |
| `MountTargetSecurityGroupId` | Step 1 の出力 `dev-gassyuku-MountTargetSG` の値 | vpc-nfs スタック「出力」タブ |

### デプロイ手順

#### コンソール

1. CloudFormation コンソール → **「スタックの作成」**
2. テンプレートのアップロード → `s3files-nfs.yaml` を選択
3. スタック名: 任意（例: `s3files`）
4. パラメーターに Step 1 で控えた値を入力
5. **「IAM リソースの作成を承認する」** にチェックを入れて **「送信」**

#### AWS CLI

vpc-nfs スタックの出力値を確認して `s3files-nfs-parameters.json` の `<...>` 部分を書き換える。

```bash
aws cloudformation describe-stacks \
  --stack-name vpc-nfs \
  --query "Stacks[0].Outputs" \
  --region ap-northeast-1
```

パラメーターファイル編集後に実行:

```bash
aws cloudformation create-stack \
  --stack-name s3files \
  --template-body file://nfs/s3files-nfs.yaml \
  --parameters file://nfs/s3files-nfs-parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-northeast-1
```

### デプロイ後に確認する値

スタックの **「出力」タブ** から以下を控える（Step 3 で使用）。

| 出力キー | 確認する値 | 使用先 |
|---|---|---|
| `S3FilesAccessPointArn` | フル ARN | lambda-connect-nfs-parameters.json の `S3FilesAccessPointArn` |

#### AWS CLI で取得する場合

```bash
aws cloudformation describe-stacks \
  --stack-name s3files \
  --query "Stacks[0].Outputs[?OutputKey=='S3FilesAccessPointArn'].OutputValue" \
  --output text \
  --region ap-northeast-1
```

---

## Step 3: lambda-connect-nfs.yaml のデプロイ

### 事前準備: Lambda ZIP ファイルのアップロード

デプロイ前に Lambda 関数のコードを ZIP 化して S3 バケットにアップロードする。

1. `lambda_function.py` を作成する（例: 動作確認用コード）

   ```python
   import os

   def lambda_handler(event, context):
       os.makedirs('/mnt/s3/test', exist_ok=True)
       return {'statusCode': 200}
   ```

2. ZIP 化する

   ```bash
   zip nfsTest.zip lambda_function.py
   ```

3. S3 バケットにアップロードする（バケットとキーは任意）

   ```bash
   aws s3 cp nfsTest.zip s3://<バケット名>/lambda/nfsTest.zip --region ap-northeast-1
   ```

### パラメーター

| パラメーター | 値 | 取得元 |
|---|---|---|
| `S3FilesAccessPointArn` | Step 2 で控えた `S3FilesAccessPoint` の物理 ID | s3files スタック「リソース」タブ |
| `LambdaCodeS3Bucket` | ZIP をアップロードした S3 バケット名 | 事前準備で使用したバケット名 |
| `LambdaCodeS3Key` | ZIP のオブジェクトキー（例: `lambda/nfsTest.zip`） | 事前準備でアップロードしたパス |

### デプロイ手順

#### コンソール

1. CloudFormation コンソール → **「スタックの作成」**
2. テンプレートのアップロード → `lambda-connect-nfs.yaml` を選択
3. スタック名: 任意（例: `lambda-nfs`）
4. パラメーターを入力
5. **「IAM リソースの作成を承認する」** にチェックを入れて **「送信」**

#### AWS CLI

s3files スタックのアクセスポイント ARN を確認して `lambda-connect-nfs-parameters.json` の各値を書き換える。

```bash
aws cloudformation describe-stack-resource \
  --stack-name s3files \
  --logical-resource-id S3FilesAccessPoint \
  --query "StackResourceDetail.PhysicalResourceId" \
  --region ap-northeast-1
```

パラメーターファイル編集後に実行:

```bash
aws cloudformation create-stack \
  --stack-name lambda-nfs \
  --template-body file://nfs/lambda-connect-nfs.yaml \
  --parameters file://nfs/lambda-connect-nfs-parameters.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-northeast-1
```

---

## 動作確認

### Lambda テスト実行

1. Lambda コンソール → **nfsTest**
2. 「テスト」タブ → テストイベントを作成（デフォルト設定で可）
3. **「テスト」** を実行
4. ステータスが `Succeeded` になることを確認

### S3 バケット確認

1. S3 コンソール → **dev-gassyuku-tokyo**
2. `lambda/test/` フォルダが作成されていることを確認

---

## スタック削除手順

環境を削除する場合は **逆順** で削除する。

```
削除順序

1. lambda-connect-nfs スタック
2. s3files スタック
3. vpc-nfs スタック
```

> **注意:** S3 バケットにオブジェクトが残っている場合、スタック削除前に手動でバケットを空にする必要がある。

#### AWS CLI

```bash
aws cloudformation delete-stack --stack-name lambda-nfs --region ap-northeast-1
aws cloudformation delete-stack --stack-name s3files    --region ap-northeast-1
aws cloudformation delete-stack --stack-name vpc-nfs    --region ap-northeast-1
```

---

## 構成ファイル一覧

| ファイル | 用途 |
|---|---|
| `vpc-nfs.yaml` | VPC・サブネット・セキュリティグループ |
| `s3files-nfs.yaml` | S3バケット・S3 Filesファイルシステム・IAMロール |
| `lambda-connect-nfs.yaml` | Lambda関数・IAMロール |
| `vpc-nfs-parameters.json` | vpc-nfs スタック用パラメーター |
| `s3files-nfs-parameters.json` | s3files スタック用パラメーター |
| `lambda-connect-nfs-parameters.json` | lambda-connect-nfs スタック用パラメーター |
