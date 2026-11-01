Copyimport { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Database Webhook → 뉴스레터 발송
 *
 * 보안:
 *  - 요청 헤더 `x-webhook-secret` 이 환경변수 WEBHOOK_SECRET 과 일치해야만 처리합니다.
 *    (Supabase 대시보드 > Database > Webhooks 에서 HTTP Header 로 같은 값을 추가하세요)
 *  - WEBHOOK_SECRET 이 설정되지 않았으면 모든 요청을 거부합니다(fail-closed).
 *
 * 발송 조건:
 *  - INSERT: 처음부터 발행 상태(is_published = true)로 저장된 기사
 *  - UPDATE: 임시저장 → 발행으로 바뀐 기사 (old.is_published = false, new.is_published = true)
 *  - 이미 발송한 기사(newsletter_sent_at 값 있음)는 다시 보내지 않습니다.
 */

export const runtime = 'nodejs';

const resend = new Resend(process.env.RESEND_API_KEY);

// 서버 전용 관리자 클라이언트 (service_role 키는 절대 NEXT_PUBLIC_ 으로 노출하지 말 것)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

function isAuthorized(req: Request): boolean {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) {
    console.error('WEBHOOK_SECRET is not configured — rejecting webhook request.');
    return false;
  }
  const provided = req.headers.get('x-webhook-secret') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // 길이가 다르면 timingSafeEqual 이 예외를 던지므로 먼저 비교
  return a.length === b.length && timingSafeEqual(a, b);
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type ArticleRecord = { id?: string | number; is_published?: boolean; newsletter_sent_at?: string | null };
type WebhookPayload = {
  type?: 'INSERT' | 'UPDATE' | 'DELETE';
  table?: string;
  record?: ArticleRecord | null;
  old_record?: ArticleRecord | null;
};

function shouldSend(payload: WebhookPayload): boolean {
  if (payload?.table !== 'articles') return false;
  const record = payload.record;
  if (!record?.is_published || record.newsletter_sent_at) return false;

  if (payload.type === 'INSERT') return true;
  if (payload.type === 'UPDATE') return payload.old_record?.is_published === false;
  return false;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = (await req.json()) as WebhookPayload;

    if (!shouldSend(payload)) {
      return NextResponse.json({ message: '발송 대상 이벤트가 아닙니다.' });
    }

    const webhookArticle = payload.record as ArticleRecord;

    // 페이로드만 믿지 않고 DB에서 실제 상태를 다시 확인 (위조·중복 발송 방지)
    const { data: article, error: articleError } = await supabaseAdmin
      .from('articles')
      .select('id, title, category, is_published, newsletter_sent_at')
      .eq('id', webhookArticle.id)
      .single();

    if (articleError || !article) {
      return NextResponse.json({ error: '기사를 찾을 수 없습니다.' }, { status: 404 });
    }
    if (!article.is_published || article.newsletter_sent_at) {
      return NextResponse.json({ message: '이미 발송했거나 발행되지 않은 기사입니다.' });
    }

    // 동시 요청 대비: newsletter_sent_at 이 비어 있을 때만 선점(claim)
    const { data: claimed, error: claimError } = await supabaseAdmin
      .from('articles')
      .update({ newsletter_sent_at: new Date().toISOString() })
      .eq('id', article.id)
      .is('newsletter_sent_at', null)
      .select('id');

    if (claimError) throw new Error(claimError.message);
    if (!claimed || claimed.length === 0) {
      return NextResponse.json({ message: '다른 요청에서 이미 발송 중입니다.' });
    }

    const { data: subscribers, error } = await supabaseAdmin
      .from('subscribers')
      .select('email')
      .eq('is_active', true);

    if (error || !subscribers || subscribers.length === 0) {
      return NextResponse.json({ message: '활성화된 구독자가 없습니다.' });
    }

    const subscriberEmails = subscribers.map((sub) => sub.email);
    const safeTitle = escapeHtml(article.title);
    const safeCategory = escapeHtml(String(article.category ?? '').toUpperCase());
    const articleUrl = `https://www.ceodailybrief.com/article/${encodeURIComponent(String(article.id))}`;
    // 메일 제목은 HTML이 아니지만 줄바꿈 등 헤더 주입 문자는 제거
    const subjectTitle = String(article.title ?? '').replace(/[\r\n]+/g, ' ').slice(0, 150);

    const { data, error: resendError } = await resend.emails.send({
      // 참고: Resend 무료 계정은 도메인 인증 전까지 'onboarding@resend.dev'만 발신자로 쓸 수 있습니다.
      from: process.env.NEWSLETTER_FROM || 'CEO Daily Brief <onboarding@resend.dev>',
      to: process.env.NEWSLETTER_TO || 'wjshin2450@gmail.com', // 대표 수신자
      bcc: subscriberEmails, // 구독자끼리 주소가 보이지 않도록 숨은참조
      subject: `[CEO Daily Brief] 새 기사가 발행되었습니다: ${subjectTitle}`,
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #111;">
          <p style="color: #990000; font-weight: bold; font-size: 12px; letter-spacing: 1px;">${safeCategory}</p>
          <h1 style="font-size: 24px; margin-bottom: 20px;">${safeTitle}</h1>
          <p style="color: #666; font-size: 14px; margin-bottom: 30px;">
            CEO Daily Brief에 새로운 기사가 업데이트 되었습니다. 지금 바로 확인해 보세요.
          </p>
          <a href="${articleUrl}"
             style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; font-family: sans-serif;">
            기사 전문 읽기
          </a>
        </div>
      `,
    });

    if (resendError) {
      // 발송 실패 시 선점 표시를 되돌려 재시도 가능하게 함
      await supabaseAdmin.from('articles').update({ newsletter_sent_at: null }).eq('id', article.id);
      throw new Error(resendError.message);
    }

    return NextResponse.json({ message: '뉴스레터 발송 성공', data });
  } catch (error: unknown) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}












