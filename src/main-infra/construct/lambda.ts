import { Construct } from "constructs";
import { Function, Code, Runtime, Handler, Architecture } from "aws-cdk-lib/aws-lambda";
import { Duration } from "aws-cdk-lib";
import { IRepository } from "aws-cdk-lib/aws-ecr";
import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { PROJECT_CONFIG, LambdaFunctionProps, API_LAMBDA_HANDLER } from "../../shared/enviroment/common";
import { IRole } from "aws-cdk-lib/aws-iam";
import { IFunction } from "aws-cdk-lib/aws-lambda";

export interface LambdaConstructProps extends LambdaFunctionProps {
    readonly imageRepository: IRepository;
    readonly documentTable?: ITable;
    readonly lambdaType: keyof typeof PROJECT_CONFIG.RESOURCES.LAMBDA.FUNCTIONS;
}

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
 * 汎用Lambda関数を管理するConstruct
 * コンテナイメージベースのLambda関数とその設定を提供
 */
export class LambdaConstruct extends Construct {
    public readonly function: Function;

    constructor(scope: Construct, id: string, props: LambdaConstructProps) {
        super(scope, id);

        const lambdaConfig = PROJECT_CONFIG.RESOURCES.LAMBDA.FUNCTIONS[props.lambdaType];
        const defaults = PROJECT_CONFIG.RESOURCES.LAMBDA.DEFAULTS;

        const functionName = props.functionName ?? 
            `${lambdaConfig.FUNCTION_NAME}-${props.environment}`;

        const handler = props.handler ?? lambdaConfig.HANDLER;

        this.function = new Function(this, "Function", {
            functionName,
            code: Code.fromEcrImage(props.imageRepository, {
                cmd: [handler],
                tagOrDigest: props.imageTag ?? "latest",
            }),
            runtime: defaults.RUNTIME,
            handler: Handler.FROM_IMAGE,
            architecture: defaults.ARCHITECTURE,
            timeout: Duration.minutes(
                props.timeoutMinutes ?? 
                lambdaConfig.TIMEOUT_MINUTES ?? 
                defaults.TIMEOUT_MINUTES
            ),
            memorySize: 
                props.memorySize ?? 
                lambdaConfig.MEMORY_SIZE ?? 
                defaults.MEMORY_SIZE,
            environment: {
                PROJECT_NAME: PROJECT_CONFIG.PROJECT_NAME,
                ENVIRONMENT: props.environment,
                LAMBDA_TYPE: props.lambdaType,
                ...(props.documentTable && {
                    DOCUMENTS_TABLE_NAME: props.documentTable.tableName,
                }),
            },
        });

        // DynamoDBテーブルへのアクセス権限を付与
        if (props.documentTable) {
            props.documentTable.grantReadWriteData(this.function);
        }
    }
}

/**
 * RAG処理専用Lambda Construct
 */
export class RagProcessingConstruct extends LambdaConstruct {
    constructor(scope: Construct, id: string, props: Omit<LambdaConstructProps, 'lambdaType'>) {
        super(scope, id, { ...props, lambdaType: 'RAG_PROCESSOR' });
    }
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