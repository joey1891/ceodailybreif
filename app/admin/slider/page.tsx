"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/lib/admin-auth";

interface SliderSettings {
  id?: string;
  interval_seconds: number;
  updated_at?: string;
}

export default function SliderSpeedManagement() {
  const [settings, setSettings] = useState<SliderSettings>({
    interval_seconds: 5 // 기본값 5초
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { adminUser } = useAdminSession();
  const { toast } = useToast();

  // 설정 불러오기
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("slider_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== "PGRST116") { // PGRST116: 결과가 없음
        console.error("Error fetching slider settings:", error);
        toast({
          title: "설정 로드 오류",
          description: "슬라이더 설정을 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } else if (data) {
        setSettings(data);
      }
      
      setLoading(false);
    };
    
    fetchSettings();
  }, [toast]);

  // 설정 저장
  const saveSettings = async () => {
    // 유효성 검사
    if (settings.interval_seconds < 3 || settings.interval_seconds > 60) {
      toast({
        title: "설정 오류",
        description: "슬라이더 속도는 3초에서 60초 사이로 설정해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    setSaving(true);
    
    try {
      let error;
      
      if (settings.id) {
        // 기존 설정 업데이트
        const { error: updateError } = await supabase
          .from("slider_settings")
          .update({
            interval_seconds: settings.interval_seconds,
            updated_at: new Date().toISOString()
          })
          .eq("id", settings.id);
        
        error = updateError;
      } else {
        // 새 설정 생성
        const { error: insertError } = await supabase
          .from("slider_settings")
          .insert([{
            interval_seconds: settings.interval_seconds
          }]);
        
        error = insertError;
      }
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "설정 저장 완료",
        description: "슬라이더 속도 설정이 저장되었습니다.",
      });
      
      // 최신 설정 다시 불러오기
      const { data } = await supabase
        .from("slider_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error saving slider settings:", error);
      toast({
        title: "설정 저장 오류",
        description: "슬라이더 속도 설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">슬라이더 속도 관리</h1>
      
      {loading ? (
        <div className="text-center py-10">
          <p>설정 로딩 중...</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">슬라이더 자동 전환 속도</h2>
            <p className="text-sm text-gray-500 mb-4">
              메인 페이지 슬라이더의 자동 전환 속도를 설정합니다.
              3초에서 60초 사이로 설정해주세요.
            </p>
            
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">전환 간격 (초)</label>
                <input
                  type="number"
                  min="3"
                  max="60"
                  value={settings.interval_seconds}
                  onChange={(e) => setSettings({
                    ...settings,
                    interval_seconds: parseInt(e.target.value) || 5
                  })}
                  className="w-full p-3 border rounded-md"
                />
              </div>
              
              <div className="w-20">
                <span className="text-xl font-medium">초</span>
              </div>
            </div>
            
            <div className="mt-8 text-sm text-gray-500">
              <p>※ 참고사항:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>너무 빠른 전환은 사용자가 내용을 읽기 어렵게 만들 수 있습니다.</li>
                <li>일반적으로 5~10초가 적당합니다.</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "저장 중..." : "설정 저장"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}