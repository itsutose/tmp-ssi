# バックエンドサービス要件定義書

## 1. 目的

Advanced RAGシステムのバックエンドAPIサービスを構築し、文書検索、コンプライアンスチェック、約款チェック、表記チェック機能を提供する。フロントエンドアプリケーションとの疎結合な設計により、独立した開発・デプロイを可能にする。

## 2. 本要件定義書の範囲

本要件定義書は、Advanced RAGシステムのバックエンドAPIサービスの機能要件、非機能要件、技術仕様、インフラ構成を定義する。

## 3. 機能要件

### 3.1 Advanced RAG の手続き構成

#### 3.1.1 検索・チェック機能

- **文書検索**
  - 概要：指定されたクエリに対して関連文書を検索・取得
  - 検索対象：アップロードされた全ての文書
  - 検索戦略：ベクトル検索、キーワード検索、ハイブリッド検索
  - フォルダ指定検索：特定フォルダ内の文書に限定した検索

- **コンプライアンスチェック**
  - 概要：与えられた文章が金融法などの関連法律に違反した書き方をしていないかをチェック
  - 検索対象：法務文書（legal/compliance, legal/regulations, legal/policies）
  - 処理方式：同期処理（即座にチェック結果を返す）
  - 評価方式：手動評価（ユーザーが結果の良し悪しを判断）

- **約款チェック**
  - 概要：与えられた文章が約款情報に違反/矛盾した内容がないかを検査
  - 検索対象：約款情報を含むドキュメント（terms/life-insurance, terms/property-insurance, terms/common）
  - 処理方式：同期処理（即座にチェック結果を返す）
  - 評価方式：手動評価（ユーザーが結果の良し悪しを判断）

- **表記チェック**
  - 概要：与えられた文書が正しい表記法を使用しているかをチェック
  - 検索対象：表記方法をまとめたCSVファイル（notation/style-guides, notation/dictionaries）
  - 処理方式：同期処理（即座にチェック結果を返す）
  - 評価方式：手動評価（ユーザーが結果の良し悪しを判断）

#### 3.1.2 RAG処理パイプライン

- **Pre-Retrieval処理**
  - 検索クエリの生成・拡張
  - リクエスト文書の分割・前処理

- **検索戦略**
  - ベクトル検索（セマンティック検索）
  - キーワード検索（BM25）
  - ハイブリッド検索（ベクトル + キーワード）

- **Post-Retrieval処理**
  - リランキング（関連度による再順序付け）
  - メタデータ圧縮
  - RAG Fusion処理

- **回答生成**
  - 検索結果に基づく回答生成
  - コンテキスト管理
  - チャット履歴の考慮

#### 3.1.3 チャット機能

- セッション管理（30日間保持）
- 会話履歴の保持
- コンテキストの継続

### 3.2 ドキュメント管理機能

#### 3.2.1 ドキュメントアップロード・埋め込み

- **対応ドキュメント形式**
  - PDF
  - CSV
  - その他テキストファイル

- **チャンキング戦略**
  - 文字数ベースのチャンキング
  - セマンティックチャンキング
  - 文書構造を考慮したチャンキング

- **ベクトルデータベース**
  - Pinecone（全環境統一）
    - 開発環境：独立したインデックス
    - ステージング環境：独立したインデックス
    - 本番環境：独立したインデックス

- **文書保管・管理**
  - 文書の原本：S3に保管、ダウンロード可能
  - 文書の目録と保管先：DynamoDBに登録
  - 文書のメタデータ管理

#### 3.2.2 S3ストレージ構成

- **Documents バケット**: 文書原本保管
  - legal/: 法務文書（compliance, regulations, policies）
  - terms/: 約款情報（life-insurance, property-insurance, common）
  - notation/: 表記方法（style-guides, dictionaries）
  - general/: 一般文書（manuals, faqs, others）
  - uploads/: ユーザーアップロード（一時保管）

- **Temporary バケット**: 一時ファイル保管
  - uploads/: アップロード一時保管（24時間）
  - processing/: 処理中ファイル（7日間）
  - chunks/: チャンキング結果（30日間）

- **Prompts バケット**: プロンプト管理（オプション）
  - system/: システムプロンプト
  - user/: ユーザー定義プロンプト
  - templates/: プロンプトテンプレート

- **Sandbox バケット**: サンドボックス環境
  - workspaces/: 動的ワークスペース
  - shared/: 共有リソース
  - experiments/: 実験用領域

#### 3.2.3 DynamoDBテーブル構成

- **Documents テーブル**: 文書管理
  - Primary Key: documentId
  - GSI: category-uploadedAt-index, uploadedBy-uploadedAt-index
  
