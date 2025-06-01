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
  contact_number?: string;
  workplace?: string;
  job_title?: string;
  specialty?: string;
}

export default function MembersManagement() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSubscribers, setTotalSubscribers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [editingField, setEditingField] = useState<{id: string, field: string, value: string} | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({
    email: "",
    contact_number: "",
    workplace: "",
    job_title: "",
    specialty: "",
  });
  
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
      query = query.or(
        `email.ilike.%${searchTerm}%,contact_number.ilike.%${searchTerm}%,workplace.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%,specialty.ilike.%${searchTerm}%`
      );
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
           sub.status === 'inactive' ? '비활성' : '대기중',
      연락처: sub.contact_number || '',
      직장: sub.workplace || '',
      직무: sub.job_title || '',
      특기: sub.specialty || ''
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

  // 필드 업데이트 함수
  const handleFieldUpdate = async (id: string, field: string, value: string) => {
    const updateData: any = {};
    updateData[field] = value;

    const { error } = await supabase
      .from("subscribers")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error(`Error updating subscriber ${field}:`, error);
      toast({
        title: "업데이트 실패",
        description: `구독자 ${fieldDisplayName(field)} 업데이트 중 오류가 발생했습니다.`,
        variant: "destructive",
      });
    } else {
      // 로컬 상태만 업데이트하여 페이지 새로고침 방지
      setSubscribers(prevSubscribers => 
        prevSubscribers.map(subscriber => 
          subscriber.id === id 
            ? { ...subscriber, [field]: value } 
            : subscriber
        )
      );
      
      setEditingField(null);
      
      toast({
        title: "업데이트 완료",
        description: `구독자 ${fieldDisplayName(field)}가 업데이트되었습니다.`,
      });
    }
  };

  // 새 구독자 추가
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSubscriber.email || !newSubscriber.email.includes('@')) {
      toast({
        title: "유효하지 않은 이메일",
        description: "올바른 이메일 주소를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    const { data, error } = await supabase
      .from("subscribers")
      .insert([
        {
          email: newSubscriber.email,
          status: "active",
          contact_number: newSubscriber.contact_number,
          workplace: newSubscriber.workplace,
          job_title: newSubscriber.job_title,
          specialty: newSubscriber.specialty,
        }
      ])
      .select();
    
    if (error) {
      console.error("Error adding subscriber:", error);
      let errorMessage = "구독자 추가 중 오류가 발생했습니다.";
      if (error.code === "23505") {
        errorMessage = "이미 등록된 이메일 주소입니다.";
      }
      
      toast({
        title: "추가 실패",
        description: errorMessage,
        variant: "destructive",
      });
    } else {
      toast({
        title: "추가 완료",
        description: "새 구독자가 추가되었습니다.",
      });
      
      // 폼 초기화
      setNewSubscriber({
        email: "",
        contact_number: "",
        workplace: "",
        job_title: "",
        specialty: "",
      });
      setShowAddForm(false);
      
      // 첫 페이지로 이동하고 데이터 새로고침
      setCurrentPage(1);
      fetchSubscribers();
    }
  };

  // 필드 이름 표시용
  const fieldDisplayName = (field: string) => {
    const displayNames: Record<string, string> = {
      'contact_number': '연락처',
      'workplace': '직장',
      'job_title': '직무',
      'specialty': '특기'
    };
    return displayNames[field] || field;
  };

  // 입력 필드 렌더링
  const renderEditableField = (subscriber: Subscriber, field: string) => {
    const isEditing = editingField?.id === subscriber.id && editingField?.field === field;
    const value = subscriber[field as keyof Subscriber] as string || '';
    
    if (isEditing) {
      return (
        <div className="flex items-center">
          <textarea
            value={editingField.value}
            onChange={(e) => setEditingField({...editingField, value: e.target.value})}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
          <div className="flex flex-col ml-2 space-y-1">
            <button
              onClick={() => handleFieldUpdate(subscriber.id, field, editingField.value)}
              className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              저장
            </button>
            <button
              onClick={() => setEditingField(null)}
              className="p-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              취소
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex items-center group">
          <div className="whitespace-pre-wrap flex-1 text-sm">
            {value || "-"}
          </div>
          <button
            onClick={() => setEditingField({id: subscriber.id, field, value})}
            className="ml-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            편집
          </button>
        </div>
      );
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">구독자 관리</h1>

      {/* 검색창, 구독자 추가 버튼 및 엑셀 다운로드 버튼 */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="검색어 입력 (이메일, 연락처, 직장 등)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 rounded flex-1 bg-white text-black"
            />
            <button
              onClick={() => fetchSubscribers()}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              검색
            </button>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-600 text-white px-4 py-2 rounded flex items-center"
            >
              <span>구독자 추가</span>
            </button>
            <button
              onClick={downloadExcel}
              className="bg-indigo-600 text-white px-4 py-2 rounded flex items-center"
            >
              <span>엑셀 다운로드</span>
            </button>
          </div>
        </div>
      </div>

      {/* 구독자 추가 폼 */}
      {showAddForm && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">새 구독자 추가</h2>
          <form onSubmit={handleAddSubscriber}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">이메일 *</label>
                <input
                  type="email"
                  required
                  value={newSubscriber.email}
                  onChange={(e) => setNewSubscriber({...newSubscriber, email: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="example@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">연락처</label>
                <input
                  type="text"
                  value={newSubscriber.contact_number}
                  onChange={(e) => setNewSubscriber({...newSubscriber, contact_number: e.target.value})}
                  className="w-full p-2 border rounded"
                  placeholder="010-0000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">직장</label>
                <input
                  type="text"
                  value={newSubscriber.workplace}
                  onChange={(e) => setNewSubscriber({...newSubscriber, workplace: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">직무</label>
                <input
                  type="text"
                  value={newSubscriber.job_title}
                  onChange={(e) => setNewSubscriber({...newSubscriber, job_title: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">특기</label>
                <input
                  type="text"
                  value={newSubscriber.specialty}
                  onChange={(e) => setNewSubscriber({...newSubscriber, specialty: e.target.value})}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border rounded"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                추가하기
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 구독자 목록 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
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
                연락처
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                직장
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                직무
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                특기
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center">
                  로딩 중...
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center">
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
                    {renderEditableField(subscriber, "contact_number")}
                  </td>
                  <td className="px-6 py-4">
                    {renderEditableField(subscriber, "workplace")}
                  </td>
                  <td className="px-6 py-4">
                    {renderEditableField(subscriber, "job_title")}
                  </td>
                  <td className="px-6 py-4">
                    {renderEditableField(subscriber, "specialty")}
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
