# Advanced RAGシステム API設計書

## 1. API概要

### 1.1 システム概要

- **システム名**: ソニー損保AdvancedRAGAPI
- **目的**: Advanced RAGシステムのバックエンドAPIサービスとして、文書検索、コンプライアンスチェック、約款チェック、表記チェック機能を提供
- **対象ユーザー**: ソニー損保 RAGシステムのフロントエンドアプリケーション

### 1.2 基本情報

- **ベースURL**: `https://APIGatewayID.execute-api.ap-northeast-1.amazonaws.com/Stagename`
- **プロトコル**: HTTPS (TLS 1.2以上)
- **データ形式**: JSON
- **文字エンコーディング**: UTF-8

### 1.3 API設計方針

- **アーキテクチャスタイル**: RESTful API
- **HTTPメソッド**: GET・POST・PUT・DELETE
- **レスポンス形式**: 統一されたJSON形式
- **バージョニング**: URL パスによるバージョニング対応

## 2. 認証・認可

### 2.1 認証方式

- **認証タイプ**: JWT Bearer Token (Cognito)
- **認証ヘッダー**: `Authorization: Bearer <JWT_TOKEN>`
- **認証フロー**: 
  1. Amplify側でCognitoのユーザーに割り当てられたJWTトークンを取得
  2. ヘッダーのAuthorization要素にBearer tokenとして設定
  3. API GatewayのCognito Authorizerで検証

### 2.2 セキュリティ要件

- **通信暗号化**: HTTPS必須 (TLS 1.2以上)
- **保存時暗号化**: S3、DynamoDB等での保存時暗号化
- **認証トークン有効期限**: JWT標準に準拠

## 3. 共通仕様

### 3.1 共通HTTPヘッダー

```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
Accept: application/json
```

### 3.2 共通レスポンス形式

#### 成功レスポンス
```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "success": true,
    "data": {},
    "message": "成功メッセージ"
  },
  "isBase64Encoded": false
}
```

#### エラーレスポンス
```json
{
  "statusCode": 400,
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "success": false,
    "error": {
      "code": "ERROR_CODE",
      "message": "エラーメッセージ",
      "details": "詳細情報"
    }
  },
  "isBase64Encoded": false
}
```

### 3.3 共通エラーコード

#### HTTPステータスコード
| HTTPステータス | エラーコード | 説明 |
|:---|:---|:---|
| 400 | BAD_REQUEST | リクエストパラメータ不正・JSONフォーマットエラー・必須パラメータ不足 |
| 401 | UNAUTHORIZED | 認証トークン不正・期限切れ・認証情報不足 |
| 403 | FORBIDDEN | 権限不足・リソースアクセス権限なし |
| 404 | NOT_FOUND | リソースが存在しない・エンドポイント不正 |
| 413 | PAYLOAD_TOO_LARGE | ファイルサイズ制限超過・リクエストサイズ制限超過 |
| 429 | TOO_MANY_REQUESTS | API呼び出し制限超過・レート制限適用 |
| 500 | INTERNAL_SERVER_ERROR | 未処理の例外・システム内部エラー・設定エラー |
| 502 | BAD_GATEWAY | 外部サービス応答エラー・Lambda関数タイムアウト |
| 503 | SERVICE_UNAVAILABLE | システムメンテナンス中・リソース不足 |
| 504 | GATEWAY_TIMEOUT | Step Function実行タイムアウト・外部API呼び出しタイムアウト |

#### ビジネスロジックエラーコード
| エラーコード | 説明 |
|:---|:---|
| RAG_001 | ドキュメント処理エラー（ファイル形式未対応・ファイル破損・テキスト抽出失敗） |
| RAG_002 | 検索処理エラー（ベクトルデータベース接続エラー・検索結果0件・検索クエリ不正） |
| RAG_003 | 埋め込み生成エラー（Embedding API エラー・トークン制限超過） |
| RAG_004 | 回答生成エラー（LLM API エラー・コンテキスト長制限超過） |

## 4. APIエンドポイント仕様

### 4.1 ヘルスチェック系API

