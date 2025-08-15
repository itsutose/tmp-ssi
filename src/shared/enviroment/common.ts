import { Duration } from "aws-cdk-lib";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";

// 型定義
export interface EnvironmentProps {
  readonly environment: string;
  readonly projectName?: string;
}

export interface ContainerRegistryProps extends EnvironmentProps {
  readonly repositoryName?: string;
}

export interface LambdaFunctionProps extends EnvironmentProps {
  readonly functionName?: string;
  readonly handler?: string;
  readonly imageTag?: string;
  readonly timeoutMinutes?: number;
  readonly memorySize?: number;
}

// 特定機能用の型定義
export interface RagProcessingProps extends LambdaFunctionProps {}

// 定数定義（両方のブランチから統合）
export const API_GATEWAY_NAME = "sony-sonpo-api";
export const CDK_DEFAULT_ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT;
export const CDK_DEFAULT_REGION = process.env.CDK_DEFAULT_REGION;
export const REPOSITORY_NAME = "sony-sonpo-rag";
export const API_LAMBDA_FUNCTION_NAME = "sony-sonpo-rag-lambda";
export const API_LAMBDA_HANDLER = "api.main.handler";

export const STEP_FUNCTION_NAME = "sony-sonpo-rag-check-state-machine";
export const GET_STATUS_CHECK_EXCECUTION_ARN_PREFIX = `arn:aws:states:ap-northeast-1:082041771987:execution:${STEP_FUNCTION_NAME}:`;

// StepFunctionsDifinition
export const stepFunctionDefinition = {
    "Comment": "Lambdaを使用してタスクを処理するワークフロー",
    "StartAt": "InvokeMainLambda",
    "States": {
        "InvokeMainLambda": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",
            "Parameters": {
                "FunctionName": API_LAMBDA_FUNCTION_NAME,
                "Payload.$": "$"
            },
            "TimeoutSeconds": 300,
            "Retry": [
                {
                    "ErrorEquals": [
                        "States.TaskFailed",
                        "Lambda.ServiceException"
                    ],
                    "IntervalSeconds": 2,
                    "MaxAttempts": 2,
                    "BackoffRate": 2
                }
            ],
            "Catch": [
                {
                    "ErrorEquals": [
                        "States.ALL"
                    ],
                    "Next": "HandleError"
                }
            ],
            "Next": "ProcessResult"
        },
        "HandleError": {
            "Type": "Pass",
            "Result": {
                "status": "FAILED",
                "error": "Task execution failed"
            },
            "End": true
        },
        "ProcessResult": {
            "Type": "Pass",
            "InputPath": "$.Payload",
            "End": true
        }
    }
};