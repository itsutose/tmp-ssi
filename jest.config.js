// jest.config.js
module.exports = {
    preset: 'ts-jest', // Test実行前にts-jestでjsに変換
    testEnvironment: 'node', // （ブラウザ環境ではなく）Node.js環境でテストを実行
    testMatch: ['**/test/unit/**/*.test.ts'], // test/unit ディレクトリ内の .test.ts ファイルを対象にする
};