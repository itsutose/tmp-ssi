# AWSリソース関連 Issue一覧

## インフラ実装推奨順序

### 第1優先: 基盤リソース
1. **INFRA-001**: DynamoDB テーブル群作成・設定
2. **INFRA-002**: S3 バケット構成作成・設定  
3. **INFRA-006**: ECR リポジトリ設定
4. **INFRA-008**: Secrets Manager設定
5. **INFRA-010**: IAM ロール・ポリシー設定

### 第2優先: AI/MLサービス統合
6. **INFRA-013**: Vector Database統合設定
7. **INFRA-014**: Bedrock統合・LLMモデル設定
8. **INFRA-015**: 環境変数・設定管理強化

### 第3優先: コンピュート・API
9. **INFRA-005**: Lambda関数設定・ECR連携
10. **INFRA-004**: API Gateway REST API設定

### 第4優先: 運用・監視
11. **INFRA-009**: CloudWatch 監視・ログ設定
12. **INFRA-007**: Step Functions ワークフロー設定
13. **INFRA-012**: セキュリティ設定・監査

### 第5優先: 追加機能
14. **INFRA-011**: 環境別デプロイメント設定
15. **INFRA-003**: Cognito ユーザープール設定

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
**優先度**: Low
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
Advanced RAG RESTful APIエンドポイントを提供するAPI Gateway (sony-sonpo-api) を設定し、Lambda統合とCognito認証を構成する。

