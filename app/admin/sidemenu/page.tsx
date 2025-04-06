"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/lib/admin-auth";
import Image from "next/image";
import { Post } from "@/types/supabase";

interface SidebarSettings {
  id?: string;
  profile_description: string;
  youtube_link: string;
  youtube_thumbnail_url: string;
  updated_at?: string;
}

interface FeaturedPost {
  id: string;
  post_id: string;
  display_order: number;
  post?: Post;
}

export default function SideMenuManagement() {
  const [settings, setSettings] = useState<SidebarSettings>({
    profile_description: "",
    youtube_link: "",
    youtube_thumbnail_url: "",
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  
  const { adminUser } = useAdminSession();
  const { toast } = useToast();

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // 사이드바 설정 로드
  useEffect(() => {
    const fetchSidebarSettings = async () => {
      setLoadingSettings(true);
      
      const { data, error } = await supabase
        .from("sidebar_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code !== "PGRST116") { // 결과가 없는 경우가 아니라면
          console.error("Error fetching sidebar settings:", error);
          toast({
            title: "설정 로드 오류",
            description: "사이드바 설정을 불러오지 못했습니다.",
            variant: "destructive",
          });
        }
      } else if (data) {
        setSettings(data);
      }
      
      setLoadingSettings(false);
    };
    
    const fetchPosts = async () => {
      setLoadingPosts(true);
      
      // 모든 게시물 가져오기
      const { data: postsData, error: postsError } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (postsError) {
        console.error("Error fetching posts:", postsError);
        toast({
          title: "게시물 로드 오류", 
          description: "게시물 목록을 불러오지 못했습니다.",
          variant: "destructive",
        });
      } else {
        setAllPosts(postsData || []);
      }
      
      // 피처드 게시물 목록 가져오기
      const { data: featuredData, error: featuredError } = await supabase
        .from("featured_posts")
        .select("*, post:posts(*)")
        .order("display_order", { ascending: true });
      
      if (featuredError) {
        console.error("Error fetching featured posts:", featuredError);
      } else {
        setFeaturedPosts(featuredData || []);
      }
      
      setLoadingPosts(false);
    };
    
    fetchSidebarSettings();
    fetchPosts();
  }, []);

  // 이미지 업로드 함수
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setThumbnailFile(file);
      
      // 파일 미리보기 생성 (로컬에서만)
      const previewUrl = URL.createObjectURL(file);
      setSettings(prev => ({
        ...prev,
        youtube_thumbnail_url: previewUrl
      }));
    } catch (error) {
      console.error("Error handling file:", error);
      toast({
        title: "파일 처리 오류",
        description: "썸네일 이미지를 처리하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };
  
  // 설정 저장 시 이미지도 업로드
  const saveSettings = async () => {
    setSavingSettings(true);
    
    try {
      let thumbnailUrl = settings.youtube_thumbnail_url;
      
      // 파일이 선택되었다면 Supabase에 업로드
      if (thumbnailFile) {
        setUploading(true);
        
        // 한글 파일명 처리 - 안전한 파일명 생성
        const fileExt = thumbnailFile.name.split('.').pop(); // 확장자 추출
        const safeFileName = `youtube_thumbnail_${Date.now()}.${fileExt}`;
        
        // Supabase Storage에 업로드
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(`sidemenu/${safeFileName}`, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          throw uploadError;
        }
        
        // 업로드된 이미지 URL 가져오기
        thumbnailUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/sidemenu/${safeFileName}`;
        setUploading(false);
      }
      
      const updatedSettings = {
        profile_description: settings.profile_description,
        youtube_link: settings.youtube_link,
        youtube_thumbnail_url: thumbnailUrl
      };
      
      // 기존 설정이 있다면 업데이트, 없다면 새로 생성
      let error;
      if (settings.id) {
        const { error: updateError } = await supabase
          .from("sidebar_settings")
          .update(updatedSettings)
          .eq("id", settings.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("sidebar_settings")
          .insert([updatedSettings]);
        error = insertError;
      }
      
      if (error) {
        throw error;
      }
      
      // 업데이트된 설정으로 상태 갱신
      setSettings(prev => ({
        ...prev,
        ...updatedSettings
      }));
      
      toast({
        title: "설정 저장 완료",
        description: "사이드바 설정이 성공적으로 저장되었습니다.",
      });
      
      // 썸네일 파일 상태 초기화
      setThumbnailFile(null);
      
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "설정 저장 오류",
        description: "사이드바 설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
      setUploading(false);
    }
  };

  // 피처드 게시물 추가
  const addFeaturedPost = async () => {
    if (!selectedPostId) return;
    
    // 이미 추가된 게시물인지 확인
    const isAlreadyFeatured = featuredPosts.some(
      (post) => post.post_id === selectedPostId
    );
    
    if (isAlreadyFeatured) {
      toast({
        title: "게시물 추가 오류",
        description: "이미 추가된 게시물입니다.",
        variant: "destructive",
      });
      return;
    }
    
    // 새 피처드 게시물의 순서 (마지막 + 1)
    const newOrder = featuredPosts.length > 0
      ? Math.max(...featuredPosts.map(p => p.display_order)) + 1
      : 1;
    
    const { data, error } = await supabase
      .from("featured_posts")
      .insert({
        post_id: selectedPostId,
        display_order: newOrder,
      })
      .select("*, post:posts(*)");
    
    if (error) {
      console.error("Error adding featured post:", error);
      toast({
        title: "게시물 추가 오류",
        description: "피처드 게시물 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } else if (data) {
      setFeaturedPosts([...featuredPosts, data[0]]);
      setSelectedPostId("");
      toast({
        title: "게시물 추가 완료",
        description: "피처드 게시물이 추가되었습니다.",
      });
    }
  };

  // 피처드 게시물 제거
  const removeFeaturedPost = async (id: string) => {
    if (!confirm("정말 이 게시물을 목록에서 제거하시겠습니까?")) return;
    
    const { error } = await supabase
      .from("featured_posts")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error removing featured post:", error);
      toast({
        title: "게시물 제거 오류",
        description: "피처드 게시물 제거 중 오류가 발생했습니다.",
        variant: "destructive", 
      });
    } else {
      // 피처드 게시물 목록에서 제거된 게시물 제외
      setFeaturedPosts(featuredPosts.filter(post => post.id !== id));
      toast({
        title: "게시물 제거 완료",
        description: "피처드 게시물이 제거되었습니다.",
      });
    }
  };

  // 게시물 순서 변경 함수 (순위 직접 지정 방식)
  const updatePostRank = async (id: string, newRank: number) => {
    // 유효성 검사
    if (newRank < 1 || newRank > featuredPosts.length) {
      toast({
        title: "순위 범위 오류",
        description: `1에서 ${featuredPosts.length} 사이의 순위를 선택해주세요.`,
        variant: "destructive",
      });
      return;
    }
    
    // 현재 게시물 찾기
    const postIndex = featuredPosts.findIndex(post => post.id === id);
    if (postIndex === -1) return;
    
    // 새 순서로 게시물 배열 재정렬
    const currentPost = featuredPosts[postIndex];
    const newPosts = featuredPosts.filter(post => post.id !== id);
    
    // 새 위치에 게시물 삽입 (newRank는 1부터 시작하므로 인덱스는 newRank-1)
    newPosts.splice(newRank - 1, 0, currentPost);
    
    // 변경된 순서에 따라 display_order 값 업데이트
    const updatedPosts = newPosts.map((post, index) => ({
      ...post,
      display_order: index + 1,
    }));
    
    // 데이터베이스 일괄 업데이트
    const updates = updatedPosts.map(post => ({
      id: post.id,
      display_order: post.display_order,
    }));
    
    const { error } = await supabase
      .from("featured_posts")
      .upsert(updates);
    
    if (error) {
      console.error("Error updating post order:", error);
      toast({
        title: "순서 변경 오류",
        description: "게시물 순서 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } else {
      setFeaturedPosts(updatedPosts);
      toast({
        title: "순서 변경 완료",
        description: "게시물 순서가 변경되었습니다.",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">사이드 메뉴 관리</h1>
      
      {loadingSettings ? (
        <div className="text-center py-10">
          <p>설정 로딩 중...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* 프로필 설명 섹션 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">프로필 설명</h2>
            <textarea
              value={settings.profile_description}
              onChange={(e) => setSettings({...settings, profile_description: e.target.value})}
              className="w-full h-32 p-3 border rounded-md resize-none"
              placeholder="프로필 설명 입력..."
            />
          </div>
          
          {/* 유튜브 섹션 - 변경된 부분 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">유튜브 링크 및 썸네일</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">유튜브 링크</label>
              <input
                type="text"
                value={settings.youtube_link}
                onChange={(e) => setSettings({...settings, youtube_link: e.target.value})}
                className="w-full p-3 border rounded-md"
                placeholder="https://youtube.com/..."
              />
            </div>
            
            {/* 이미지 업로드 영역 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">썸네일 이미지</label>
              <div className="flex items-center space-x-4">
                <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
                  이미지 선택
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleThumbnailUpload}
                    disabled={uploading || savingSettings}
                  />
                </label>
                <span className="text-sm text-gray-500">
                  {thumbnailFile ? thumbnailFile.name : "파일을 선택하세요"}
                </span>
              </div>
            </div>
            
            {/* 썸네일 미리보기 */}
            {settings.youtube_thumbnail_url && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">썸네일 미리보기</p>
                <div className="relative">
                  <Image 
                    src={settings.youtube_thumbnail_url} 
                    alt="유튜브 썸네일" 
                    width={400} 
                    height={225} 
                    className="rounded-md border"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 text-white opacity-0 hover:opacity-100 transition-opacity">
                    {thumbnailFile ? "저장 전 미리보기" : "저장된 이미지"}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {/* 저장 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={savingSettings || uploading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingSettings || uploading ? (
                <>저장 중...</>
              ) : (
                <>설정 저장</>
              )}
            </button>
          </div>
          
          {/* 피처드 게시물 섹션 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">조회수 순위 게시물 관리</h2>
            <p className="text-sm text-gray-500 mb-4">
              사이드바에 표시할 게시물을 선택하고 순서를 설정할 수 있습니다. 
              실제 조회수와 관계없이 임의로 게시물을 선택하여 표시할 수 있습니다.
            </p>
            
            {/* 게시물 추가 */}
            <div className="flex gap-2 mb-6">
              <select
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
              >
                <option value="">게시물 선택...</option>
                {allPosts.map((post) => (
                  <option key={post.id} value={post.id}>
                    {post.title}
                  </option>
                ))}
              </select>
              <button
                onClick={addFeaturedPost}
                disabled={!selectedPostId}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                추가
              </button>
            </div>
            
            {/* 선택된 게시물 목록 */}
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      순서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제목
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      실제 조회수
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loadingPosts ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">
                        로딩 중...
                      </td>
                    </tr>
                  ) : featuredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center">
                        선택된 게시물이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    featuredPosts.map((featured, index) => (
                      <tr key={featured.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={index + 1}
                            onChange={(e) => updatePostRank(featured.id, parseInt(e.target.value))}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            {Array.from({ length: featuredPosts.length }, (_, i) => (
                              <option key={i} value={i + 1}>
                                {i + 1}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          {featured.post?.title || "제목 없음"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {featured.post?.viewcnt || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => removeFeaturedPost(featured.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 