- **ChatSessions テーブル**: チャットセッション管理
  - Primary Key: sessionId, Sort Key: messageIndex
  - GSI: userId-timestamp-index
  - TTL: 30日間

- **ProcessingHistory テーブル**: 処理履歴管理
  - Primary Key: executionId
  - GSI: userId-createdAt-index, queryType-createdAt-index
  - TTL: 2年間（Bedrock履歴）

- **Prompts テーブル**: プロンプト管理
  - Primary Key: promptKey, Sort Key: version
  - GSI: category-isActive-index

- **UserSessions テーブル**: ユーザーセッション管理
  - Primary Key: userId, Sort Key: sessionId
  - GSI: sessionId-index
  - TTL: 30日間

### 3.3 履歴管理機能

#### 3.3.1 回答履歴の参照

- Step Function タスク完了時にレスポンス結果をDynamoDBに登録
- 検索履歴の保存・参照
- ユーザー別履歴管理
- 将来的にAppSync (GraphQL)でアクセス可能にする予定

### 3.4 API設計

- RESTful API設計
- OpenAPI仕様書の提供
- バージョニング対応（URL パスによる）
- プロンプトはフロントで指定し、指定されたプロンプトを使用する
- JWT Bearer Token認証（Cognito）

#### 3.4.1 主要APIエンドポイント

- **ヘルスチェック系**: `/health`, `/rag/health`
- **文書検索系**: `POST /search`
- **チェック系**: `POST /check` (手動評価方式)
- **ユーザー評価系**: `POST /check/evaluate`, `GET /check/evaluations`
- **文書管理系**: `POST /upload`, `GET /download`, `GET /documents`, `DELETE /documents/{id}`
- **サンドボックス管理**: `PUT /sandbox/folders/{id}`, `/sandbox/prompts`
- **サンドボックスRAG**: `POST /sandbox/search`, `POST /sandbox/check`, `POST /sandbox/compare`
- **サンドボックス結果管理**: `POST /sandbox/results/save`, `GET /sandbox/results`, `GET /sandbox/results/{id}`, `DELETE /sandbox/results/{id}`, `GET /sandbox/workspaces/{id}/summary`
- **履歴管理**: `GET /history/search`, `GET /history/checks`

### 3.5 サンドボックス環境

#### 3.5.1 参照フォルダの名前変更

- フロントからのリクエストに応じて、フォルダ名を変更
- S3オブジェクトのコピー＆削除による実装
- ワークスペース単位での管理

#### 3.5.2 プロンプトの編集・作成

- プロンプトのキーと内容については DynamoDB + S3で管理
- フロントからのリクエストに応じて、プロンプトの内容を表示
- フロントからのリクエストに応じて、プロンプトの内容を上書き
- バージョニング対応

#### 3.5.3 動的ワークスペース管理

- ユーザー別ワークスペースの作成・削除
- ワークスペース内での文書・プロンプト・結果の管理
- 実験用領域での独立したテスト環境提供

#### 3.5.4 Sandbox専用RAG機能

##### 概要
Sandbox環境では、動的に変更したプロンプトや文書を即座にテストできるRAG機能が必要です。本番環境に影響を与えることなく、安全で効率的な検証・改善サイクルを実現します。

##### Sandbox RAG処理アーキテクチャ

```mermaid
graph TB
    subgraph "🏖️ Sandbox Environment"
        WS[ワークスペース] --> DOC[テスト文書]
        WS --> PROMPT[カスタムプロンプト]
        DOC --> SRAG[Sandbox RAG処理]
        PROMPT --> SRAG
        SRAG --> RESULT[処理結果]
        RESULT --> EVAL{"評価"}
        EVAL -->|改善必要| DOC
        EVAL -->|改善必要| PROMPT
        EVAL -->|OK| PROMOTE[本番反映]
    end
    
    subgraph "🎯 Production Environment"
        PROMOTE --> PROD_PROMPT[Promptsバケット]
        PROMOTE --> PROD_DOC[Documentsバケット]
        PROD_PROMPT --> PROD_RAG[本番RAG処理]
        PROD_DOC --> PROD_RAG
    end
```

##### 追加APIエンドポイント

###### Sandbox専用文書検索
- **エンドポイント**: `POST /sandbox/search`
- **概要**: ワークスペース内の文書とカスタムプロンプトを使用した検索
- **検索スコープ**: 
  - `workspace`: ワークスペース内のみ
  - `global`: 本番文書も含む
  - `mixed`: 両方を統合検索

###### Sandbox専用チェック処理
- **エンドポイント**: `POST /sandbox/check`
- **概要**: ワークスペース内のカスタムプロンプトを使用したチェック処理
- **チェックタイプ**: `compliance`, `term`, `expression`
- **処理方式**: Step Function による非同期処理（ワークスペース専用）

