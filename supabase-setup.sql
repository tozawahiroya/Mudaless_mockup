-- ============================================
-- Supabase データベースセットアップSQL
-- ============================================
-- このファイルの内容をSupabaseのSQL Editorで実行してください

-- 1. 資産テーブルの作成
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

-- 2. 添付ファイルテーブルの作成
CREATE TABLE asset_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id TEXT NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_factory ON assets(factory);
CREATE INDEX idx_asset_attachments_asset_id ON asset_attachments(asset_id);

-- 4. Row Level Security (RLS) の有効化
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_attachments ENABLE ROW LEVEL SECURITY;

-- 5. RLSポリシーの作成（全ユーザーが読み書き可能）
-- 注意: 本番環境では適切な認証とポリシーを実装してください
CREATE POLICY "Allow all operations on assets" ON assets
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on asset_attachments" ON asset_attachments
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- Storageポリシーの設定
-- ============================================
-- 以下のSQLは、Storageバケット作成後に実行してください

-- アップロードを許可
CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'asset-attachments');

-- 読み取りを許可
CREATE POLICY "Allow reads" ON storage.objects
  FOR SELECT USING (bucket_id = 'asset-attachments');

-- 削除を許可
CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE USING (bucket_id = 'asset-attachments');

-- ============================================
-- Realtimeの有効化
-- ============================================
-- assetsテーブルをRealtimeの監視対象に追加
ALTER PUBLICATION supabase_realtime ADD TABLE assets;

