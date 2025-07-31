import { Construct } from "constructs";
import { Function, FunctionProps } from "aws-cdk-lib/aws-lambda";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { IRepository } from "aws-cdk-lib/aws-ecr";
import { Code } from "aws-cdk-lib/aws-lambda";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Handler } from "aws-cdk-lib/aws-lambda";

export interface LambdaProps {
    functionName: string;
    imageTag: string;
    repository: IRepository;
}

export class LambdaImageConstruct extends Construct {
    public readonly lambda: Function;

    constructor(scope: Construct, id: string, props: LambdaProps) {
        super(scope, id);

        const sampleLambda = new Function(this, "advanced-rag-lambda", {
            code: Code.fromEcrImage(props.repository, {
              cmd: ["app.handler"],
              tag: props.imageTag,
            }),
            functionName: props.functionName,
            runtime: Runtime.FROM_IMAGE,
            handler: Handler.FROM_IMAGE,
            architecture: Architecture.ARM_64,
          });
    }
}