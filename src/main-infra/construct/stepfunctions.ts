import { Construct } from "constructs";
import { IStateMachine, StateMachine, DefinitionBody } from "aws-cdk-lib/aws-stepfunctions";

export interface StepFunctionsProps {
    stateMachineName: string;
    definitionBody: any;
}

export class StepFunctions extends Construct {
    public readonly stateMachine: IStateMachine;
    constructor(scope: Construct, id: string, props: StepFunctionsProps) {
        super(scope, id);

        const stateMachine = new StateMachine(this, "StateMachine", {
            stateMachineName: props.stateMachineName,
            definitionBody: DefinitionBody.fromString(JSON.stringify(props.definitionBody)),
        });

        this.stateMachine = stateMachine;
    }
}