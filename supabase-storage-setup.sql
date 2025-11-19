-- ============================================
-- Supabase Storageバケット作成SQL
-- ============================================
-- Storage UIでエラーが発生した場合、このSQLを実行してください

-- 1. Storageバケットの作成
-- MIMEタイプ制限を更新（PDFやその他のファイル形式も許可）
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/*',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed'
]
WHERE id = 'asset-attachments';

-- バケットが存在しない場合は作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-attachments',
  'asset-attachments',
  true,
  10485760, -- 10MB
  ARRAY[
    'image/*',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. 既存のポリシーを削除（エラーを避けるため）
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes" ON storage.objects;
DROP POLICY IF EXISTS "Allow updates" ON storage.objects;

-- 3. Storageポリシーの作成
-- アップロードを許可
CREATE POLICY "Allow uploads" ON storage.objects
  FOR INSERT 
  WITH CHECK (bucket_id = 'asset-attachments');

-- 読み取りを許可
CREATE POLICY "Allow reads" ON storage.objects
  FOR SELECT 
  USING (bucket_id = 'asset-attachments');

-- 削除を許可
CREATE POLICY "Allow deletes" ON storage.objects
  FOR DELETE 
  USING (bucket_id = 'asset-attachments');

-- 更新を許可（オプション）
CREATE POLICY "Allow updates" ON storage.objects
  FOR UPDATE 
  USING (bucket_id = 'asset-attachments')
  WITH CHECK (bucket_id = 'asset-attachments');

