import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { LAMBDA_FUNCTION_NAME, REPOSITORY_NAME } from "../shared/enviroment/common";
import { EcrConstruct } from "../main-infra/construct/ecr";
import { LambdaImageConstruct } from "../main-infra/construct/lambda";

export class InfraPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        const repository = new EcrConstruct(this, "EcrConstruct");

        const lambdaProps = {
            functionName: LAMBDA_FUNCTION_NAME,
            imageTag: "latest",
            repository: repository.repository,
        }

        const lambda = new LambdaImageConstruct(this, "LambdaImageConstruct", lambdaProps);
    }
}