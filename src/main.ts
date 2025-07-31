import { App } from "aws-cdk-lib";
import { InfraPipelineStack } from "./pipeline/cdk-pipeline";
import { CDK_DEFAULT_ACCOUNT, CDK_DEFAULT_REGION } from "./shared/enviroment/common";

const app = new App();

new InfraPipelineStack(app, "InfraPipelineStack", {
    env: {
        account: CDK_DEFAULT_ACCOUNT,
        region: CDK_DEFAULT_REGION,
    },
});

app.synth();