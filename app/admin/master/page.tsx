"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/lib/admin-auth";
import { RefreshCw, Save, User, Mail, Phone } from "lucide-react";

export default function MasterInfoManagement() {
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileInfo, setProfileInfo] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    description: ""
  });
  
  const { adminUser } = useAdminSession();
  const { toast } = useToast();
  
  // 마스터 정보 불러오기
  useEffect(() => {
    const fetchMasterInfo = async () => {
      if (!adminUser) return;
      
      setLoading(true);
      try {
        // 마스터 정보 테이블 존재 여부 확인
        const { data, error } = await supabase
          .from('master_info')
          .select('*')
          .single();
        
        if (error && error.code !== 'PGRST116') {
          // PGRST116는 데이터가 없는 경우
          console.error("Error fetching master info:", error);
          return;
        }
        
        if (data) {
          setProfileInfo({
            name: data.name || "",
            email: data.email || adminUser.email || "",
            phone: data.phone || "",
            position: data.position || "",
            description: data.description || ""
          });
        } else {
          // 초기 데이터가 없는 경우 adminUser 정보로 초기화
          setProfileInfo({
            ...profileInfo,
            email: adminUser.email || ""
          });
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMasterInfo();
  }, [adminUser]);
  
  // 마스터 정보 저장
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminUser) return;
    
    setIsSubmitting(true);
    
    try {
      // 테이블이 있는지 확인하고 없으면 만들기
      try {
        await supabase.rpc('create_master_info_if_not_exists');
      } catch (err) {
        // 이 함수가 없으면 무시 (이미 테이블 생성됨)
        console.log("RPC function may not exist:", err);
      }
      
      // 마스터 정보 저장
      const { error } = await supabase
        .from('master_info')
        .upsert({
          id: 1, // 항상 id=1로 단일 레코드 관리
          name: profileInfo.name,
          email: profileInfo.email,
          phone: profileInfo.phone,
          position: profileInfo.position,
          description: profileInfo.description,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast({
        title: "정보 저장 완료",
        description: "마스터 정보가 성공적으로 저장되었습니다.",
      });
    } catch (error: any) {
      console.error("Error saving master info:", error);
      toast({
        title: "저장 오류",
        description: error.message || "마스터 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">마스터 정보관리</h1>
      
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="animate-spin h-8 w-8 text-gray-400" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">
                <User className="inline-block w-4 h-4 mr-1" />
                이름
              </label>
              <input
                type="text"
                value={profileInfo.name}
                onChange={(e) => setProfileInfo({...profileInfo, name: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                <Mail className="inline-block w-4 h-4 mr-1" />
                이메일
              </label>
              <input
                type="email"
                value={profileInfo.email}
                onChange={(e) => setProfileInfo({...profileInfo, email: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                <Phone className="inline-block w-4 h-4 mr-1" />
                연락처
              </label>
              <input
                type="tel"
                value={profileInfo.phone}
                onChange={(e) => setProfileInfo({...profileInfo, phone: e.target.value})}
                className="w-full p-2 border rounded-md"
                placeholder="ex) 010-1234-5678"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">직책</label>
              <input
                type="text"
                value={profileInfo.position}
                onChange={(e) => setProfileInfo({...profileInfo, position: e.target.value})}
                className="w-full p-2 border rounded-md"
                placeholder="ex) 대표, 관리자"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">소개</label>
            <textarea
              value={profileInfo.description}
              onChange={(e) => setProfileInfo({...profileInfo, description: e.target.value})}
              className="w-full p-2 border rounded-md"
              rows={4}
              placeholder="관리자 소개 또는 웹사이트 설명"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="mr-2 animate-spin" /> 저장 중...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" /> 정보 저장
                </>
              )}
            </button>
          </div>
        </form>
      )}
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-2">기능 안내</h3>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
          <li>이 페이지에서는 마스터 관리자의 기본 정보를 설정할 수 있습니다.</li>
          <li>설정된 정보는 웹사이트의 다양한 곳에 표시될 수 있습니다.</li>
          <li>이메일 주소 변경은 로그인에 사용되는 계정을 변경하지 않습니다.</li>
        </ul>
      </div>
    </div>
  );
} 