### 実装詳細
- [ ] REST API作成 (sony-sonpo-api)
- [ ] リソース・メソッド設定
  - [ ] /health - ヘルスチェック
  - [ ] /rag/query - Advanced RAGクエリ
  - [ ] /rag/check - チェック機能
  - [ ] /documents/* - 文書管理
  - [ ] /history/* - 履歴管理
  - [ ] /config - 設定取得
- [ ] Lambda プロキシ統合設定 (sony-sonpo-rag-lambda)
- [ ] Cognito Authorizer設定 (JWT Bearer Token)
- [ ] CORS設定 (開発・本番環境別)
- [ ] リクエスト・レスポンス変換設定
- [ ] レート制限設定 (1000リクエスト/時間)
- [ ] CloudWatch統合アクセスログ設定
- [ ] ステージ設定 (dev, staging, prod)
- [ ] WAF統合設定

### 技術要件
- 使用技術: AWS CDK, API Gateway REST API
- 制約事項: Lambda統合、Cognito認証、CORS対応、命名規則統一

### テスト項目
- [ ] 全エンドポイント作成確認
- [ ] Lambda統合確認
- [ ] Cognito認証動作確認
- [ ] CORS動作確認
- [ ] レート制限動作確認

### 完了条件
- [ ] API Gateway設定完了
- [ ] Advanced RAGエンドポイント動作確認
- [ ] セキュリティ設定確認

---

## INFRA-005: Lambda関数設定・ECR連携
**優先度**: High
**カテゴリ**: Lambda
**依存関係**: INFRA-006

### 課題概要
FastAPI + MangumによるAdvanced RAG LambdaをECRコンテナイメージで実行する環境を構築する。

### 実装詳細
- [ ] Lambda関数作成 (ECRコンテナイメージ、ARM64アーキテクチャ)
- [ ] メモリ・タイムアウト設定 (メモリ: 3008MB, タイムアウト: 900秒)
- [ ] 環境変数設定 (DynamoDB テーブル名、S3バケット名、Vector DB設定等)
- [ ] Lambda実行ロール・ポリシー設定
- [ ] VPC設定 (セキュリティグループ、サブネット)
- [ ] 同時実行数制限設定 (1000)
- [ ] Dead Letter Queue設定
- [ ] CloudWatch Logs設定
- [ ] Lambda Layer設定 (共通ライブラリ用)
- [ ] 関数命名規則適用 (sony-sonpo-rag-lambda)

### 技術要件
- 使用技術: AWS CDK, Lambda (Container), ECR, ARM64
- 制約事項: コンテナイメージ、IAM最小権限、監視必須、コールドスタート最適化

### テスト項目
- [ ] Lambda関数作成確認
- [ ] ECR連携確認
- [ ] IAM権限確認
- [ ] CloudWatch Logs確認
- [ ] Advanced RAG統合確認

### 完了条件
- [ ] Lambda関数動作確認
- [ ] ECR連携動作確認
- [ ] Advanced RAG機能確認

---

## INFRA-006: ECR リポジトリ設定
**優先度**: High
**カテゴリ**: ECR
**依存関係**: なし

### 課題概要
Advanced RAG FastAPIアプリケーションのDockerイメージを管理するECRリポジトリを設定する。

### 実装詳細
- [ ] ECRリポジトリ参照設定 (sony-sonpo-rag)
- [ ] Lambda ServicePrincipal プル権限設定
- [ ] イメージスキャン設定 (脆弱性検出)
- [ ] ライフサイクルポリシー設定 (最新10イメージ保持)
- [ ] 暗号化設定 (AES256)
- [ ] リポジトリタグ管理設定
- [ ] イメージ署名・検証設定
- [ ] CDK統合設定

### 技術要件
- 使用技術: AWS CDK, ECR, Docker
- 制約事項: リポジトリ名統一 (sony-sonpo-rag)、セキュリティスキャン必須

### テスト項目
- [ ] リポジトリ参照確認
- [ ] Lambda プル権限確認
- [ ] イメージスキャン確認
- [ ] ライフサイクル動作確認

### 完了条件
- [ ] ECRリポジトリ統合確認
- [ ] セキュリティ機能確認
- [ ] CDK連携確認

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
Advanced RAGシステムで使用するAPIキーと機密設定を安全に管理するSecrets Managerを設定する。

### 実装詳細
- [ ] Secrets Manager シークレット作成
- [ ] Pinecone API Key保存・管理
- [ ] Bedrock モデルアクセス設定保存
- [ ] Vector DB接続情報保存
- [ ] 外部API認証情報保存
- [ ] Lambda実行ロールアクセス権限設定
- [ ] シークレットローテーション設定（可能な場合）
- [ ] 暗号化設定 (AWS KMS)
- [ ] 監査ログ・アクセス追跡設定
- [ ] 環境別シークレット分離設定

### 技術要件
- 使用技術: AWS CDK, Secrets Manager, KMS
- 制約事項: 暗号化必須、最小権限アクセス、環境分離

### テスト項目
- [ ] シークレット作成確認
- [ ] Lambda統合確認
- [ ] アクセス権限確認
- [ ] 暗号化確認

### 完了条件
- [ ] Secrets Manager動作確認
- [ ] Advanced RAG統合確認
- [ ] セキュリティ要件確認

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
Advanced RAGシステムのセキュリティ要件に沿った包括的なセキュリティ設定と監査機能を実装する。

### 実装詳細
- [ ] TLS 1.2以上強制設定 (API Gateway, ALB)
- [ ] 保存時暗号化確認 (S3, DynamoDB, Secrets Manager)
- [ ] 転送時暗号化確認 (HTTPS, VPC内通信)
- [ ] アクセスログ設定 (API Gateway, CloudFront, ALB)
- [ ] 監査証跡設定 (CloudTrail, VPC Flow Logs)
- [ ] VPCセキュリティグループ設定
- [ ] WAF設定 (SQLインジェクション、XSS防御)
- [ ] セキュリティ監査自動化 (Config Rules)
- [ ] 脆弱性スキャン設定 (Inspector)
- [ ] データ分類・ラベリング設定
- [ ] 機密情報検出設定 (Macie)

### 技術要件
- 使用技術: AWS CDK, CloudTrail, VPC, WAF, Config, Inspector, Macie
- 制約事項: 暗号化必須、監査証跡必須、最小権限、データ保護

### テスト項目
- [ ] 暗号化設定確認
- [ ] アクセス制御確認
- [ ] 監査ログ確認
- [ ] WAF動作確認
- [ ] 脆弱性スキャン確認

### 完了条件
- [ ] 包括的セキュリティ設定確認
- [ ] 監査機能動作確認
- [ ] コンプライアンス要件満足確認

---

## INFRA-013: Pinecone Vector Database統合設定
**優先度**: High
**カテゴリ**: Database
**依存関係**: INFRA-005, INFRA-008

### 課題概要
Advanced RAGシステムで使用するPinecone Vector Databaseとの統合設定を行う。外部SaaSサービスとしてのPinecone接続管理を実装する。

### 実装詳細
- [ ] Pinecone統合設定 (外部SaaSサービス)
- [ ] Pinecone API Key管理 (Secrets Manager統合)
- [ ] Pinecone接続プール・セッション管理設定
- [ ] Embedding モデル設定 (Bedrock Titan Embeddings)
- [ ] Pineconeインデックス管理設定
- [ ] メタデータスキーマ設定 (document_id, category, tags等)
- [ ] Pinecone接続エラー処理・リトライ設定
- [ ] パフォーマンス監視・メトリクス設定
- [ ] Pinecone利用料金監視設定
- [ ] 接続タイムアウト・制限設定
- [ ] 環境別Pinecone設定管理 (dev/staging/prod)

### 技術要件
- 使用技術: Pinecone SDK, boto3, Bedrock Embeddings
- 制約事項: 外部SaaSサービス依存、API制限対応、コスト最適化、パフォーマンス最適化

### テスト項目
- [ ] Pinecone接続確認
- [ ] インデックス CRUD操作確認
- [ ] ベクトル検索性能確認
- [ ] API制限・エラーハンドリング確認
- [ ] 接続プール動作確認

### 完了条件
- [ ] Pinecone統合動作確認
- [ ] 検索性能要件確認
- [ ] 外部サービス障害耐性確認

---

## INFRA-014: Bedrock統合・LLMモデル設定
**優先度**: High
**カテゴリ**: AI/ML
**依存関係**: INFRA-005, INFRA-010

### 課題概要
Advanced RAGシステムで使用するAmazon Bedrock LLMモデルとの統合設定を行う。

### 実装詳細
- [ ] Bedrock サービス統合設定
- [ ] Claude 3 モデルアクセス設定
- [ ] Embedding モデル設定 (Titan Embed)
- [ ] モデル呼び出し権限設定
- [ ] レスポンス時間最適化設定
- [ ] トークン制限・コスト管理設定
- [ ] モデル選択ロジック設定
- [ ] エラー処理・フォールバック設定
- [ ] 使用量監視・アラート設定
- [ ] セキュリティ設定 (データ保持ポリシー)

### 技術要件
- 使用技術: Amazon Bedrock, Claude 3, Titan Embeddings
- 制約事項: モデル制限対応、コスト最適化、セキュリティ要件

### テスト項目
- [ ] Bedrockアクセス確認
- [ ] モデル呼び出し確認
- [ ] レスポンス時間確認
- [ ] エラーハンドリング確認

### 完了条件
- [ ] Bedrock統合動作確認
- [ ] 全モデル動作確認
- [ ] パフォーマンス要件確認

---

## INFRA-015: 環境変数・設定管理強化
**優先度**: Medium
**カテゴリ**: Configuration
**依存関係**: INFRA-005, INFRA-008

### 課題概要
Advanced RAGシステムの複雑な設定を環境別に管理する統合設定管理システムを構築する。

### 実装詳細
- [ ] 環境別設定ファイル管理 (dev/staging/prod)
- [ ] Lambda環境変数設定
  - [ ] DynamoDB テーブル名設定
  - [ ] S3 バケット名設定
  - [ ] Vector DB設定
  - [ ] Bedrock モデル設定
  - [ ] API エンドポイント設定
- [ ] Parameter Store統合設定
- [ ] 設定検証・ヘルスチェック機能
- [ ] 設定変更通知機能
- [ ] 設定バックアップ・復旧機能
- [ ] 設定テンプレート管理
- [ ] 設定ドリフト検出機能

### 技術要件
- 使用技術: AWS Systems Manager Parameter Store, Lambda Environment Variables
- 制約事項: 環境分離、設定検証、変更追跡

### テスト項目
- [ ] 環境別設定確認
- [ ] 設定読み込み確認
- [ ] 設定変更検証確認

### 完了条件
- [ ] 設定管理システム動作確認
- [ ] 環境分離確認
- [ ] 設定検証機能確認