"use client";

import { useEffect } from 'react';

// Kakao API 키 (환경 변수로 관리하는 것을 권장합니다)
const KAKAO_API_KEY = '0bbb8e7bb04d99385a87998c64580b1b';

// 전역 window 객체에 Kakao 타입을 선언하면 타입스크립트에서 더 안전하게 사용할 수 있습니다.
// 예: types/kakao.d.ts 파일 생성 후
// declare global {
//   interface Window {
//     Kakao?: {
//       init: (apiKey: string) => void;
//       isInitialized: () => boolean;
//       // 필요한 다른 Kakao SDK 함수들...
//     };
//   }
// }

export function KakaoScriptInitializer() {
  useEffect(() => {
    const kakao = (window as any).Kakao;

    if (!kakao) {
      const script = document.createElement('script');
      script.src = "https://developers.kakao.com/sdk/js/kakao.js";
      script.async = true;
      script.onload = () => {
        if ((window as any).Kakao) {
          (window as any).Kakao.init(KAKAO_API_KEY);
          console.log("Kakao SDK initialized after script load.");
        } else {
          console.error("Kakao SDK loaded, but Kakao object not found on window.");
        }
      };
      script.onerror = () => {
        console.error("Failed to load Kakao SDK script.");
      };
      document.head.appendChild(script);
    } else if (kakao && typeof kakao.isInitialized === 'function' && !kakao.isInitialized()) {
      kakao.init(KAKAO_API_KEY);
      console.log("Kakao SDK initialized (already loaded).");
    } else if (kakao && typeof kakao.isInitialized === 'function' && kakao.isInitialized()) {
      console.log("Kakao SDK already initialized.");
    }
  }, []);

  return null; // 이 컴포넌트는 UI를 렌더링하지 않습니다.
} 