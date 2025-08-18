import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { S3BucketsConstruct } from "../construct/s3";

export class S3Stack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // S3バケットのみのテスト用スタック
        const s3Buckets = new S3BucketsConstruct(this, "S3BucketsConstruct");

        // スタック出力（CI/CDで使用）
        this.exportValue(s3Buckets.documentsBucket.bucketName, {
            name: "TestDocumentsBucketName"
        });
        this.exportValue(s3Buckets.temporaryBucket.bucketName, {
            name: "TestTemporaryBucketName"
        });
    }
}
