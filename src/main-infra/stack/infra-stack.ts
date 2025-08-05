import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { PROJECT_CONFIG, EnvironmentProps } from "../../shared/enviroment/common";
import { ContainerRegistryConstruct } from "../construct/ecr";
import { RagProcessingConstruct } from "../construct/lambda";


export interface RagInfraStackProps extends StackProps {
  readonly environment: string;
}

/**
 * RAGシステムのメインインフラストラクチャスタック
 * コンテナレジストリ、Lambda関数、DynamoDBテーブルを組み合わせてRAGシステムを構築
 */
export class RagInfraStack extends Stack {
  public readonly containerRegistry: ContainerRegistryConstruct;
  
  // Lambda関数群
  public readonly ragProcessor: RagProcessingConstruct;

  constructor(scope: Construct, id: string, props: RagInfraStackProps) {
    super(scope, id, props);

    // コンテナレジストリの構築
    this.containerRegistry = new ContainerRegistryConstruct(this, "ContainerRegistry", {
      environment: props.environment,
    });

    // Lambda関数群の構築（DynamoDBテーブルとの連携は別途設定）
    this.ragProcessor = new RagProcessingConstruct(this, "RagProcessor", {
      environment: props.environment,
      imageRepository: this.containerRegistry.repository,
      // documentTable: 別スタックのテーブルを参照する場合は後で設定
    });

    // 出力値の定義
    this.exportValues(props.environment);
  }

  /**
   * スタックの重要な値をエクスポート
   */
  private exportValues(environment: string): void {
    // Lambda関数名をエクスポート
    // new CfnOutput(this, "RagFunctionName", {
    //   value: this.ragProcessing.function.functionName,
    //   description: "RAG processing Lambda function name",
    //   exportName: `${PROJECT_CONFIG.PROJECT_NAME}-${environment}-rag-function-name`,
    // });

    // ECRリポジトリURIをエクスポート
    // new CfnOutput(this, "EcrRepositoryUri", {
    //   value: this.containerRegistry.repository.repositoryUri,
    //   description: "ECR repository URI for container images",
    //   exportName: `${PROJECT_CONFIG.PROJECT_NAME}-${environment}-ecr-uri`,
    // });
  }
}