###### A/Bテスト機能
- **エンドポイント**: `POST /sandbox/compare`
- **概要**: 複数のプロンプト・文書設定での比較テスト
- **同時比較**: 最大5つの設定を並列実行
- **結果保存**: `workspaces/{workspaceId}/results/compare/`

##### Sandbox RAG処理フロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Frontend as フロントエンド
    participant API as API Gateway
    participant SandboxLambda as Sandbox Lambda
    participant StepFunction as Step Functions
    participant S3Sandbox as S3 Sandbox
    participant Pinecone as Pinecone
    participant Bedrock as Bedrock
    participant DynamoDB as DynamoDB

    Note over User, DynamoDB: Sandbox RAG実行フロー

    User->>Frontend: テスト実行要求
    Frontend->>API: POST /sandbox/search
    Note over API: workspace_id + custom settings

    API->>SandboxLambda: Sandbox専用処理開始
    SandboxLambda->>S3Sandbox: ワークスペース内文書取得
    SandboxLambda->>S3Sandbox: カスタムプロンプト取得
    
    alt チェック処理の場合
        SandboxLambda->>StepFunction: Sandbox専用フロー開始
        StepFunction->>Pinecone: ベクトル検索（workspace scope）
        StepFunction->>Bedrock: LLM実行（custom prompt）
        Bedrock-->>StepFunction: 処理結果
        StepFunction->>S3Sandbox: 結果保存
        StepFunction->>DynamoDB: 履歴記録（sandbox専用）
        StepFunction-->>API: 非同期完了通知
    else 即座検索の場合
        SandboxLambda->>Pinecone: リアルタイム検索
        SandboxLambda->>Bedrock: リアルタイム生成
        Bedrock-->>SandboxLambda: 即座結果
        SandboxLambda-->>API: 即座レスポンス
    end

    API-->>Frontend: 結果データ
    Frontend-->>User: テスト結果表示

    Note over User, DynamoDB: 本番反映フロー
    User->>Frontend: 本番反映決定
    Frontend->>API: POST /sandbox/promote
    API->>SandboxLambda: 本番反映処理
    SandboxLambda->>S3Sandbox: Promptsバケットへコピー
    SandboxLambda->>DynamoDB: 本番プロンプト登録
    SandboxLambda-->>API: 反映完了
    API-->>Frontend: 反映完了通知
```

##### パフォーマンス要件（Sandbox環境）
- **即座検索**: 3秒以内
- **チェック処理**: 30秒以内（本番の1/4時間）
- **A/Bテスト**: 90秒以内（並列実行）
- **同時ワークスペース**: ユーザーあたり5個まで

#### 3.5.5 手動評価システム

##### 概要
チェック処理結果の自動修正ではなく、ユーザーによる手動評価を重視したシステム設計。チェック結果の良し悪しをユーザーが判断し、継続的な改善に活用します。

##### 手動評価フロー

```mermaid
graph TB
    subgraph "🔍 手動評価チェック処理"
        A[ユーザー] --> B[文書入力]
        B --> C[チェック実行<br/>POST /check]
        C --> D[チェック結果表示<br/>問題点の指摘のみ]
        D --> E[ユーザー評価<br/>POST /check/evaluate]
        E --> F{"評価結果"}
        F -->|good| G[✅ 採用・保存]
        F -->|poor| H[❌ 改善が必要]
        F -->|needs_improvement| I[🔧 部分的改善]
        
        H --> J[プロンプト調整]
        H --> K[参照文書更新]
        I --> J
        I --> K
        J --> C
        K --> C
        
        G --> L[評価履歴蓄積<br/>GET /check/evaluations]
        L --> M[システム改善<br/>分析・学習]
    end
```

##### 評価データ活用

```mermaid
graph LR
    subgraph "📊 評価データ分析"
        A[ユーザー評価] --> B[評価履歴蓄積]
        B --> C[パターン分析]
        C --> D[改善提案]
        
        D --> E[プロンプト最適化]
        D --> F[参照文書更新]
        D --> G[チェック精度向上]
    end
    
    subgraph "🎯 継続改善サイクル"
        G --> H[新しいテスト]
        H --> I[ユーザー評価]
        I --> J[さらなる改善]
    end
