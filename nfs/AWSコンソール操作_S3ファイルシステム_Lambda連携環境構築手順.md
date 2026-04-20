# Lambda → S3 Files（NFS）のネットワーク関連設定手順

## 実施前に
infrastructure/vpc-serverless_none.yamlを元にVPCが作成済みの状態から実施した手順となっている。
sg-s3filesはVPCとともに作成済み。
sg-lambdaは新規で登録。

## 構成図

```
Lambda (sg-lambda)
  │ TCP 2049 (NFSv4.1) アウトバウンド
  ▼
S3 Files マウントターゲット (sg-s3files)
  │ TCP 2049 インバウンド（sg-lambdaのみ）
  ▼
S3 Files ファイルシステム
  │ 自動同期
  ▼
S3 バケット
```

SGとは別に **Lambda の IAM ロール** に S3 権限も必要（後述）。

---

## 手順

### 1. Lambda 用セキュリティグループの作成

1. AWSコンソール → **VPC** → 左メニュー「セキュリティグループ」→「セキュリティグループを作成」
2. 以下を入力

| 項目 | 値 |
|------|-----|
| 名前 | `sg-lambda` |
| VPC | LambdaをデプロイするVPC |

3. **アウトバウンドルール**を追加（作成後に編集）

| タイプ | プロトコル | ポート | 送信先 |
|--------|-----------|--------|--------|
| カスタムTCP | TCP | 2049 | `sg-s3files` のSG ID |

---

### 2. S3 Files マウントターゲット用セキュリティグループの作成

1. 同じく「セキュリティグループを作成」

| 項目 | 値 |
|------|-----|
| 名前 | `sg-s3files` |
| VPC | 同じVPC |

2. **インバウンドルール**を追加

| タイプ | プロトコル | ポート | ソース |
|--------|-----------|--------|--------|
| NFS | TCP | 2049 | `sg-lambda` のSG ID |

> SG IDを指定することでLambdaのSGを持つリソースからのみ許可できる

---

### 3. S3 Files マウントターゲットに SG を適用

1. AWSコンソール → **S3** → 左メニュー「ファイルシステム」（S3 Files）
2. 対象のファイルシステム →「マウントターゲット」タブ
3. 各AZのマウントターゲットのSGを `sg-s3files` に変更・保存

---

### 4. Lambda の IAM ロールに権限を付与

VPC設定の前にIAMロールへの権限付与が必要。

#### 4-1. VPC接続権限（AWSLambdaVPCAccessExecutionRole）

VPC内でLambdaを動かすためにENI作成権限が必要。これがないとVPC設定時にエラーになる。

1. **Lambda** →「設定」→「アクセス権限」→ 実行ロールのリンクをクリック（IAMへ遷移）
2. 「許可を追加」→「ポリシーをアタッチ」
3. `AWSLambdaVPCAccessExecutionRole` を検索して選択し保存

#### 4-2. S3アクセス権限 および elasticfilesystem権限

S3 FilesはEFSのインフラを使用しているため、S3権限に加えて `elasticfilesystem` 権限も必要。

