# Needless - 固定資産台帳管理システム

固定資産の管理を行うデモアプリケーションです。顧客側とムダレス側の2つのビューがあり、資産の登録・確認・承認のワークフローを実装しています。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **UIコンポーネント**: shadcn/ui
- **チャート**: Recharts
- **データベース**: Supabase (PostgreSQL + Storage)
- **状態管理**: React Hooks (useState)

## セットアップ

### 1. 依存関係のインストール

```bash
npm install --legacy-peer-deps
```

### 2. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## Supabase設定

このプロジェクトはSupabaseを使用しています。設定は`lib/supabase/client.ts`に直接記述されています（デモ用）。

### データベーステーブル

以下のテーブルが必要です：

1. **assets** - 資産情報
2. **asset_attachments** - 添付ファイル情報

テーブル作成SQLは`supabase-setup.sql`を参照してください。

### Storageバケット

`asset-attachments`という名前のPublicバケットが必要です。

バケット作成SQLは`supabase-storage-setup.sql`を参照してください。

## デプロイ

### Vercelへのデプロイ

1. GitHubリポジトリにプッシュ
2. [Vercel](https://vercel.com/)でプロジェクトをインポート
3. 環境変数は設定不要（コード内に直接記述済み）

### 注意事項

- デモ用途のため、Supabaseの認証情報がコード内に直接記述されています
- 本番環境では環境変数を使用することを推奨します
- SupabaseのRLSポリシーは全ユーザーが読み書き可能に設定されています

## 機能

### 顧客側

1. **台帳取り込み**: CSVファイルのアップロード
2. **固定資産一覧**: 資産の登録・編集・送信
3. **進捗管理**: KPIダッシュボードと分析
4. **GUT評価**: 承認済み資産のリスク評価可視化

### ムダレス側

1. **確認・GUT入力**: 確認待ち資産の承認・差し戻し
2. **進捗管理**: KPIダッシュボード
3. **GUT評価**: 承認済み資産のリスク評価可視化

## データの永続化

- **Supabase**: メインのデータベース（資産情報・添付ファイル）
- **localStorage**: フォールバック（Supabaseが利用できない場合）

## ライセンス

このプロジェクトはデモ用途です。

