import boto3
import json
import os
def lambda_handler(event, context):
    """
    StepFunctionsの実行結果を取得して処理するLambda関数
    """
    
    def create_response(status_code, body):
        """共通のレスポンス形式を作成"""
        return {
            "statusCode": status_code,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(body, ensure_ascii=False)
        }
    
    try:
        # executionARNの取得と検証
        execution_uuid = event.get("queryStringParameters", {}).get("executionUuid")
        if not execution_uuid:
            return create_response(400, {
                "error": "executionArn is required",
                "status": "ERROR"
            })
        
        # StepFunctions実行状況の取得
        client = boto3.client("stepfunctions")
        GET_STATUS_CHECK_EXCECUTION_ARN_PREFIX = os.environ.get("GET_STATUS_CHECK_EXCECUTION_ARN_PREFIX")
        execution_arn = f"{GET_STATUS_CHECK_EXCECUTION_ARN_PREFIX}{execution_uuid}"
        execution = client.describe_execution(executionArn=execution_arn)
        status = execution["status"]
        
        # 基本レスポンス情報
        base_response = {
            "executionArn": execution_arn,
            "status": status
        }
        
        # 実行中の場合
        if status not in ["SUCCEEDED", "FAILED", "TIMED_OUT", "ABORTED"]:
            return create_response(200, {
                **base_response,
                "message": "Execution is still in progress"
            })
        
        # 成功時の処理
        if status == "SUCCEEDED":
            output = json.loads(execution["output"])
            result_data = _extract_result(output)
            return create_response(200, {
                **base_response,
                "result": result_data
            })
        
        # 失敗時の処理
        return create_response(200, {
            **base_response,
            "error": execution.get("error", "Unknown error"),
            "cause": execution.get("cause", "No cause provided")
        })
        
    except Exception as e:
        return create_response(500, {
            "error": str(e),
            "status": "ERROR"
        })


def _extract_result(output):
    """StepFunctions出力から結果データを抽出"""
    # httpResponseがある場合の処理
    http_response = output.get("httpResponse", {})
    if "body" in http_response:
        try:
            # JSONパースを試行
            return json.loads(http_response["body"])
        except json.JSONDecodeError:
            # パース失敗時は文字列として返却
            return http_response["body"]
    
    # httpResponseがない場合は出力をそのまま返却
    return output