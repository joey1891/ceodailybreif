import { createBrowserClient } from '@supabase/ssr';

// 환경 변수가 제대로 로드되는지 디버깅 로그 추가
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl?.substring(0, 10) + "...");
console.log("Supabase Key exists:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase credentials missing');
}

// 쿠키 기반 스토리지를 사용하는 클라이언트 설정
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // storageKey는 createBrowserClient 사용 시 필요 없음 (쿠키 사용)
  },
  global: {
    fetch: (input, init) => {
      return fetch(input, {
        ...init,
        cache: 'no-store', // 캐시 비활성화
      });
    },
  },
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
    console.log("loginAdmin: 로그인 프로세스 시작");
    // 먼저 로그아웃을 해서 세션을 초기화
    console.log("loginAdmin: 세션 초기화 (signOut) 시도");
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("loginAdmin: signOut 오류", signOutError);
    } else {
      console.log("loginAdmin: signOut 성공");
    }

    // 로그인 시도
    console.log("loginAdmin: signInWithPassword 시도");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    console.log("loginAdmin: signInWithPassword 결과 - data:", data, "error:", signInError);

    if (signInError) {
      console.error("loginAdmin: signInWithPassword 오류 발생", signInError);
      // signInWithPassword 오류 발생 시 바로 반환
      return { data: null, error: signInError };
    }
    console.log("loginAdmin: signInWithPassword 성공, admin_users 확인 시작");

    // 3. 로그인은 성공했지만 admin 여부 확인
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    console.log("loginAdmin: admin_users 조회 결과 - data:", adminData, "error:", adminError);

    if (adminError || !adminData) {
      console.error("loginAdmin: admin_users 조회 오류 또는 관리자 아님", adminError || "관리자 데이터 없음");
      // admin_users 조회 오류 또는 관리자 아닐 경우 오류 반환
      return { data: null, error: adminError || new Error("해당 이메일은 관리자로 등록되지 않았습니다.") };
    }

    console.log("loginAdmin: 관리자 확인 성공");
    // 관리자 정보 포함하여 반환
    return { data: { user: { ...data.user, role: adminData.role, name: adminData.name } }, error: null };

  } catch (error: any) {
    console.error('loginAdmin: 관리자 로그인 처리 중 예상치 못한 오류 발생 (catch 블록)', error);
    // 예상치 못한 오류 발생 시 Error 객체를 반환
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

// 디버깅용 - 페이지 로드 시 세션 상태 확인 (localStorage 확인 로직 제거)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    supabase.auth.getSession().then(({ data, error }) => {
      console.log("Initial session check:", data?.session ? "Active" : "None", error);
    });
  });
}
