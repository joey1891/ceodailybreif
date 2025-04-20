"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { Popup } from "@/types/popup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import { Slider } from "@/components/ui/slider";

interface PopupFormProps {
  popupId?: string;
}

export default function PopupForm({ popupId }: PopupFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [popup, setPopup] = useState<Partial<Popup>>({
    title: "",
    content: "",
    image_url: "",
    link_url: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    is_active: true,
    size_percentage: 80,
    position: 0,
    display_order: 1,
  });

  const isEditMode = !!popupId;

  useEffect(() => {
    if (isEditMode) {
      fetchPopupData();
    }
  }, [popupId]);

  async function fetchPopupData() {
    try {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("id", popupId)
        .single();

      if (error) throw error;
      
      if (data) {
        setPopup({
          ...data,
          start_date: data.start_date.slice(0, 10),
          end_date: data.end_date.slice(0, 10),
        });
        
        if (data.image_url) {
          setImagePreview(data.image_url);
        }
      }
    } catch (error) {
      console.error("Error fetching popup:", error);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPopup(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setPopup(prev => ({ ...prev, is_active: checked }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `popup/${uuidv4()}.${fileExt}`;
    
    setUploading(true);
    
    try {
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
      
      // 'images' 버킷 사용 (기존 버킷 이름)
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      
      setPopup(prev => ({ ...prev, image_url: data.publicUrl }));
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPopup(prev => ({ ...prev, [name]: parseInt(value, 10) }));
  };
  
  const handleSizeChange = (value: number[]) => {
    setPopup(prev => ({ ...prev, size_percentage: value[0] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isEditMode) {
        // Update existing popup
        const { error } = await supabase
          .from("popups")
          .update(popup)
          .eq("id", popupId);
          
        if (error) throw error;
      } else {
        // Create new popup
        const { error } = await supabase
          .from("popups")
          .insert([{ ...popup, id: uuidv4() }]);
          
        if (error) throw error;
      }
      
      router.push("/admin/popup");
      router.refresh();
    } catch (error) {
      console.error("Error saving popup:", error);
      alert("팝업 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {isEditMode ? "팝업 수정" : "새 팝업 추가"}
      </h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input 
            id="title" 
            name="title" 
            value={popup.title} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="content">내용</Label>
          <Textarea 
            id="content" 
            name="content" 
            value={popup.content || ""} 
            onChange={handleChange} 
            rows={4} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="image">팝업 이미지</Label>
          <Input 
            id="image" 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            disabled={uploading} 
            className="mb-2"
          />
          
          {imagePreview && (
            <div className="mt-2 relative w-full h-48">
              <Image 
                src={imagePreview} 
                alt="Preview" 
                fill
                className="object-contain"
              />
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="link_url">링크 URL</Label>
          <Input 
            id="link_url" 
            name="link_url" 
            type="url" 
            value={popup.link_url || ""} 
            onChange={handleChange} 
            placeholder="https://example.com" 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date">시작일</Label>
            <Input 
              id="start_date" 
              name="start_date" 
              type="date" 
              value={popup.start_date} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="end_date">종료일</Label>
            <Input 
              id="end_date" 
              name="end_date" 
              type="date" 
              value={popup.end_date} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="is_active" 
            checked={popup.is_active} 
            onCheckedChange={handleSwitchChange} 
          />
          <Label htmlFor="is_active">활성화</Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="size_percentage">팝업 크기 (%)</Label>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Slider
                id="size_percentage"
                min={10}
                max={100}
                step={1}
                value={[popup.size_percentage || 80]}
                onValueChange={handleSizeChange}
              />
            </div>
            <span className="w-12 text-right">{popup.size_percentage || 80}%</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="position">팝업 가로 위치 (px 단위, 0 = 왼쪽 기준)</Label>
          <Input
            id="position"
            name="position"
            type="number"
            value={popup.position || 0}
            onChange={handleNumberChange}
          />
          <p className="text-xs text-gray-500">양수값은 왼쪽에서 떨어진 거리(px)를 의미합니다. 중앙 정렬은 -1을 입력하세요.</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="display_order">표시 순서</Label>
          <Input
            id="display_order"
            name="display_order"
            type="number"
            min="1"
            value={popup.display_order || 1}
            onChange={handleNumberChange}
          />
          <p className="text-xs text-gray-500">낮은 숫자가 먼저 표시됩니다</p>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.push("/admin/popup")}
          >
            취소
          </Button>
          <Button 
            type="submit" 
            disabled={loading || uploading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? "저장 중..." : "저장"}
          </Button>
        </div>
      </form>
    </div>
  );
} 