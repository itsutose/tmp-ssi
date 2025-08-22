import { Construct } from "constructs";
import { IRestApi, RestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";


export interface ApiGatewayProps {
    apiName: string;
    smartragLambdaFunction: IFunction;
    getStatusLambdaFunction: IFunction;
    userPool: UserPool;
    environment: string;
}

export class ApiGatewayConstruct extends Construct {
    public readonly apiGateway: IRestApi;

    constructor(scope: Construct, id: string, props: ApiGatewayProps) {
        super(scope, id);
        
        const apiName = props.apiName;

        const apiGateway = new RestApi(this, "ApiGateway", {
            restApiName: apiName,
            deployOptions: {
                stageName: props.environment,
                throttlingRateLimit: 1000,
            },
        });
        const auth = new CognitoUserPoolsAuthorizer(this, "CognitoUserPoolAuthorizer", {
            cognitoUserPools: [props.userPool],
        });

        // ヘルスチェック
        const healthCheckResource = apiGateway.root.addResource('health');
        healthCheckResource.addMethod('GET', new LambdaIntegration(props.smartragLambdaFunction), {
            authorizer: auth,
            authorizationType: AuthorizationType.COGNITO,
        });

        // テスト用エンドポイント
        const testResource = apiGateway.root.addResource('test');
        testResource.addMethod('GET', new LambdaIntegration(props.smartragLambdaFunction), {
            authorizer: auth,
            authorizationType: AuthorizationType.COGNITO,
        });

        this.apiGateway = apiGateway;

    }
}