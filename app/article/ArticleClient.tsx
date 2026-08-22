'use client';

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/utils/supabase';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const LANGUAGES = [
  { code: 'en', name: '🇺🇸 English (Original)' },
  { code: 'ko', name: '🇰🇷 한국어' },
  { code: 'ja', name: '🇯🇵 日本語' },
  { code: 'zh-CN', name: '🇨🇳 中文' },
  { code: 'ru', name: '🇷🇺 Русский' },
  { code: 'mn', name: '🇲🇳 Монгол' },
  { code: 'vi', name: '🇻🇳 Tiếng Việt' }
];

// 💡 다국어 지원 사전 (구독 및 댓글 UI 텍스트)
const uiDict: Record<string, any> = {
  'en': {
    title: "Enjoyed this article?",
    desc: "Subscribe to CEO Daily Brief and get core insights into the South Korean market delivered to your inbox every morning.",
    placeholder: "Your email address",
    button: "SUBSCRIBE",
    success: "Successfully subscribed! Welcome to CEO Daily Brief.",
    duplicate: "This email is already subscribed.",
    error: "An error occurred during subscription.",
    commentTitle: "Comments",
    commentName: "Name",
    commentText: "Add a comment...",
    commentBtn: "Post Comment",
    noComments: "No comments yet. Be the first to share your thoughts!"
  },
  'ko': {
    title: "이 기사가 마음에 드셨나요?",
    desc: "CEO Daily Brief를 구독하고 한국 시장의 핵심 인사이트를 매일 아침 메일로 받아보세요.",
    placeholder: "이메일 주소 입력",
    button: "구독하기",
    success: "환영합니다! 성공적으로 구독되었습니다.",
    duplicate: "이미 구독 중인 이메일입니다.",
    error: "구독 중 오류가 발생했습니다.",
    commentTitle: "댓글",
    commentName: "이름",
    commentText: "댓글을 남겨보세요...",
    commentBtn: "등록",
    noComments: "아직 댓글이 없습니다. 첫 번째 의견을 남겨보세요!"
  },
  'ja': {
    title: "この記事が気に入りましたか？",
    desc: "CEO Daily Briefを購読して、韓国市場の重要な洞察を毎朝メールで受け取りましょう。",
    placeholder: "メールアドレスを入力",
    button: "購読する",
    success: "購読が完了しました！",
    duplicate: "既に購読しているメールアドレスです。",
    error: "購読中にエラーが発生しました。",
    commentTitle: "コメント",
    commentName: "名前",
    commentText: "コメントを追加...",
    commentBtn: "投稿する",
    noComments: "まだコメントはありません。最初のコメントを投稿しましょう！"
  },
  'zh-CN': {
    title: "喜欢这篇文章吗？",
    desc: "订阅 CEO Daily Brief，每天早上将韩国市场的核心洞察发送到您的收件箱。",
    placeholder: "输入您的电子邮件地址",
    button: "订阅",
    success: "订阅成功！",
    duplicate: "此邮箱已订阅。",
    error: "订阅时发生错误。",
    commentTitle: "评论",
    commentName: "名字",
    commentText: "添加评论...",
    commentBtn: "发表评论",
    noComments: "暂无评论。来做第一个发表看法的人吧！"
  },
  'ru': {
    title: "Понравилась статья?",
    desc: "Подпишитесь на CEO Daily Brief и получайте ключевые идеи корейского рынка каждое утро.",
    placeholder: "Ваш email адрес",
    button: "ПОДПИСАТЬСЯ",
    success: "Вы успешно подписались!",
    duplicate: "Этот email уже подписан.",
    error: "Произошла ошибка при подписке.",
    commentTitle: "Комментарии",
    commentName: "Имя",
    commentText: "Добавить комментарий...",
    commentBtn: "Опубликовать",
    noComments: "Пока нет комментариев. Поделитесь своими мыслями первым!"
  },
  'mn': {
    title: "Энэ нийтлэл танд таалагдсан уу?",
    desc: "CEO Daily Brief-т бүртгүүлж, Өмнөд Солонгосын зах зээлийн гол мэдээллийг өглөө бүр имэйлээрээ аваарай.",
    placeholder: "Таны имэйл хаяг",
    button: "БҮРТГҮҮЛЭХ",
    success: "Амжилттай бүртгүүллээ!",
    duplicate: "Энэ имэйл аль хэдийн бүртгэгдсэн байна.",
    error: "Бүртгүүлэх үед алдаа гарлаа.",
    commentTitle: "Сэтгэгдэл",
    commentName: "Нэр",
    commentText: "Сэтгэгдэл үлдээх...",
    commentBtn: "Нийтлэх",
    noComments: "Одоогоор сэтгэгдэл алга. Анхны сэтгэгдлийг үлдээгээрэй!"
  },
  'vi': {
    title: "Bạn có thích bài viết này không?",
    desc: "Đăng ký CEO Daily Brief và nhận những thông tin cốt lõi về thị trường Hàn Quốc mỗi sáng.",
    placeholder: "Địa chỉ email của bạn",
    button: "ĐĂNG KÝ",
    success: "Đăng ký thành công!",
    duplicate: "Email này đã được đăng ký.",
    error: "Đã xảy ra lỗi khi đăng ký.",
    commentTitle: "Bình luận",
    commentName: "Tên",
    commentText: "Thêm bình luận...",
    commentBtn: "Đăng bình luận",
    noComments: "Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ suy nghĩ của bạn!"
  }
};

