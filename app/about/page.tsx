"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect } from 'react';
import { supabase } from "@/lib/supabase";

export default function AboutPage() {
  // 컴포넌트가 마운트될 때 페이지 조회수 증가
  useEffect(() => {
    const 조회수증가 = async () => {
      try {
        // 페이지가 page_views 테이블에 존재하는지 확인
        const { data, error } = await supabase
          .from('page_views')
          .select('*')
          .eq('page_path', '/about')
          .single();
        
        if (error && error.code !== 'PGRST116') {
          console.error('페이지 조회 확인 오류:', error);
          return;
        }
        
        if (data) {
          // 페이지가 존재하면 조회수 증가
          await supabase
            .from('page_views')
            .update({ view_count: (data.view_count || 0) + 1 })
            .eq('page_path', '/about');
        } else {
          // 페이지가 존재하지 않으면 새 레코드 생성
          await supabase
            .from('page_views')
            .insert([{ page_path: '/about', view_count: 1 }]);
        }
      } catch (err) {
        console.error('조회수 증가 실패:', err);
      }
    };
    
    조회수증가();
  }, []);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 select-none">About Me</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 프로필 이미지 섹션 */}
        <div className="md:col-span-1">
          <Card className="bg-white border-0 shadow-md">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="w-48 h-48 relative mb-4 rounded-full overflow-hidden">
                <Image
                  src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                  alt="신원종"
                  fill
                  className="object-cover"
                />
              </div>
              <h2 className="text-xl font-bold mb-2 select-none">신원종</h2>
              <p className="text-gray-500 text-center select-none">바이오플러스인터내셔널 대표이사</p>
            </CardContent>
          </Card>
        </div>
        
        {/* 소개 및 프로필 정보 섹션 */}
        <div className="md:col-span-2">
          <Card className="bg-white border-0 shadow-md mb-8">
            <CardHeader>
              <CardTitle className="text-xl font-bold select-none">소개</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 select-none leading-relaxed">
                보건의료산업 관련 전반에 영향을 미치는 주요 변수들의 동향들을 살펴보고,<br />
                관련 의사결정자들이 더 나은 판단을 할 수 있게 도움주고자 개설된 정보 플랫폼입니다.
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white border-0 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold select-none">경력</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 select-none">
                <li className="flex">
                  <span className="font-medium min-w-28">현</span>
                  <span>바이오플러스인터내셔널 대표이사</span>
                </li>
                <li className="flex">
                  <span className="font-medium min-w-28">전</span>
                  <span>바이오플러스 전략기획조정실장</span>
                </li>
                <li className="flex">
                  <span className="font-medium min-w-28">전</span>
                  <span>GC녹십자웰빙 비즈니스이노베이션 유닛장</span>
                </li>
                <li className="flex">
                  <span className="font-medium min-w-28">전</span>
                  <span>코스맥스비티아이 전략기획팀장</span>
                </li>
                <li className="flex">
                  <span className="font-medium min-w-28">전</span>
                  <span>GC(녹십자홀딩스) 전략기획실</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 전문분야 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <Card className="bg-white border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold select-none">전문산업분야</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-2 select-none">
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <span>의료서비스</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <span>의약품</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <span>의료기기</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <span>건강기능식품</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <span>화장품</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <span>디지털헬스케어</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                <span>디지털마케팅</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl font-bold select-none">전문영역</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-2 gap-2 select-none">
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span>경영관리</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span>경영진단</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span>전략수립</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span>투자</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span>신사업</span>
              </li>
              <li className="flex items-center">
                <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                <span>사업개발</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 