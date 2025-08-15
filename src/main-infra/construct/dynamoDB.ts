import { Construct } from "constructs";
import { Table, AttributeType, StreamViewType } from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";
import { DYNAMODB_CONFIG, DocumentTableProps, ChatSessionTableProps, ProcessingHistoryTableProps, PromptTableProps, UserSessionTableProps, SandboxTestTableProps, CategoryTableProps, AlertSettingTableProps } from "../../shared/enviroment/dynamodb-config";

/**
 * ドキュメント管理用DynamoDBテーブルを管理するConstruct
 * ファイルメタデータ、処理状況、ベクトルDB連携情報を格納
 */
export class DocumentTableConstruct extends Construct {
    public readonly table: Table;

    constructor(scope: Construct, id: string, props: DocumentTableProps) {
        super(scope, id);

        const tableName = props.tableName ?? 
            `${DYNAMODB_CONFIG.TABLES.DOCUMENTS}-${props.environment}`;

        this.table = new Table(this, "DocumentTable", {
            tableName,
            
            // パーティションキー: documentId (UUID)
            partitionKey: { 
                name: 'documentId', 
                type: AttributeType.STRING 
            },
            
            // DynamoDB設定
            billingMode: DYNAMODB_CONFIG.DEFAULTS.BILLING_MODE,
            encryption: DYNAMODB_CONFIG.DEFAULTS.ENCRYPTION,
            
            // バックアップ設定
            pointInTimeRecovery: props.enableBackup ?? DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,
            
            // ストリーム設定（変更通知用）
            stream: props.enableStreaming ? StreamViewType.NEW_AND_OLD_IMAGES : undefined,
            
            // TTL設定（一時ファイル自動削除用）
            timeToLiveAttribute: props.enableTtl !== false ? 'ttl' : undefined,
            
            // 削除ポリシー（本番環境では RETAIN を推奨）
            removalPolicy: RemovalPolicy.DESTROY, // 開発環境用
        });

        // GSI1: ステータス別検索用
        this.table.addGlobalSecondaryIndex({
            indexName: 'StatusIndex',
            partitionKey: { name: 'status', type: AttributeType.STRING },
            sortKey: { name: 'uploadedAt', type: AttributeType.STRING },
        });

        // GSI2: アップロード者別検索用
        this.table.addGlobalSecondaryIndex({
            indexName: 'UploaderIndex',
            partitionKey: { name: 'uploadedBy', type: AttributeType.STRING },
            sortKey: { name: 'uploadedAt', type: AttributeType.STRING },
        });

        // GSI3: カテゴリ別検索用
        this.table.addGlobalSecondaryIndex({
            indexName: 'CategoryIndex',
            partitionKey: { name: 'category', type: AttributeType.STRING },
            sortKey: { name: 'uploadedAt', type: AttributeType.STRING },
        });
    }
}
export class ChatSessionTableConstruct extends Construct {
    public readonly table: Table;

    constructor(scope: Construct, id: string, props: ChatSessionTableProps) {
        super(scope, id);

        const tableName = props.tableName ?? 
            `${DYNAMODB_CONFIG.TABLES.CHAT_SESSIONS}-${props.environment}`;

        this.table = new Table(this, "ChatSessionTable", {
            tableName,

            // パーティションキー: sessionId (UUID)
            partitionKey: { name: 'sessionId', type: AttributeType.STRING },

            // ソートキー: messageIndex (数値)
            sortKey: { name: 'messageIndex', type: AttributeType.NUMBER },

            // DynamoDB設定
            billingMode: DYNAMODB_CONFIG.DEFAULTS.BILLING_MODE,
            encryption: DYNAMODB_CONFIG.DEFAULTS.ENCRYPTION,

            // バックアップ設定
            pointInTimeRecovery: props.enableBackup ?? DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,

            // ストリーム設定（変更通知用）
            stream: props.enableStreaming ? StreamViewType.NEW_AND_OLD_IMAGES : undefined,

            // TTL設定（自動削除用）
            timeToLiveAttribute: props.enableTtl !== false ? 'ttl' : undefined,

            // 削除ポリシー（本番環境では RETAIN を推奨）
            removalPolicy: RemovalPolicy.DESTROY,
        });

        // GSI1: userId-timestamp-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'UserIdIndex',
            partitionKey: { name: 'userId', type: AttributeType.STRING },
            sortKey: { name: 'timestamp', type: AttributeType.STRING },
        });

        // GSI2: sessionId-timestamp-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'SessionIdIndex',
            partitionKey: { name: 'sessionId', type: AttributeType.STRING },
            sortKey: { name: 'timestamp', type: AttributeType.STRING },
        });
    }
}

export class ProcessingHistoryTableConstruct extends Construct {
    public readonly table: Table;