```

##### 評価指標
- **ユーザー満足度**: good/poor/needs_improvement の比率
- **改善率**: 評価後の再実行での満足度向上
- **効率性**: チェック→評価→改善のサイクル時間
- **学習効果**: 同種の問題での精度向上

##### データ蓄積戦略
- **評価履歴**: DynamoDB ProcessingHistory テーブルに長期保存
- **改善パターン**: よくある問題と解決策のナレッジベース構築
- **プロンプト進化**: ユーザーフィードバックに基づくプロンプト最適化

#### 3.5.6 動的フォルダ履歴管理

##### 概要
Sandbox環境での処理結果を動的フォルダに保存し、ユーザーが後で参照・分析できる履歴管理システム。S3とDynamoDBの二重保存により、高速検索と詳細データ保持を両立します。

##### 保存戦略

```mermaid
graph TB
    subgraph "📁 S3 Sandbox結果保存"
        A["RAG処理完了"] --> B["結果データ生成"]
        B --> C{"保存場所決定"}
        C --> D["workspaces/workspace-id/results/"]
        D --> E["日付別フォルダ<br/>YYYY-MM-DD/"]
        E --> F["タイプ別ファイル<br/>type_timestamp.json"]
        
        F --> G["search_20240101T100000Z.json"]
        F --> H["check_20240101T103000Z.json"]
        F --> I["compare_20240101T110000Z.json"]
    end
    
    subgraph "🗄️ DynamoDB履歴インデックス"
        J["ProcessingHistory"] --> K["結果メタデータ"]
        K --> L["検索・フィルタ機能"]
        L --> M["高速取得"]
    end
    
    A --> J
```

##### S3保存パターン

```typescript
// 結果ファイルの命名規則
interface S3ResultNaming {
  basePath: 'workspaces/{workspaceId}/results/';
  dateFolder: '{YYYY-MM-DD}/';
  fileName: '{resultType}_{timestamp}_{resultId}.json';
  
  // 例
  // workspaces/workspace-123/results/2024-01-01/search_20240101T100000Z_result-789c0123.json
  // workspaces/workspace-123/results/2024-01-01/check_20240101T103000Z_result-456d7890.json
}
```

##### DynamoDB保存形式

```typescript
// ProcessingHistory テーブル（Sandbox専用レコード）
interface SandboxHistoryRecord {
  executionId: string; // Primary Key
  userId: string;
  workspaceId: string;
  resultType: 'search' | 'check' | 'compare';
  queryType: 'sandbox'; // GSI用
  
  // S3参照情報
  s3Bucket: string;
  s3Key: string;
  
  // メタデータ
  query: string;
  checkType?: 'compliance' | 'term' | 'expression';
  userEvaluation?: 'good' | 'poor' | 'needs_improvement';
  
  // 統計情報
  processingTimeMs: number;
  resultsCount: number;
  
  // 時刻情報
  createdAt: string; // ISO string
  ttl: number; // 30日後の自動削除
}
```

##### 履歴取得最適化

```mermaid
graph LR
    subgraph "🔍 履歴検索フロー"
        A[履歴取得要求] --> B[DynamoDB検索]
        B --> C[メタデータ一覧]
        C --> D{"詳細必要?"}
        D -->|No| E[プレビュー表示]
        D -->|Yes| F[S3詳細取得]
        F --> G[完全結果表示]
    end
    
    subgraph "⚡ パフォーマンス最適化"
        H[GSI活用] --> I[高速フィルタ]
        I --> J[ページネーション]
        J --> K[レスポンス1秒以内]
    end
```

##### 自動保存トリガー

```typescript
// Sandbox RAG処理完了時の自動保存
async function autoSaveResult(ragResult: RagResult, workspaceId: string) {
  const resultId = generateUuid();
  const timestamp = new Date().toISOString();
  
  // S3保存
  const s3Key = `workspaces/${workspaceId}/results/${getDateFolder()}/${ragResult.type}_${formatTimestamp(timestamp)}_${resultId}.json`;
  await s3.putObject({
    Bucket: sandboxBucket,
    Key: s3Key,
    Body: JSON.stringify(ragResult.fullData),
    ContentType: 'application/json'
  }).promise();
  
  // DynamoDB保存
  await dynamodb.putItem({
    TableName: 'ProcessingHistory',
    Item: {
      executionId: resultId,
      workspaceId,
      queryType: 'sandbox',
      resultType: ragResult.type,
      s3Bucket: sandboxBucket,
      s3Key,
      query: ragResult.query,
      processingTimeMs: ragResult.processingTime,
      createdAt: timestamp,
      ttl: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30日後
    }
  }).promise();
}
```

##### データライフサイクル管理

| 保存先 | 保持期間 | 削除方法 | 用途 |
|--------|----------|----------|------|
| **S3** | 30日間 | TTL自動削除 | 詳細結果データ |
| **DynamoDB** | 30日間 | TTL自動削除 | 検索・フィルタ用メタデータ |
| **ユーザー手動削除** | 即座 | DELETE API | 不要な結果の即座削除 |

##### クリーンアップ処理

```mermaid
graph TB
    subgraph "🧹 自動クリーンアップ"
        A[DynamoDB TTL] --> B[30日経過レコード削除]
        C[S3 Lifecycle] --> D[30日経過オブジェクト削除]
        E[CloudWatch Events] --> F[定期クリーンアップ実行]
    end
    
    subgraph "🗑️ 手動削除"
        G[ユーザー削除要求] --> H[API経由削除]
        H --> I[S3とDynamoDB同時削除]
        I --> J[削除確認レスポンス]
    end
