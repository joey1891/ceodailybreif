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
  onChange: (val: string) => void;
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
// imageUploader: {
    upload: async (file: File) => {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `articles/${fileName}`;
      
        // Supabase Storage 업로드
        const { data, error } = await supabase.storage.from("images").upload(filePath, file);
        if (error) {
          console.error("Image upload error:", error);
          throw error;
        }
      
        // public URL로 변환
        // (공개 버킷이거나, public URL을 만들 수 있는 설정이 되어 있어야 합니다)
        const { data: publicUrlData } = supabase.storage
          .from("images")
          .getPublicUrl(filePath);
      
        // 에디터에 삽입될 <img src="..."> 경로
        return publicUrlData.publicUrl;
      },
      
  },
};

export default function EditorWithUploader({ value, onChange }: Props) {
  return (
    <ReactQuill
      theme="snow"
      value={value}
      onChange={onChange}
      modules={modules}
      style={{ minHeight: 300 }}
    />
  );
}
