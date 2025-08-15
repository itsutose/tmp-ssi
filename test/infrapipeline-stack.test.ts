import { App } from "aws-cdk-lib";
import { InfraPipelineStack } from "../src/pipeline/cdk-pipeline";
import { Template, Match } from "aws-cdk-lib/assertions";

describe("InfraPipelineStack", () => {
    test('Snapshot test', () => {
        const app = new App();
        const stack = new InfraPipelineStack(app, "InfraPipelineStack", {
            env: {
                account: process.env.CDK_DEFAULT_ACCOUNT,
                region: process.env.CDK_DEFAULT_REGION,
            },
        });
        // テンプレートをスタックから作成
        const template = Template.fromStack(stack);

        // スナップショットテスト
        expect(template.toJSON()).toMatchSnapshot();
    });
});