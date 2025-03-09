// app/search/page.tsx
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from 'next/headers'
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || "";

  // 서버 컴포넌트용 Supabase 클라이언트 생성 (쿠키 기반 인증 등 필요 시)
  const supabase = createServerComponentClient({ cookies });

  // 검색어가 없는 경우, 빈 화면이나 안내 메시지 표시
  if (!query.trim()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold">Search</h1>
        <p>Please enter a search query.</p>
      </div>
    );
  }
  // Supabase 쿼리: title, description, content에서 검색 (ilike는 대소문자 무시)
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`);

  if (error) {
    console.error("Search error:", error.message);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Search Results for "{query}"</h1>
      {data && data.length > 0 ? (
        <ul className="space-y-2">
          {data.map((post: any) => (
            <li key={post.id}>
              <a
                href={`/article/${post.id}`}
                className="text-blue-600 hover:underline"
              >
                {post.title}
              </a>
              <p className="text-gray-600 text-sm">{post.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No results found.</p>
      )}
    </div>
  );
}
