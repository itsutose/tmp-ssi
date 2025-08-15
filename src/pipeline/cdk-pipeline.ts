import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { PROJECT_CONFIG, API_LAMBDA_FUNCTION_NAME, GET_STATUS_CHECK_EXCECUTION_ARN_PREFIX, STEP_FUNCTION_NAME, stepFunctionDefinition } from "../shared/enviroment/common";
import { RagInfraStack } from "../main-infra/stack/infra-stack";
import { DataStack } from "../main-infra/stack/data-stack";
import { ContainerRegistryConstruct } from "../main-infra/construct/ecr";
import { LambdaImageConstruct, Lambda } from "../main-infra/construct/lambda";
import { Architecture, Code } from "aws-cdk-lib/aws-lambda";
import { StepFunctions } from "../main-infra/construct/stepfunctions";
import { Role } from "aws-cdk-lib/aws-iam";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { PolicyDocument } from "aws-cdk-lib/aws-iam";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

export interface InfraPipelineStackProps extends StackProps {
  readonly environment?: string;
}

/**
 * CI/CDパイプライン用のスタック
 * 各環境のRAGインフラストラクチャをデプロイ
 */
export class InfraPipelineStack extends Stack {
    public readonly dataStack: DataStack;
    public readonly ragInfraStack: RagInfraStack;

    constructor(scope: Construct, id: string, props: InfraPipelineStackProps) {
        super(scope, id, props);

        const environment = props.environment ?? "dev";
        
        // データストレージスタックをデプロイ
        this.dataStack = new DataStack(this, "DataStack", {
            environment,
            env: props.env,
            description: `DynamoDB tables for ${environment} environment`,
        });

        // RAGインフラストラクチャスタックをデプロイ
        this.ragInfraStack = new RagInfraStack(this, "RagInfraStack", {
            environment,
            env: props.env,
            description: `RAG system infrastructure for ${environment} environment`,
        });

        // ECRを用いたLambdaによるFastAPIのデプロイ
        const repository = new ContainerRegistryConstruct(this, "ContainerRegistryConstruct", { environment: "dev" });

        const lambdaImageConstructProps = {
            functionName: API_LAMBDA_FUNCTION_NAME,
            imageTag: "latest",
            repository: repository.repository,
            architecture: Architecture.ARM_64,
        }

        const lambda = new LambdaImageConstruct(this, "LambdaImageConstruct", lambdaImageConstructProps);

        // チェック用StepFunctionsのデプロイ
        const stepFunctionsRole = new Role(this, "StepFunctionsRole", {
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

        const stepFunction = new StepFunctions(this, "StepFunctionsConstruct", {
            stateMachineName: STEP_FUNCTION_NAME,
            definitionBody: stepFunctionDefinition,
            role: stepFunctionsRole,
        });

        // invoke用Lambda関数のIAMロール
        const invokeLambdaRole = new Role(this, "InvokeLambdaRole", {
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
        const getStatusCheckExcecutionLambdaRole = new Role(this, "GetStatusCheckExcecutionLambdaRole", {
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
            this.dataStack.tags.setTag(key, value);
            this.ragInfraStack.tags.setTag(key, value);
        });
    }
}