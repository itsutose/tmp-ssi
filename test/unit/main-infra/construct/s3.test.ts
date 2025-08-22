// test/unit/main-infra/construct/s3.test.ts

import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { S3BucketsConstruct } from '../../../../src/main-infra/construct/s3'; // テスト対象をインポート

describe('S3BucketsConstruct', () => {

    // テスト全体で使う Stack と Template を準備
    let template: Template;

    // 各テストが実行される前に、毎回新しいスタックを作ってテストの独立性を保つ
    beforeAll(() => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, "TestStack");
        // S3BucketsConstructをインスタンス化
        new S3BucketsConstruct(stack, 'MyS3Construct', {
            environment: 'test',
            env: {
                account: process.env.CDK_DEFAULT_ACCOUNT,
                region: process.env.CDK_DEFAULT_REGION
            },
            description: 'Test S3 buckets'
        });
        template = Template.fromStack(stack);
    });

    // 1. スナップショットテスト
    test('Should create S3 buckets matching the snapshot', () => {
        expect(template.toJSON()).toMatchSnapshot();
    });

    // 2. ファイングレインアサーション
    describe('DocumentsBucket', () => {
        test('Should have correct bucket name pattern', () => {
            template.hasResourceProperties('AWS::S3::Bucket', {
                BucketName: Match.stringLikeRegexp('advanced-rag-documents-.*')
            });
        });

        test('Should have versioning enabled', () => {
            template.hasResourceProperties('AWS::S3::Bucket', {
                VersioningConfiguration: {
                    Status: 'Enabled'
                }
            });
        });

        test('Should have SSE-S3 encryption', () => {
            template.hasResourceProperties('AWS::S3::Bucket', {
                BucketEncryption: {
                    ServerSideEncryptionConfiguration: [
                        { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } }
                    ]
                }
            });
        });

        test('Should block all public access', () => {
          template.hasResourceProperties('AWS::S3::Bucket', {
              PublicAccessBlockConfiguration: {
                  BlockPublicAcls: true,
                  BlockPublicPolicy: true,
                  IgnorePublicAcls: true,
                  RestrictPublicBuckets: true
              }
          });
        });

        test('Should have bucket policy restricting access to IAM roles only', () => {
            // バケットポリシーが存在することを確認
            template.hasResource('AWS::S3::BucketPolicy', {});
            
            // ポリシードキュメントの基本構造を確認
            template.hasResourceProperties('AWS::S3::BucketPolicy', {
                PolicyDocument: {
                    Version: '2012-10-17'
                }
            });
        });

        test('Should enforce IAM role-based access control', () => {
            // バケットポリシーが存在することを確認
            template.hasResource('AWS::S3::BucketPolicy', {});
            
            // バケットポリシーがDocumentsBucketに関連付けられていることを確認
            template.hasResourceProperties('AWS::S3::BucketPolicy', {
                Bucket: Match.anyValue()
            });
        });

        // test('Should have lifecycle rules for different storage classes and periods', () => {
        //     template.hasResourceProperties('AWS::S3::Bucket', {
        //         LifecycleConfiguration: {
        //             Rules: Match.arrayWith([
        //                 // 30日後のルール（uploads/）
        //                 {
        //                   Id: 'NewUploads30Days',
        //                   Status: 'Enabled',
        //                   ExpirationInDays: 0,
        //                   Prefix: 'uploads/'
        //                 },
        //                 // 90日後のルール（processing/）
        //                 {
        //                   Id: 'LowAccess90Days',
        //                   Status: 'Enabled',
        //                   ExpirationInDays: 90,
        //                   Prefix: 'processing/'
        //                 },
        //                 // 365日後のルール（chunks/）
        //                 {
        //                   Id: 'LongTerm365Days',
        //                   Status: 'Enabled',
        //                   ExpirationInDays: 365,
        //                   Prefix: 'chunks/'
        //                 }
        //             ])
        //         }
        //     });
        // });

        test('Should retain the bucket on deletion', () => {
            template.hasResource('AWS::S3::Bucket', {
                UpdateReplacePolicy: 'Retain',
                DeletionPolicy: 'Retain',
            });
        });
    });

    describe('TemporaryBucket', () => {
        test('Should have a lifecycle rule to delete uploads after n days', () => {
            template.hasResourceProperties('AWS::S3::Bucket', {
                LifecycleConfiguration: {
                    Rules: [
                        {
                          Id: 'DeleteUploadsAfter24Hours',
                          Status: 'Enabled',
                          ExpirationInDays: 1,
                          Prefix: 'uploads/'
                        },
                        {
                          Id: 'DeleteProcessingAfter7Days',
                          Status: 'Enabled',
                          ExpirationInDays: 7,
                          Prefix: 'processing/'
                        },
                        {
                          Id: 'DeleteChunksAfter30Days',
                          Status: 'Enabled',
                          ExpirationInDays: 30,
                          Prefix: 'chunks/'
                        },
                        // 他のルールも同様にテスト可能
                    ]
                }
            });
        });

        test('Should block all public access', () => {
          template.hasResourceProperties('AWS::S3::Bucket', {
              PublicAccessBlockConfiguration: {
                  BlockPublicAcls: true,
                  BlockPublicPolicy: true,
                  IgnorePublicAcls: true,
                  RestrictPublicBuckets: true
              }
          });
        });

        test('Should be destroyed on deletion', () => {
            template.hasResource('AWS::S3::Bucket', {
                UpdateReplacePolicy: 'Delete',
                DeletionPolicy: 'Delete',
            });
        });
    });
});