    constructor(scope: Construct, id: string, props: ProcessingHistoryTableProps) {
        super(scope, id);

        const tableName = props.tableName ?? 
            `${DYNAMODB_CONFIG.TABLES.PROCESSING_HISTORY}-${props.environment}`;

        this.table = new Table(this, "ProcessingHistoryTable", {
            tableName,

            // パーティションキー: executionId (Step Function実行ID)
            partitionKey: { name: 'executionId', type: AttributeType.STRING },

            // DynamoDB設定
            billingMode: DYNAMODB_CONFIG.DEFAULTS.BILLING_MODE,
            encryption: DYNAMODB_CONFIG.DEFAULTS.ENCRYPTION,

            // バックアップ設定
            pointInTimeRecovery: props.enableBackup ?? DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,

            // ストリーム設定（変更通知用）
            stream: props.enableStreaming ? StreamViewType.NEW_AND_OLD_IMAGES : undefined,

            // TTL設定（自動削除用）
            timeToLiveAttribute: props.enableTtl !== false ? 'ttl' : undefined,

            // 削除ポリシー（本番環境では RETAIN を推奨）
            removalPolicy: RemovalPolicy.DESTROY,
        });

        // GSI1: userId-createdAt-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'UserIdIndex',
            partitionKey: { name: 'userId', type: AttributeType.STRING },
            sortKey: { name: 'createdAt', type: AttributeType.STRING },
        });

        // GSI2: sessionId-createdAt-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'SessionIdIndex',
            partitionKey: { name: 'sessionId', type: AttributeType.STRING },
            sortKey: { name: 'createdAt', type: AttributeType.STRING },
        });
    }
}

export class PromptTableConstruct extends Construct {
    public readonly table: Table;

    constructor(scope: Construct, id: string, props: PromptTableProps) {
        super(scope, id);

        const tableName = props.tableName ?? 
            `${DYNAMODB_CONFIG.TABLES.PROMPTS}-${props.environment}`;

        this.table = new Table(this, "PromptTable", {
            tableName,

            // パーティションキー: promptKey (プロンプト識別子)
            partitionKey: { name: 'promptKey', type: AttributeType.STRING },

            // ソートキー: version (バージョン番号)
            sortKey: { name: 'version', type: AttributeType.NUMBER },

            // DynamoDB設定
            billingMode: DYNAMODB_CONFIG.DEFAULTS.BILLING_MODE,
            encryption: DYNAMODB_CONFIG.DEFAULTS.ENCRYPTION,

            // バックアップ設定
            pointInTimeRecovery: props.enableBackup ?? DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,
        });

            // GSI1: category-isActive-index
            this.table.addGlobalSecondaryIndex({
                indexName: 'CategoryIndex',
                partitionKey: { name: 'category', type: AttributeType.STRING },
                sortKey: { name: 'isActive', type: AttributeType.NUMBER },
            });
    }
}

export class UserSessionTableConstruct extends Construct {
    public readonly table: Table;

    constructor(scope: Construct, id: string, props: UserSessionTableProps) {
        super(scope, id);

        const tableName = props.tableName ?? 
            `${DYNAMODB_CONFIG.TABLES.USER_SESSION}-${props.environment}`;

        this.table = new Table(this, "UserSessionTable", {
            tableName,

            // パーティションキー: userId (ユーザーID)
            partitionKey: { name: 'userId', type: AttributeType.STRING },

            // ソートキー: sessionId (セッションID)
            sortKey: { name: 'sessionId', type: AttributeType.STRING },

            // DynamoDB設定
            billingMode: DYNAMODB_CONFIG.DEFAULTS.BILLING_MODE,
            encryption: DYNAMODB_CONFIG.DEFAULTS.ENCRYPTION,

            // バックアップ設定
            pointInTimeRecovery: props.enableBackup ?? DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,

            // ストリーム設定（変更通知用）
            stream: props.enableStreaming ? StreamViewType.NEW_AND_OLD_IMAGES : undefined,

            // TTL設定（自動削除用）
            timeToLiveAttribute: props.enableTtl !== false ? 'ttl' : undefined,

            // 削除ポリシー（本番環境では RETAIN を推奨）
            removalPolicy: RemovalPolicy.DESTROY,
        });

        // GSI1: sessionId-index (セッションID逆引き)
        this.table.addGlobalSecondaryIndex({
            indexName: 'SessionIdIndex',
            partitionKey: { name: 'sessionId', type: AttributeType.STRING },
            sortKey: { name: 'lastAccessedAt', type: AttributeType.STRING },
        });
    }
}

export class SandboxTestTableConstruct extends Construct {
    public readonly table: Table;

