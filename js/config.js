const CONFIG = {
  SUPABASE_URL: 'https://samesxnhaekdonoipmxv.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhbWVzeG5oYWVrZG9ub2lwbXh2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODgzNzkyNCwiZXhwIjoyMTA0NDEzOTI0fQ.zVM6AUfGupR2HttauVjyvMXuGxSiq-iofrXHRThTS_o',
  
  // 教室位置（默认为上海某位置，需修改为实际教室坐标）
  CLASSROOM_LOCATION: {
    lat: 31.2222,
    lng: 121.4581
  },
  
  // 签到距离阈值（米）
  CHECK_IN_DISTANCE: 100,
  
  // 签到时间窗口（上课前5分钟开始）
  CHECK_IN_START_MINUTES: 5
};

export default CONFIG;
