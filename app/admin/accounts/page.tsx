"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/lib/admin-auth";
import { Eye, EyeOff, Plus, RefreshCw } from "lucide-react";

export default function AdminAccountsManagement() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const { adminUser } = useAdminSession();
  const { toast } = useToast();
  
  // 비밀번호 변경
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "비밀번호 불일치",
        description: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 최소 6자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }
    
    setChangingPassword(true);
    
    try {
      // 현재 비밀번호로 로그인 확인
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: adminUser?.email || "",
        password: currentPassword,
      });
      
      if (signInError) {
        throw new Error("현재 비밀번호가 올바르지 않습니다.");
      }
      
      // 비밀번호 변경
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) throw updateError;
      
      toast({
        title: "비밀번호 변경 성공",
        description: "비밀번호가 성공적으로 변경되었습니다.",
      });
      
      // 입력 필드 초기화
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast({
        title: "비밀번호 변경 오류",
        description: error.message || "비밀번호 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };
  
  return (
    <div className="p-6 bg-white dark:bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-900">관리자 계정 관리</h1>
      
      {/* 현재 관리자 정보 */}
      <div className="mb-8 p-4 bg-white dark:bg-white rounded-lg border">
        <h2 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-900">현재 로그인 정보</h2>
        <div className="grid grid-cols-[0.5fr,14fr] gap-2">
          <div className="text-gray-700 dark:text-gray-700">이메일:</div>
          <div className="font-medium text-gray-900 dark:text-gray-900">{adminUser?.email}</div>
          <div className="text-gray-700 dark:text-gray-700">권한:</div>
          <div className="font-medium text-gray-900 dark:text-gray-900">{adminUser?.role === 'super_admin' ? '슈퍼 관리자' : '서브 관리자'}</div>
        </div>
      </div>
      
      {/* 비밀번호 변경 폼 */}
      <div className="p-6 bg-white dark:bg-white rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-900">비밀번호 변경</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-700">현재 비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 border rounded-md bg-white dark:bg-white text-gray-900 dark:text-gray-900 bg-white text-black"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500 dark:text-gray-400"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-700">새 비밀번호</label>
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-white text-gray-900 dark:text-gray-900 bg-white text-black"
              required
              minLength={6}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-700">새 비밀번호 확인</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded-md bg-white dark:bg-white text-gray-900 dark:text-gray-900 bg-white text-black"
              required
              minLength={6}
            />
          </div>
          
          <button
            type="submit"
            disabled={changingPassword}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {changingPassword ? (
              <>
                <RefreshCw size={18} className="mr-2 animate-spin" /> 변경 중...
              </>
            ) : (
              "비밀번호 변경"
            )}
          </button>
        </form>
      </div>
      
      {/* 향후 기능 추가 안내
      {adminUser?.role === 'super_admin' && (
        <div className="mt-10 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-medium mb-2">서브 관리자 관리 기능</h3>
          <p className="text-gray-600 mb-2">
            서브 관리자 추가 및 관리 기능은 <strong>admin_users</strong> 테이블 설정 후 이용 가능합니다.
          </p>
          <p className="text-sm text-gray-500">
            Supabase SQL 에디터에서 다음 명령어를 실행하여 관리자 테이블을 생성하세요:
          </p>
          <pre className="mt-2 p-3 bg-gray-800 text-white text-sm rounded overflow-x-auto">
            {`CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'sub_admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 기존 관리자 추가
INSERT INTO admin_users (id, email, role) 
SELECT id, email, 'super_admin' 
FROM auth.users 
WHERE email = 'admin@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- 접근 정책 설정
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view" ON admin_users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin')
);`}
          </pre>
        </div>
      )} */}
    </div>
  );
}