    constructor(scope: Construct, id: string, props: SandboxTestTableProps) {
        super(scope, id);

        const tableName = props.tableName ?? 
            `${DYNAMODB_CONFIG.TABLES.SANDBOX_TESTS}-${props.environment}`;

        this.table = new Table(this, "SandboxTestTable", {
            tableName,

            // パーティションキー: testId (UUID)
            partitionKey: { name: 'testId', type: AttributeType.STRING },

            // DynamoDB設定
            billingMode: DYNAMODB_CONFIG.DEFAULTS.BILLING_MODE,
            encryption: DYNAMODB_CONFIG.DEFAULTS.ENCRYPTION,

            // バックアップ設定
            pointInTimeRecovery: props.enableBackup ?? DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,

            // ストリーム設定（変更通知用）
            stream: props.enableStreaming ? StreamViewType.NEW_AND_OLD_IMAGES : undefined,

            // TTL設定（自動削除用）
            timeToLiveAttribute: props.enableTtl !== false ? 'ttl' : undefined,

            // 削除ポリシー（本番環境では RETAIN を推奨）
            removalPolicy: RemovalPolicy.DESTROY,
        });

        // GSI1: userId-createdAt-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'UserIdIndex',
            partitionKey: { name: 'userId', type: AttributeType.STRING },
            sortKey: { name: 'createdAt', type: AttributeType.STRING },
        });

        // GSI2: promptId-createdAt-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'PromptIdIndex',
            partitionKey: { name: 'promptId', type: AttributeType.STRING },
            sortKey: { name: 'createdAt', type: AttributeType.STRING },
        });

        // checkType-createdAt-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'CheckTypeIndex',
            partitionKey: { name: 'checkType', type: AttributeType.STRING },
            sortKey: { name: 'createdAt', type: AttributeType.STRING },
        });
    }
}

export class CategoryTableConstruct extends Construct {
    public readonly table: Table;

    constructor(scope: Construct, id: string, props: CategoryTableProps) {
        super(scope, id);

        const tableName = props.tableName ?? 
            `${DYNAMODB_CONFIG.TABLES.CATEGORIES}-${props.environment}`;

        this.table = new Table(this, "CategoryTable", {
            tableName,

            // パーティションキー: categoryId (UUID)
            partitionKey: { name: 'categoryId', type: AttributeType.STRING },

            // DynamoDB設定
            billingMode: DYNAMODB_CONFIG.DEFAULTS.BILLING_MODE,
            encryption: DYNAMODB_CONFIG.DEFAULTS.ENCRYPTION,

            // バックアップ設定
            pointInTimeRecovery: props.enableBackup ?? DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,

            // ストリーム設定（変更通知用）
            stream: props.enableStreaming ? StreamViewType.NEW_AND_OLD_IMAGES : undefined,

            // TTL設定（自動削除用）
            timeToLiveAttribute: props.enableTtl !== false ? 'ttl' : undefined,

            // 削除ポリシー（本番環境では RETAIN を推奨）
            removalPolicy: RemovalPolicy.DESTROY,
        });
        // GSI1: name-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'NameIndex',
            partitionKey: { name: 'name', type: AttributeType.STRING },
            sortKey: { name: 'createdAt', type: AttributeType.STRING },
        });

        // GSI2: parentCategoryId-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'ParentCategoryIdIndex',
            partitionKey: { name: 'parentCategoryId', type: AttributeType.STRING },
            sortKey: { name: 'createdAt', type: AttributeType.STRING },
        });

        // GSI3: isActive-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'IsActiveIndex',
            partitionKey: { name: 'isActive', type: AttributeType.NUMBER },
            sortKey: { name: 'createdAt', type: AttributeType.STRING },
        });
    }
}

export class AlertSettingTableConstruct extends Construct {
    public readonly table: Table;

    constructor(scope: Construct, id: string, props: AlertSettingTableProps) {
        super(scope, id);

        const tableName = props.tableName ?? 
            `${DYNAMODB_CONFIG.TABLES.ALERT_SETTINGS}-${props.environment}`;

        this.table = new Table(this, "AlertSettingTable", {
            tableName,

            // パーティションキー: alertId (UUID)
            partitionKey: { name: 'alertId', type: AttributeType.STRING },

            // DynamoDB設定
            billingMode: DYNAMODB_CONFIG.DEFAULTS.BILLING_MODE,
            encryption: DYNAMODB_CONFIG.DEFAULTS.ENCRYPTION,

            // バックアップ設定
            pointInTimeRecovery: props.enableBackup ?? DYNAMODB_CONFIG.DEFAULTS.ENABLE_BACKUP,

            // ストリーム設定（変更通知用）
            stream: props.enableStreaming ? StreamViewType.NEW_AND_OLD_IMAGES : undefined,

            // TTL設定（自動削除用）
            timeToLiveAttribute: props.enableTtl !== false ? 'ttl' : undefined,

            // 削除ポリシー（本番環境では RETAIN を推奨）
            removalPolicy: RemovalPolicy.DESTROY,
        });

        // GSI1: alertType-isActive-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'AlertTypeIndex',
            partitionKey: { name: 'alertType', type: AttributeType.STRING },
            sortKey: { name: 'isActive', type: AttributeType.NUMBER },
        });

        // GSI2:isActive-createdAt-index
        this.table.addGlobalSecondaryIndex({
            indexName: 'IsActiveIndex',
            partitionKey: { name: 'isActive', type: AttributeType.NUMBER },
            sortKey: { name: 'createdAt', type: AttributeType.STRING },
        });
    }
}