function ArticleContent() {
  const searchParams = useSearchParams() as any;
  const articleId = searchParams?.get('id');
  const initialLang = searchParams?.get('lang') || 'en'; 

  const [article, setArticle] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentLang, setCurrentLang] = useState(initialLang);
  const [displayTitle, setDisplayTitle] = useState('');
  const [displayContent, setDisplayContent] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // 구독 폼 State
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  // 💡 댓글 기능 전용 State
  const [comments, setComments] = useState<any[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isAsianLang = ['ko', 'ja', 'zh-CN', 'mn', 'vi'].includes(currentLang);
  const titleFontClass = isAsianLang ? 'font-sans font-black tracking-tight' : 'font-serif font-black';
  const bodyFontClass = isAsianLang 
    ? 'prose-p:font-sans prose-p:font-medium prose-p:tracking-wide prose-p:leading-relaxed' 
    : 'font-serif leading-loose';

  const getAvailableText = (articleData: any, fieldName: 'title' | 'content', targetLang: string) => {
    if (!articleData) return { text: '', hasExactLang: false };
    if (targetLang === 'en') return { text: articleData[fieldName] || '', hasExactLang: true };
    if (articleData.translations?.[targetLang]?.[fieldName]?.trim() !== '') {
      return { text: articleData.translations[targetLang][fieldName], hasExactLang: true };
    }
    return { text: articleData[fieldName] || '', hasExactLang: false };
  };

  const applyLanguage = async (articleData: any, langCode: string) => {
    setCurrentLang(langCode);
    if (typeof window !== 'undefined') {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('lang', langCode);
      window.history.replaceState({}, '', newUrl.toString());
    }

    const titleInfo = getAvailableText(articleData, 'title', langCode);
    const contentInfo = getAvailableText(articleData, 'content', langCode);

    if (titleInfo.hasExactLang && contentInfo.hasExactLang) {
      setDisplayTitle(titleInfo.text); setDisplayContent(contentInfo.text); return;
    }

    setIsTranslating(true);
    try {
      let translatedTitle = titleInfo.text;
      if (!titleInfo.hasExactLang && titleInfo.text) {
        const titleRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(titleInfo.text)}`);
        const titleData = await titleRes.json();
        translatedTitle = titleData[0].map((item: any) => item[0]).join('');
      }

      let finalHtml = contentInfo.text;
      if (!contentInfo.hasExactLang && contentInfo.text) {
        let textToTranslate = contentInfo.text;
        const blocks: string[] = []; const tags: string[] = [];

        textToTranslate = textToTranslate.replace(/<(style|script)[^>]*>[\s\S]*?<\/\1>/gi, (m: string) => { blocks.push(m); return ` __B${blocks.length - 1}__ `; });
        textToTranslate = textToTranslate.replace(/<[^>]+>/g, (m: string) => { tags.push(m); return ` __T${tags.length - 1}__ `; });

        const contentRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t`, {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ q: textToTranslate })
        });
        const contentData = await contentRes.json();
        let translatedText = contentData[0].map((item: any) => item[0]).join('');

        const parseIndex = (str: string) => Number(str.replace(/[０-９]/g, (c: string) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)));
        finalHtml = translatedText.replace(/__\s*T\s*([\d０-９]+)\s*__/gi, (m: string, p1: string) => tags[parseIndex(p1)] || '');
        finalHtml = finalHtml.replace(/__\s*B\s*([\d０-９]+)\s*__/gi, (m: string, p1: string) => blocks[parseIndex(p1)] || '');
        finalHtml = finalHtml.replace(/__\s*[TB]\s*[\d０-９]+\s*__/gi, '');
      }

      setDisplayTitle(translatedTitle); setDisplayContent(finalHtml);
    } catch (error) {
      console.error("Translation Error:", error); alert('번역 서버와의 통신에 실패했습니다.');
    } finally { setIsTranslating(false); }
  };

  const fetchComments = async () => {
    if (!articleId) return;
    const { data } = await supabase.from('comments').select('*').eq('article_id', String(articleId)).order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  useEffect(() => {
    if (articleId) {
      const fetchArticle = async () => {
        const { data } = await supabase.from('articles').select('*').eq('id', articleId).single();
        if (data) { setArticle(data); applyLanguage(data, initialLang); }
        setIsLoading(false);
      };
      fetchArticle();
      fetchComments(); // 💡 댓글 목록 불러오기
    } else {
      setIsLoading(false);
    }
  }, [articleId]);

  const handleLanguageChange = (langCode: string) => { if (!article) return; applyLanguage(article, langCode); };

  const handleShare = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = `https://ceodailybrief.com/article?id=${article?.id}&lang=${currentLang}`;
    try {
      if (navigator.share) await navigator.share({ title: displayTitle || article?.title, url: shareUrl });
      else throw new Error('Not supported');
    } catch (err) {
      try { if (navigator.clipboard) { await navigator.clipboard.writeText(shareUrl); alert('기사 링크가 클립보드에 복사되었습니다.'); }
      } catch (e) { alert('링크 복사에 실패했습니다.'); }
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault(); if (!subscribeEmail) return;
    setIsSubscribing(true);
    const t = uiDict[currentLang] || uiDict['en'];
    try {
      const { error } = await supabase.from('subscribers').insert([{ email: subscribeEmail }]);
      if (error) { if (error.code === '23505') alert(t.duplicate); else alert(t.error + ': ' + error.message); } 
      else { alert(t.success); setSubscribeEmail(''); }
    } catch (err) { alert(t.error); } finally { setIsSubscribing(false); }
  };

  // 💡 댓글 등록 핸들러
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentText.trim()) return;
    setIsSubmittingComment(true);
    
    const { error } = await supabase.from('comments').insert([{
      article_id: String(articleId),
      author_name: commentName.trim(),
      content: commentText.trim()
    }]);

    setIsSubmittingComment(false);
    
    if (!error) {
      setCommentName('');
      setCommentText('');
      fetchComments(); // 목록 새로고침
    } else {
      alert('Error posting comment: ' + error.message);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc] text-black">Loading article...</div>;
  if (!article) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] text-black"><h1 className="text-2xl mb-4">기사를 찾을 수 없습니다.</h1><Link href="/" className="text-blue-600 underline">홈으로 돌아가기</Link></div>;

  const t = uiDict[currentLang] || uiDict['en'];

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-[#111111] font-sans selection:bg-black selection:text-white pb-20">
      <header className="border-b border-gray-200 py-4 px-6 mb-10 flex justify-between items-center">
        <Link href="/" className="font-black font-serif text-xl tracking-tighter uppercase hover:text-red-800 transition-colors">
          CEO Daily Brief
        </Link>
        <Link href={`/news?category=${encodeURIComponent(article.category)}`} className="text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-black">
          {article.category}
        </Link>
      </header>

      <article className="max-w-3xl mx-auto px-4" style={{ display: 'block', textAlign: 'left' }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-100 pb-4">
          <span className="text-red-800 font-bold text-sm tracking-widest uppercase">{article.category}</span>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select value={currentLang} onChange={(e) => handleLanguageChange(e.target.value)} disabled={isTranslating} className="bg-white border border-gray-300 text-xs font-bold py-1.5 px-3 rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer disabled:opacity-50">
              {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
            </select>
            <button onClick={handleShare} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-1.5 px-4 rounded-md transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              Share
            </button>
          </div>
        </div>

        {isTranslating && <div className="text-[10px] text-red-600 mb-4 font-bold uppercase tracking-widest animate-pulse text-center">Translating...</div>}

        <div style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }} className="mb-10">
          <h1 className={`text-4xl md:text-5xl lg:text-6xl leading-[1.15] mb-6 break-words ${titleFontClass}`} style={{ textAlign: 'left', width: '100%' }}>{displayTitle}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 font-serif italic border-y border-gray-200 py-3 w-full" style={{ justifyContent: 'flex-start' }}>
            <span className="font-bold text-black font-sans uppercase not-italic">By {article.author_name || 'Editor-in-Chief'}</span>
            <span>|</span>
            <span>Published: {new Date(article.created_at).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'})}</span>
          </div>
        </div>

        {article.image_url && (
          <div className="mb-12 w-full">
            <img src={article.image_url} alt="Article main" className="w-full h-auto object-cover rounded-sm grayscale-[10%]" />
          </div>
        )}

        <div className={`prose prose-lg max-w-none text-gray-800 prose-img:rounded-sm prose-a:text-red-700 hover:prose-a:text-red-900 ${bodyFontClass}`} style={{ textAlign: 'left' }} dangerouslySetInnerHTML={{ __html: displayContent }} />

        {/* 💡 작성자 프로필 섹션 (동그라미 ➔ 직사각형(aspect-[3/4]) 변경) */}
        {(article?.author_image_url || article?.author_bio) && (
          <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-gray-50 p-6 rounded-lg">
            {article.author_image_url && (
              <div className="shrink-0">
                <img 
                  src={article.author_image_url} 
                  alt={article.author_name || 'Author'} 
                  className="w-24 sm:w-28 aspect-[3/4] rounded-md object-cover border border-gray-300 shadow-sm"
                />
              </div>
            )}
            <div className="flex flex-col text-center sm:text-left w-full mt-2 sm:mt-0">
              <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mb-1">
                Written By
              </span>
              <h3 className="text-lg font-bold text-gray-900 mb-2 font-serif">
                {article.author_name || 'Editor-in-Chief'}
              </h3>
              {article.author_bio && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {article.author_bio}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 뉴스레터 구독 폼 */}
        <div className="mt-12 p-8 md:p-10 bg-[#f4f4f4] border border-gray-200 rounded-xl text-center shadow-sm">
          <h3 className={`text-2xl md:text-3xl font-black mb-3 ${isAsianLang ? 'font-sans tracking-tight' : 'font-serif tracking-tight'}`}>{t.title}</h3>
          <p className="text-gray-600 font-bold mb-6 text-sm md:text-base max-w-lg mx-auto leading-relaxed">{t.desc}</p>
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input type="email" placeholder={t.placeholder} required value={subscribeEmail} onChange={(e) => setSubscribeEmail(e.target.value)} className="flex-1 px-4 py-3 border border-gray-300 rounded-md text-black focus:outline-none focus:border-black focus:ring-1 focus:ring-black" />
            <button type="submit" disabled={isSubscribing} className="bg-blue-950 text-white px-8 py-3 rounded-md font-bold uppercase tracking-widest hover:bg-blue-800 transition-colors whitespace-nowrap disabled:bg-gray-400">
              {isSubscribing ? '...' : t.button}
            </button>
          </form>
        </div>

        {/* 💬 댓글 (Comments) 섹션 */}
        <div className="mt-16 border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            {t.commentTitle} <span className="text-sm bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">{comments.length}</span>
          </h3>

          <form onSubmit={handleCommentSubmit} className="mb-10 bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder={t.commentName}
                required
                maxLength={30}
                value={commentName}
                onChange={(e) => setCommentName(e.target.value)}
                className="w-full sm:w-1/3 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
              />
              <textarea 
                placeholder={t.commentText}
                required
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-black resize-none"
              />
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSubmittingComment}
                  className="bg-black text-white px-6 py-2 rounded font-bold text-sm hover:bg-gray-800 transition disabled:bg-gray-400"
                >
                  {isSubmittingComment ? '...' : t.commentBtn}
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="bg-gray-50 p-4 sm:p-5 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-gray-900">{comment.author_name}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-10 bg-gray-50 rounded border border-gray-100 border-dashed">
                {t.noComments}
              </p>
            )}
          </div>
        </div>

      </article>
    </div>
  );
}

export default function ArticleClient() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-black">Loading...</div>}>
      <ArticleContent />
    </Suspense>
  );
}
