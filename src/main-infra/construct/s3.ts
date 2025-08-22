import { Duration, RemovalPolicy, StackProps } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export interface S3BucketsConstructProps extends StackProps {
    readonly environment: string;
  }

export class S3BucketsConstruct extends Construct {
    public readonly documentsBucket: s3.Bucket;
    public readonly temporaryBucket: s3.Bucket;
    public readonly documentsBucketPolicy: s3.BucketPolicy;

    constructor(scope: Construct, id: string, props?: S3BucketsConstructProps) {
        super(scope, id);

        // Documents バケット（文書原本保管）
        this.documentsBucket = new s3.Bucket(this, "DocumentsBucket", {
            bucketName: `advanced-rag-documents-${props?.environment}`,
            encryption: s3.BucketEncryption.S3_MANAGED, // SSE-S3暗号化
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // プライベートバケット
            versioned: true, // バージョニング有効（誤削除防止）
            removalPolicy: RemovalPolicy.RETAIN, // 削除保護（本番環境での誤削除防止）
            lifecycleRules: [
                {
                    id: 'DocumentLifecyclePolicy',
                    enabled: true,
                    transitions: [
                        {
                            // 0日後にIntelligent-Tieringへ移行（全て）
                            storageClass: s3.StorageClass.INTELLIGENT_TIERING,
                            transitionAfter: Duration.days(0),
                        },
                    ],
                },
            ],
        });

        // バケットポリシーによる制限を追加
        this.documentsBucketPolicy = new s3.BucketPolicy(this, "DocumentsBucketPolicy", {
            bucket: this.documentsBucket,
        });

        // バケットポリシーでIAMロールベースアクセスのみを許可
        this.documentsBucketPolicy.document.addStatements(
            new iam.PolicyStatement({
                effect: iam.Effect.DENY,
                principals: [new iam.AnyPrincipal()],
                actions: ["s3:*"], // すべてのアクション
                resources: [
                    this.documentsBucket.bucketArn, // バケットARN
                    `${this.documentsBucket.bucketArn}/*` // バケット内のすべてのオブジェクト
                ],
                conditions: { // 条件を追加
                    StringNotEquals: {
                        "aws:PrincipalType": "AssumedRole" // IAMロールのみ除外
                    }
                }
            })
        );


        // Temporary バケット（一時ファイル保管）
        this.temporaryBucket = new s3.Bucket(this, "TemporaryBucket", {
            bucketName: `advanced-rag-temporary-${props?.environment}`,
            encryption: s3.BucketEncryption.S3_MANAGED, // SSE-S3暗号化
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // プライベートバケット
            versioned: false, // 一時ファイルなのでバージョニング不要
            removalPolicy: RemovalPolicy.DESTROY, // 開発環境では削除可能
            lifecycleRules: [
                {
                    id: "DeleteUploadsAfter24Hours",
                    enabled: true,
                    expiration: Duration.days(1), // 24時間後に削除
                    prefix: "uploads/", // uploads/で始まるオブジェクトのみ対象
                },
                {
                    id: "DeleteProcessingAfter7Days",
                    enabled: true,
                    expiration: Duration.days(7), // 7日後に削除
                    prefix: "processing/", // processing/で始まるオブジェクトのみ対象
                },
                {
                    id: "DeleteChunksAfter30Days",
                    enabled: true,
                    expiration: Duration.days(30), // 30日後に削除
                    prefix: "chunks/", // chunks/で始まるオブジェクトのみ対象
                }
            ]
        });

        // バケットの作成完了をログ出力
        console.log(`Created Documents Bucket: ${this.documentsBucket.bucketName}`);
        console.log(`Created Temporary Bucket: ${this.temporaryBucket.bucketName}`);
    }
}
