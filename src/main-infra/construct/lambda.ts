import { Construct } from "constructs";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { IRepository } from "aws-cdk-lib/aws-ecr";
import { Code } from "aws-cdk-lib/aws-lambda";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Handler } from "aws-cdk-lib/aws-lambda";
import { LAMBDA_HANDLER } from "../../shared/enviroment/common";
import { Duration } from "aws-cdk-lib";
import { IRole } from "aws-cdk-lib/aws-iam";
import { IFunction } from "aws-cdk-lib/aws-lambda";

export interface LambdaImageConstructProps {
    functionName: string;
    imageTag: string;
    repository: IRepository;
    architecture: Architecture;
}

export interface LambdaProps {
  functionName: string;
  code: Code;
  runtime?: Runtime;
  handler?: string;
  timeout?: Duration;
  memorySize?: number;
  environment?: { [key: string]: string };
  role?: IRole;
}

export class LambdaImageConstruct extends Construct {
    public readonly lambda: Function;

    constructor(scope: Construct, id: string, props: LambdaImageConstructProps) {
        super(scope, id);

        const sampleLambda = new Function(this, "advanced-rag-lambda", {
            code: Code.fromEcrImage(props.repository, {
              cmd: [LAMBDA_HANDLER],
              tagOrDigest: props.imageTag,  // 修正: tag → tagOrDigest
            }),
            functionName: props.functionName,
            runtime: Runtime.FROM_IMAGE,
            handler: Handler.FROM_IMAGE,
            architecture: props.architecture,
          });
    }
}

export class Lambda extends Construct {
  public readonly function: IFunction;

  constructor(scope: Construct, id: string, props: LambdaProps) {
      super(scope, id);

      this.function = new Function(this, "Function", {
          functionName: props.functionName,
          runtime: props.runtime || Runtime.PYTHON_3_11,
          handler: props.handler || "index.handler",
          code: props.code,
          timeout: props.timeout || Duration.seconds(30),
          memorySize: props.memorySize || 128,
          environment: props.environment || {},
          role: props.role,
      });
  }
}