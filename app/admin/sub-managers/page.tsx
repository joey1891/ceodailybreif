"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/lib/admin-auth";
import { Eye, EyeOff, Plus, RefreshCw, Trash, AlertCircle } from "lucide-react";

// 서브 관리자 타입 정의
type SubManager = {
  id: string;
  email: string;
  name?: string;
  created_at: string;
};

export default function SubManagersManagement() {
  const [subManagers, setSubManagers] = useState<SubManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(false);
  const [newManager, setNewManager] = useState({ email: "", name: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { adminUser } = useAdminSession();
  const { toast } = useToast();
  
  // 테이블 존재 여부와 관리자 목록 확인
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoading(true);
        
        // 단순 쿼리로 시도
        const { data, error } = await supabase
          .from('admin_users')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error("Error:", error);
          setTableExists(false);
        } else {
          setTableExists(true);
          setSubManagers(data?.filter(m => m.role === 'sub_admin') || []);
        }
      } catch (e) {
        console.error("Fetch error:", e);
        setTableExists(false);
      } finally {
        setLoading(false);
      }
    };
    
    fetchManagers();
  }, []);
  
  // 서브 관리자 추가
  const handleAddSubManager = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newManager.email || !newManager.password) {
      toast({
        title: "입력 오류",
        description: "이메일과 비밀번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const cleanEmail = newManager.email.trim().toLowerCase();
      
      // [중요] 이전 접근 방식에서 실패한 이유:
      // 1. Next.js App Router에서 자동으로 쿠키가 서버 API 라우트로 전달되지 않음
      // 2. credentials: 'include'만으로는 Supabase 인증 토큰이 제대로 전달되지 않음
      // 3. 클라이언트와 서버 간의 쿠키 컨텍스트가 분리되어 있음
      
      // [해결책] 현재 세션의 액세스 토큰을 직접 가져와서 Authorization 헤더로 전송
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("로그인 세션이 없습니다. 다시 로그인해주세요.");
      }
      
      // 토큰을 Authorization 헤더에 직접 포함시켜 전송
      // - 쿠키 전달 문제를 우회
      // - 명시적인 인증 흐름 구성
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // 명시적 토큰 전달
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: newManager.password,
          name: newManager.name,
        }),
        credentials: 'include', // 여전히 포함하지만 주요 인증은 헤더를 통해 이루어짐
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || '서브 관리자 추가 중 오류가 발생했습니다.');
      }
      
      toast({ 
        title: "서브 관리자 추가 완료", 
        description: data.message || `${cleanEmail} 관리자가 추가되었습니다.`
      });
      
      setNewManager({ email: "", name: "", password: "" });
      
      // 목록 새로고침
      const { data: managers } = await supabase.from('admin_users')
        .select('*')
        .eq('role', 'sub_admin')
        .order('created_at', { ascending: false });
        
      setSubManagers(managers || []);
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "추가 오류",
        description: error.message || "관리자 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 서브 관리자 삭제
  const handleRemoveSubManager = async (id: string, email: string) => {
    if (!confirm(`정말 ${email} 관리자를 삭제하시겠습니까?`)) {
      return;
    }
    
    try {
      // 현재 세션 가져오기
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("로그인 세션이 없습니다. 다시 로그인해주세요.");
      }
      
      // 서버 API 호출하여 사용자 삭제
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          userId: id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok && !data.warning) {
        throw new Error(data.error || '서브 관리자 삭제 중 오류가 발생했습니다.');
      }
      
      // 경고가 있는 경우 (부분 성공)
      if (data.warning) {
        toast({
          title: "서브 관리자 부분 삭제",
          description: data.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "서브 관리자 삭제 완료",
          description: data.message || `${email} 관리자가 삭제되었습니다.`,
        });
      }
      
      // 목록에서 삭제된 관리자 제거
      setSubManagers(subManagers.filter(manager => manager.id !== id));
    } catch (error: any) {
      console.error("Error removing sub manager:", error);
      toast({
        title: "서브 관리자 삭제 오류",
        description: error.message || "서브 관리자 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };
  
  // 테이블이 없는 경우 안내 화면
  if (!tableExists) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">서브 관리자 관리</h1>
        
        <div className="mb-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-yellow-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-lg text-yellow-700 mb-2">테이블이 생성되지 않았습니다</h3>
              <p className="text-yellow-700 mb-4">
                서브 관리자 관리 기능을 사용하려면 Supabase에 <code>admin_users</code> 테이블이 필요합니다.
              </p>
              <p className="text-sm text-yellow-600 mb-2">다음 SQL을 Supabase SQL 에디터에서 실행하세요:</p>
              <pre className="bg-gray-800 text-white p-4 rounded-md text-sm overflow-x-auto">
                {`CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'sub_admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 현재 관리자 추가
INSERT INTO admin_users (id, email, role) 
SELECT id, email, 'super_admin' 
FROM auth.users 
WHERE email = '${adminUser?.email || "admin@gmail.com"}'
ON CONFLICT (id) DO NOTHING;

-- 접근 정책 설정
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view" ON admin_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins can manage" ON admin_users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid() AND role = 'super_admin')
);`}
              </pre>
              <button 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={() => window.location.reload()}
              >
                테이블 생성 후 새로고침
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">서브 관리자 관리</h1>
      
      {/* 서브 관리자 추가 폼 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">서브 관리자 추가</h2>
        <form onSubmit={handleAddSubManager} className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">이메일 *</label>
              <input
                type="email"
                value={newManager.email}
                onChange={(e) => setNewManager({...newManager, email: e.target.value})}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">이름</label>
              <input
                type="text"
                value={newManager.name}
                onChange={(e) => setNewManager({...newManager, name: e.target.value})}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">비밀번호 *</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newManager.password}
                onChange={(e) => setNewManager({...newManager, password: e.target.value})}
                className="w-full p-2 border rounded-md"
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">최소 6자 이상의 비밀번호가 필요합니다.</p>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={18} className="mr-2 animate-spin" /> 처리 중...
              </>
            ) : (
              <>
                <Plus size={18} className="mr-2" /> 서브 관리자 추가
              </>
            )}
          </button>
        </form>
      </div>
      
      {/* 서브 관리자 목록 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">서브 관리자 목록</h2>
        
        {loading ? (
          <div className="p-4 text-center">
            <RefreshCw className="animate-spin h-6 w-6 mx-auto mb-2" />
            <p>로딩 중...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이메일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    추가일
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subManagers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center">
                      등록된 서브 관리자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  subManagers.map((manager) => (
                    <tr key={manager.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {manager.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {manager.name || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(manager.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => handleRemoveSubManager(manager.id, manager.email)}
                          className="text-red-600 hover:text-red-900"
                          title="서브 관리자 삭제"
                        >
                          <Trash size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium mb-2">참고사항</h3>
        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
          <li>서브 관리자는 관리 페이지에 접근할 수 있지만, 다른 관리자를 관리할 수 없습니다.</li>
          <li>서브 관리자를 삭제해도 Auth 시스템에서 사용자는 완전히 삭제되지 않을 수 있습니다.</li>
          <li>서브 관리자는 자신의 계정으로 로그인하여 비밀번호를 변경할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
} 