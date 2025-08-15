import { Construct } from "constructs";
import { Function, Code, Runtime, Handler, Architecture } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { IRepository } from "aws-cdk-lib/aws-ecr";
import { API_LAMBDA_HANDLER } from "../../shared/enviroment/common";
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

/**
 * コンテナイメージベースのLambda関数用Construct
 */
export class LambdaImageConstruct extends Construct {
    public readonly lambda: Function;

    constructor(scope: Construct, id: string, props: LambdaImageConstructProps) {
        super(scope, id);

        this.lambda = new Function(this, "advanced-rag-lambda", {
            functionName: props.functionName,
            code: Code.fromEcrImage(props.repository, {
              cmd: [API_LAMBDA_HANDLER],
              tagOrDigest: props.imageTag,
            }),
            runtime: Runtime.FROM_IMAGE,
            handler: Handler.FROM_IMAGE,
            architecture: props.architecture,
        });
    }
}

/**
 * 汎用Lambda関数用Construct
 */
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