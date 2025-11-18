import { createClient } from '@supabase/supabase-js'

// Supabase設定（デモ用：コード内に直接記述）
const supabaseUrl = 'https://urqpoqsbcafycxvdbwue.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVycXBvcXNiY2FmeWN4dmRid3VlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0OTk4MzUsImV4cCI6MjA3OTA3NTgzNX0.kcLk-EpO-EJ2GCyindf54Vv3SSzdV2ZX_v9UgiZVY1k'

// クライアント側でのみ初期化
export const supabase =
  typeof window !== 'undefined'
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      })
    : (null as any)

