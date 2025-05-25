'use client';

import { useState, useEffect } from 'react';

const ArticleContent = ({ content }: { content: string }) => {
  // 서버에서 이미 처리된 콘텐츠를 받으므로, 클라이언트 측 useEffect 로직은 제거합니다.
  // const [processedContent, setProcessedContent] = useState(content);

  // useEffect(() => {
  //   console.log("원본 콘텐츠:", content); // 디버깅용
    
  //   // 유튜브 비디오 ID 추출 로직 제거
  //   // 유튜브 URL 찾기 로직 제거
  //   // 콘텐츠 처리 로직 제거
    
  //   // setProcessedContent(content); // 서버에서 온 content를 그대로 사용
  // }, [content]);
  
  // 콘텐츠가 비어있으면 안내 메시지 표시
  if (!content || content.trim() === '') {
    return <div className="p-4 bg-yellow-50 rounded-md">콘텐츠를 불러올 수 없습니다.</div>;
  }
  
  // 서버에서 이미 처리된 content를 직접 사용
  return <div dangerouslySetInnerHTML={{ __html: content }} className="article-content prose max-w-none" />;
};

export default ArticleContent;