```

### 3.6 ユーザー権限

- Cognito による認証・認可
- ユーザー別リソースアクセス制御
- ワークスペース別権限管理

## 4. 非機能要件

### 4.1 性能要件

- **レスポンスタイム**
  - 文書検索：15秒以内
  - チェック機能：5秒以内（同期処理、手動評価方式）
  - ユーザー評価記録：1秒以内
  - ファイルアップロード：120秒以内

- **制限事項**
  - ファイルサイズ：最大 10MB
  - API呼び出し制限：ユーザーあたり 1000 リクエスト/時間
  - Lambda同時実行数：1000 同時実行

### 4.2 セキュリティ要件

#### 4.2.1 認証・認可

- **Cognito による認証**
  - JWT トークンベース認証
  - ユーザープール管理
  - API Gateway Cognito Authorizer

#### 4.2.2 データ保護

- **転送時暗号化**
  - TLS 1.2以上
  - HTTPS必須

- **保存時暗号化**
  - S3: Server-Side Encryption (SSE-S3)
  - DynamoDB: 保存時暗号化
  - Secrets Manager: キー管理

#### 4.2.3 アクセス制御

- **S3セキュリティ設定**
  - IAMロールベースアクセス
  - バケットポリシーによる制限
  - プライベートバケット（パブリックアクセス禁止）
  - バージョニング有効（誤削除防止）
  - MFA Delete（本番環境）

- **DynamoDB セキュリティ**
  - IAMロールベースアクセス
  - リソースレベル権限制御

- **Lambda セキュリティ**
  - 最小権限の原則
  - VPC内実行（必要に応じて）

### 4.3 可用性要件

- **ヘルスチェック**: 定期的な生存確認

### 4.4 運用・監視

#### 4.4.1 ログ管理

- **CloudWatch Logs**
  - 構造化ログ
  - エラー追跡
  - アクセスログ

- **ログ保持期間**
  - API Gateway アクセスログ: 1年間
  - Lambda実行ログ: 1年間
  - Step Function実行ログ: 1年間

#### 4.4.2 監視・アラート

- **メトリクス監視**
  - API Gateway: リクエスト数、エラー率、レイテンシ
  - Lambda: 実行時間、エラー数、同時実行数
  - DynamoDB: 読み書きキャパシティ、スロットリング
  - S3: リクエスト数、エラー率、ストレージ使用量

- **ヘルスチェック**
  - システム全体の死活監視
  - 外部サービス（Pinecone、Bedrock）の接続確認

- **異常検知・アラート**
  - エラー率閾値超過
  - レスポンス時間劣化
  - リソース使用量異常

### 4.5 アーキテクチャ設計

- **疎結合設計**
  - API Gateway による独立した実装
  - マイクロサービスアーキテクチャ
  - イベント駆動アーキテクチャ

- **スケーラビリティ**
  - サーバーレスアーキテクチャ
  - 自動スケーリング対応

## 5. データ保持・削除ポリシー

### 5.1 データ保持期間

- **ドキュメント原本**: 無期限保持（削除は明示的な指示のみ）
- **ベクトルデータ**: ドキュメント削除まで保持
- **チャットセッション**: 30日間保持（TTL自動削除）
- **処理履歴（Bedrockの履歴）**: 2年間保持（TTL自動削除）
- **ユーザーセッション**: 30日間保持（TTL自動削除）
- **ログデータ**: 1年間保持
- **一時ファイル**: 24時間後自動削除（S3ライフサイクル）
- **処理中ファイル**: 7日間後自動削除（S3ライフサイクル）
- **チャンキング結果**: 30日間後自動削除（S3ライフサイクル）

### 5.2 データ削除ポリシー

- **手動削除**: AWSコンソールを通じて該当のデータなどは削除
- **自動削除**: 
  - DynamoDB TTL設定による自動削除
  - S3ライフサイクルポリシーによる自動削除
- **Bedrockの履歴**: ライフサイクルを設定し、自動で削除されるように設定

### 5.3 S3ライフサイクル設定

| ストレージクラス | 期間 | 対象 |
|-----------------|------|------|
| Standard | 30日 | 新規アップロード |
| Standard-IA | 90日 | アクセス頻度低下 |
| Glacier Flexible Retrieval | 365日 | 長期保管 |
| Glacier Deep Archive | 無期限 | アーカイブ（削除は明示的指示のみ） |

## 6. インフラ構成

### 6.1 AWS サービス構成

- **API Gateway**: RESTful APIエンドポイント
- **Lambda**: サーバーレス実行環境
- **Step Functions**: ワークフロー管理（チェック処理の状態管理）
- **ECR**: Dockerイメージ管理
- **DynamoDB**: NoSQLデータベース
- **S3**: オブジェクトストレージ（4バケット構成）
- **Bedrock**: LLMサービス
  - **ナレッジベース**: Pineconeへのアクセス
  - **Embedding生成**: テキストベクトル化
- **Pinecone**: Vector Database（全環境統一）
- **Cognito**: 認証サービス
- **Secrets Manager**: キー管理
- **CloudWatch**: ログ管理・監視

### 6.2 AWS アーキテクチャ構成図

FastAPI基本機能の処理フロー: **API Gateway → Step Functions → Lambda**

```mermaid
graph TB
    subgraph "Frontend"
        FE[React/Amplify Frontend]
    end
    
    subgraph "Authentication"
        COGNITO[Amazon Cognito<br/>User Pool]
    end
    
    subgraph "API Layer"
        APIGW[API Gateway<br/>REST API]
        AUTH[Cognito Authorizer]
    end
    
    subgraph "Compute"
        LAMBDA[Lambda Functions<br/>FastAPI + Mangum]
        ECR[Amazon ECR<br/>Docker Images]
    end
    
    subgraph "Orchestration"
        SF[Step Functions<br/>RAG Workflow]
    end
    
    subgraph "Storage"
        S3_DOC[S3 Documents Bucket<br/>文書原本保管]
        S3_TEMP[S3 Temporary Bucket<br/>一時ファイル保管]
        S3_PROMPT[S3 Prompts Bucket<br/>プロンプト管理]
        S3_SANDBOX[S3 Sandbox Bucket<br/>サンドボックス環境]
    end
    
    subgraph "Database"
        DDB_DOCS[DynamoDB Documents<br/>文書メタデータ]
        DDB_CHAT[DynamoDB ChatSessions<br/>チャット履歴]
        DDB_HISTORY[DynamoDB ProcessingHistory<br/>処理履歴]
        DDB_PROMPTS[DynamoDB Prompts<br/>プロンプト管理]
        DDB_SESSIONS[DynamoDB UserSessions<br/>ユーザーセッション]
    end
    
    subgraph "AI/ML Services"
        BEDROCK[Amazon Bedrock<br/>LLM & Embedding]
        PINECONE[Pinecone<br/>Vector Database]
    end
    
    subgraph "Security"
        SECRETS[AWS Secrets Manager<br/>API Keys管理]
    end
    
    subgraph "Monitoring"
        CW[CloudWatch<br/>Logs & Metrics]
    end
    
    %% Authentication Flow
    FE -->|JWT Token| COGNITO
    COGNITO -->|Authorize| AUTH
    
    %% API Flow
    FE -->|HTTPS Requests| APIGW
    APIGW -->|Authorize| AUTH
    AUTH -->|Execute| SF
    
    %% Step Functions to Lambda
    SF -->|Invoke| LAMBDA
    ECR -->|Container Images| LAMBDA
    
    %% Data Storage
    LAMBDA -->|Store/Retrieve| S3_DOC
    LAMBDA -->|Temp Files| S3_TEMP
    LAMBDA -->|Prompts| S3_PROMPT
    LAMBDA -->|Sandbox| S3_SANDBOX
    
    %% Database Operations
    LAMBDA -->|Metadata| DDB_DOCS
    LAMBDA -->|Chat Data| DDB_CHAT
    LAMBDA -->|History| DDB_HISTORY
    LAMBDA -->|Prompts Meta| DDB_PROMPTS
    LAMBDA -->|Sessions| DDB_SESSIONS
    
    %% AI/ML Integration
    LAMBDA -->|LLM Requests| BEDROCK
    LAMBDA -->|Vector Operations| PINECONE
    
    %% Security
    LAMBDA -->|API Keys| SECRETS
    
    %% Monitoring
    LAMBDA -->|Logs| CW
    APIGW -->|Access Logs| CW
    SF -->|Execution Logs| CW
    
    %% S3 Event Triggers
    S3_DOC -->|Object Created| LAMBDA
    
    %% Data Flow Styling
    classDef frontend fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef compute fill:#e8f5e8
    classDef storage fill:#fff3e0
    classDef database fill:#fce4ec
    classDef ai fill:#e0f2f1
    classDef security fill:#fff8e1
    classDef monitoring fill:#f1f8e9
    
    class FE frontend
    class COGNITO,AUTH api
    class APIGW api
    class LAMBDA,ECR,SF compute
    class S3_DOC,S3_TEMP,S3_PROMPT,S3_SANDBOX storage
    class DDB_DOCS,DDB_CHAT,DDB_HISTORY,DDB_PROMPTS,DDB_SESSIONS database
    class BEDROCK,PINECONE ai
    class SECRETS security
    class CW monitoring
