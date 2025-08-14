export const API_GATEWAY_NAME = "sony-sonpo-api";

export const CDK_DEFAULT_ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT;
export const CDK_DEFAULT_REGION = process.env.CDK_DEFAULT_REGION;

export const REPOSITORY_NAME = "sony-sonpo-rag";
export const LAMBDA_FUNCTION_NAME = "sony-sonpo-rag-lambda";
export const LAMBDA_HANDLER = "src.api.main.handler";

// 環境設定
export const ENVIRONMENT = process.env.ENV || "dev";

// S3バケット名の生成関数
export const getS3BucketName = (baseName: string) => 
    `advanced-rag-${baseName}-${ENVIRONMENT}`;