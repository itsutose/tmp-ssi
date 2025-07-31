import { Construct } from "constructs";
import { IRepository, Repository } from "aws-cdk-lib/aws-ecr";
import { REPOSITORY_NAME } from "../../shared/enviroment/common";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";

export class EcrConstruct extends Construct {
    public readonly repository: IRepository;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        const projectRAGEcr = Repository.fromRepositoryName(this, "ProjectRAGEcr", REPOSITORY_NAME);

        projectRAGEcr.grantPull(new ServicePrincipal("lambda.amazonaws.com"));
        this.repository = projectRAGEcr;
    }
}