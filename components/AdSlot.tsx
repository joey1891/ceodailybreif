Copy'use client';

// 광고 배너 1칸. 클라이언트 컴포넌트지만 서버에서 HTML로 먼저 그려지므로
// 이미지 src / alt / 링크 / 텍스트가 검색엔진에 그대로 보입니다.

import { useState } from 'react';
import type { Ad } from '@/lib/seo';
import { isVideoFile } from '@/lib/seo';

type Variant = 'wide' | 'box' | 'tall' | 'banner';

const getYoutubeSrc = (id: string, autoplay: boolean) => {
  if (!autoplay) return `https://www.youtube.com/embed/${id}?rel=0`;
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&loop=1&playlist=${id}&iv_load_policy=3&disablekb=1&cc_load_policy=0&cc_lang_pref=zz`;
};

const getCoverStyle = (autoplay: boolean, scale: number = 1.0): React.CSSProperties => {
  if (!autoplay) return { width: '100%', height: '100%' };
  return {
    position: 'absolute', top: '50%', left: '50%',
    transform: `translate(-50%, -50%) scale(${scale})`,
    width: '100%', height: '100%', pointerEvents: 'none',
  };
};

function Media({ url, alt }: { url: string; alt: string }) {
  if (isVideoFile(url)) {
    return <video src={url} autoPlay loop muted playsInline aria-label={alt} className="w-full h-full object-cover" />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} loading="lazy" className="w-full h-full object-cover" />;
}

function TextOverlay({ ad }: { ad: Ad }) {
  if (!ad.has_text || !ad.text_content) return null;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute p-3 flex"
        style={{
          left: `${ad.text_x ?? 10}%`,
          top: `${ad.text_y ?? 10}%`,
          width: `${ad.text_w ?? 50}%`,
          height: `${ad.text_h ?? 50}%`,
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: ad.text_content }} className="prose-p:m-0 w-full h-full" />
      </div>
    </div>
  );
}

export default function AdSlot({ ad, variant }: { ad: Ad | null | undefined; variant: Variant }) {
  const [modalOpen, setModalOpen] = useState(false);
  if (!ad || !ad.is_visible) return null;

  const alt = ad.alt_text || ad.description || 'CEO Daily Brief sponsor';
  // 유료 광고 링크는 rel="sponsored" 로 표시 (구글 정책)
  const linkRel = 'sponsored noopener noreferrer';

  const youtubeFrame = ad.is_youtube && ad.youtube_id ? (
    <>
      <iframe
        title={alt}
        style={getCoverStyle(!!ad.autoplay, ad.youtube_scale ?? 1)}
        src={getYoutubeSrc(ad.youtube_id, !!ad.autoplay)}
        allow="autoplay; encrypted-media"
        allowFullScreen={!ad.autoplay}
        loading="lazy"
      />
      {ad.autoplay && (
        <button
          type="button"
          aria-label={`Play video: ${alt}`}
          onClick={() => setModalOpen(true)}
          className="absolute inset-0 z-10 block cursor-pointer"
        />
      )}
    </>
  ) : null;

  let body: React.ReactNode = null;

  if (variant === 'wide') {
    body = youtubeFrame ? (
      <div className="relative w-full aspect-video bg-black rounded overflow-hidden shadow-md my-2 sm:my-0">{youtubeFrame}</div>
    ) : ad.image_url ? (
      <div className="w-full my-2 sm:my-0 rounded overflow-hidden shadow-md border border-gray-200">
        <a href={ad.link_url || '#'} target="_blank" rel={linkRel} className="block relative w-full">
          <Media url={ad.image_url} alt={alt} />
          <TextOverlay ad={ad} />
        </a>
      </div>
    ) : null;
  } else if (variant === 'box') {
    body = (
      <div className="flex justify-center w-full">
        {youtubeFrame ? (
          <div className="w-[300px] h-[250px] bg-black relative overflow-hidden rounded">{youtubeFrame}</div>
        ) : ad.image_url ? (
          <a href={ad.link_url || '#'} target="_blank" rel={linkRel} className="block w-[300px] h-[250px] relative rounded overflow-hidden border border-gray-200">
            <Media url={ad.image_url} alt={alt} />
            <TextOverlay ad={ad} />
          </a>
        ) : null}
      </div>
    );
  } else if (variant === 'tall') {
    body = (
      <div className="flex-1 w-full relative pb-8 min-h-[600px]">
        {youtubeFrame ? (
          <div className="absolute inset-0 bottom-8 w-full bg-black overflow-hidden rounded">{youtubeFrame}</div>
        ) : ad.image_url ? (
          <a href={ad.link_url || '#'} target="_blank" rel={linkRel} className="absolute inset-0 bottom-8 block w-full rounded overflow-hidden border border-gray-200">
            <Media url={ad.image_url} alt={alt} />
            <TextOverlay ad={ad} />
          </a>
        ) : null}
      </div>
    );
  } else {
    body = (
      <div className="max-w-7xl mx-auto px-4 mb-16">
        {youtubeFrame ? (
          <div className="relative w-full aspect-video sm:aspect-[21/9] md:aspect-[24/9] bg-black rounded overflow-hidden shadow-lg border border-gray-200">{youtubeFrame}</div>
        ) : ad.image_url ? (
          <a href={ad.link_url || '#'} target="_blank" rel={linkRel} className="block relative w-full rounded overflow-hidden shadow-lg border border-gray-200">
            <Media url={ad.image_url} alt={alt} />
            <TextOverlay ad={ad} />
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {body}
      {modalOpen && ad.youtube_id && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setModalOpen(false)}>
          <div className="relative w-full max-w-5xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModalOpen(false)} className="absolute -top-12 right-0 text-white font-bold text-3xl hover:text-gray-300 transition-colors" title="Close">✕</button>
            <div className="w-full aspect-video bg-black rounded-t-lg shadow-2xl overflow-hidden">
              <iframe
                title={alt}
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${ad.youtube_id}?autoplay=1&controls=1&rel=0&cc_load_policy=0&cc_lang_pref=zz`}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
            {(ad.description || ad.link_url || ad.file_url) && (
              <div className="bg-[#111] p-6 rounded-b-lg shadow-lg flex flex-col gap-4">
                {ad.description && <p className="text-white whitespace-pre-wrap leading-relaxed">{ad.description}</p>}
                <div className="flex flex-wrap gap-4 mt-2">
                  {ad.link_url && <a href={ad.link_url} target="_blank" rel={linkRel} className="bg-red-800 text-white px-6 py-2.5 rounded-full font-bold hover:bg-red-900 transition shadow-sm text-sm">웹페이지 링크 이동</a>}
                  {ad.file_url && <a href={ad.file_url} target="_blank" rel="noopener noreferrer" className="bg-gray-700 text-white px-6 py-2.5 rounded-full font-bold hover:bg-gray-600 transition shadow-sm text-sm">파일 다운로드 (Download)</a>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}








