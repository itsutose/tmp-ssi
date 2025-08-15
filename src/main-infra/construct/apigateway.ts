import { Construct } from "constructs";
import { IRestApi, RestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";
import { AuthorizationType } from "aws-cdk-lib/aws-apigateway";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { CognitoUserPoolsAuthorizer } from "aws-cdk-lib/aws-apigateway";

export interface ApiGatewayProps {
    apiName: string;
    lambdaFunction: IFunction;
    userPool: UserPool;
}

export class ApiGatewayConstruct extends Construct {
    public readonly apiGateway: IRestApi;

    constructor(scope: Construct, id: string, props: ApiGatewayProps) {
        super(scope, id);
        
        const apiName = props.apiName;

        const apiGateway = new RestApi(this, "ApiGateway", {
            restApiName: apiName,
        });
        const auth = new CognitoUserPoolsAuthorizer(this, "CognitoUserPoolAuthorizer", {
            cognitoUserPools: [props.userPool],
        });

        apiGateway.root.addMethod(
            "GET", 
            new LambdaIntegration(props.lambdaFunction),
            {
                authorizer: auth,
                authorizationType: AuthorizationType.COGNITO,
            }
        );

        this.apiGateway = apiGateway;

    }
}