"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/lib/admin-auth";
import * as XLSX from 'xlsx';

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
  status?: string;
  memo?: string;
}

export default function MembersManagement() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [editingMemo, setEditingMemo] = useState<{id: string, memo: string} | null>(null);
  
  const { adminUser } = useAdminSession();
  const { toast } = useToast();
  const subscribersPerPage = 10;

  // 데이터 조회
  const fetchSubscribers = async () => {
    setLoading(true);
    const start = (currentPage - 1) * subscribersPerPage;
    const end = currentPage * subscribersPerPage - 1;

    let query = supabase
      .from("subscribers")
      .select("*", { count: "exact" })
      .range(start, end)
      .order(sortField, { ascending: sortDirection === "asc" });

    if (searchTerm) {
      query = query.or(`email.ilike.%${searchTerm}%,memo.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching subscribers:", error);
      toast({
        title: "오류 발생",
        description: "구독자 목록을 불러오지 못했습니다.",
        variant: "destructive",
      });
    } else {
      setSubscribers(data || []);
      if (count !== null) {
        setTotalSubscribers(count);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscribers();
  }, [currentPage, searchTerm, sortField, sortDirection]);

  // 구독자 삭제
  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 구독자를 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("subscribers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting subscriber:", error);
      toast({
        title: "삭제 실패",
        description: "구독자 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "삭제 완료",
        description: "구독자가 삭제되었습니다.",
      });
      fetchSubscribers();
    }
  };

  // 상태 변경 함수 최적화
  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("subscribers")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating subscriber status:", error);
      toast({
        title: "상태 변경 실패",
        description: "구독자 상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } else {
      // 로컬 상태만 업데이트하여 페이지 새로고침 방지
      setSubscribers(prevSubscribers => 
        prevSubscribers.map(subscriber => 
          subscriber.id === id 
            ? { ...subscriber, status: newStatus } 
            : subscriber
        )
      );
      
      toast({
        title: "상태 변경 완료",
        description: "구독자 상태가 변경되었습니다.",
      });
    }
  };

  // 정렬 토글
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const totalPages = Math.ceil(totalSubscribers / subscribersPerPage);

  // 엑셀 다운로드 함수
  const downloadExcel = () => {
    // 데이터 준비
    const excelData = subscribers.map(sub => ({
      ID: sub.id,
      이메일: sub.email,
      등록일: new Date(sub.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }),
      상태: sub.status === 'active' ? '활성' : 
           sub.status === 'inactive' ? '비활성' : '대기중'
    }));
    
    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "구독자목록");
    
    // 파일명 생성
    const now = new Date();
    const fileName = `구독자목록_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.xlsx`;
    
    // 파일 다운로드
    XLSX.writeFile(workbook, fileName);
  };

  // 메모 업데이트 함수
  const handleMemoUpdate = async (id: string, memo: string) => {
    const { error } = await supabase
      .from("subscribers")
      .update({ memo })
      .eq("id", id);

    if (error) {
      console.error("Error updating subscriber memo:", error);
      toast({
        title: "메모 업데이트 실패",
        description: "구독자 메모 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } else {
      // 로컬 상태만 업데이트하여 페이지 새로고침 방지
      setSubscribers(prevSubscribers => 
        prevSubscribers.map(subscriber => 
          subscriber.id === id 
            ? { ...subscriber, memo } 
            : subscriber
        )
      );
      
      setEditingMemo(null);
      
      toast({
        title: "메모 업데이트 완료",
        description: "구독자 메모가 업데이트되었습니다.",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">구독자 관리</h1>

      {/* 검색창 및 엑셀 다운로드 버튼 */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="이메일 또는 메모로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 rounded flex-1"
            />
            <button
              onClick={() => fetchSubscribers()}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              검색
            </button>
          </div>
          <button
            onClick={downloadExcel}
            className="ml-4 bg-green-600 text-white px-4 py-2 rounded flex items-center"
          >
            <span>엑셀 다운로드</span>
          </button>
        </div>
      </div>

      {/* 구독자 목록 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort("email")}
              >
                이메일 {sortField === "email" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort("created_at")}
              >
                구독 시작일 {sortField === "created_at" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => toggleSort("status")}
              >
                상태 {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                메모
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  로딩 중...
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  구독자가 없습니다.
                </td>
              </tr>
            ) : (
              subscribers.map((subscriber) => (
                <tr key={subscriber.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{subscriber.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(subscriber.created_at).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${subscriber.status === "active" ? "bg-green-100 text-green-800" : 
                        subscriber.status === "inactive" ? "bg-red-100 text-red-800" : 
                        "bg-gray-100 text-gray-800"}`}>
                      {subscriber.status === "active" ? "활성" : 
                       subscriber.status === "inactive" ? "비활성" : 
                       "대기중"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {editingMemo?.id === subscriber.id ? (
                      <div className="flex items-center">
                        <textarea
                          value={editingMemo.memo}
                          onChange={(e) => setEditingMemo({...editingMemo, memo: e.target.value})}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={2}
                        />
                        <div className="flex flex-col ml-2 space-y-1">
                          <button
                            onClick={() => handleMemoUpdate(subscriber.id, editingMemo.memo)}
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingMemo(null)}
                            className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center group">
                        <div className="whitespace-pre-wrap flex-1 text-sm">
                          {subscriber.memo || "메모 없음"}
                        </div>
                        <button
                          onClick={() => setEditingMemo({id: subscriber.id, memo: subscriber.memo || ""})}
                          className="ml-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          편집
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleStatusChange(subscriber.id, "active")}
                        className="text-green-600 hover:text-green-900"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleStatusChange(subscriber.id, "inactive")}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        비활성
                      </button>
                      <button
                        onClick={() => handleDelete(subscriber.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex justify-center mt-6">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 border rounded mr-2 disabled:opacity-50"
        >
          이전
        </button>
        <span className="px-3 py-1">
          {currentPage} / {totalPages || 1} 페이지
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage >= totalPages}
          className="px-3 py-1 border rounded ml-2 disabled:opacity-50"
        >
          다음
        </button>
      </div>
    </div>
  );
} 