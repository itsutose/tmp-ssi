import { Duration } from "aws-cdk-lib";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { BillingMode, TableEncryption } from "aws-cdk-lib/aws-dynamodb";

// プロジェクト設定
export const PROJECT_CONFIG = {
  PROJECT_NAME: 'sony-sonpo-rag',
  
  // AWS設定
  AWS: {
    ACCOUNT: process.env.CDK_DEFAULT_ACCOUNT,
    REGION: process.env.CDK_DEFAULT_REGION,
  },
  
  // リソース設定
  RESOURCES: {
    ECR: {
      REPOSITORY_NAME: 'sony-sonpo-rag',
    },
    LAMBDA: {
      // デフォルト設定値
      DEFAULTS: {
        TIMEOUT_MINUTES: 5,
        MEMORY_SIZE: 512,
        ARCHITECTURE: Architecture.ARM_64,
        RUNTIME: Runtime.FROM_IMAGE,
      },
      // 個別関数設定
      FUNCTIONS: {
        RAG_PROCESSOR: {
          FUNCTION_NAME: 'sony-sonpo-rag-processor',
          HANDLER: 'src.api.rag.handler',
          TIMEOUT_MINUTES: 10,
          MEMORY_SIZE: 1024,
        },
      },
    },
    DYNAMODB: {
      TABLES: {
        DOCUMENTS: 'sony-sonpo-documents',
        SESSIONS: 'sony-sonpo-sessions',
      },
      BILLING_MODE: BillingMode.PAY_PER_REQUEST,
      ENCRYPTION: TableEncryption.AWS_MANAGED,
    },
    API_GATEWAY: {
      NAME: 'sony-sonpo-api',
    },
  },
} as const;

// 型定義
export interface EnvironmentProps {
  readonly environment: string;
  readonly projectName?: string;
}

export interface ContainerRegistryProps extends EnvironmentProps {
  readonly repositoryName?: string;
}

export interface LambdaFunctionProps extends EnvironmentProps {
  readonly functionName?: string;
  readonly handler?: string;
  readonly imageTag?: string;
  readonly timeoutMinutes?: number;
  readonly memorySize?: number;
}

// 特定機能用の型定義
export interface RagProcessingProps extends LambdaFunctionProps {}