#### 4.1.1 システムヘルスチェック
- **エンドポイント**: `GET /health`
- **概要**: システム全体のヘルスチェック
- **認証**: 認証要
- **リクエストパラメータ**: なし
- **レスポンス**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "healthy",
    "bedrock": "healthy",
    "pinecone": "healthy"
  }
}
```

#### 4.1.2 RAGシステムヘルスチェック
- **エンドポイント**: `GET /rag/health`
- **概要**: RAGシステム固有のヘルスチェック
- **認証**: 認証要
- **リクエストパラメータ**: なし
- **レスポンス**:
```json
{
  "status": "healthy",
  "rag_components": {
    "vector_db": "healthy",
    "embedding_service": "healthy",
    "llm_service": "healthy"
  }
}
```

### 4.2 文書検索系API

#### 4.2.1 文書検索
- **エンドポイント**: `POST /search`
- **概要**: 指定されたクエリに対して関連文書を検索・取得
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "query": "検索クエリ",
  "search_strategy": "hybrid", // vector, keyword, hybrid
  "max_results": 10,
  "use_reranking": true,
  "folders": ["folder1", "folder2"] // オプション：検索対象フォルダ指定
}
```
- **レスポンス**:
```json
{
  "results": [
    {
      "document_id": "doc123",
      "title": "文書タイトル",
      "content": "関連する文書内容",
      "score": 0.95,
      "metadata": {
        "source": "document.pdf",
        "page": 1,
        "folder": "compliance"
      }
    }
  ],
  "total_results": 5,
  "search_metadata": {
    "strategy_used": "hybrid",
    "processing_time_ms": 1500
  }
}
```

### 4.3 コンプライアンスチェック系API

#### 4.3.1 文書コンプライアンスチェック
- **エンドポイント**: `POST /compliance/check`
- **概要**: 与えられた文書が法務上の違反内容を含まないかをドキュメント検索して修正を行う
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "document": "文書内容",
  "prompt": "使用プロンプト"
}
```
- **レスポンス**:
```json
{
  "executionARN": "arn:aws:states:ap-northeast-1:123456789012:execution:StateMachine:execution-id",
  "status": "RUNNING"
}
```

#### 4.3.2 約款チェック
- **エンドポイント**: `POST /term/check`
- **概要**: 与えられた文書が約款と矛盾する内容を含まないかをドキュメント検索して修正を行う
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "document": "文書内容",
  "prompt": "使用プロンプト"
}
```
- **レスポンス**:
```json
{
  "executionARN": "arn:aws:states:ap-northeast-1:123456789012:execution:StateMachine:execution-id",
  "status": "RUNNING"
}
```

#### 4.3.3 表記チェック
- **エンドポイント**: `POST /expression/check`
- **概要**: 与えられた文書が表記に関するルールに違反していないか、表記ルールCSVを検索して修正を行う
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "document": "文書内容",
  "prompt": "使用プロンプト"
}
```
- **レスポンス**:
```json
{
  "executionARN": "arn:aws:states:ap-northeast-1:123456789012:execution:StateMachine:execution-id",
  "status": "RUNNING"
}
```

#### 4.3.4 処理状態確認
- **エンドポイント**: `GET /status/check`
- **概要**: Step FunctionのexecutionARNを用いて処理状態を確認
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "executionARN": "arn:aws:states:ap-northeast-1:123456789012:execution:StateMachine:execution-id"
}
```
- **レスポンス**:
```json
// 処理中の場合
{
  "status": "RUNNING",
  "executionARN": "arn:aws:states:ap-northeast-1:123456789012:execution:StateMachine:execution-id"
}

// 完了の場合
{
  "status": "SUCCEEDED",
  "executionARN": "arn:aws:states:ap-northeast-1:123456789012:execution:StateMachine:execution-id",
  "result": {
    "document_modified": "修正した文書内容",
    "check_points": ["指摘内容1", "指摘内容2"],
    "basis_documents": ["参照文書1", "参照文書2"],
    "basis_contents": ["参照文書内容1", "参照文書内容2"]
  }
}

// 失敗の場合
{
  "status": "FAILED",
  "executionARN": "arn:aws:states:ap-northeast-1:123456789012:execution:StateMachine:execution-id",
  "error": {
    "code": "RAG_001",
    "message": "処理エラーの詳細"
  }
}
```

### 4.4 文書管理系API

