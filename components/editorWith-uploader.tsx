"use client"; 

import React from "react";
import ReactQuill from "react-quill";
import Quill from "quill";
import ImageUploader from "quill-image-uploader";
import { supabase } from "@/lib/supabase";

import "react-quill/dist/quill.snow.css";
import "quill-image-uploader/dist/quill.imageUploader.min.css";

// 플러그인 등록
Quill.register("modules/imageUploader", ImageUploader);

interface Props {
  value: string;
  onChangeAction: (val: string) => void;
}

// 모듈 설정
const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    ["blockquote", "code-block"],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ direction: "rtl" }],
    [{ color: [] }, { background: [] }],
    [{ font: [] }],
    [{ align: [] }],
    // 이미지 버튼 추가
    ["image"],
    ["clean"],
  ],
  imageUploader: {
    upload: async (file: File) => {
      // 파일 확장자 추출 및 안전한 파일명 생성
      const fileExt = file.name.split('.').pop() || '';
      const originalFileName = file.name;
      const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `articles/${safeFileName}`;
      
      console.log("원본 파일명:", originalFileName);
      console.log("업로드 경로:", filePath);
      
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        console.error("이미지 파일이 아닙니다:", file.type);
        throw new Error('이미지 파일만 업로드 가능합니다');
      }
      
      // 파일 크기 체크 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        console.error("파일 크기 초과:", file.size);
        throw new Error('이미지 크기는 5MB 이하여야 합니다');
      }

      try {
        const { data, error } = await supabase.storage
          .from('images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          console.error("이미지 업로드 오류:", error);
          console.error("실패한 파일 정보:", {
            name: originalFileName,
            encodedName: encodeURIComponent(originalFileName),
            size: file.size,
            type: file.type
          });
          throw error;
        }
        
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
        
        console.log("이미지 업로드 성공, URL:", urlData.publicUrl);
        return urlData.publicUrl;
      } catch (error) {
        console.error("이미지 업로드 실패:", error);
        throw error;
      }
    },
  },
};

export default function EditorWithUploader({ value, onChangeAction }: Props) {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChangeAction}
      modules={modules}
      style={{ minHeight: 300 }}
    />
  );
}
