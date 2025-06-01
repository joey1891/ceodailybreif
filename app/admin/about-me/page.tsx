"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { getAdminUser } from "@/lib/admin-auth";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";

interface AboutMeData {
  id: string;
  profile_image_url: string;
  name: string;
  title: string;
  introduction: string;
  career: string[];
  industry_expertise: string[];
  area_of_expertise: string[];
}

export default function AdminAboutMePage() {
  const [aboutMeData, setAboutMeData] = useState<AboutMeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getAdminUser();
      if (!user) {
        router.push('/login');
      } else {
        setAuthChecked(true);
      }
    };
    
    checkAuth();
  }, [router]);

  // 프로필 데이터 불러오기
  useEffect(() => {
    if (!authChecked) return;
    
    const fetchAboutMeData = async () => {
      setLoading(true);
      try {
        console.log("Fetching about me data...");
        
        const { data, error } = await supabase
          .from('about_me')
          .select('*')
          .single();

        if (error) {
          console.error('Error fetching about me data:', error);
          toast.error('프로필 데이터를 불러오는 중 오류가 발생했습니다');
          
          // 오류 종류 확인 (테이블이 없는 경우)
          if (error.code === 'PGRST116') {
            console.log("Table might not exist, creating default data");
            await createDefaultData();
          }
          return;
        }

        if (data) {
          console.log("Data loaded:", data);
          setAboutMeData(data);
        } else {
          console.log("No data found, creating default");
          await createDefaultData();
        }
      } catch (err) {
        console.error('Failed to fetch about me data:', err);
        toast.error('데이터 로딩 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
    };

    const createDefaultData = async () => {
      try {
        console.log("Creating default data...");
        const { data: insertData, error: insertError } = await supabase
          .from('about_me')
          .insert([
            {
              profile_image_url: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
              name: "신원종",
              title: "바이오플러스인터내셔널 대표이사",
              introduction: "보건의료산업 관련 전반에 영향을 미치는 주요 변수들의 동향들을 살펴보고,\n관련 의사결정자들이 더 나은 판단을 할 수 있게 도움주고자 개설된 정보 플랫폼입니다.",
              career: ["바이오플러스인터내셔널 대표이사", "바이오플러스 전략기획조정실장", "GC녹십자웰빙 비즈니스이노베이션 유닛장", "코스맥스비티아이 전략기획팀장", "GC(녹십자홀딩스) 전략기획실"],
              industry_expertise: ["의료서비스", "의약품", "의료기기", "건강기능식품", "화장품", "디지털헬스케어", "디지털마케팅"],
              area_of_expertise: ["경영관리", "경영진단", "전략수립", "투자", "신사업", "사업개발"]
            }
          ])
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting default data:', insertError);
          toast.error('기본 데이터 생성 중 오류가 발생했습니다');
          return;
        }

        if (insertData) {
          console.log("Default data created:", insertData);
          setAboutMeData(insertData);
        }
      } catch (err) {
        console.error('Failed to create default data:', err);
        toast.error('기본 데이터 생성 중 오류가 발생했습니다');
      }
    };

    fetchAboutMeData();
  }, [authChecked]);

  // 이미지 파일 변경 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileName = file.name;
      console.log("Selected image file:", fileName, file.size, "Original filename encoding check:", encodeURIComponent(fileName));
      
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        toast.error('이미지 파일만 업로드 가능합니다');
        return;
      }
      
      // 파일 크기 체크 (2MB 제한)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('이미지 크기는 2MB 이하여야 합니다');
        return;
      }
      
      setImageFile(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 기본 필드 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    const value = e.target.value;
    console.log(`Updating field ${field} to:`, value);
    
    setAboutMeData(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  // 배열 필드를 위한 일반 핸들러
  const handleArrayChange = <K extends keyof AboutMeData>(
    field: K,
    index: number, 
    value: string
  ) => {
    console.log(`Updating array field ${String(field)} at index ${index} to:`, value);
    
    setAboutMeData(prev => {
      if (!prev || !Array.isArray(prev[field])) return prev;
      
      const updatedArray = [...(prev[field] as string[])];
      updatedArray[index] = value;
      return { ...prev, [field]: updatedArray };
    });
  };

  const handleAddArrayItem = <K extends keyof AboutMeData>(field: K) => {
    console.log(`Adding new item to ${String(field)}`);
    
    setAboutMeData(prev => {
      if (!prev || !Array.isArray(prev[field])) return prev;
      
      return { 
        ...prev, 
        [field]: [...(prev[field] as string[]), ""] 
      };
    });
  };

  const handleRemoveArrayItem = <K extends keyof AboutMeData>(
    field: K,
    index: number
  ) => {
    console.log(`Removing item at index ${index} from ${String(field)}`);
    
    setAboutMeData(prev => {
      if (!prev || !Array.isArray(prev[field])) return prev;
      
      const updatedArray = [...(prev[field] as string[])];
      updatedArray.splice(index, 1);
      return { ...prev, [field]: updatedArray };
    });
  };

  // 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!aboutMeData) return;
    
    setSubmitting(true);
    console.log("Submitting form with data: ", aboutMeData);
    
    try {
      // 이미지 업로드 처리
      let profileImageUrl = aboutMeData.profile_image_url;
      
      if (imageFile) {
        // 파일 확장자 추출 및 안전한 파일명 생성
        const fileExt = imageFile.name.split('.').pop() || '';
        const originalFileName = imageFile.name;
        const safeFileName = `${Date.now()}.${fileExt}`;
        const filePath = `about_me/${safeFileName}`;
        
        console.log("Original filename:", originalFileName);
        console.log("Uploading image to path:", filePath);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          console.error("Failed file details:", {
            name: originalFileName,
            encodedName: encodeURIComponent(originalFileName),
            size: imageFile.size,
            type: imageFile.type
          });
          toast.error('이미지 업로드 실패: ' + uploadError.message);
        } else {
          // 업로드 성공 시 URL 업데이트
          const { data: urlData } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);
            
          profileImageUrl = urlData.publicUrl;
          console.log("Image uploaded successfully, new URL:", profileImageUrl);
          console.log("Original filename was:", originalFileName);
        }
      }
      
      // 프로필 데이터 업데이트
      const { error: updateError } = await supabase
        .from('about_me')
        .update({
          profile_image_url: profileImageUrl,
          name: aboutMeData.name,
          title: aboutMeData.title,
          introduction: aboutMeData.introduction,
          career: aboutMeData.career,
          industry_expertise: aboutMeData.industry_expertise,
          area_of_expertise: aboutMeData.area_of_expertise
        })
        .eq('id', aboutMeData.id);
        
      if (updateError) {
        console.error("Error updating profile:", updateError);
        toast.error('프로필 업데이트 실패: ' + updateError.message);
      } else {
        toast.success('프로필이 성공적으로 업데이트되었습니다');
        // 이미지 미리보기 초기화
        setImageFile(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error('업데이트 중 오류가 발생했습니다');
    } finally {
      setSubmitting(false);
    }
  };

  if (!authChecked) return <p>인증 확인 중...</p>;
  if (loading) return <p>데이터 로딩 중...</p>;
  if (!aboutMeData) return <p>프로필 데이터를 불러올 수 없습니다</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-white">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-900">프로필 관리</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 이미지 업로드 섹션 */}
        <div className="p-4 border rounded-lg bg-white dark:bg-white">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-900">프로필 이미지</h2>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            className="mb-2 text-gray-900 dark:text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-700 dark:file:text-slate-50 dark:hover:file:bg-slate-600"
          />
          {imagePreview && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-700">현재 이미지 미리보기:</p>
              <Image src={imagePreview} alt="Preview" width={150} height={150} className="rounded" />
            </div>
          )}
          {aboutMeData?.profile_image_url && !imagePreview && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-700">현재 프로필 이미지:</p>
              <Image src={aboutMeData.profile_image_url} alt={aboutMeData.name} width={150} height={150} className="rounded" />
            </div>
          )}
        </div>
        
        {/* 기본 정보 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-700">이름</label>
            <input
              type="text"
              value={aboutMeData.name}
              onChange={(e) => handleChange(e, "name")}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-white text-gray-900 dark:text-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-700">직함</label>
            <input
              type="text"
              value={aboutMeData.title}
              onChange={(e) => handleChange(e, "title")}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-white text-gray-900 dark:text-gray-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-700">소개</label>
            <textarea
              value={aboutMeData.introduction}
              onChange={(e) => handleChange(e, "introduction")}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-white text-gray-900 dark:text-gray-900"
            />
          </div>
        </div>
        
        {/* 경력 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">경력</label>
          {aboutMeData.career.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange("career", index, e.target.value)}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-white text-gray-900 dark:text-gray-900"
              />
              <button 
                type="button" 
                onClick={() => handleRemoveArrayItem("career", index)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                삭제
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => handleAddArrayItem("career")}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            경력 추가
          </button>
        </div>
        
        {/* 산업 전문 분야 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">산업 전문 분야</label>
          {aboutMeData.industry_expertise.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange("industry_expertise", index, e.target.value)}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-white text-gray-900 dark:text-gray-900"
              />
              <button 
                type="button" 
                onClick={() => handleRemoveArrayItem("industry_expertise", index)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                삭제
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => handleAddArrayItem("industry_expertise")}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            전문 분야 추가
          </button>
        </div>
        
        {/* 업무 전문 분야 */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">업무 전문 분야</label>
          {aboutMeData.area_of_expertise.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={item}
                onChange={(e) => handleArrayChange("area_of_expertise", index, e.target.value)}
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-white text-gray-900 dark:text-gray-900"
              />
              <button 
                type="button" 
                onClick={() => handleRemoveArrayItem("area_of_expertise", index)}
                className="bg-red-500 text-white px-2 py-1 rounded"
              >
                삭제
              </button>
            </div>
          ))}
          <button 
            type="button" 
            onClick={() => handleAddArrayItem("area_of_expertise")}
            className="bg-blue-500 text-white px-3 py-1 rounded"
          >
            전문 분야 추가
          </button>
        </div>
        
        {/* 제출 버튼 */}
        <button 
          type="submit" 
          disabled={submitting}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {submitting ? "저장 중..." : "저장하기"}
        </button>
      </form>
    </div>
  );
}
