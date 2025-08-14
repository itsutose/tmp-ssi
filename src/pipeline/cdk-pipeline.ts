import { Stack, StackProps } from "aws-cdk-lib";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { EcrConstruct } from "../main-infra/construct/ecr";
import { LambdaImageConstruct } from "../main-infra/construct/lambda";
import { S3BucketsConstruct } from "../main-infra/construct/s3";
import { LAMBDA_FUNCTION_NAME } from "../shared/enviroment/common";

export class InfraPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        // ECRリポジトリの作成
        const repository = new EcrConstruct(this, "EcrConstruct");

        // S3バケットの作成
        const s3Buckets = new S3BucketsConstruct(this, "S3BucketsConstruct");

        const lambdaProps = {
            functionName: LAMBDA_FUNCTION_NAME,
            imageTag: "latest",
            repository: repository.repository,
            architecture: Architecture.ARM_64,
        }

        const lambda = new LambdaImageConstruct(this, "LambdaImageConstruct", lambdaProps);
    }
}