```

### 6.3 RAG処理フロー図

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Frontend as フロントエンド
    participant APIGW as API Gateway
    participant Auth as Cognito Authorizer
    participant SF as Step Functions
    participant Lambda as Lambda Function
    participant S3 as S3 Storage
    participant DDB as DynamoDB
    participant Bedrock as Amazon Bedrock
    participant Pinecone as Pinecone VectorDB
    
    Note over User, Pinecone: Advanced RAG処理フロー (API Gateway → Step Functions → Lambda)
    
    %% Authentication
    User->>Frontend: RAG処理要求
    Frontend->>APIGW: POST /search (JWT Token)
    APIGW->>Auth: トークン検証
    Auth-->>APIGW: 認証OK
    
    %% Step Functions Processing
    APIGW->>SF: Step Function実行開始
    SF->>DDB: 処理開始ログ記録
    
    %% Document Search Flow
    alt 文書検索の場合
        SF->>Lambda: 検索Lambda呼び出し
        Lambda->>Bedrock: Embedding生成
        Bedrock-->>Lambda: クエリベクトル
        Lambda->>Pinecone: ベクトル検索実行
        Pinecone-->>Lambda: 関連文書リスト
        Lambda->>DDB: 文書メタデータ取得
        Lambda->>S3: 文書内容取得
        Lambda->>Bedrock: RAG回答生成
        Bedrock-->>Lambda: 最終回答
        Lambda->>DDB: 処理結果保存
        Lambda-->>SF: 検索結果
        SF-->>APIGW: 検索結果レスポンス
    
    %% Check Processing Flow    
    else チェック処理の場合
        SF->>Lambda: チェックLambda呼び出し
        Lambda->>Bedrock: 文書解析
        Lambda->>Pinecone: 関連法規検索
        Lambda->>S3: 参照文書取得
        Lambda->>Bedrock: コンプライアンス判定
        Lambda->>DDB: 処理結果保存
        Lambda-->>SF: チェック結果
        SF-->>APIGW: チェック結果レスポンス
    
    %% File Upload Flow
    else ファイルアップロードの場合
        SF->>Lambda: アップロードLambda呼び出し
        Lambda->>S3: 一時アップロード
        Lambda->>DDB: メタデータ登録
        Lambda-->>SF: アップロード完了
        Note over S3: S3イベントトリガー
        S3->>SF: 文書処理Step Function開始
        SF->>Lambda: 文書処理Lambda呼び出し
        Lambda->>Lambda: テキスト抽出
        Lambda->>Bedrock: チャンキング処理
        Lambda->>Bedrock: Embedding生成
        Lambda->>Pinecone: ベクトル登録
        Lambda->>S3: 最終保存先に移動
        Lambda->>DDB: ステータス更新
        Lambda-->>SF: 処理完了
        SF-->>APIGW: 処理完了レスポンス
    end
    
    %% Response
    APIGW-->>Frontend: JSONレスポンス
    Frontend-->>User: 結果表示
    
    %% Monitoring
    SF->>DDB: ワークフロー履歴保存
    Lambda->>DDB: 処理ログ記録
```

