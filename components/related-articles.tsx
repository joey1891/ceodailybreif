import { Post } from "@/types/supabase";
import Link from "next/link";

export default function RelatedArticles({ articles }: { articles: Post[] }) {
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4">관련 기사</h3>
      {articles.length > 0 ? (
        <ul className="space-y-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Link 
                href={`/article/${article.id}`}
                className="block hover:text-blue-600"
              >
                {article.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">관련 기사가 없습니다.</p>
      )}
    </div>
  );
} 