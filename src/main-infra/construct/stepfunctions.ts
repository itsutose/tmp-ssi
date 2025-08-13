import { Construct } from "constructs";
import { Stack, StackProps } from "aws-cdk-lib";

export class StepFunctionsConstruct extends Construct {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);
            
    }
}