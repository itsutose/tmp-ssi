import { Construct } from "constructs";
import { Table } from "aws-cdk-lib/aws-dynamodb";

export class DynamoDBConstruct extends Construct {
    public readonly table: Table;

    constructor(scope: Construct, id: string) {
        super(scope, id);
    }
}