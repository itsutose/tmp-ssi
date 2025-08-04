
## ✅ 作業項目2: AWSリソース関連課題（issues_infra.md）の作成

```markdown:sony-sonpo-cdk/issues/issues_infra.md
# AWSリソース関連 Issue一覧

## Issue テンプレート

```markdown
## Issue タイトル
**優先度**: High/Medium/Low
**カテゴリ**: DynamoDB/S3/Lambda/API Gateway/Security/Monitoring

**依存関係**: [関連Issue番号]

### 課題概要
[課題の概要を簡潔に記述]

### 実装詳細
- [ ] 詳細タスク1
- [ ] 詳細タスク2
- [ ] 詳細タスク3

### 技術要件
- 使用技術: [AWSサービス名]
- 制約事項: [制約・注意点]

### テスト項目
- [ ] リソース作成テスト
- [ ] 設定テスト
- [ ] 権限テスト

### 完了条件
- [ ] リソース作成完了
- [ ] 設定確認完了
- [ ] 動作確認完了
```

---

## INFRA-001: DynamoDB テーブル群作成・設定
**優先度**: High
**カテゴリ**: DynamoDB

**依存関係**: なし

### 課題概要
Advanced RAGシステムで使用する5つのDynamoDBテーブルをCDKで作成し、適切なインデックスとTTL設定を行う。

### 実装詳細
- [ ] Documents テーブル作成 (Primary Key: documentId)
- [ ] ChatSessions テーブル作成 (PK: sessionId, SK: messageIndex)
- [ ] ProcessingHistory テーブル作成 (Primary Key: executionId)
- [ ] Prompts テーブル作成 (PK: promptKey, SK: version)
- [ ] UserSessions テーブル作成 (PK: userId, SK: sessionId)
- [ ] GSI設定 (category-uploadedAt-index, userId-timestamp-index等)
- [ ] TTL設定 (ChatSessions: 30日, ProcessingHistory: 2年等)
- [ ] 保存時暗号化設定
- [ ] キャパシティモード設定 (dev: On-Demand, prod: Provisioned)

### 技術要件
- 使用技術: AWS CDK, DynamoDB
- 制約事項: TTL自動削除、GSI効率化、暗号化必須

### テスト項目
- [ ] テーブル作成確認
- [ ] インデックス作成確認
- [ ] TTL設定確認
- [ ] 暗号化設定確認

### 完了条件
- [ ] 全テーブル作成完了
- [ ] GSI動作確認
- [ ] TTL動作確認

---

## INFRA-002: S3 バケット構成作成・設定
**優先度**: High
**カテゴリ**: S3

**依存関係**: なし

### 課題概要
文書管理とファイル保管のための3つのS3バケットをCDKで作成し、セキュリティとライフサイクル設定を行う。

### 実装詳細
- [ ] Documents バケット作成 (文書原本保管)
- [ ] Temporary バケット作成 (一時ファイル保管)
- [ ] Prompts バケット作成 (プロンプト管理・オプション)
- [ ] フォルダ構造設定 (legal/, terms/, notation/, general/, uploads/)
- [ ] Server-Side Encryption (SSE-S3) 設定
- [ ] バージョニング有効化
- [ ] パブリックアクセス禁止設定
- [ ] ライフサイクルポリシー設定
- [ ] MFA Delete設定 (本番環境)

### 技術要件
- 使用技術: AWS CDK, S3
- 制約事項: プライベートバケット、暗号化必須、ライフサイクル管理

### テスト項目
- [ ] バケット作成確認
- [ ] 暗号化設定確認
- [ ] アクセス制御確認
- [ ] ライフサイクル設定確認

### 完了条件
- [ ] 全バケット作成完了
- [ ] セキュリティ設定確認
- [ ] ライフサイクル動作確認

---

## INFRA-003: Cognito ユーザープール設定
**優先度**: High
**カテゴリ**: Security

**依存関係**: なし

### 課題概要
JWT Bearer Token認証のためのCognitoユーザープールとAPI Gateway Authorizerを設定する。

### 実装詳細
- [ ] Cognito ユーザープール作成
- [ ] JWT トークン設定
- [ ] ユーザープールクライアント設定
- [ ] API Gateway Cognito Authorizer設定
- [ ] トークン有効期限設定
- [ ] セキュリティポリシー設定
- [ ] MFA設定（オプション）

### 技術要件
- 使用技術: AWS CDK, Cognito, API Gateway
- 制約事項: JWT標準準拠、セキュリティ要件満足

### テスト項目
- [ ] ユーザープール作成確認
- [ ] JWT トークン生成確認
- [ ] Authorizer動作確認

### 完了条件
- [ ] 認証システム動作確認
- [ ] トークン検証動作確認
- [ ] API Gateway連携確認

---

## INFRA-004: API Gateway REST API設定
**優先度**: High
**カテゴリ**: API Gateway

**依存関係**: INFRA-003, INFRA-005

### 課題概要
RESTful APIエンドポイントを提供するAPI Gatewayを設定し、Lambda統合とCognito認証を構成する。

### 実装詳細
- [ ] REST API作成
- [ ] リソース・メソッド設定 (/health, /search, /check, /upload等)
- [ ] Lambda プロキシ統合設定
- [ ] Cognito Authorizer設定
- [ ] CORS設定
- [ ] リクエスト・レスポンス変換設定
- [ ] レート制限設定 (1000リクエスト/時間)
- [ ] アクセスログ設定
- [ ] ステージ設定 (dev, staging, prod)

### 技術要件
- 使用技術: AWS CDK, API Gateway
- 制約事項: Lambda統合、Cognito認証、CORS対応

### テスト項目
- [ ] エンドポイント作成確認
- [ ] Lambda統合確認
- [ ] 認証動作確認
- [ ] CORS動作確認

### 完了条件
- [ ] API Gateway設定完了
- [ ] 全エンドポイント動作確認
- [ ] セキュリティ設定確認

---

## INFRA-005: Lambda関数設定・ECR連携
**優先度**: High
**カテゴリ**: Lambda

**依存関係**: INFRA-006

### 課題概要
FastAPI + MangumによるLambda関数をECRコンテナイメージで実行する環境を構築する。

### 実装詳細
- [ ] Lambda関数作成 (ECRコンテナイメージ)
- [ ] メモリ・タイムアウト設定 (メモリ: 3008MB, タイムアウト: 900秒)
- [ ] 環境変数設定 (DynamoDB テーブル名、S3バケット名等)
- [ ] IAMロール・ポリシー設定
- [ ] VPC設定 (必要に応じて)
- [ ] 同時実行数制限設定 (1000)
- [ ] Dead Letter Queue設定
- [ ] CloudWatch Logs設定

### 技術要件
- 使用技術: AWS CDK, Lambda, ECR
- 制約事項: コンテナイメージ、IAM最小権限、監視必須

### テスト項目
- [ ] Lambda関数作成確認
- [ ] ECR連携確認
- [ ] IAM権限確認
- [ ] CloudWatch Logs確認

### 完了条件
- [ ] Lambda関数動作確認
- [ ] ECR連携動作確認
- [ ] 権限設定確認

---

## INFRA-006: ECR リポジトリ設定
**優先度**: High
**カテゴリ**: ECR

**依存関係**: なし

### 課題概要
FastAPIアプリケーションのDockerイメージを管理するECRリポジトリを作成する。

### 実装詳細
- [ ] ECRリポジトリ作成
- [ ] イメージスキャン設定
- [ ] ライフサイクルポリシー設定 (古いイメージ自動削除)
- [ ] アクセス権限設定
- [ ] 暗号化設定
- [ ] タグ設定

### 技術要件
- 使用技術: AWS CDK, ECR
- 制約事項: イメージスキャン有効、ライフサイクル管理

### テスト項目
- [ ] リポジトリ作成確認
- [ ] プッシュ・プル確認
- [ ] ライフサイクル設定確認

### 完了条件
- [ ] ECRリポジトリ動作確認
- [ ] イメージ管理機能確認
- [ ] アクセス権限確認

---

## INFRA-007: Step Functions ワークフロー設定
**優先度**: Medium
**カテゴリ**: Step Functions

**依存関係**: INFRA-005

### 課題概要
RAG処理とチェック処理のワークフロー管理にStep Functionsを設定する。

### 実装詳細
- [ ] ステートマシン定義作成
- [ ] Lambda関数呼び出し設定
- [ ] エラーハンドリング・リトライ設定
- [ ] 実行履歴管理設定
- [ ] CloudWatch統合設定
- [ ] IAMロール設定
- [ ] 実行時間制限設定

### 技術要件
- 使用技術: AWS CDK, Step Functions
- 制約事項: エラー耐性、実行履歴保持、監視必須

### テスト項目
- [ ] ステートマシン作成確認
- [ ] Lambda統合確認
- [ ] エラーハンドリング確認

### 完了条件
- [ ] Step Functions動作確認
- [ ] ワークフロー実行確認
- [ ] エラー処理確認

---

## INFRA-008: Secrets Manager設定
**優先度**: Medium
**カテゴリ**: Security

**依存関係**: なし

### 課題概要
PineconeやBedrock等のAPIキーを安全に管理するSecrets Managerを設定する。

### 実装詳細
- [ ] Secrets Manager シークレット作成
- [ ] APIキー保存 (Pinecone API Key等)
- [ ] アクセス権限設定
- [ ] ローテーション設定（可能な場合）
- [ ] 暗号化設定
- [ ] 監査ログ設定

### 技術要件
- 使用技術: AWS CDK, Secrets Manager
- 制約事項: 暗号化必須、最小権限アクセス

### テスト項目
- [ ] シークレット作成確認
- [ ] アクセス権限確認
- [ ] 暗号化確認

### 完了条件
- [ ] Secrets Manager動作確認
- [ ] APIキー管理確認
- [ ] アクセス制御確認

---

## INFRA-009: CloudWatch 監視・ログ設定
**優先度**: Medium
**カテゴリ**: Monitoring

**依存関係**: INFRA-004, INFRA-005

### 課題概要
システム全体の監視、ログ管理、アラート設定をCloudWatchで構築する。

### 実装詳細
- [ ] CloudWatch Logs グループ作成 (Lambda, API Gateway)
- [ ] 構造化ログ設定
- [ ] カスタムメトリクス設定
- [ ] ダッシュボード作成
- [ ] アラーム設定 (エラー率、レスポンス時間等)
- [ ] SNS通知設定
- [ ] ログ保持期間設定 (1年間)

### 技術要件
- 使用技術: AWS CDK, CloudWatch
- 制約事項: 構造化ログ、リアルタイム監視、コスト最適化

### テスト項目
- [ ] ログ出力確認
- [ ] メトリクス確認
- [ ] アラーム動作確認

### 完了条件
- [ ] 監視システム動作確認
- [ ] ログ収集確認
- [ ] アラート動作確認

---

## INFRA-010: IAM ロール・ポリシー設定
**優先度**: High
**カテゴリ**: Security

**依存関係**: INFRA-001, INFRA-002, INFRA-005

### 課題概要
最小権限の原則に基づいたIAMロールとポリシーを設定し、セキュリティを確保する。

### 実装詳細
- [ ] Lambda実行ロール作成
- [ ] DynamoDBアクセスポリシー設定
- [ ] S3アクセスポリシー設定
- [ ] Bedrock/Pineconeアクセスポリシー設定
- [ ] Secrets Manager アクセスポリシー設定
- [ ] CloudWatch Logs アクセスポリシー設定
- [ ] 最小権限ポリシー適用
- [ ] クロスアカウントアクセス設定（必要に応じて）

### 技術要件
- 使用技術: AWS CDK, IAM
- 制約事項: 最小権限の原則、リソースレベル権限

### テスト項目
- [ ] ロール作成確認
- [ ] 権限確認
- [ ] アクセス制御確認

### 完了条件
- [ ] IAM設定完了
- [ ] 権限動作確認
- [ ] セキュリティ確認

---

## INFRA-011: 環境別デプロイメント設定
**優先度**: Medium
**カテゴリ**: Deployment

**依存関係**: 全INFRA課題

### 課題概要
dev、staging、prodの環境別デプロイメント機能をCDKで実装する。

### 実装詳細
- [ ] 環境別スタック分離設定
- [ ] 環境別パラメータ設定
- [ ] 環境別リソース命名規則設定
- [ ] デプロイメントパイプライン設定
- [ ] 環境間データ分離確認
- [ ] 環境別監視設定
- [ ] 環境別セキュリティ設定

### 技術要件
- 使用技術: AWS CDK
- 制約事項: 環境分離、命名規則統一、デプロイメント自動化

### テスト項目
- [ ] 環境別デプロイ確認
- [ ] データ分離確認
- [ ] 設定差分確認

### 完了条件
- [ ] 環境別デプロイ動作確認
- [ ] データ分離確認
- [ ] 設定管理確認

---

## INFRA-012: セキュリティ設定・監査
**優先度**: High
**カテゴリ**: Security

**依存関係**: 全INFRA課題

### 課題概要
セキュリティ要件に沿った設定確認と監査機能を実装する。

### 実装詳細
- [ ] TLS 1.2以上強制設定
- [ ] 保存時暗号化確認 (S3, DynamoDB)
- [ ] 転送時暗号化確認 (HTTPS)
- [ ] アクセスログ設定
- [ ] 監査証跡設定 (CloudTrail)
- [ ] セキュリティグループ設定
- [ ] VPC設定（必要に応じて）
- [ ] セキュリティ監査自動化

### 技術要件
- 使用技術: AWS CDK, CloudTrail, VPC
- 制約事項: 暗号化必須、監査証跡必須、最小権限

### テスト項目
- [ ] 暗号化設定確認
- [ ] アクセス制御確認
- [ ] 監査ログ確認

### 完了条件
- [ ] セキュリティ設定確認
- [ ] 監査機能動作確認
- [ ] コンプライアンス要件満足確認
```

## 完了報告

✅ **作業項目1**: FastAPI実装関連課題（issues_rag.md）の作成完了
- 10個のRAG関連Issueを作成
- 共通テンプレートを使用
- 依存関係と優先度を明記

✅ **作業項目2**: AWSリソース関連課題（issues_infra.md）の作成完了  
- 12個のInfra関連Issueを作成
- 共通テンプレートを使用
- 依存関係と優先度を明記

## コミットメッセージ案

documentsディレクトリの分析に基づき、issuesディレクトリにFastAPI実装とAWSリソース構築の詳細なIssue一覧を作成しました。
