import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { PROJECT_CONFIG } from "../shared/enviroment/common";
import { RagInfraStack } from "../main-infra/stack/infra-stack";

export interface InfraPipelineStackProps extends StackProps {
  readonly environment?: string;
}

/**
 * CI/CDパイプライン用のスタック
 * 各環境のRAGインフラストラクチャをデプロイ
 */
export class InfraPipelineStack extends Stack {
    public readonly ragInfraStack: RagInfraStack;

    constructor(scope: Construct, id: string, props: InfraPipelineStackProps) {
        super(scope, id, props);

        const environment = props.environment ?? "dev";
        
        // RAGインフラストラクチャスタックをデプロイ
        // 複数Lambda関数（RAG処理、ドキュメント解析、API Gateway）を含む統合スタック
        this.ragInfraStack = new RagInfraStack(this, "RagInfraStack", {
            environment,
            env: props.env,
            description: `RAG system infrastructure with multiple Lambda functions for ${environment} environment`,
        });

        // タグ付け
        this.addTags(environment);
    }

    /**
     * スタックに共通タグを追加
     */
    private addTags(environment: string): void {
        const tags = {
            Project: PROJECT_CONFIG.PROJECT_NAME,
            Environment: environment,
            ManagedBy: "AWS CDK",
        };

        Object.entries(tags).forEach(([key, value]) => {
            this.ragInfraStack.tags.setTag(key, value);
        });
    }
}