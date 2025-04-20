"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Popup } from "@/types/popup";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PopupManagement() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchPopups();
  }, []);

  async function fetchPopups() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPopups(data || []);
    } catch (error) {
      console.error("Error fetching popups:", error);
    } finally {
      setLoading(false);
    }
  }

  async function togglePopupStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("popups")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      
      // Update local state to reflect the change
      setPopups(popups.map(popup => 
        popup.id === id ? { ...popup, is_active: !currentStatus } : popup
      ));
    } catch (error) {
      console.error("Error toggling popup status:", error);
    }
  }

  async function deletePopup(id: string) {
    if (!confirm("정말로 이 팝업을 삭제하시겠습니까?")) return;
    
    try {
      // 먼저 해당 팝업의 이미지 URL 정보를 가져옵니다
      const { data: popupData, error: fetchError } = await supabase
        .from("popups")
        .select("image_url")
        .eq("id", id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // 팝업 데이터베이스 항목 삭제
      const { error: deleteError } = await supabase
        .from("popups")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
      
      // 이미지가 있는 경우 이미지도 삭제
      if (popupData?.image_url) {
        // 이미지 URL에서 파일 경로 추출 (예: https://....supabase.co/storage/v1/object/public/images/popup/uuid.jpg)
        const urlParts = popupData.image_url.split('/');
        const bucketIndex = urlParts.findIndex((part: string) => part === 'public');

        if (bucketIndex !== -1 && bucketIndex + 2 < urlParts.length) {
          const bucket = urlParts[bucketIndex + 1]; // 'images'
          const filePath = urlParts.slice(bucketIndex + 2).join('/'); // 'popup/uuid.jpg'
          
          // 스토리지에서 이미지 삭제
          const { error: storageError } = await supabase.storage
            .from(bucket)
            .remove([filePath]);
            
          if (storageError) {
            console.error("Error deleting image file:", storageError);
          }
        }
      }
      
      // 삭제된 팝업을 상태에서 제거
      setPopups(popups.filter(popup => popup.id !== id));
      
    } catch (error) {
      console.error("Error deleting popup:", error);
      alert("팝업 삭제 중 오류가 발생했습니다.");
    }
  }

  // 위치 표시 함수 수정
  const getPositionDisplay = (position: number | null | undefined) => {
    if (position === -1) {
      return "중앙";
    } else if (position !== null && position !== undefined) {
      return `왼쪽에서 ${position}px`;
    } else {
      return "기본값";
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">팝업 관리</h1>
        <Link href="/admin/popup/create">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            새 팝업 추가
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-center py-4">로딩 중...</p>
      ) : popups.length === 0 ? (
        <p className="text-center py-4 text-gray-500">등록된 팝업이 없습니다.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>표시 기간</TableHead>
              <TableHead className="text-center">순서</TableHead>
              <TableHead className="text-center">크기</TableHead>
              <TableHead className="text-center">위치</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead className="text-right">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {popups.map((popup) => (
              <TableRow key={popup.id}>
                <TableCell className="font-medium">{popup.title}</TableCell>
                <TableCell>
                  {formatDate(popup.start_date)} ~ {formatDate(popup.end_date)}
                </TableCell>
                <TableCell className="text-center">{popup.display_order || 1}</TableCell>
                <TableCell className="text-center">{popup.size_percentage || 100}%</TableCell>
                <TableCell className="px-4 py-2">
                  {getPositionDisplay(popup.position)}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={popup.is_active}
                    onCheckedChange={() => togglePopupStatus(popup.id, popup.is_active)}
                    className="ml-2"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/popup/edit/${popup.id}`}>
                    <Button variant="outline" size="sm" className="mr-2">
                      수정
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deletePopup(popup.id)}
                  >
                    삭제
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
