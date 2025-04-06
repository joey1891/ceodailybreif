import { createClient } from '@supabase/supabase-js';

// 환경 변수가 제대로 로드되는지 디버깅 로그 추가
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl?.substring(0, 10) + "...");
console.log("Supabase Key exists:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials missing');
}

// 재정의된 클라이언트 설정
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase-auth-token'
  }
});

// 익명 사용자를 위한 구독 기능 
export const addSubscriber = async (email: string) => {
  try {
    // RLS 정책 우회를 위해 서버리스 함수나 특별한 엔드포인트를 사용할 수 있음
    // 여기서는 직접 시도
    const { data, error } = await supabase
      .from('subscribers')
      .insert([{ email }])
      .select();
      
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('구독 처리 중 오류:', error);
    return { data: null, error };
  }
};

// 관리자 로그인 전용 함수 추가
export const loginAdmin = async (email: string, password: string) => {
  try {
    // 먼저 로그아웃을 해서 세션을 초기화
    await supabase.auth.signOut();
    
    // 로그인 시도
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('관리자 로그인 오류:', error);
    return { data: null, error };
  }
};

// 브라우저에서 세션 상태 확인 함수
export const checkStorageForSession = () => {
  if (typeof window !== 'undefined') {
    console.log("localStorage available:", !!window.localStorage);
    
    try {
      // 저장된 세션 토큰 확인
      const authToken = localStorage.getItem('supabase-auth-token');
      console.log("Auth token exists:", !!authToken);
      if (authToken) {
        try {
          const parsed = JSON.parse(authToken);
          console.log("Auth token valid JSON:", !!parsed);
          console.log("Auth token expiry:", new Date(parsed?.expires_at * 1000).toISOString());
        } catch (e) {
          console.error("Could not parse auth token:", e);
        }
      }
      
      return !!authToken;
    } catch (e) {
      console.error("localStorage error:", e);
      return false;
    }
  }
  return false;
};

// 디버깅용 - 페이지 로드 시 세션 상태 확인
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    checkStorageForSession();
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("Initial session check:", data?.session ? "Active" : "None", error);
    });
  });
}