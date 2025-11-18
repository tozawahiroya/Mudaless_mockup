# Supabaseセットアップガイド

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセスしてアカウントを作成
2. 新しいプロジェクトを作成
3. プロジェクトのURLとAnon Keyを取得

## 2. 環境変数の設定

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. データベーステーブルの作成

SupabaseのSQL Editorで以下のSQLを実行してください：

```sql
-- 資産テーブル
CREATE TABLE assets (
  id TEXT PRIMARY KEY,
  asset_number TEXT NOT NULL,
  equipment_name TEXT NOT NULL,
  catalog_name TEXT,
  lifespan_years INTEGER,
  description TEXT,
  acquisition_amount INTEGER,
  acquisition_date TEXT NOT NULL,
  factory TEXT NOT NULL,
  building TEXT,
  floor TEXT,
  g INTEGER CHECK (g >= 1 AND g <= 5),
  u INTEGER CHECK (u >= 1 AND u <= 5),
  t INTEGER CHECK (t >= 1 AND t <= 5),
  status TEXT NOT NULL CHECK (status IN ('未入力', '確認待ち', '承認済み', '差し戻し')),
  input_by TEXT NOT NULL,
  assigned_to TEXT,
  updated_at TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添付ファイルテーブル
CREATE TABLE asset_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_factory ON assets(factory);
CREATE INDEX idx_asset_attachments_asset_id ON asset_attachments(asset_id);

-- Row Level Security (RLS) の設定
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_attachments ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み書き可能なポリシー（本番環境では適切な認証を実装してください）
CREATE POLICY "Allow all operations on assets" ON assets
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on asset_attachments" ON asset_attachments
  FOR ALL USING (true) WITH CHECK (true);
```

## 4. Storageバケットの作成

1. Supabaseダッシュボードの「Storage」セクションに移動
2. 「New bucket」をクリック
3. バケット名: `asset-attachments`
4. Public bucket: **有効にする**（ファイルを公開するため）
5. File size limit: 適切なサイズを設定（例: 10MB）
6. Allowed MIME types: `image/*,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv`

## 5. Storageポリシーの設定

Storageバケットのポリシーで、全ユーザーがアップロード・削除できるように設定：

```sql
-- Storageポリシー（SQL Editorで実行）
-- アップロードを許可
CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'asset-attachments');

-- 読み取りを許可
CREATE POLICY "Allow reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'asset-attachments');

-- 削除を許可
CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'asset-attachments');
```

## 6. 既存データの移行

アプリケーションを起動後、ブラウザの開発者コンソールで以下を実行して、localStorageのデータをSupabaseに移行できます：

```javascript
// 移行機能を使用する場合
import { migrateLocalStorageToSupabase } from '@/lib/supabase/migration'
const result = await migrateLocalStorageToSupabase()
console.log(result)
```

または、`public/data/assets-seed.csv`を使用してCSVインポート機能でデータをインポートすることもできます。

## 7. 動作確認

1. 開発サーバーを起動: `npm run dev`
2. ブラウザでアプリケーションにアクセス
3. 資産を追加・編集してSupabaseに保存されることを確認
4. ファイルをアップロードしてStorageに保存されることを確認

## トラブルシューティング

### 環境変数が読み込まれない
- `.env.local`ファイルがプロジェクトルートにあることを確認
- 開発サーバーを再起動

### ファイルアップロードが失敗する
- Storageバケットが作成されているか確認
- バケットがPublicに設定されているか確認
- ファイルサイズが制限内か確認

### RLSエラーが発生する
- ポリシーが正しく設定されているか確認
- 必要に応じて認証機能を実装

