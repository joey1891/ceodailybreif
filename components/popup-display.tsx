"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Popup } from "@/types/popup";

export default function PopupDisplay() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const popupWindowsRef = useRef<Window[]>([]);

  useEffect(() => {
    const checkAndFetchPopups = async () => {
      // Check if popups have been dismissed
      const dismissedUntil = localStorage.getItem("popupsDismissedUntil");
      if (dismissedUntil && new Date(dismissedUntil) > new Date()) {
        return;
      }

      const fetchActivePopups = async () => {
        try {
          const today = new Date().toISOString().slice(0, 10);
          
          const { data, error } = await supabase
            .from("popups")
            .select("*")
            .eq("is_active", true)
            .gte("end_date", today)
            .lte("start_date", today)
            .order("created_at", { ascending: false })
            .limit(3);

          if (error) throw error;
          
          if (data && data.length > 0) {
            setPopups(data);
            openPopupsInNewWindows(data);
          }
        } catch (error) {
          console.error("Error fetching popups:", error);
        }
      };

      await fetchActivePopups();
    };

    checkAndFetchPopups();

    // Close popup windows when component unmounts
    return () => {
      popupWindowsRef.current.forEach(window => {
        if (window && !window.closed) {
          window.close();
        }
      });
    };
  }, []);

  const openPopupsInNewWindows = (popupData: Popup[]) => {
    console.log("모든 팝업 데이터:", popupData);
    
    // 모든 팝업 창을 닫고 새로 설정하기
    popupWindowsRef.current.forEach(window => {
      if (window && !window.closed) {
        window.close();
      }
    });
    
    popupWindowsRef.current = [];
    
    // 표시 순서(display_order)에 따라 정렬
    const sortedPopups = [...popupData].sort((a, b) => 
      (a.display_order || 999) - (b.display_order || 999)
    );
    
    sortedPopups.forEach((popup, index) => {
      // 필요한 값들 계산
      const sizePercentage = popup.size_percentage || 80;
      
      // 기본 크기 설정 (최대 크기 제한)
      const baseWidth = 1000; // 기본 최대 너비 (픽셀)
      const baseHeight = 800; // 기본 최대 높이 (픽셀)
      
      // 퍼센티지 적용한 실제 크기 계산
      const width = Math.round((baseWidth * sizePercentage) / 100);
      const height = Math.round((baseHeight * sizePercentage) / 100);
      
      // 현재 창 위치 및 크기 기준으로 계산
      let leftPosition = 0;
      
      if (popup.position === -1) {
        // 현재 창의 중앙에 배치
        leftPosition = window.screenX + Math.round((window.innerWidth - width) / 2);
      } else if (popup.position !== undefined && popup.position !== null) {
        // 현재 창의 왼쪽 모서리 기준으로 오프셋 적용
        leftPosition = window.screenX + popup.position;
      } else {
        // 기본값: 인덱스별 계단식 배치
        leftPosition = window.screenX + (index * 50);
      }
      
      // 상단 위치 계산 (현재 창 기준)
      const topPosition = window.screenY + (index * 50);
      
      console.log(`팝업 ${index+1} (${popup.id}): 제목=${popup.title}, position=${popup.position}, 계산된 left=${leftPosition}, 크기=${sizePercentage}% (${width}x${height}px)`);
      
      // 팝업 창 열기 전에 디버깅 정보 출력
      console.log("브라우저 창 정보:", {
        screenX: window.screenX,
        screenY: window.screenY,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height
      });
      
      // 팝업 창 열기 (각 팝업에 고유 ID 사용)
      try {
        const features = `width=${width},height=${height},left=${leftPosition},top=${topPosition},resizable=yes,scrollbars=yes,status=yes`;
        console.log(`팝업 창 설정: ${features}`);
        
        const popupWindow = window.open(
          '',
          `popup_${popup.id}`, // 고유 ID로 창 식별
          features
        );
        
        // 팝업 위치를 직접 설정 (더 안정적인 방법)
        if (popupWindow) {
          popupWindow.moveTo(leftPosition, topPosition);
        }
        
        if (!popupWindow) {
          console.error("팝업 창을 열 수 없습니다. 팝업 차단을 확인해주세요.");
          return;
        }
        
        // HTML 내용 설정
        popupWindow.document.open();
        popupWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${popup.title}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                max-width: 100%;
                background-color: white;
              }
              .popup-title {
                font-size: 22px;
                font-weight: bold;
                margin-bottom: 10px;
                text-align: center;
              }
              .popup-content {
                font-size: 16px;
                margin-bottom: 20px;
                text-align: center;
              }
              .popup-image {
                max-width: 100%;
                height: auto;
                cursor: ${popup.link_url ? 'pointer' : 'default'};
                max-height: 70vh;
                margin-bottom: 20px;
              }
              .popup-buttons {
                display: flex;
                justify-content: space-between;
                width: 100%;
                max-width: 400px;
              }
              .dismiss-btn {
                padding: 8px 16px;
                background-color: #f1f1f1;
                border: 1px solid #ccc;
                border-radius: 4px;
                cursor: pointer;
              }
              .close-btn {
                padding: 8px 16px;
                background-color: #4f46e5;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
              }
            </style>
          </head>
          <body>
            <div class="popup-title">${popup.title}</div>
            ${popup.content ? `<div class="popup-content">${popup.content}</div>` : ''}
            ${popup.image_url ? 
              popup.link_url ? 
                `<a href="${popup.link_url}" target="_blank" rel="noopener noreferrer">
                  <img src="${popup.image_url}" alt="${popup.title}" class="popup-image">
                </a>` :
                `<img src="${popup.image_url}" alt="${popup.title}" class="popup-image">` 
              : ''
            }
            <div class="popup-buttons">
              <button class="dismiss-btn" onclick="dismissToday()">오늘 하루 보지 않기</button>
              <button class="close-btn" onclick="window.close()">닫기</button>
            </div>
            <script>
              function dismissToday() {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                window.opener.postMessage({type: 'DISMISS_POPUP', until: tomorrow.toISOString()}, '*');
                window.close();
              }
              
              // Debug info
              console.log("팝업 정보: id=${popup.id}, position=${popup.position}, left=${leftPosition}");
            </script>
          </body>
          </html>
        `);
        popupWindow.document.close();
        
        // 참조 저장
        popupWindowsRef.current[index] = popupWindow;
        
      } catch (error) {
        console.error("팝업 창 생성 오류:", error);
      }
    });
  };

  // Listen for message from popup window for "오늘 하루 보지 않기"
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'DISMISS_POPUP') {
        localStorage.setItem("popupsDismissedUntil", event.data.until);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Return null since we're not rendering anything in the current page
  return null;
} 