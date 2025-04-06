"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAdminSession } from "@/lib/admin-auth";
import Image from "next/image";

interface Book {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  display_order: number;
  created_at: string;
}

export default function BooksManagement() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  
  const { adminUser } = useAdminSession();
  const { toast } = useToast();

  // 도서 목록 불러오기
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recommended_books")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast({
        title: "오류 발생",
        description: "도서 목록을 불러오지 못했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // 이미지 파일 변경 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileName = file.name;
      console.log("Selected image file:", fileName, file.size, "Original filename encoding check:", encodeURIComponent(fileName));
      
      // 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        toast({
          title: "파일 오류",
          description: "이미지 파일만 업로드 가능합니다",
          variant: "destructive",
        });
        return;
      }
      
      // 파일 크기 체크 (2MB 제한)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "파일 오류",
          description: "이미지 크기는 2MB 이하여야 합니다",
          variant: "destructive",
        });
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

  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBook || !editingBook.title) {
      toast({
        title: "입력 오류",
        description: "도서 제목을 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      let imageUrl = editingBook.image_url;
      
      // 이미지 업로드 처리
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop() || '';
        const originalFileName = imageFile.name;
        const safeFileName = `${Date.now()}.${fileExt}`;
        const filePath = `books/${safeFileName}`;
        
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
          throw uploadError;
        }
        
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
          
        imageUrl = urlData.publicUrl;
      }
      
      const bookData = {
        title: editingBook.title,
        image_url: imageUrl,
        link_url: editingBook.link_url,
        display_order: editingBook.display_order
      };
      
      if (editingBook.id) {
        // 기존 도서 업데이트
        const { error } = await supabase
          .from("recommended_books")
          .update(bookData)
          .eq("id", editingBook.id);
          
        if (error) throw error;
        
        toast({
          title: "업데이트 성공",
          description: "도서 정보가 업데이트되었습니다.",
        });
      } else {
        // 새 도서 추가
        const { error } = await supabase
          .from("recommended_books")
          .insert(bookData);
          
        if (error) throw error;
        
        toast({
          title: "추가 성공",
          description: "새 도서가 추가되었습니다.",
        });
      }
      
      // 폼 초기화 및 목록 새로고침
      setEditingBook(null);
      setImageFile(null);
      setImagePreview("");
      fetchBooks();
    } catch (error) {
      console.error("Error submitting book:", error);
      toast({
        title: "오류 발생",
        description: "도서 정보 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 도서 삭제 핸들러
  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 도서를 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("recommended_books")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "삭제 성공",
        description: "도서가 삭제되었습니다.",
      });
      
      fetchBooks();
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({
        title: "삭제 실패",
        description: "도서 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 새 도서 추가 시작
  const handleAddBook = () => {
    // 현재 도서 개수에 기반한 다음 순서
    const nextOrder = books.length > 0 
      ? Math.max(...books.map(b => b.display_order)) + 1 
      : 1;
    
    setEditingBook({
      id: "",
      title: "",
      image_url: "",
      link_url: "",
      display_order: nextOrder,
      created_at: new Date().toISOString()
    });
    setImagePreview("");
    setImageFile(null);
  };

  // 도서 편집 시작
  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setImagePreview(book.image_url);
    setImageFile(null);
  };

  // 도서 순서 변경 핸들러
  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = books.findIndex(book => book.id === id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === books.length - 1)
    ) {
      return; // 첫 번째 항목은 위로, 마지막 항목은 아래로 이동 불가
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentBook = books[currentIndex];
    const targetBook = books[targetIndex];

    try {
      // 두 도서의 순서 교체
      const updates = [
        {
          id: currentBook.id,
          display_order: targetBook.display_order
        },
        {
          id: targetBook.id,
          display_order: currentBook.display_order
        }
      ];

      // 순서 업데이트 트랜잭션
      for (const update of updates) {
        const { error } = await supabase
          .from("recommended_books")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
          
        if (error) throw error;
      }

      fetchBooks(); // 목록 새로고침
    } catch (error) {
      console.error("Error reordering books:", error);
      toast({
        title: "순서 변경 실패",
        description: "도서 순서 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">도서 추천 관리</h1>

      {/* 도서 추가 버튼 */}
      <div className="mb-6">
        <button
          onClick={handleAddBook}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={!!editingBook}
        >
          새 도서 추가
        </button>
      </div>

      {/* 도서 편집 폼 */}
      {editingBook && (
        <div className="mb-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">
            {editingBook.id ? "도서 수정" : "새 도서 추가"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    도서 제목
                  </label>
                  <input
                    type="text"
                    value={editingBook.title}
                    onChange={(e) => setEditingBook({...editingBook, title: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="도서 제목을 입력하세요"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    링크 URL
                  </label>
                  <input
                    type="text"
                    value={editingBook.link_url}
                    onChange={(e) => setEditingBook({...editingBook, link_url: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="도서 링크 URL을 입력하세요"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    표시 순서
                  </label>
                  <input
                    type="number"
                    value={editingBook.display_order}
                    onChange={(e) => setEditingBook({...editingBook, display_order: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded"
                    min="1"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    도서 이미지
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                {imagePreview && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium mb-2">
                      이미지 미리보기
                    </label>
                    <div className="border p-2 rounded flex justify-center">
                      <Image
                        src={imagePreview}
                        alt="Book preview"
                        width={150}
                        height={200}
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-2">
              <button
                type="button"
                onClick={() => {
                  setEditingBook(null);
                  setImageFile(null);
                  setImagePreview("");
                }}
                className="px-4 py-2 border rounded"
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded"
                disabled={submitting}
              >
                {submitting ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 도서 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                순서
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                이미지
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제목
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                링크
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
            ) : books.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center">
                  등록된 도서가 없습니다.
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {book.display_order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {book.image_url && (
                      <Image
                        src={book.image_url}
                        alt={book.title}
                        width={50}
                        height={70}
                        className="object-contain"
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {book.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a 
                      href={book.link_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {book.link_url ? book.link_url.substring(0, 30) + (book.link_url.length > 30 ? '...' : '') : ''}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleReorder(book.id, 'up')}
                        className="text-gray-600 hover:text-gray-900"
                        disabled={books.indexOf(book) === 0}
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleReorder(book.id, 'down')}
                        className="text-gray-600 hover:text-gray-900"
                        disabled={books.indexOf(book) === books.length - 1}
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => handleEditBook(book)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(book.id)}
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
    </div>
  );
} 