import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 환경 변수에서 Supabase URL과 서비스 역할 키 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 서비스 역할 키를 사용하는 관리자 클라이언트 생성
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST(request: Request) {
  try {
    // 권한 확인 - 헤더에서 토큰 추출
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "인증 토큰이 없습니다." }, { status: 401 });
    }
    
    const token = authHeader.split(' ')[1];
    
    // JWT 토큰으로 사용자 정보 확인
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("사용자 인증 오류:", userError);
      return NextResponse.json({ error: "유효하지 않은 인증 토큰입니다." }, { status: 401 });
    }
    
    // 요청 데이터 가져오기
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: "사용자 ID가 필요합니다." }, { status: 400 });
    }
    
    // 현재 사용자가 super_admin인지 확인
    const { data: currentAdmin, error: adminError } = await supabaseAdmin
      .from("admin_users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (adminError || !currentAdmin || currentAdmin.role !== "super_admin") {
      return NextResponse.json(
        { error: "권한이 없습니다. 슈퍼 관리자만 서브 관리자를 삭제할 수 있습니다." },
        { status: 403 }
      );
    }
    
    // 삭제할 사용자가 sub_admin인지 확인
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from("admin_users")
      .select("role, email")
      .eq("id", userId)
      .single();
      
    if (targetError) {
      console.error("대상 사용자 확인 오류:", targetError);
      return NextResponse.json({ error: "해당 사용자를 찾을 수 없습니다." }, { status: 404 });
    }
    
    if (targetUser.role !== "sub_admin") {
      return NextResponse.json({ error: "슈퍼 관리자는 삭제할 수 없습니다." }, { status: 403 });
    }
    
    // 1. 먼저 관리자 테이블에서 삭제
    const { error: deleteTableError } = await supabaseAdmin
      .from("admin_users")
      .delete()
      .eq("id", userId);
      
    if (deleteTableError) {
      console.error("테이블 삭제 오류:", deleteTableError);
      return NextResponse.json({ error: "테이블에서 사용자 삭제 중 오류가 발생했습니다." }, { status: 500 });
    }
    
    // 2. Authentication에서 사용자 삭제
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (deleteAuthError) {
      console.error("인증 삭제 오류:", deleteAuthError);
      
      // 실패했지만, 테이블에서는 이미 삭제되었으므로 부분 성공 응답
      return NextResponse.json({
        warning: true,
        message: `${targetUser.email} 관리자가 테이블에서 삭제되었지만, 인증 시스템에서 삭제하지 못했습니다.`,
        error: deleteAuthError.message
      }, { status: 207 }); // 207 Multi-Status
    }
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      message: `${targetUser.email} 관리자가 완전히 삭제되었습니다.`
    });
    
  } catch (error: any) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: error.message || "서브 관리자 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 