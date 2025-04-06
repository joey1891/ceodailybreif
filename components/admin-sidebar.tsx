import Link from "next/link";
import { IconPhoto } from "@tabler/icons-react";

export default function AdminSidebar() {
  return (
    <div className="min-w-[200px] h-screen bg-gray-100 p-4 border-r">
      <div className="text-xl font-bold mb-6">관리자 메뉴</div>
      <nav>
        <ul className="space-y-2">
          <li>
            <Link 
              href="/admin/dashboard" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              대시보드
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/articles" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              기사 관리
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/about-me" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              소개 관리
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/members" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              구독자 관리
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/books" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              도서 추천 관리
            </Link>
          </li>
          <li>
            <Link 
              href="/admin/popup" 
              className="block p-2 hover:bg-gray-200 rounded"
            >
              <IconPhoto className="inline-block mr-2" size={16} />
              팝업 관리
            </Link>
          </li>
          {/* 기타 메뉴 항목들 */}
        </ul>
      </nav>
    </div>
  );
} 