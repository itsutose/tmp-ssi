import { Construct } from "constructs";
import { IRestApi, RestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration } from "aws-cdk-lib/aws-apigateway";

export interface ApiGatewayProps {
    apiName: string;
    lambdaFunction: IFunction;
}

export class ApiGatewayConstruct extends Construct {
    public readonly apiGateway: IRestApi;

    constructor(scope: Construct, id: string, props: ApiGatewayProps) {
        super(scope, id);
        
        const apiName = props.apiName;

        const apiGateway = new RestApi(this, "ApiGateway", {
            restApiName: apiName,
        });

        apiGateway.root.addMethod("GET", new LambdaIntegration(props.lambdaFunction));

        this.apiGateway = apiGateway;

    }
}