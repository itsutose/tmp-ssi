import boto3
import json
import os

# Step Functionsのboto3クライアント
step_function_client = boto3.client('stepfunctions')

# 許可されたState Machine ARN（環境変数から取得）
ALLOWED_STATE_MACHINE_ARN = os.environ.get('ALLOWED_STATE_MACHINE_ARN')

def lambda_handler(event, context):
    """
    Step Functionsの実行を呼び出すLambda関数
    """

    try:
        # 環境変数で設定されたState Machine ARNをチェック
        if not ALLOWED_STATE_MACHINE_ARN:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'ALLOWED_STATE_MACHINE_ARN environment variable is not set'
                })
            }

        # Step Functionsの実行を開始（検証済みのARNを使用）
        response = step_function_client.start_execution(
            stateMachineArn=ALLOWED_STATE_MACHINE_ARN,
            input=event
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'executionArn': response['executionArn'],
                'startDate': str(response['startDate'])
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': str(e)
            })
        }