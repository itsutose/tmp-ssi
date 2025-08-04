# DynamoDB テーブル定義書

## 概要

Advanced RAGシステムで使用するDynamoDBテーブルの設計定義書です。

## テーブル一覧

1. [Documents テーブル](#1-documents-テーブル) - 文書管理
2. [ChatSessions テーブル](#2-chatsessions-テーブル) - チャットセッション管理
3. [ProcessingHistory テーブル](#3-processinghistory-テーブル) - 処理履歴管理
4. [Prompts テーブル](#4-prompts-テーブル) - プロンプト管理
5. [UserSessions テーブル](#5-usersessions-テーブル) - ユーザーセッション管理
6. [SandboxTests テーブル](#6-sandboxtests-テーブル) - サンドボックステスト管理
7. [Categories テーブル](#7-categories-テーブル) - カテゴリ管理
8. [AlertSettings テーブル](#8-alertsettings-テーブル) - アラート設定管理

## 1. Documents テーブル

### 概要
文書の目録と保管先を管理するテーブル

### キー設計
- **Primary Key**: `documentId` (String)
- **Sort Key**: 不要（単一ドキュメント管理）

### データ構造
```typescript
interface DocumentRecord {
  documentId: string;           // PK: UUID
  fileName: string;            // 元ファイル名
  fileType: string;           // PDF, CSV, TXT
  s3Bucket: string;           // S3バケット名
  s3Key: string;              // S3オブジェクトキー
  uploadedAt: string;         // ISO 8601形式
  uploadedBy: string;         // ユーザーID
  fileSize: number;           // ファイルサイズ（bytes）
  status: string;             // processing, completed, failed
  chunkingStrategy: string;   // チャンキング戦略
  vectorDbId?: string;        // Chroma/Pinecone ID
  metadata: {
    title?: string;
    author?: string;
    category: string;         // 法務文書, 約款, 表記, 一般
    tags: string[];
  };
  createdAt: string;
  updatedAt: string;
  ttl?: number;              // 自動削除用（一時ファイル）
}
```

### インデックス
- **GSI**: `category-uploadedAt-index` - カテゴリ別文書検索
- **GSI**: `uploadedBy-uploadedAt-index` - ユーザー別文書検索

### 使用用途
- 文書アップロード時のメタデータ登録
- カテゴリ別文書検索
- ユーザー別アップロード履歴

## 2. ChatSessions テーブル

### 概要
チャット機能でのメッセージと会話履歴を管理

### キー設計
- **Primary Key**: `sessionId` (String)
- **Sort Key**: `messageIndex` (Number)

### データ構造
```typescript
interface ChatSessionRecord {
  sessionId: string;          // PK: UUID
  messageIndex: number;       // SK: メッセージ順序
  userId: string;             // ユーザーID
  messageType: string;        // user, assistant, system
  content: string;            // メッセージ内容
  timestamp: string;          // ISO 8601形式
  metadata?: {
    queryType?: string;       // search, compliance, terms, notation
    processingTime?: number;
    stepFunctionExecutionArn?: string;
  };
  ttl: number;               // 30日後自動削除
}
```

### インデックス
- **GSI**: `userId-timestamp-index` - ユーザー別セッション検索
- **GSI**: `sessionId-timestamp-index` - セッション内メッセージ検索

### 使用用途
- チャット履歴の保存・取得
- セッション管理
- コンテキストの継続

## 3. ProcessingHistory テーブル

### 概要
Step Function実行結果と処理履歴を管理

### キー設計
- **Primary Key**: `executionId` (String)
- **Sort Key**: 不要

### データ構造
```typescript
interface ProcessingHistoryRecord {
  executionId: string;        // PK: Step Function実行ID
  userId: string;             // ユーザーID
  sessionId?: string;         // 関連セッション
  queryType: string;          // search, compliance, terms, notation
  inputQuery: string;         // 入力クエリ
  status: string;             // started, processing, completed, failed
  result?: {
    searchResults?: any[];
    complianceIssues?: any[];
    response: string;
    confidence?: number;
    sources: string[];        // 参照ドキュメントID
  };
  metrics: {
    startTime: string;
    endTime?: string;
    processingTimeMs?: number;
    tokensUsed?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  createdAt: string;
  ttl: number;               // 2年後自動削除（Bedrock履歴）
}
```

### インデックス
- **GSI**: `userId-createdAt-index` - ユーザー別履歴検索
- **GSI**: `queryType-createdAt-index` - 機能別履歴検索

### 使用用途
- Step Function完了時の結果保存
- 処理履歴の検索・参照
- AppSync (GraphQL) でのアクセス

## 4. Prompts テーブル

### 概要
プロンプトの管理とバージョニング

### キー設計
- **Primary Key**: `promptKey` (String)
- **Sort Key**: `version` (Number)

### データ構造
```typescript
interface PromptRecord {
  promptKey: string;          // PK: プロンプト識別子
  version: number;            // SK: バージョン番号
  name: string;               // プロンプト名
  description: string;        // 説明
  content: string;            // プロンプト内容
  category: string;           // search, compliance, terms, notation
  isActive: boolean;          // アクティブフラグ
  createdBy: string;          // 作成者
  createdAt: string;
  updatedAt: string;
}
```

### インデックス
- **GSI**: `category-isActive-index` - カテゴリ別アクティブプロンプト検索

### 使用用途
- プロンプトの作成・編集
- フロントエンドからのプロンプト取得
- バージョン管理

## 5. UserSessions テーブル

### 概要
ユーザーのセッション情報を管理

### キー設計
- **Primary Key**: `userId` (String)
- **Sort Key**: `sessionId` (String)

### データ構造
```typescript
interface UserSessionRecord {
  userId: string;             // PK: ユーザーID
  sessionId: string;          // SK: セッションID
  sessionName?: string;       // セッション名
  lastAccessedAt: string;     // 最終アクセス
  isActive: boolean;          // アクティブフラグ
  createdAt: string;
  ttl: number;               // 30日後自動削除
}
```

### インデックス
- **GSI**: `sessionId-index` - セッションID逆引き

### 使用用途
- ユーザー別セッション管理
- アクティブセッション判定
- セッション一覧表示

## 6. SandboxTests テーブル

### 概要
サンドボックス環境でのプロンプトテスト結果を管理

### キー設計
- **Primary Key**: `testId` (String)
- **Sort Key**: 不要

### データ構造
```typescript
interface SandboxTestRecord {
  testId: string;             // PK: UUID
  userId: string;             // テスト実行者
  promptId: string;           // 使用プロンプトID
  promptVersion: number;      // プロンプトバージョン
  testName: string;           // テスト名
  testDescription?: string;   // テスト説明
  inputDocument: string;      // テスト用文書
  checkType: string;          // compliance, terms, notation
  executionId?: string;       // Step Function実行ID
  status: string;             // running, completed, failed
  result?: {
    checkPoints: any[];       // チェック結果詳細
    summary: {
      totalIssues: number;
      highSeverity: number;
      mediumSeverity: number;
      lowSeverity: number;
    };
    processingTimeMs: number;
    confidence?: number;
  };
  metrics: {
    startTime: string;
    endTime?: string;
    processingTimeMs?: number;
    tokensUsed?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  createdAt: string;
  updatedAt: string;
  ttl?: number;              // 1年後自動削除
}
```

### インデックス
- **GSI**: `userId-createdAt-index` - ユーザー別テスト履歴検索
- **GSI**: `promptId-createdAt-index` - プロンプト別テスト履歴検索
- **GSI**: `checkType-createdAt-index` - チェック種別別テスト履歴検索

### 使用用途
- サンドボックステストの実行結果保存
- テスト履歴の検索・参照
- プロンプト効果の比較分析
- テスト結果のダウンロード機能

## 7. Categories テーブル

### 概要
文書カテゴリの管理とメタデータ

### キー設計
- **Primary Key**: `categoryId` (String)
- **Sort Key**: 不要

### データ構造
```typescript
interface CategoryRecord {
  categoryId: string;         // PK: UUID
  name: string;               // カテゴリ名
  displayName: string;        // 表示名
  description: string;        // カテゴリ説明
  s3Prefix: string;           // S3保存プレフィックス
  color?: string;             // UI表示色
  icon?: string;              // アイコン名
  parentCategoryId?: string;  // 親カテゴリ（階層構造用）
  isActive: boolean;          // アクティブフラグ
  documentCount: number;      // 所属文書数
  createdBy: string;          // 作成者
  createdAt: string;
  updatedAt: string;
}
```

### インデックス
- **GSI**: `name-index` - カテゴリ名検索
- **GSI**: `parentCategoryId-index` - 階層構造検索
- **GSI**: `isActive-createdAt-index` - アクティブカテゴリ一覧

### 使用用途
- 文書カテゴリの作成・編集・削除
- カテゴリ階層の管理
- カテゴリ別文書数の集計
- UI表示用メタデータ管理

## 8. AlertSettings テーブル

### 概要
エラー監視・通知設定を管理

### キー設計
- **Primary Key**: `alertId` (String)
- **Sort Key**: 不要

### データ構造
```typescript
interface AlertSettingRecord {
  alertId: string;            // PK: UUID
  alertName: string;          // アラート名
  alertType: string;          // error_rate, response_time, authentication_failure
  severity: string;           // CRITICAL, HIGH, MEDIUM, LOW
  conditions: {
    threshold: number;        // 閾値
    period: number;           // 監視期間（分）
    evaluationPeriods: number; // 評価期間数
    comparisonOperator: string; // GreaterThanThreshold, LessThanThreshold
  };
  targets: {
    slackChannels: string[];  // 通知先Slackチャンネル
    emailAddresses: string[]; // 通知先メールアドレス
    smsNumbers: string[];     // 通知先SMS番号（CRITICAL のみ）
  };
  schedule: {
    enabled: boolean;         // アラート有効/無効
    quietHours?: {           // 通知停止時間帯
      start: string;         // HH:mm 形式
      end: string;           // HH:mm 形式
      timezone: string;      // タイムゾーン
    };
  };
  escalation?: {
    enabled: boolean;
    steps: {
      delayMinutes: number;   // エスカレーション遅延時間
      targets: string[];      // エスカレーション先
    }[];
  };
  createdBy: string;          // 作成者
  createdAt: string;
  updatedAt: string;
  isActive: boolean;          // アクティブフラグ
}
```

### インデックス
- **GSI**: `alertType-severity-index` - アラート種別・重要度別検索
- **GSI**: `isActive-createdAt-index` - アクティブアラート一覧

### 使用用途
- CloudWatchアラーム設定の管理
- EventBridgeルール設定の管理
- AWS Chatbot通知設定の管理
- エスカレーション設定の管理

## TTL設定

| テーブル | TTL期間 | 対象データ |
|---------|---------|-----------|
| Documents | 24時間 | 一時ファイル（ttl設定時のみ） |
| ChatSessions | 30日 | 全メッセージ |
| ProcessingHistory | 2年（730日） | Bedrock履歴 |
| UserSessions | 30日 | 全セッション |
| Prompts | 無期限 | - |
| SandboxTests | 1年（365日） | 全テスト結果 |
| Categories | 無期限 | - |
| AlertSettings | 無期限 | - |

## アクセスパターン

### 読み取りパターン
1. 文書一覧取得（カテゴリ別、ユーザー別）
2. チャット履歴取得（セッション別）
3. 処理履歴検索（ユーザー別、日付範囲）
4. アクティブプロンプト取得（カテゴリ別）
5. ユーザーセッション一覧
6. サンドボックステスト履歴取得（ユーザー別、プロンプト別）
7. カテゴリ一覧取得（階層構造、アクティブのみ）
8. アラート設定一覧取得（種別別、重要度別）

### 書き込みパターン
1. 文書アップロード時のメタデータ登録
2. チャットメッセージ追加
3. Step Function完了時の結果保存
4. プロンプト作成・更新
5. セッション作成・更新
6. サンドボックステスト実行・結果保存
7. カテゴリ作成・更新・削除
8. 文書カテゴリ変更時のカウント更新
9. アラート設定作成・更新
10. エラー閾値監視・通知トリガー

## パフォーマンス考慮事項

### キャパシティモード
- **開発・テスト環境**: On-Demand
- **本番環境**: Provisioned（予測可能な負荷の場合）

### 最適化ポイント
- GSIを活用した効率的な検索
- TTLによる自動データ削除
- パーティションキーの適切な分散
- ホットパーティションの回避