### 6.4 データフロー図

```mermaid
graph LR
    subgraph "Input Layer"
        USER[ユーザー入力]
        UPLOAD[ファイルアップロード]
    end
    
    subgraph "Processing Layer"
        PREPROCESS[前処理]
        CHUNK[チャンキング]
        EMBED[Embedding生成]
        SEARCH[ベクトル検索]
        RANK[リランキング]
        GENERATE[回答生成]
    end
    
    subgraph "Storage Layer"
        S3_ORIG[S3: 原本ファイル]
        S3_PROC[S3: 処理済みデータ]
        VECTOR[Pinecone: ベクトルDB]
        META[DynamoDB: メタデータ]
    end
    
    subgraph "AI Services"
        BEDROCK_EMBED[Bedrock: Embedding]
        BEDROCK_LLM[Bedrock: LLM]
    end
    
    %% Input Flow
    USER -->|クエリ| PREPROCESS
    UPLOAD -->|PDF/CSV/TXT| CHUNK
    
    %% Processing Flow
    PREPROCESS -->|クエリ拡張| EMBED
    CHUNK -->|テキスト分割| EMBED
    EMBED -->|ベクトル化| SEARCH
    SEARCH -->|関連文書取得| RANK
    RANK -->|スコア調整| GENERATE
    
    %% Storage Operations
    UPLOAD -->|保存| S3_ORIG
    CHUNK -->|メタデータ| META
    EMBED -->|ベクトル保存| VECTOR
    GENERATE -->|結果保存| S3_PROC
    
    %% AI Service Calls
    EMBED -.->|API Call| BEDROCK_EMBED
    SEARCH -.->|クエリ| VECTOR
    GENERATE -.->|API Call| BEDROCK_LLM
    
    %% Data Retrieval
    SEARCH -->|メタデータ参照| META
    RANK -->|原本参照| S3_ORIG
    
    %% Output
    GENERATE -->|最終回答| USER
    
    %% Styling
    classDef input fill:#e3f2fd
    classDef process fill:#f1f8e9
    classDef storage fill:#fff3e0
    classDef ai fill:#e8f5e8
    
    class USER,UPLOAD input
    class PREPROCESS,CHUNK,EMBED,SEARCH,RANK,GENERATE process
    class S3_ORIG,S3_PROC,VECTOR,META storage
    class BEDROCK_EMBED,BEDROCK_LLM ai
```

