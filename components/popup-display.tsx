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
    popupData.forEach((popup, index) => {
      // Create HTML content for popup window
      const htmlContent = `
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
              `<a href="${popup.link_url}" target="_blank"><img src="${popup.image_url}" alt="${popup.title}" class="popup-image"></a>` :
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
            ${popup.link_url && popup.image_url ? 
              `document.querySelector('.popup-image').addEventListener('click', function() {
                window.open('${popup.link_url}', '_blank');
              });` : ''
            }
          </script>
        </body>
        </html>
      `;

      // Configure popup window position
      const width = 600;
      const height = 700;
      const left = (index * 50) + window.screenX;
      const top = (index * 50) + window.screenY;
      
      // Open popup in new window
      const popupWindow = window.open(
        '',
        `popup_${index}`,
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
      );

      if (popupWindow) {
        popupWindow.document.write(htmlContent);
        popupWindow.document.close();
        
        // Store reference to close later if needed
        popupWindowsRef.current[index] = popupWindow;
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