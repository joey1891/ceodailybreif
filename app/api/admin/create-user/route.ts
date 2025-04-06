import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 환경 변수에서 Supabase URL과 서비스 역할 키 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 서비스 역할 키를 사용하는 관리자 클라이언트 생성
// - 중요: 이 키는 서버 측에서만 사용해야 함 (클라이언트에 노출 금지)
// - 이 클라이언트는 관리자 API에 접근할 수 있는 권한을 가짐
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: Request) {
  try {
    // [중요] 이전 접근 방식에서 실패한 이유:
    // 1. createRouteHandlerClient와 cookies()를 사용했지만 쿠키가 제대로 전달되지 않음
    // 2. Next.js App Router 서버 컴포넌트와 API 라우트 간 인증 컨텍스트 공유 문제
    // 3. Supabase 인증 쿠키가 API 라우트로 전달되지 않는 문제
    
    // [해결책] 헤더에서 직접 토큰을 추출하는 방식으로 변경
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "인증 토큰이 없습니다." }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // 일반 클라이언트 생성 (토큰 검증 용도) - 실제로는 사용하지 않음
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    
    // [핵심] 전달받은 JWT 토큰으로 사용자 정보 확인
    // - supabaseAdmin.auth.getUser()로 토큰의 유효성 검증 및 사용자 정보 조회
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("사용자 인증 오류:", userError);
      return NextResponse.json({ error: "유효하지 않은 인증 토큰입니다." }, { status: 401 });
    }
    
    console.log("인증된 사용자:", user.id);
    
    // 요청 바디에서 데이터 가져오기
    const { email, password, name } = await request.json();
    
    // 입력 값 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: "이메일과 비밀번호는 필수 항목입니다." },
        { status: 400 }
      );
    }

    // 현재 사용자가 super_admin인지 확인
    // - 인증된 사용자의 ID로 권한 검증
    const { data: currentAdmin, error: adminError } = await supabaseAdmin
      .from("admin_users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminError) {
      console.error("관리자 확인 오류:", adminError);
    }

    if (!currentAdmin || currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { error: "권한이 없습니다. 슈퍼 관리자만 서브 관리자를 생성할 수 있습니다." },
        { status: 403 }
      );
    }
    
    console.log("슈퍼 관리자 확인됨");

    // 이메일이 이미 등록되었는지 확인
    const { data: existingUser } = await supabaseAdmin
      .from("admin_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다." },
        { status: 400 }
      );
    }

    // [중요] 관리자 API로 사용자 생성 (이메일 확인 없음)
    // - 이 부분은 일반 클라이언트에서는 호출할 수 없음 (서비스 역할 키 필요)
    // - email_confirm: true로 인해 이메일 확인 없이 바로 활성화됨
    // - 이 방식으로 Supabase 기본 이메일 제한을 우회
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 확인 건너뛰기
      user_metadata: { name: name || null, role: "sub_admin" },
    });

    if (createError) {
      console.error("사용자 생성 오류:", createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }
    
    console.log("사용자 생성됨:", userData.user.id);

    // 관리자 테이블에 추가 (애플리케이션 데이터)
    const { error: insertError } = await supabaseAdmin
      .from("admin_users")
      .insert({
        id: userData.user.id, // Auth와 동일한 ID 사용 (중요)
        email,
        name: name || null,
        role: "sub_admin",
      });

    if (insertError) {
      console.error("관리자 테이블 추가 오류:", insertError);
      
      // 롤백 - 생성된 사용자 삭제
      await supabaseAdmin.auth.admin.deleteUser(userData.user.id);
      
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }
    
    console.log("관리자 테이블에 추가됨");

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: `${email} 서브 관리자가 추가되었습니다.`,
      user: {
        id: userData.user.id,
        email,
        name: name || null,
        created_at: userData.user.created_at,
      },
    });
  } catch (error: any) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: error.message || "서브 관리자 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 