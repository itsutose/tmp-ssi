import { BillingMode, TableEncryption } from "aws-cdk-lib/aws-dynamodb";

// DynamoDB専用設定
export const DYNAMODB_CONFIG = {
  // テーブル名定義
  TABLES: {
    DOCUMENTS: 'sony-sonpo-documents',
    CHAT_SESSIONS: 'sony-sonpo-chat-sessions',
    PROCESSING_HISTORY: 'sony-sonpo-processing-history',
    PROMPTS: 'sony-sonpo-prompts',
    USER_SESSION: 'sony-sonpo-user-session',
    SANDBOX_TESTS: 'sony-sonpo-sandbox-tests',
    CATEGORIES: 'sony-sonpo-categories',
    ALERT_SETTINGS: 'sony-sonpo-alert-settings',
  } as const,
  
  // デフォルト設定
  DEFAULTS: {
    BILLING_MODE: BillingMode.PAY_PER_REQUEST,
    ENCRYPTION: TableEncryption.AWS_MANAGED,
    ENABLE_BACKUP: true,
    ENABLE_TTL: false,
    ENABLE_STREAMING: false,
  },

} as const;

// DynamoDB関連の型定義
export interface BaseTableProps {
  readonly environment: string;
  readonly tableName?: string;
  readonly enableTtl?: boolean;
  readonly enableBackup?: boolean;
  readonly enableStreaming?: boolean;
  readonly ttlDays?: number;
}

// 各テーブル専用の型定義
export interface DocumentTableProps extends BaseTableProps {}

export interface ChatSessionTableProps extends BaseTableProps {}

export interface ProcessingHistoryTableProps extends BaseTableProps {}

export interface PromptTableProps extends BaseTableProps {}

export interface UserSessionTableProps extends BaseTableProps {}

export interface SandboxTestTableProps extends BaseTableProps {}

export interface CategoryTableProps extends BaseTableProps {}

export interface AlertSettingTableProps extends BaseTableProps {}

// データ構造の型定義
export interface DocumentRecord {
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

export interface ChatSessionRecord {
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


export interface ProcessingHistoryRecord {
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

export interface PromptRecord {
  promptKey: string;          // PK: プロンプト識別子
  version: number;            // SK: バージョン番号
  name: string;               // プロンプト名
  description: string;        // 説明
  content: string;            // プロンプト内容
  category: string;           // search, compliance, terms, notation
  isActive: number;          // アクティブフラグ
  createdBy: string;          // 作成者
  createdAt: string;
  updatedAt: string;
}

export interface UserSessionRecord {
  userId: string;             // PK: ユーザーID
  sessionId: string;          // SK: セッションID
  sessionName?: string;       // セッション名
  lastAccessedAt: string;     // 最終アクセス
  isActive: boolean;          // アクティブフラグ
  createdAt: string;
  ttl: number;               // 30日後自動削除
}

export interface SandboxTestRecord {
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

export interface CategoryRecord {
  categoryId: string;         // PK: UUID
  name: string;               // カテゴリ名
  displayName: string;        // 表示名
  description: string;        // カテゴリ説明
  s3Prefix: string;           // S3保存プレフィックス
  color?: string;             // UI表示色
  icon?: string;              // アイコン名
  parentCategoryId?: string;  // 親カテゴリ（階層構造用）
  isActive: number;          // アクティブフラグ
  documentCount: number;      // 所属文書数
  createdBy: string;          // 作成者
  createdAt: string;
  updatedAt: string;
}

export interface AlertSettingRecord {
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
  isActive: number;          // アクティブフラグ
}