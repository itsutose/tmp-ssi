import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { DYNAMODB_CONFIG } from "../../shared/enviroment/dynamodb-config";
import { DocumentTableConstruct, ChatSessionTableConstruct, ProcessingHistoryTableConstruct, PromptTableConstruct, UserSessionTableConstruct, SandboxTestTableConstruct, CategoryTableConstruct, AlertSettingTableConstruct } from "../construct/dynamoDB";

export interface DataStackProps extends StackProps {
  readonly environment: string;
}

/**
 * データストレージ専用スタック
 * DynamoDBテーブル群を管理
 */
export class DataStack extends Stack {
  public readonly documentTable: DocumentTableConstruct;
  public readonly chatSessionTable: ChatSessionTableConstruct;
  public readonly processingHistoryTable: ProcessingHistoryTableConstruct;
  public readonly promptTable: PromptTableConstruct;
  public readonly userSessionTable: UserSessionTableConstruct;
  public readonly sandboxTestTable: SandboxTestTableConstruct;
  public readonly categoryTable: CategoryTableConstruct;
  public readonly alertSettingTable: AlertSettingTableConstruct;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // ドキュメントテーブル
    this.documentTable = new DocumentTableConstruct(this, "DocumentTable", {
      environment: props.environment,
      tableName: `${DYNAMODB_CONFIG.TABLES.DOCUMENTS}-${props.environment}`,
      enableBackup: DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,
      enableTtl: false,
      enableStreaming: DYNAMODB_CONFIG.DEFAULTS.ENABLE_STREAMING,
    });

    // チャットセッションテーブル
    this.chatSessionTable = new ChatSessionTableConstruct(this, "ChatSessionTable", {
      environment: props.environment,
      tableName: `${DYNAMODB_CONFIG.TABLES.CHAT_SESSIONS}-${props.environment}`,
      enableBackup: DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,
      enableTtl:true,
      enableStreaming: DYNAMODB_CONFIG.DEFAULTS.ENABLE_STREAMING,
    });

    // 処理履歴テーブル
    this.processingHistoryTable = new ProcessingHistoryTableConstruct(this, "ProcessingHistoryTable", {
      environment: props.environment,
      tableName: `${DYNAMODB_CONFIG.TABLES.PROCESSING_HISTORY}-${props.environment}`,
      enableBackup: DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,
      enableTtl: true,
      enableStreaming: DYNAMODB_CONFIG.DEFAULTS.ENABLE_STREAMING,
    });

    // プロンプトテーブル
    this.promptTable = new PromptTableConstruct(this, "PromptTable", {
      environment: props.environment,
      tableName: `${DYNAMODB_CONFIG.TABLES.PROMPTS}-${props.environment}`,
      enableBackup: DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,
      enableTtl: false,
      enableStreaming: DYNAMODB_CONFIG.DEFAULTS.ENABLE_STREAMING,
    });

    // ユーザーセッションテーブル
    this.userSessionTable = new UserSessionTableConstruct(this, "UserSessionTable", {
      environment: props.environment,
      tableName: `${DYNAMODB_CONFIG.TABLES.USER_SESSION}-${props.environment}`,
      enableBackup: DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,
      enableTtl: true,
      enableStreaming: DYNAMODB_CONFIG.DEFAULTS.ENABLE_STREAMING,
    });

    // サンドボックステストテーブル
    this.sandboxTestTable = new SandboxTestTableConstruct(this, "SandboxTestTable", {
      environment: props.environment,
      tableName: `${DYNAMODB_CONFIG.TABLES.SANDBOX_TESTS}-${props.environment}`,
      enableBackup: DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,
      enableTtl: true,
      enableStreaming: DYNAMODB_CONFIG.DEFAULTS.ENABLE_STREAMING,
    });

    // カテゴリテーブル
    this.categoryTable = new CategoryTableConstruct(this, "CategoryTable", {
      environment: props.environment,
      tableName: `${DYNAMODB_CONFIG.TABLES.CATEGORIES}-${props.environment}`,
      enableBackup: DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,
      enableTtl: false,
      enableStreaming: DYNAMODB_CONFIG.DEFAULTS.ENABLE_STREAMING,
    });

    // アラート設定テーブル
    this.alertSettingTable = new AlertSettingTableConstruct(this, "AlertSettingTable", {
      environment: props.environment,
      tableName: `${DYNAMODB_CONFIG.TABLES.ALERT_SETTINGS}-${props.environment}`,
      enableBackup: DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,
      enableTtl: false,
      enableStreaming: DYNAMODB_CONFIG.DEFAULTS.ENABLE_STREAMING,
    });

    // タグ付け
    this.addTags(props.environment);
  }

  /**
   * スタックに共通タグを追加
   */
  private addTags(environment: string): void {
    const tags = {
      Project: 'sony-sonpo-rag',
      Environment: environment,
      StackType: 'Data',
      ManagedBy: "AWS CDK",
    };

    Object.entries(tags).forEach(([key, value]) => {
      this.tags.setTag(key, value);
    });
  }
}