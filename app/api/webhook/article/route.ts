import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

// 백엔드 전용 관리자 클라이언트 생성 (보안상 service_role 키 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Supabase Webhook에서 보내는 데이터 받기
    const payload = await req.json();

    // 새 기사가 삽입(INSERT)된 이벤트인지 확인
    if (payload.type === 'INSERT' && payload.table === 'articles') {
      const article = payload.record;

      // 임시저장(is_published가 false)인 경우 메일 발송 안 함
      if (!article.is_published) {
        return NextResponse.json({ message: '임시저장 기사입니다. 메일을 발송하지 않습니다.' });
      }

      // 구독자 이메일 목록 가져오기
      const { data: subscribers, error } = await supabase
        .from('subscribers')
        .select('email')
        .eq('is_active', true);

      if (error || !subscribers || subscribers.length === 0) {
        return NextResponse.json({ message: '활성화된 구독자가 없습니다.' });
      }

      // 이메일 배열로 변환
      const subscriberEmails = subscribers.map(sub => sub.email);

      // Resend로 이메일 발송
      const { data, error: resendError } = await resend.emails.send({
        // 참고: Resend 무료 계정은 도메인 인증 전까지 'onboarding@resend.dev'만 발신자로 쓸 수 있습니다.
        from: 'CEO Daily Brief <onboarding@resend.dev>', 
        to: 'wjshin2450@gmail.com', // 대표 수신자 (본인 이메일 등)
        bcc: subscriberEmails, // 구독자들의 이메일이 서로 안 보이도록 숨은참조(bcc) 사용
        subject: `[CEO Daily Brief] 새 기사가 발행되었습니다: ${article.title}`,
        html: `
          <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111;">
            <p style="color: #990000; font-weight: bold; font-size: 12px; letter-spacing: 1px;">${article.category.toUpperCase()}</p>
            <h1 style="font-size: 24px; margin-bottom: 20px;">${article.title}</h1>
            <p style="color: #666; font-size: 14px; margin-bottom: 30px;">
              CEO Daily Brief에 새로운 기사가 업데이트 되었습니다. 지금 바로 확인해 보세요.
            </p>
            <a href="https://www.ceodailybrief.com/article?id=${article.id}" 
               style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; font-family: sans-serif;">
              기사 전문 읽기
            </a>
          </div>
        `,
      });

      if (resendError) {
        throw new Error(resendError.message);
      }

      return NextResponse.json({ message: '뉴스레터 발송 성공', data });
    }

    return NextResponse.json({ message: '처리할 이벤트가 아닙니다.' });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
