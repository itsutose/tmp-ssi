import { Construct } from "constructs";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";

export interface UserPoolConstructProps {
    userPoolName: string;

}

export class UserPoolConstruct extends Construct {
    public readonly userPool: UserPool;
    public readonly userPoolClient: UserPoolClient;

    constructor(scope: Construct, id: string, props: UserPoolConstructProps) {
        super(scope, id);

        const userPool = new UserPool(this, "UserPool", {
            userPoolName: props.userPoolName,

            // セルフサービスのサインアップの無効化
            selfSignUpEnabled: false,

            // サインインエイリアスの設定
            signInAliases: {
                email: true,
            },

            // パスワードポリシーの設定
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
            },
        });

        this.userPool = userPool;
        
    }
}