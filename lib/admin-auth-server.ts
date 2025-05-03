import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// 서버 컴포넌트에서 사용할 수 있는 관리자 확인 함수
export async function isAdmin() {
  try {
    // 쿠키를 사용하여 서버 클라이언트 생성
    const cookieStore = cookies();
    console.log("[Server] Cookies retrieved:", cookieStore.getAll()); // Added log
    const supabase = createServerClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookieValue = cookieStore.get(name)?.value;
            console.log(`[Server] Getting cookie "${name}":`, cookieValue); // Added log
            return cookieValue;
          },
          set(name: string, value: string, options: any) {
            // Next.js Server Components don't allow setting cookies after
            // the response headers have been set, but Supabase requires this method
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            // Same as above, this is required but won't be used in server components
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // 세션 확인
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.log("[Server] No session found");
      return false;
    }
    
    console.log("[Server] Session user:", session?.user?.id);
    
    // 관리자 테이블에서 사용자 정보 조회
    console.log("[Server] Session:", session);
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("id", session.user.id)
      .single();
    
    if (adminError) {
      console.log("[Server] Admin query error:", adminError.message);
      return false;
    }
    
    if (!adminData) {
      console.log("[Server] No admin data found");
      return false;
    }
    
    console.log("[Server] Admin verified:", adminData.id);
    return true;
  } catch (error) {
    console.error("[Server] Admin check error:", error);
    return false;
  }
}