### 6.5 開発・運用環境

- **環境分離**: dev, staging, prod
- **CI/CD**: AWS CDK
- **コンテナ化**: Docker
- **Infrastructure as Code**: AWS CDK 2.200.1+

## 7. 技術スタック

### 7.1 Advanced RAG

- **LangChain**: RAGフレームワーク
- **FastAPI**: Webフレームワーク
- **boto3**: AWS SDK
- **Docling**: 文書処理
- **Mangum**: ASGI-Lambda アダプター

### 7.2 開発環境

- **Node.js**: 20+
- **TypeScript**: 5.3.3
- **パッケージマネージャー**: Yarn

### 7.3 開発ツール

- **プロジェクト管理**: Projen 0.77.5
- **バンドラー**: ESBuild 0.19.8
- **コンテナ**: Docker, Docker Compose 3.8

### 7.4 AWS Services

- API Gateway, Lambda, ECR, DynamoDB, S3, Bedrock, Cognito, Secrets Manager, Step Functions, CloudWatch

### 7.5 CI/CD

- **AWS CDK**: Infrastructure as Code

## 8. エラーハンドリング・例外処理

### 8.1 エラー分類

#### 8.1.1 システムエラー（5xx系）

- **500 Internal Server Error**
  - 未処理の例外
  - システム内部エラー
  - 設定エラー

- **502 Bad Gateway**
  - 外部サービス（Bedrock、Pinecone等）の応答エラー
  - Lambda関数のタイムアウト

- **503 Service Unavailable**
  - システムメンテナンス中
  - リソース不足による一時的な利用不可

- **504 Gateway Timeout**
  - Step Function実行タイムアウト
  - 外部API呼び出しタイムアウト

#### 8.1.2 クライアントエラー（4xx系）

- **400 Bad Request**
  - リクエストパラメータ不正
  - JSONフォーマットエラー
  - 必須パラメータ不足

- **401 Unauthorized**
  - 認証トークン不正・期限切れ
  - 認証情報不足

- **403 Forbidden**
  - 権限不足
  - リソースアクセス権限なし

- **404 Not Found**
  - リソースが存在しない
  - エンドポイント不正

- **413 Payload Too Large**
  - ファイルサイズ制限超過（10MB）
  - リクエストサイズ制限超過

- **429 Too Many Requests**
  - API呼び出し制限超過（1000リクエスト/時間）
  - レート制限適用

#### 8.1.3 ビジネスロジックエラー

- **RAG_001**: ドキュメント処理エラー
  - ファイル形式未対応
  - ファイル破損
  - テキスト抽出失敗

- **RAG_002**: 検索処理エラー
  - ベクトルデータベース接続エラー
  - 検索結果0件
  - 検索クエリ不正

- **RAG_003**: 埋め込み生成エラー
  - Embedding API エラー
  - トークン制限超過

- **RAG_004**: 回答生成エラー
  - LLM API エラー
  - コンテキスト長制限超過

## 9. 今後の拡張予定

### 9.1 GraphQL API

- AppSync (GraphQL) による検索履歴・処理履歴アクセス機能の追加
- DynamoDBの検索機能拡張