#### 4.4.1 文書アップロード
- **エンドポイント**: `POST /upload`
- **概要**: 文書をアップロードし、チャンキング処理を行ってベクトルデータベースに登録
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "file": "base64エンコードされたファイル",
  "filename": "document.pdf",
  "folder": "compliance", // 保存先フォルダ
  "chunking_strategy": "semantic", // semantic, character, structure
  "metadata": {
    "title": "文書タイトル",
    "description": "文書説明",
    "tags": ["tag1", "tag2"]
  }
}
```
- **レスポンス**:
```json
{
  "executionARN": "arn:aws:states:ap-northeast-1:123456789012:execution:StateMachine:execution-id",
  "document_id": "doc123",
  "status": "PROCESSING"
}
```

#### 4.4.2 文書ダウンロード
- **エンドポイント**: `GET /download`
- **概要**: 文書の原本をダウンロード可能なリンクを返す
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "document_id": "doc123"
}
```
- **レスポンス**:
```json
{
  "download_url": "https://s3.amazonaws.com/bucket/document.pdf?signature=...",
  "expires_at": "2024-01-01T01:00:00Z",
  "document_info": {
    "filename": "document.pdf",
    "size": 1024000,
    "upload_date": "2024-01-01T00:00:00Z"
  }
}
```

