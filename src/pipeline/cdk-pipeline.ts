import { Stack, StackProps } from "aws-cdk-lib";
import { IRole, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Architecture, Code } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { EcrConstruct } from "../main-infra/construct/ecr";
import { Lambda, LambdaImageConstruct, LambdaImageConstructProps } from "../main-infra/construct/lambda";
import { S3BucketsConstruct } from "../main-infra/construct/s3";
import { StepFunctions } from "../main-infra/construct/stepfunctions";
import { DataStack } from "../main-infra/stack/data-stack";
import { API_LAMBDA_FUNCTION_NAME, GET_STATUS_CHECK_EXCECUTION_ARN_PREFIX, STEP_FUNCTION_NAME, stepFunctionDefinition } from "../shared/enviroment/common";
import { ApiGatewayConstruct, ApiGatewayProps } from "../main-infra/construct/apigateway";
import { UserPoolConstruct } from "../main-infra/construct/cognito";


export interface InfraPipelineStackProps extends StackProps {
  readonly environment?: string;
}

/**
 * CI/CDパイプライン用のスタック
 * 各環境のRAGインフラストラクチャをデプロイ
 */
export class InfraPipelineStack extends Stack {
    public readonly dataStack: DataStack;

    constructor(scope: Construct, id: string, props: InfraPipelineStackProps) {
        super(scope, id, props);

        // ECRリポジトリの作成
        const environment: string = props.environment ?? "dev";
        
        // データストレージスタックをデプロイ
        this.dataStack = new DataStack(this, "DataStack", {
            environment,
            env: props.env,
            description: `DynamoDB tables for ${environment} environment`,
        });

        // ECRを用いたLambdaによるFastAPIのデプロイ
        const repository: EcrConstruct = new EcrConstruct(this, "EcrConstruct");

        // S3バケットの作成
        const s3Buckets = new S3BucketsConstruct(this, "S3BucketsConstruct", {
            environment,
            description: `S3 buckets for ${environment} environment`,
        });

        const lambdaImageConstructProps: LambdaImageConstructProps = {
            functionName: API_LAMBDA_FUNCTION_NAME,
            imageTag: "latest",
            repository: repository.repository,
            architecture: Architecture.ARM_64,
        }

        const lambda: LambdaImageConstruct = new LambdaImageConstruct(this, "LambdaImageConstruct", lambdaImageConstructProps);

        // チェック用StepFunctionsのデプロイ
        const stepFunctionsRole: IRole = new Role(this, "StepFunctionsRole", {
            assumedBy: new ServicePrincipal("states.amazonaws.com"),
            inlinePolicies: {
                stepFunctionsPolicy: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: ["lambda:InvokeFunction"],
                            resources: [lambda.lambda.functionArn],
                        }),
                    ],
                }),
            },
        });

        const stepFunction: StepFunctions = new StepFunctions(this, "StepFunctionsConstruct", {
            stateMachineName: STEP_FUNCTION_NAME,
            definitionBody: stepFunctionDefinition,
            role: stepFunctionsRole,
        });

        // invoke用Lambda関数のIAMロール
        const invokeLambdaRole: IRole = new Role(this, "InvokeLambdaRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            inlinePolicies: {
                stepFunctionsInvokePolicy: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: ["states:StartExecution"],
                            resources: [stepFunction.stateMachine.stateMachineArn],
                        }),
                        new PolicyStatement({
                            actions: [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            resources: ["arn:aws:logs:*:*:*"],
                        }),
                    ],
                }),
            },
        });

        // invoke用Lambda関数
        const invokeLambda = new Lambda(this, "InvokeStepFunctionsLambda", {
            functionName: "sony-sonpo-invoke-stepfunctions",
            code: Code.fromAsset("src/lambda-functions/invokeCheckStepFunctions"),
            handler: "index.lambda_handler",
            environment: {
                ALLOWED_STATE_MACHINE_ARN: stepFunction.stateMachine.stateMachineArn,
            },
            role: invokeLambdaRole,
        });

        // getStatusCheckExcecution用Lambda関数のIAMロール
        const getStatusCheckExcecutionLambdaRole: IRole = new Role(this, "GetStatusCheckExcecutionLambdaRole", {
            assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
            inlinePolicies: {
                stepFunctionsInvokePolicy: new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            actions: ["states:DescribeExecution"],
                            resources: [
                                `${GET_STATUS_CHECK_EXCECUTION_ARN_PREFIX}*`
                            ],
                        }),
                    ],
                }),
            },
        });

        // getStatusCheckExcecution用Lambda関数
        const getStatusCheckExcecutionLambda = new Lambda(this, "GetStatusCheckExcecutionLambda", {
            functionName: "sony-sonpo-get-status-check-excecution",
            code: Code.fromAsset("src/lambda-functions/getStatusCheckExcecution"),
            handler: "index.lambda_handler",
            role: getStatusCheckExcecutionLambdaRole,
            environment: {
                GET_STATUS_CHECK_EXCECUTION_ARN_PREFIX: GET_STATUS_CHECK_EXCECUTION_ARN_PREFIX,
            },
        });

        // UserPool Construct
        const userPoolConstructProps = {
            userPoolName: "sony-sonpo-user-pool",
        }
        const userPool = new UserPoolConstruct(this, "UserPoolConstruct", userPoolConstructProps);

        // API Gateway Props
        const apiGatewayProps: ApiGatewayProps = {
            apiName: "sony-sonpo-api",
            smartragLambdaFunction: lambda.lambda,
            getStatusLambdaFunction: getStatusCheckExcecutionLambda.function,
            userPool: userPool.userPool,
            environment,
        }

        const apiGateway = new ApiGatewayConstruct(this, "ApiGatewayConstruct", apiGatewayProps);

    }
}