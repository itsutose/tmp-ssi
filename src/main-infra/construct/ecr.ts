import { Construct } from "constructs";
import { IRepository, Repository } from "aws-cdk-lib/aws-ecr";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { PROJECT_CONFIG, ContainerRegistryProps } from "../../shared/enviroment/common";

/**
 * コンテナレジストリを管理するConstruct
 * RAGアプリケーション用のECRリポジトリとアクセス権限を提供
 */
export class ContainerRegistryConstruct extends Construct {
    public readonly repository: IRepository;

    constructor(scope: Construct, id: string, props: ContainerRegistryProps) {
        super(scope, id);

        const repositoryName = props.repositoryName ?? PROJECT_CONFIG.RESOURCES.ECR.REPOSITORY_NAME;
        
        // 既存のECRリポジトリを参照（環境名は含めない）
        const ragRepository = Repository.fromRepositoryName(
            this, 
            "RagRepository", 
            repositoryName
        );

        // Lambda サービスにpull権限を付与
        ragRepository.grantPull(new ServicePrincipal("lambda.amazonaws.com"));
        
        this.repository = ragRepository;
    }
}