# ソニー損保 インフラシステム

## 概要
ソニー損保に提供するRAGシステムのインフラです。  
AWS上のデプロイ環境をAWS CDKを用いてIaC（Infrastructure as Code）で管理します。

## 技術スタック

### 開発環境
- `Node.js`: 20+
- `TypeScript`: 5.3.3
- `パッケージマネージャー`: Yarn

### インフラストラクチャ
- `Infrastructure as Code`: AWS CDK 2.200.1+
- `AWS CLI`: コマンドラインインターフェース
- `AWS SSM Session Manager`: セキュアなリモートアクセス

### 開発ツール
- `プロジェクト管理`: Projen 0.77.5
- `バンドラー`: ESBuild 0.19.8
- `コンテナ`: Docker, Docker Compose 3.8

### AWS認証
- `AWS IAM Identity Center`: SSO認証
- `AWS プロファイル`: 複数環境対応

## 環境構築

### 1. コンテナのビルド
`sony-sonpo-cdk`ディレクトリで以下を実行：
```bash
dc build
```

### 2. AWS認証設定
コンテナ外でAWSアクセス用のプロファイルを設定：
```bash
aws configure sso
```

#### プロファイル設定項目

`SSO session name (Recommended):` *`your-sso-session-name`*
- AWS IAM Identity Centerを利用した認証セッションを識別するための名前
- 例: `alliance-dev-sso`

<details>
<summary>SSOセッションについて</summary>  

- 各ユーザーが自由に名前を設定可能
- `~/.aws/config`ファイルに`[sso-session <SSO session name>]`形式で保存
- `aws sso login --sso-session <SSO session name>`でログイン可能

</details>

`SSO start URL [None]:` `https://d-956719651a.awsapps.com/start/#`
- アライアンス開発部のAWS環境アクセスポータルURL

`SSO region [None]:` `ap-northeast-1`
- アライアンス開発部のIAM Identity Centerインスタンスのリージョン

`SSO registration scopes [sso:account:access]:`
- デフォルト値をそのまま使用（Enterのみ）

`使用するアカウント・ロール:`
- プルダウンメニューから選択

`Default client Region [None]:` `ap-northeast-1`
- リソース操作が行われるデフォルトリージョン（東京リージョン）

`Default output format [None]:` `json`
- コマンドのデフォルト出力形式（Noneのままでも可）

`Profile name [123456789011_ReadOnly]:` *`your-profile-name`*
- プロファイルの識別名
- 例: `kutsuna-rag-deploy`

### 3. 依存関係のインストール
コンテナ内で以下を実行：
```bash
npm install
```

## 使用方法

### デプロイ
1. コンテナ起動前にSSOログイン：
```bash
aws sso login --profile your-profile-name
```

2. コンテナ内でデプロイ実行：
```bash
AWS_PROFILE=your-profile-name cdk deploy StackName
```

### デプロイの削除
```bash
AWS_PROFILE=your-profile-name cdk destroy StackName
```

## プロジェクト構成