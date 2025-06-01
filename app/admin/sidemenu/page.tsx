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
  updated_at?: string;
}

interface YouTubeEntry {
  id: string;
  title: string;
  thumbnail_url: string;
  youtube_link: string;
  display_order: number;
  created_at?: string;
}

interface FeaturedPost {
  id: string;
  post_id: string;
  display_order: number;
  post?: Post;
}

interface Book {
  id: string;
  title: string;
  author?: string;
  image_url: string;
  link_url: string;
  display_order: number;
  created_at?: string;
}

interface BlogEntry {
  id: string;
  title: string;
  thumbnail_url: string;
  blog_link: string;
  display_order: number;
  created_at?: string;
}

export default function SideMenuManagement() {
  // Remove unused states and variables
  /* 
  const [settings, setSettings] = useState<SidebarSettings>({
    profile_description: "",
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  */
  
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [featuredPosts, setFeaturedPosts] = useState<FeaturedPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  
  const [youtubeEntries, setYoutubeEntries] = useState<YouTubeEntry[]>([]);
  const [loadingYoutube, setLoadingYoutube] = useState(true);
  const [editingYoutube, setEditingYoutube] = useState<YouTubeEntry | null>(null);
  
  const [books, setBooks] = useState<Book[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookImageFile, setBookImageFile] = useState<File | null>(null);
  const [bookImagePreview, setBookImagePreview] = useState<string>("");
  const [bookSubmitting, setBookSubmitting] = useState(false);
  
  const { adminUser } = useAdminSession();
  const { toast } = useToast();

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  const [blogEntries, setBlogEntries] = useState<BlogEntry[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [editingBlog, setEditingBlog] = useState<BlogEntry | null>(null);
  const [blogThumbnailFile, setBlogThumbnailFile] = useState<File | null>(null);
  const [blogThumbnailPreview, setBlogThumbnailPreview] = useState<string>("");
  const [uploadingBlog, setUploadingBlog] = useState(false);

  // Add a fetchBooks function outside the useEffect
  const fetchBooks = async () => {
    setLoadingBooks(true);
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
      setLoadingBooks(false);
    }
  };

  // 유튜브 엔트리 및 기타 데이터 로드
  useEffect(() => {    
    /* 
    const fetchSidebarSettings = async () => {
      setLoadingSettings(true);
      
      const { data, error } = await supabase
        .from("sidebar_settings")
        .select("*")
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching sidebar settings:", error);
      } else if (data) {
        setSettings(data);
      }
      
      setLoadingSettings(false);
    };
    */
    
    const fetchYoutubeEntries = async () => {
      setLoadingYoutube(true);
      
      const { data, error } = await supabase
        .from("youtube_recommendations")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) {
        console.error("Error fetching YouTube entries:", error);
        toast({
          title: "유튜브 목록 로드 오류",
          description: "유튜브 목록을 불러오지 못했습니다.",
          variant: "destructive",
        });
      } else {
        setYoutubeEntries(data || []);
      }
      
      setLoadingYoutube(false);
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
    
    const fetchBlogEntries = async () => {
      setLoadingBlogs(true);
      
      const { data, error } = await supabase
        .from("blog_recommendations")
        .select("*")
        .order("display_order", { ascending: true });
      
      if (error) {
        console.error("Error fetching blog entries:", error);
        toast({
          title: "블로그 목록 로드 오류",
          description: "블로그 목록을 불러오지 못했습니다.",
          variant: "destructive",
        });
      } else {
        setBlogEntries(data || []);
      }
      
      setLoadingBlogs(false);
    };
    
    // fetchSidebarSettings();
    fetchYoutubeEntries();
    fetchPosts();
    fetchBooks();
    fetchBlogEntries();
  }, []);

  // 썸네일 이미지 업로드 핸들러
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setThumbnailFile(file);
      
      // 파일 미리보기 생성
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    } catch (error) {
      console.error("Error handling file:", error);
      toast({
        title: "파일 처리 오류",
        description: "썸네일 이미지를 처리하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };
  
  // 설정 저장
  /* 
  const saveSettings = async () => {
    setSavingSettings(true);
    
    try {
      const updatedSettings = {
        profile_description: settings.profile_description,
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
      
      toast({
        title: "설정 저장 완료",
        description: "사이드바 설정이 성공적으로 저장되었습니다.",
      });
      
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "설정 저장 오류",
        description: "사이드바 설정을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
  };
  */

  // 유튜브 엔트리 추가/수정
  const saveYoutubeEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYoutube) return;
    
    setUploading(true);
    
    try {
      let thumbnailUrl = editingYoutube.thumbnail_url;
      
      // 썸네일 이미지 업로드
      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const safeFileName = `youtube_thumbnail_${Date.now()}.${fileExt}`;
        
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(`sidemenu/${safeFileName}`, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          throw uploadError;
        }
        
        thumbnailUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/sidemenu/${safeFileName}`;
      }
      
      const youtubeData = {
        title: editingYoutube.title,
        thumbnail_url: thumbnailUrl,
        youtube_link: editingYoutube.youtube_link,
        display_order: editingYoutube.display_order
      };
      
      if (editingYoutube.id) {
        // 기존 항목 수정
        const { error } = await supabase
          .from("youtube_recommendations")
          .update(youtubeData)
          .eq("id", editingYoutube.id);
          
        if (error) throw error;
        
        toast({
          title: "수정 완료",
          description: "유튜브 항목이 수정되었습니다.",
        });
      } else {
        // 새 항목 추가
        const { error } = await supabase
          .from("youtube_recommendations")
          .insert(youtubeData);
          
        if (error) throw error;
        
        toast({
          title: "추가 완료",
          description: "새 유튜브 항목이 추가되었습니다.",
        });
      }
      
      // 목록 새로고침 및 폼 초기화
      const { data, error } = await supabase
        .from("youtube_recommendations")
        .select("*")
        .order("display_order", { ascending: true });
        
      if (!error) {
        setYoutubeEntries(data || []);
      }
      
      setEditingYoutube(null);
      setThumbnailFile(null);
      setThumbnailPreview("");
      
    } catch (error) {
      console.error("Error saving YouTube entry:", error);
      toast({
        title: "저장 오류",
        description: "유튜브 항목을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // 유튜브 항목 삭제
  const deleteYoutubeEntry = async (id: string) => {
    if (!confirm("정말 이 유튜브 항목을 삭제하시겠습니까?")) return;
    
    try {
      const { error } = await supabase
        .from("youtube_recommendations")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // 목록에서 제거된 항목 필터링
      setYoutubeEntries(youtubeEntries.filter(entry => entry.id !== id));
      
      toast({
        title: "삭제 완료",
        description: "유튜브 항목이 삭제되었습니다.",
      });
    } catch (error) {
      console.error("Error deleting YouTube entry:", error);
      toast({
        title: "삭제 오류",
        description: "유튜브 항목을 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 새 유튜브 항목 추가 시작
  const addYoutubeEntry = () => {
    // 현재 항목 개수에 기반한 다음 순서
    const nextOrder = youtubeEntries.length > 0 
      ? Math.max(...youtubeEntries.map(entry => entry.display_order)) + 1 
      : 1;
    
    setEditingYoutube({
      id: "",
      title: "",
      thumbnail_url: "",
      youtube_link: "",
      display_order: nextOrder
    });
    setThumbnailPreview("");
    setThumbnailFile(null);
  };

  // 유튜브 항목 수정 시작
  const editYoutubeEntry = (entry: YouTubeEntry) => {
    setEditingYoutube(entry);
    setThumbnailPreview(entry.thumbnail_url);
    setThumbnailFile(null);
  };

  // 유튜브 항목 순서 변경
  const reorderYoutubeEntry = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = youtubeEntries.findIndex(entry => entry.id === id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === youtubeEntries.length - 1)
    ) {
      return; // 첫 번째 항목은 위로, 마지막 항목은 아래로 이동 불가
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentEntry = youtubeEntries[currentIndex];
    const targetEntry = youtubeEntries[targetIndex];

    try {
      // 두 항목의 순서 교체
      const updates = [
        {
          id: currentEntry.id,
          display_order: targetEntry.display_order
        },
        {
          id: targetEntry.id,
          display_order: currentEntry.display_order
        }
      ];

      // 순서 업데이트 트랜잭션
      for (const update of updates) {
        const { error } = await supabase
          .from("youtube_recommendations")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
          
        if (error) throw error;
      }

      // 목록 새로고침
      const { data, error } = await supabase
        .from("youtube_recommendations")
        .select("*")
        .order("display_order", { ascending: true });
        
      if (!error) {
        setYoutubeEntries(data || []);
      }
    } catch (error) {
      console.error("Error reordering YouTube entries:", error);
      toast({
        title: "순서 변경 실패",
        description: "유튜브 항목 순서 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
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

  // Book management functions
  const handleBookImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
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
      
      setBookImageFile(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setBookImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBook || !editingBook.title) {
      toast({
        title: "입력 오류",
        description: "도서 제목을 입력해주세요",
        variant: "destructive",
      });
      return;
    }
    
    setBookSubmitting(true);
    
    try {
      let imageUrl = editingBook.image_url;
      
      // 이미지 업로드 처리
      if (bookImageFile) {
        const fileExt = bookImageFile.name.split('.').pop() || '';
        const safeFileName = `${Date.now()}.${fileExt}`;
        const filePath = `books/${safeFileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, bookImageFile, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) throw uploadError;
        
        imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/${filePath}`;
      }
      
      const bookData = {
        title: editingBook.title,
        author: editingBook.author || '',
        image_url: imageUrl,
        link_url: editingBook.link_url || '',
        display_order: editingBook.display_order
      };
      
      if (editingBook.id) {
        // 기존 도서 수정
        const { error } = await supabase
          .from('recommended_books')
          .update(bookData)
          .eq('id', editingBook.id);
          
        if (error) throw error;
        
        toast({
          title: "도서 정보 수정",
          description: "도서 정보가 성공적으로 수정되었습니다."
        });
      } else {
        // 새 도서 추가
        if (!bookData.display_order) {
          // 새 도서의 경우 순서를 기존 도서 갯수 + 1로 설정
          bookData.display_order = books.length + 1;
        }
        
        const { error } = await supabase
          .from('recommended_books')
          .insert(bookData);
          
        if (error) throw error;
        
        toast({
          title: "도서 추가",
          description: "새 도서가 성공적으로 추가되었습니다."
        });
      }
      
      // 도서 목록 새로고침
      fetchBooks();
      
      // 폼 초기화
      setEditingBook(null);
      setBookImageFile(null);
      setBookImagePreview("");
    } catch (error) {
      console.error("Error saving book:", error);
      toast({
        title: "저장 오류",
        description: "도서 정보를 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setBookSubmitting(false);
    }
  };
  
  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setBookImagePreview(book.image_url);
  };
  
  const handleAddBook = () => {
    setEditingBook({
      id: "",
      title: "",
      author: "",
      image_url: "",
      link_url: "",
      display_order: books.length + 1,
      created_at: new Date().toISOString(),
    });
    setBookImagePreview("");
    setBookImageFile(null);
  };
  
  const handleBookDelete = async (id: string) => {
    if (!confirm("정말로 이 도서를 삭제하시겠습니까?")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('recommended_books')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      toast({
        title: "도서 삭제",
        description: "도서가 성공적으로 삭제되었습니다."
      });
      
      // 도서 목록 새로고침
      const updatedBooks = books.filter(book => book.id !== id);
      setBooks(updatedBooks);
      
      // 순서 재정렬
      await reorderBooks(updatedBooks);
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({
        title: "삭제 오류",
        description: "도서를 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };
  
  const reorderBooks = async (booksList: Book[]) => {
    try {
      // 모든 도서의 순서 업데이트
      for (let i = 0; i < booksList.length; i++) {
        const { error } = await supabase
          .from('recommended_books')
          .update({ display_order: i + 1 })
          .eq('id', booksList[i].id);
          
        if (error) throw error;
      }
      
      // 도서 목록 새로고침
      fetchBooks();
    } catch (error) {
      console.error("Error reordering books:", error);
      toast({
        title: "순서 조정 오류",
        description: "도서 순서를 조정하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };
  
  const handleBookReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = books.findIndex(book => book.id === id);
    if (currentIndex === -1) return;
    
    let newIndex = currentIndex;
    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < books.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return; // 이동할 수 없는 경우
    }
    
    // 순서 변경
    const newBooks = [...books];
    const [movedBook] = newBooks.splice(currentIndex, 1);
    newBooks.splice(newIndex, 0, movedBook);
    
    // 순서 업데이트
    setBooks(newBooks);
    await reorderBooks(newBooks);
  };

  // 블로그 썸네일 이미지 업로드 핸들러
  const handleBlogThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setBlogThumbnailFile(file);
      
      // 파일 미리보기 생성
      const previewUrl = URL.createObjectURL(file);
      setBlogThumbnailPreview(previewUrl);
    } catch (error) {
      console.error("Error handling file:", error);
      toast({
        title: "파일 처리 오류",
        description: "썸네일 이미지를 처리하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 블로그 엔트리 추가/수정
  const saveBlogEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;
    
    setUploadingBlog(true);
    
    try {
      let thumbnailUrl = editingBlog.thumbnail_url;
      
      // 썸네일 이미지 업로드
      if (blogThumbnailFile) {
        const fileExt = blogThumbnailFile.name.split('.').pop();
        const safeFileName = `blog_thumbnail_${Date.now()}.${fileExt}`;
        
        const { data: fileData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(`sidemenu/${safeFileName}`, blogThumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          throw uploadError;
        }
        
        thumbnailUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/sidemenu/${safeFileName}`;
      }
      
      const blogData = {
        title: editingBlog.title,
        thumbnail_url: thumbnailUrl,
        blog_link: editingBlog.blog_link,
        display_order: editingBlog.display_order
      };
      
      if (editingBlog.id) {
        // 기존 항목 수정
        const { error } = await supabase
          .from("blog_recommendations")
          .update(blogData)
          .eq("id", editingBlog.id);
          
        if (error) throw error;
        
        toast({
          title: "수정 완료",
          description: "블로그 항목이 수정되었습니다.",
        });
      } else {
        // 새 항목 추가
        const { error } = await supabase
          .from("blog_recommendations")
          .insert(blogData);
          
        if (error) throw error;
        
        toast({
          title: "추가 완료",
          description: "새 블로그 항목이 추가되었습니다.",
        });
      }
      
      // 목록 새로고침 및 폼 초기화
      const { data, error } = await supabase
        .from("blog_recommendations")
        .select("*")
        .order("display_order", { ascending: true });
        
      if (!error) {
        setBlogEntries(data || []);
      }
      
      setEditingBlog(null);
      setBlogThumbnailFile(null);
      setBlogThumbnailPreview("");
      
    } catch (error) {
      console.error("Error saving blog entry:", error);
      toast({
        title: "저장 오류",
        description: "블로그 항목을 저장하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setUploadingBlog(false);
    }
  };

  // 블로그 항목 삭제
  const deleteBlogEntry = async (id: string) => {
    if (!confirm("정말 이 블로그 항목을 삭제하시겠습니까?")) return;
    
    try {
      const { error } = await supabase
        .from("blog_recommendations")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
      
      // 목록에서 제거된 항목 필터링
      setBlogEntries(blogEntries.filter(entry => entry.id !== id));
      
      toast({
        title: "삭제 완료",
        description: "블로그 항목이 삭제되었습니다.",
      });
    } catch (error) {
      console.error("Error deleting blog entry:", error);
      toast({
        title: "삭제 오류",
        description: "블로그 항목을 삭제하는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 새 블로그 항목 추가 시작
  const addBlogEntry = () => {
    // 현재 항목 개수에 기반한 다음 순서
    const nextOrder = blogEntries.length > 0 
      ? Math.max(...blogEntries.map(entry => entry.display_order)) + 1 
      : 1;
    
    setEditingBlog({
      id: "",
      title: "",
      thumbnail_url: "",
      blog_link: "",
      display_order: nextOrder
    });
    setBlogThumbnailPreview("");
    setBlogThumbnailFile(null);
  };

  // 블로그 항목 수정 시작
  const editBlogEntry = (entry: BlogEntry) => {
    setEditingBlog(entry);
    setBlogThumbnailPreview(entry.thumbnail_url);
    setBlogThumbnailFile(null);
  };

  // 블로그 항목 순서 변경
  const reorderBlogEntry = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = blogEntries.findIndex(entry => entry.id === id);
    if (
      (direction === 'up' && currentIndex === 0) || 
      (direction === 'down' && currentIndex === blogEntries.length - 1)
    ) {
      return; // 첫 번째 항목은 위로, 마지막 항목은 아래로 이동 불가
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentEntry = blogEntries[currentIndex];
    const targetEntry = blogEntries[targetIndex];

    try {
      // 두 항목의 순서 교체
      const updates = [
        {
          id: currentEntry.id,
          display_order: targetEntry.display_order
        },
        {
          id: targetEntry.id,
          display_order: currentEntry.display_order
        }
      ];

      // 순서 업데이트 트랜잭션
      for (const update of updates) {
        const { error } = await supabase
          .from("blog_recommendations")
          .update({ display_order: update.display_order })
          .eq("id", update.id);
          
        if (error) throw error;
      }

      // 목록 새로고침
      const { data, error } = await supabase
        .from("blog_recommendations")
        .select("*")
        .order("display_order", { ascending: true });
        
      if (!error) {
        setBlogEntries(data || []);
      }
    } catch (error) {
      console.error("Error reordering blog entries:", error);
      toast({
        title: "순서 변경 실패",
        description: "블로그 항목 순서 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">사이드바 관리</h1>
      
      {/* 유튜브 항목 관리 섹션 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">유튜브 링크 관리</h2>
        
        {/* 유튜브 항목 추가 버튼 */}
        {!editingYoutube && (
          <button
            onClick={addYoutubeEntry}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mb-6"
          >
            새 유튜브 링크 추가
          </button>
        )}
        
        {/* 유튜브 항목 편집 폼 */}
        {editingYoutube && (
          <div className="border rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium mb-4">
              {editingYoutube.id ? "유튜브 링크 수정" : "새 유튜브 링크 추가"}
            </h3>
            <form onSubmit={saveYoutubeEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">제목</label>
                    <input
                      type="text"
                      value={editingYoutube.title}
                      onChange={(e) => setEditingYoutube({...editingYoutube, title: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      placeholder="유튜브 제목을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">유튜브 링크</label>
                    <input
                      type="text"
                      value={editingYoutube.youtube_link}
                      onChange={(e) => setEditingYoutube({...editingYoutube, youtube_link: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      placeholder="유튜브 URL을 입력하세요"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">표시 순서</label>
                    <input
                      type="number"
                      value={editingYoutube.display_order}
                      onChange={(e) => setEditingYoutube({...editingYoutube, display_order: parseInt(e.target.value)})}
                      className="w-full p-2 border rounded-md"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">썸네일 이미지</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailUpload}
                      className="w-full p-2 border rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      권장 크기: 1280x720px (16:9 비율)
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">썸네일 미리보기</label>
                  <div className="border rounded-md p-4 flex items-center justify-center bg-gray-50 h-48">
                    {thumbnailPreview ? (
                      <Image 
                        src={thumbnailPreview} 
                        alt="썸네일 미리보기" 
                        width={240}
                        height={135}
                        className="object-contain"
                      />
                    ) : (
                      <div className="text-gray-400">이미지 없음</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {uploading ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingYoutube(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* 유튜브 항목 목록 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">썸네일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">링크</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingYoutube ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">로딩 중...</td>
                </tr>
              ) : youtubeEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">등록된 유튜브 링크가 없습니다.</td>
                </tr>
              ) : (
                youtubeEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{entry.display_order}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.thumbnail_url && (
                        <Image
                          src={entry.thumbnail_url}
                          alt={entry.title || '썸네일'}
                          width={80}
                          height={45}
                          className="object-cover rounded"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{entry.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a
                        href={entry.youtube_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {entry.youtube_link ? (
                          entry.youtube_link.length > 30 
                            ? entry.youtube_link.substring(0, 30) + '...' 
                            : entry.youtube_link
                        ) : ''}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => reorderYoutubeEntry(entry.id, 'up')}
                          className="text-gray-600 hover:text-gray-900"
                          disabled={youtubeEntries.indexOf(entry) === 0}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => reorderYoutubeEntry(entry.id, 'down')}
                          className="text-gray-600 hover:text-gray-900"
                          disabled={youtubeEntries.indexOf(entry) === youtubeEntries.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => editYoutubeEntry(entry)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => deleteYoutubeEntry(entry.id)}
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
      
      {/* 블로그 항목 관리 섹션 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">블로그 링크 관리</h2>
        
        {/* 블로그 항목 추가 버튼 */}
        {!editingBlog && (
          <button
            onClick={addBlogEntry}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 mb-6"
          >
            새 블로그 링크 추가
          </button>
        )}
        
        {/* 블로그 항목 편집 폼 */}
        {editingBlog && (
          <div className="border rounded-md p-4 mb-6">
            <h3 className="text-lg font-medium mb-4">
              {editingBlog.id ? "블로그 링크 수정" : "새 블로그 링크 추가"}
            </h3>
            <form onSubmit={saveBlogEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">제목</label>
                    <input
                      type="text"
                      value={editingBlog.title}
                      onChange={(e) => setEditingBlog({...editingBlog, title: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      placeholder="블로그 제목을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">블로그 링크</label>
                    <input
                      type="text"
                      value={editingBlog.blog_link}
                      onChange={(e) => setEditingBlog({...editingBlog, blog_link: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      placeholder="블로그 URL을 입력하세요"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">표시 순서</label>
                    <input
                      type="number"
                      value={editingBlog.display_order}
                      onChange={(e) => setEditingBlog({...editingBlog, display_order: parseInt(e.target.value)})}
                      className="w-full p-2 border rounded-md"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">썸네일 이미지</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBlogThumbnailUpload}
                      className="w-full p-2 border rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      권장 크기: 1280x720px (16:9 비율)
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">썸네일 미리보기</label>
                  <div className="border rounded-md p-4 flex items-center justify-center bg-gray-50 h-48">
                    {blogThumbnailPreview ? (
                      <Image 
                        src={blogThumbnailPreview} 
                        alt="썸네일 미리보기" 
                        width={240}
                        height={135}
                        className="object-contain"
                      />
                    ) : (
                      <div className="text-gray-400">이미지 없음</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={uploadingBlog}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {uploadingBlog ? "저장 중..." : "저장"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBlog(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* 블로그 항목 목록 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순서</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">썸네일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">링크</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingBlogs ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">로딩 중...</td>
                </tr>
              ) : blogEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">등록된 블로그 링크가 없습니다.</td>
                </tr>
              ) : (
                blogEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{entry.display_order}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {entry.thumbnail_url && (
                        <Image
                          src={entry.thumbnail_url}
                          alt={entry.title || '썸네일'}
                          width={80}
                          height={45}
                          className="object-cover rounded"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{entry.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a
                        href={entry.blog_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {entry.blog_link ? (
                          entry.blog_link.length > 30 
                            ? entry.blog_link.substring(0, 30) + '...' 
                            : entry.blog_link
                        ) : ''}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => reorderBlogEntry(entry.id, 'up')}
                          className="text-gray-600 hover:text-gray-900"
                          disabled={blogEntries.indexOf(entry) === 0}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => reorderBlogEntry(entry.id, 'down')}
                          className="text-gray-600 hover:text-gray-900"
                          disabled={blogEntries.indexOf(entry) === blogEntries.length - 1}
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => editBlogEntry(entry)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => deleteBlogEntry(entry.id)}
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
      
      {/* 피처드 포스트 관리 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">조회수 순위 게시물 관리</h2>
        <p className="text-sm text-gray-500 mb-4">
          사이드바에 표시할 게시물을 선택하고 순서를 설정할 수 있습니다. 
          실제 조회수와 관계없이 임의로 게시물을 선택하여 표시할 수 있습니다.
        </p>
        
        {/* 게시물 추가 */}
        <div className="flex gap-2 mb-6">
          <select
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-black"
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
      
      {/* 추천 도서 관리 섹션 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">도서 추천 관리</h2>
        <p className="text-sm text-gray-500 mb-4">
          사이드바에 표시할 추천 도서를 관리합니다.
        </p>
        
        <div className="mb-6">
          <button
            onClick={handleAddBook}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            새 도서 추가
          </button>
        </div>
        
        {/* 도서 편집 폼 */}
        {editingBook && (
          <div className="mb-8 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-lg font-medium mb-4">
              {editingBook.id ? "도서 정보 수정" : "새 도서 추가"}
            </h3>
            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">도서 제목</label>
                    <input
                      type="text"
                      value={editingBook.title}
                      onChange={(e) => setEditingBook({ ...editingBook, title: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">저자</label>
                    <input
                      type="text"
                      value={editingBook.author || ''}
                      onChange={(e) => setEditingBook({ ...editingBook, author: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">링크</label>
                    <input
                      type="url"
                      value={editingBook.link_url || ''}
                      onChange={(e) => setEditingBook({ ...editingBook, link_url: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      placeholder="https://"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">도서 이미지</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBookImageChange}
                      className="w-full p-2 border rounded-md"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      권장 크기: 300x450px (2:3 비율)
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">이미지 미리보기</label>
                  <div className="border rounded-md p-4 flex items-center justify-center bg-gray-50 h-80">
                    {bookImagePreview ? (
                      <Image 
                        src={bookImagePreview} 
                        alt="도서 표지 미리보기" 
                        width={200}
                        height={300}
                        className="object-contain"
                      />
                    ) : (
                      <div className="text-gray-400">이미지 없음</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBook(null);
                    setBookImageFile(null);
                    setBookImagePreview("");
                  }}
                  className="px-4 py-2 border rounded"
                  disabled={bookSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                  disabled={bookSubmitting}
                >
                  {bookSubmitting ? "저장 중..." : "저장"}
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
              {loadingBooks ? (
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
                          onClick={() => handleBookReorder(book.id, 'up')}
                          className="text-gray-600 hover:text-gray-900"
                          disabled={books.indexOf(book) === 0}
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => handleBookReorder(book.id, 'down')}
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
                          onClick={() => handleBookDelete(book.id)}
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
    </div>
  );
}
