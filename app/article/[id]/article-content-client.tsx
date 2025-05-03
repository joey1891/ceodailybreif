'use client';

import { useEffect, useState } from 'react';

const ArticleContent = ({ content }: { content: string }) => {
  const [processedContent, setProcessedContent] = useState(content);

  useEffect(() => {
    console.log("원본 콘텐츠:", content); // 디버깅용
    
    // 유튜브 비디오 ID 추출
    const extractYouTubeVideoId = (url: string): string | null => {
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[7] && match[7].length === 11) ? match[7] : null;
    };

    // 유튜브 URL 찾기 (href 속성에서 추출)
    const findYouTubeUrls = (text: string): string[] => {
      // href 속성 내의 유튜브 URL을 찾는 정규식
      const youtubeHrefRegex = /href="(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[^"]+)"/g;
      const urls: string[] = [];
      let match;

      while ((match = youtubeHrefRegex.exec(text)) !== null) {
        // 정규식의 첫 번째 캡처 그룹(match[1])에 실제 URL이 있습니다.
        const url = match[1];
        urls.push(url);
      }

      return urls;
    };

    // 콘텐츠 처리
    try {
      // 원본 콘텐츠 유지 - 안전한 접근
      let result = content;
      
      // 유튜브 URL 찾기
      const youtubeUrls = findYouTubeUrls(content);
      console.log("발견된 유튜브 URL:", youtubeUrls); // 디버깅용
      
      // 유튜브 임베드 추가
      if (youtubeUrls.length > 0) {
        const videoId = extractYouTubeVideoId(youtubeUrls[0]);
        console.log("추출된 비디오 ID:", videoId); // 디버깅용
        
        if (videoId) {
          const embedHtml = `
            <div class="youtube-embed my-6">
              <iframe 
                src="https://www.youtube.com/embed/${videoId}" 
                width="100%" 
                height="400"
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen
                class="rounded-lg"
              ></iframe>
            </div>
          `;
          
          // 임베드 추가 (원본 콘텐츠 앞에)
          result = embedHtml + result;
        }
      }
      
      console.log("처리된 콘텐츠:", result); // 디버깅용
      setProcessedContent(result);
    } catch (error) {
      console.error("콘텐츠 처리 오류:", error);
      // 오류 발생 시 원본 콘텐츠 유지
      setProcessedContent(content);
    }
  }, [content]);
  
  // 콘텐츠가 비어있으면 안내 메시지 표시
  if (!processedContent || processedContent.trim() === '') {
    return <div className="p-4 bg-yellow-50 rounded-md">콘텐츠를 불러올 수 없습니다.</div>;
  }
  
  return <div dangerouslySetInnerHTML={{ __html: processedContent }} className="article-content prose max-w-none" />;
};

export default ArticleContent;
