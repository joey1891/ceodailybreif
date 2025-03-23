"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Define an interface for the about me data structure
interface AboutMeData {
  profile_image_url?: string;
  name: string;
  title: string;
  introduction: string;
  career?: string[];
  industry_expertise?: string[];
  area_of_expertise?: string[];
  updated_at: string;
}

export default function AboutPage() {
  const [aboutMeData, setAboutMeData] = useState<AboutMeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAboutMeData() {
      try {
        // 최신 데이터를 가져오기 위해 updated_at 기준으로 정렬
        const { data, error } = await supabase
          .from("about_me")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (error) {
          setError(error?.message ?? null);
        } else {
          setAboutMeData(data);
        }
      } catch (err: any) {
        setError(err?.message ?? 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchAboutMeData();
  }, []);

  if (isLoading) return <div className="container max-w-4xl mx-auto px-4 py-12">로딩 중...</div>;
  if (error) return <div className="container max-w-4xl mx-auto px-4 py-12">데이터를 불러오는 중 오류가 발생했습니다.</div>;
  if (!aboutMeData) return <div className="container max-w-4xl mx-auto px-4 py-12">프로필 정보가 없습니다.</div>;

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 select-none">About Me</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 프로필 이미지 섹션 */}
        <div className="md:col-span-1">
          <Card className="bg-white border-0 shadow-md">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="w-48 h-48 relative mb-4 rounded-full overflow-hidden">
                <Image
                  src={aboutMeData.profile_image_url || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                  alt={aboutMeData.name}
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="text-xl font-bold mb-2 select-none">{aboutMeData.name}</h2>
              <p className="text-gray-500 text-center select-none">{aboutMeData.title}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* 소개 및 프로필 정보 섹션 */}
        <div className="md:col-span-2">
          <Card className="bg-white border-0 shadow-md mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold select-none">소개</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 select-none leading-relaxed">
                {aboutMeData.introduction}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold select-none">경력</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 select-none">
                {aboutMeData.career && aboutMeData.career.map((item, index) => (
                  <li key={index} className="flex">
                    <span className="font-medium min-w-28">{index === 0 ? '현' : '전'}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 전문분야 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card className="bg-white border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold select-none">전문산업분야</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-2 select-none">
              {aboutMeData.industry_expertise && aboutMeData.industry_expertise.map((item, index) => (
                <li key={index} className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold select-none">전문영역</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-2 select-none">
              {aboutMeData.area_of_expertise && aboutMeData.area_of_expertise.map((item, index) => (
                <li key={index} className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// 관리자/프로필 편집 페이지에서 사용하는 이미지 업로드 함수
const uploadProfileImage = async (file: File | null) => {
  try {
    // 파일이 없으면 함수 종료
    if (!file) return null;

    // 파일명 생성 (중복 방지를 위해 타임스탬프 추가)
    const fileName = `profile-${Date.now()}.${file?.name?.split('.').pop()}`;
    console.log("Uploading new image:", fileName);
    
    // 'images' 버킷의 'about_me' 폴더에 업로드
    const { data, error } = await supabase.storage
      .from('images')                      // 'images' 버킷 사용
      .upload(`about_me/${fileName}`, file, { // 'about_me' 폴더 지정
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error("Error uploading image:", error);
      return null;
    }
    
    // 업로드된 이미지의 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(`about_me/${fileName}`);
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error in image upload process:", error);
    return null;
  }
};
