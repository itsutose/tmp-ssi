export const API_GATEWAY_NAME = "sony-sonpo-api";

export const CDK_DEFAULT_ACCOUNT = process.env.CDK_DEFAULT_ACCOUNT;
export const CDK_DEFAULT_REGION = process.env.CDK_DEFAULT_REGION;

export const REPOSITORY_NAME = "sony-sonpo-rag";
export const API_LAMBDA_FUNCTION_NAME = "sony-sonpo-rag-lambda";
export const API_LAMBDA_HANDLER = "api.main.handler";

// StepFunctionsDifinition
export const stepFunctionDefinition = {
    "Comment": "Lambdaを使用してタスクを処理するワークフロー",
    "StartAt": "InvokeMainLambda",
    "States": {
        "InvokeMainLambda": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",
            "Parameters": {
                "FunctionName": API_LAMBDA_FUNCTION_NAME, // cdk-pipelineでPayloadから代入できるように
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
            // エラー処理
            "Catch": [
                {
                    "ErrorEquals": [
                        "States.ALL"
                    ],
                    "Next": "HandleError"
                }
            ],
            // 正常処理
            "Next": "TaskComplete"
        },
        "HandleError": {
            "Type": "Pass",
            "Result": {
                "status": "FAILED",
                "error": "Task execution failed"
            },
            "End": true
        },
        "TaskComplete": {
            "Type": "Pass",
            "End": true
        }
    }
};