1. 同じロールで「許可を追加」→「インラインポリシーを作成」
2. 以下を設定

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-bucket-name",
                "arn:aws:s3:::your-bucket-name/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "elasticfilesystem:ClientMount",
                "elasticfilesystem:ClientWrite",
                "elasticfilesystem:ClientRootAccess"
            ],
            "Resource": [
                "arn:aws:elasticfilesystem:ap-northeast-1:{account-id}:file-system/{fs-id}",
                "arn:aws:s3files:ap-northeast-1:{account-id}:file-system/{fs-id}/access-point/{fsap-id}"
            ]
        }
    ]
}
```

> `{account-id}`、`{fs-id}`、`{fsap-id}` は実際の値に置き換える

---

### 5. Lambda の VPC 設定

1. **Lambda** → 対象の関数 →「設定」→「VPC」→「編集」
2. 以下を設定して保存

| 項目 | 値 |
|------|-----|
| VPC | 同じVPC |
| サブネット | S3 Filesマウントターゲットと**同じAZ**のサブネット |
| セキュリティグループ | `sg-lambda` |

---

### 6. アクセスポイントの作成

**S3** →「ファイルシステム」→ 対象ファイルシステム →「アクセスポイント」→「アクセスポイントの作成」

以下の値で作成する。**ルートディレクトリ作成のアクセス許可を必ず設定すること。未設定の場合マウントに失敗する。**

| 項目 | 値 |
|------|-----|
| 名前 | 任意（例: `lambda-ap`） |
| ルートディレクトリパス | `/lambda` など |
| POSIX ユーザーID | `1000` |
| POSIX グループID | `1000` |
| **所有者ユーザーID** | `1000` |
| **所有者グループID** | `1000` |
| **アクセス許可** | `755` |

> アクセスポイントは作成後に編集不可。設定を誤った場合は削除して作り直す。

---

### 7. Lambda にファイルシステムをマウント

1. **Lambda** →「設定」→「ファイルシステム」→「ファイルシステムを追加」
2. 以下を設定

| 項目 | 値 |
|------|-----|
| EFS ファイルシステム | 作成した S3 Files ファイルシステムを選択 |
| アクセスポイント | 手順6で作成したアクセスポイントを選択 |
| ローカルマウントパス | `/mnt/s3` など（`/mnt/` 配下で指定） |

### パスのマッピングについて

各パスの役割と対応関係は以下の通り。

**ルートディレクトリパス（例: `/lambda`）**
- S3 Filesファイルシステム上のパス
- S3バケット上では `lambda/` フォルダとして見える
- Lambdaはこのディレクトリより上の階層にはアクセスできない

**ローカルマウントパス（例: `/mnt/s3`）**
- Lambda実行環境（Linux）上のパス
- `/mnt/s3` が `/lambda` にマッピングされる
- Lambdaのコードからはこのパスでファイル操作を行う

```
Lambda内のパス         S3 Filesファイルシステム    S3バケット
/mnt/s3          ←→  /lambda                  ←→  lambda/
/mnt/s3/test     ←→  /lambda/test             ←→  lambda/test/
/mnt/s3/a/b.txt  ←→  /lambda/a/b.txt          ←→  lambda/a/b.txt
```

---

## 実環境でのリソース対応例

実際にリソースを作成した場合の対応関係を整理する際の参考。

### リソース構成

```
vpc-0bbe352078dd0ecc6
└── fs-0a574eeda10f0532a（S3 Files ファイルシステム）
    └── マウントターゲット
        └── sg-04b50eab93ef9e906（マウントターゲット用SG）

sg-05c581454e8a11710（Lambda用SG）
```

### SG ID の確認方法

マウントターゲット用SGのIDは以下で確認できる。

1. AWSコンソール → **S3** → 左メニュー「ファイルシステム」
2. 対象のファイルシステムをクリック →「ネットワーク」タブ
3. マウントターゲットの行の「セキュリティグループ」列に表示されるSG IDを確認

### SG IDの入力方法

アウトバウンド/インバウンドルール編集画面の入力欄に `sg-` と入力すると候補が表示されるため、SG名で検索・選択できる（ID手打ち不要）。

### 設定内容

**Lambda用SG（sg-05c581454e8a11710）のアウトバウンドルール**

| タイプ | プロトコル | ポート | 送信先 |
|--------|-----------|--------|--------|
| カスタムTCP | TCP | 2049 | `sg-04b50eab93ef9e906` |

**マウントターゲット用SG（sg-04b50eab93ef9e906）のインバウンドルール**

| タイプ | プロトコル | ポート | ソース |
|--------|-----------|--------|--------|
| NFS | TCP | 2049 | `sg-05c581454e8a11710` |

### 注意点

- `sg-lambda` と `sg-s3files` は**同じVPC内のSGである必要がある**（別VPCのSGはソースに指定不可）
- セキュリティグループ自体の利用は**無料**

---

## チェックリスト

| 確認項目 | 内容 |
|---------|------|
| SG (Lambda) | アウトバウンド TCP 2049 → `sg-s3files` |
| SG (S3 Files) | インバウンド TCP 2049 ← `sg-lambda` |
| Lambda VPC | マウントターゲットと同じAZのサブネット |
| IAM ロール | 対象S3バケットへのアクセス権限 |
| マウント設定 | `/mnt/` 配下にマウントパスを指定 |
