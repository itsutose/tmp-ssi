import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";
import { API_LAMBDA_FUNCTION_NAME, GET_STATUS_CHECK_EXCECUTION_ARN_PREFIX, STEP_FUNCTION_NAME, stepFunctionDefinition } from "../shared/enviroment/common";
import { EcrConstruct } from "../main-infra/construct/ecr";
import { LambdaImageConstruct, Lambda } from "../main-infra/construct/lambda";
import { Architecture, Code } from "aws-cdk-lib/aws-lambda";
import { StepFunctions } from "../main-infra/construct/stepfunctions";
import { Role } from "aws-cdk-lib/aws-iam";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { PolicyDocument } from "aws-cdk-lib/aws-iam";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

export class InfraPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        // ECRを用いたLambdaによるFastAPIのデプロイ
        const repository = new EcrConstruct(this, "EcrConstruct");

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
    }
}