#### 4.4.3 文書一覧取得
- **エンドポイント**: `GET /documents`
- **概要**: アップロードされた文書の一覧を取得
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "folder": "compliance", // オプション：フォルダ指定
  "page": 1,
  "limit": 20,
  "search": "検索キーワード" // オプション
}
```
- **レスポンス**:
```json
{
  "documents": [
    {
      "document_id": "doc123",
      "filename": "document.pdf",
      "title": "文書タイトル",
      "folder": "compliance",
      "upload_date": "2024-01-01T00:00:00Z",
      "size": 1024000,
      "status": "processed"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

#### 4.4.4 文書削除
- **エンドポイント**: `DELETE /documents/{document_id}`
- **概要**: 指定された文書を削除
- **認証**: 認証要
- **リクエストパラメータ**: URL パラメータのみ
- **レスポンス**:
```json
{
  "success": true,
  "message": "文書が正常に削除されました",
  "document_id": "doc123"
}
```

### 4.5 サンドボックス環境管理API

#### 4.5.1 フォルダ名変更
- **エンドポイント**: `PUT /sandbox/folders/{folder_id}`
- **概要**: 参照フォルダの名前を変更
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "new_name": "新しいフォルダ名"
}
```
- **レスポンス**:
```json
{
  "success": true,
  "folder_id": "folder123",
  "old_name": "古いフォルダ名",
  "new_name": "新しいフォルダ名"
}
```

#### 4.5.2 プロンプト一覧取得
- **エンドポイント**: `GET /sandbox/prompts`
- **概要**: 利用可能なプロンプトの一覧を取得
- **認証**: 認証要
- **リクエストパラメータ**: なし
- **レスポンス**:
```json
{
  "prompts": [
    {
      "prompt_id": "prompt123",
      "key": "compliance_check",
      "title": "コンプライアンスチェック用プロンプト",
      "description": "法務チェック用のプロンプトテンプレート",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### 4.5.3 プロンプト取得
- **エンドポイント**: `GET /sandbox/prompts/{prompt_id}`
- **概要**: 指定されたプロンプトの内容を取得
- **認証**: 認証要
- **リクエストパラメータ**: URL パラメータのみ
- **レスポンス**:
```json
{
  "prompt_id": "prompt123",
  "key": "compliance_check",
  "title": "コンプライアンスチェック用プロンプト",
  "content": "あなたは法務の専門家です。以下の文書を確認し...",
  "variables": ["document", "context"],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### 4.5.4 プロンプト作成・更新
- **エンドポイント**: `POST /sandbox/prompts` (新規作成)
- **エンドポイント**: `PUT /sandbox/prompts/{prompt_id}` (更新)
- **概要**: プロンプトの作成または更新
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "key": "new_prompt",
  "title": "新しいプロンプト",
  "content": "プロンプトの内容...",
  "description": "プロンプトの説明",
  "variables": ["document", "context"]
}
```
- **レスポンス**:
```json
{
  "success": true,
  "prompt_id": "prompt123",
  "message": "プロンプトが正常に保存されました"
}
```

### 4.6 履歴管理API

#### 4.6.1 検索履歴取得
- **エンドポイント**: `GET /history/search`
- **概要**: ユーザーの検索履歴を取得
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "page": 1,
  "limit": 20,
  "date_from": "2024-01-01",
  "date_to": "2024-01-31"
}
```
- **レスポンス**:
```json
{
  "history": [
    {
      "search_id": "search123",
      "query": "検索クエリ",
      "timestamp": "2024-01-01T00:00:00Z",
      "results_count": 5,
      "processing_time_ms": 1500
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

#### 4.6.2 チェック履歴取得
- **エンドポイント**: `GET /history/checks`
- **概要**: コンプライアンスチェック等の処理履歴を取得
- **認証**: 認証要
- **リクエストパラメータ**:
```json
{
  "check_type": "compliance", // compliance, term, expression
  "page": 1,
  "limit": 20,
  "date_from": "2024-01-01",
  "date_to": "2024-01-31"
}
```
- **レスポンス**:
```json
{
  "history": [
    {
      "check_id": "check123",
      "check_type": "compliance",
      "executionARN": "arn:aws:states:...",
      "status": "SUCCEEDED",
      "timestamp": "2024-01-01T00:00:00Z",
      "document_preview": "文書の最初の100文字...",
      "issues_found": 3
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50
  }
}
```

## 5. 使用例・サンプルコード

### 5.1 基本的な使用例

```bash
# ヘルスチェック例
curl -X GET "https://[ベースURL]/health" \
  -H "Authorization: Bearer [JWT_TOKEN]"

# 文書検索例
curl -X POST "https://[ベースURL]/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [JWT_TOKEN]" \
  -d '{
    "query": "保険約款について",
    "search_strategy": "hybrid",
    "max_results": 10,
    "use_reranking": true
  }'

# コンプライアンスチェック例
curl -X POST "https://[ベースURL]/compliance/check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [JWT_TOKEN]" \
  -d '{
    "document": "チェック対象の文書内容",
    "prompt": "法務チェック用プロンプト"
  }'

# 処理状態確認例
curl -X GET "https://[ベースURL]/status/check" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [JWT_TOKEN]" \
  -d '{
    "executionARN": "arn:aws:states:ap-northeast-1:123456789012:execution:StateMachine:execution-id"
  }'
```

### 5.2 エラーハンドリング例

```javascript
// JavaScript での基本的なエラーハンドリング例
async function callAPI(endpoint, data) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error: ${result.body.error.code} - ${result.body.error.message}`);
    }
    
    return result.body.data;
  } catch (error) {
    console.error('API呼び出しエラー:', error);
    throw error;
  }
}
```

## 6. 技術スタック (AWSリソース構成)

### 6.1 アーキテクチャ概要
- **API Gateway**: RESTful APIエンドポイントの提供
- **Lambda**: サーバーレス実行環境
- **Step Functions**: ワークフロー管理 (チェック処理の状態管理)
- **ECR**: Dockerイメージ管理 (FastAPI/Mangum環境)

### 6.2 データ層
- **DynamoDB**: 
  - 文書メタデータ管理
  - セッションデータ保存
  - 履歴データ保存
- **S3**: 
  - 文書原本保存
  - プロンプト管理 (オプション)
- **Pinecone**: ベクトルデータベース (本番環境)
- **Chroma**: ベクトルデータベース (開発・テスト環境)

### 6.3 AI/ML サービス
- **Amazon Bedrock**: 
  - LLMサービス
  - Embedding 生成
  - ナレッジベース機能

### 6.4 認証・セキュリティ
- **Cognito**: ユーザー認証・認可
- **Secrets Manager**: API キー管理
- **CloudWatch**: ログ管理・監視

### 6.5 開発・運用
- **AWS CDK**: Infrastructure as Code
- **CloudWatch Logs**: 構造化ログ
- **CloudWatch Metrics**: メトリクス監視

### 6.6 フレームワーク・ライブラリ
- **FastAPI**: Webフレームワーク
- **LangChain**: RAGフレームワーク
- **Mangum**: ASGI-Lambda アダプター
- **boto3**: AWS SDK
- **Docling**: 文書処理

## 7. パフォーマンス・制限

### 7.1 レスポンスタイム目標
- **文書検索**: 10秒以内
- **チェック機能**: 60秒以内 (Step Functionでの非同期処理)
- **ファイルアップロード**: 30秒以内

### 7.2 制限事項
- **ファイルサイズ**: 最大 10MB
- **API呼び出し制限**: ユーザーあたり 1000 リクエスト/時間
- **同時実行数**: Lambda 1000 同時実行

### 7.3 データ保持ポリシー
- **ドキュメント原本**: 無期限保持（明示的削除まで）
- **ベクトルデータ**: ドキュメント削除まで保持
- **検索履歴**: 2年間保持
- **セッションデータ**: 30日間保持
- **ログデータ**: 1年間保持
- **一時ファイル**: 24時間後自動削除

## 8. 変更履歴

| バージョン | 日付 | 変更内容 | 担当者 |
|:---|:---|:---|:---|
| v1.0 | 2025/01/25 | 初期API設計書作成 | 沓名 |
| v1.1 | 2025/01/25 | system-difinition.mdに基づく全面改訂 | AI Assistant |
