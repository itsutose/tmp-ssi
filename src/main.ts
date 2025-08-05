import { App } from "aws-cdk-lib";
import { InfraPipelineStack } from "./pipeline/cdk-pipeline";
import { PROJECT_CONFIG } from "./shared/enviroment/common";

const app = new App();

new InfraPipelineStack(app, "InfraPipelineStack", {
    env: {
        account: PROJECT_CONFIG.AWS.ACCOUNT,
        region: PROJECT_CONFIG.AWS.REGION,
    },
});

app.synth();