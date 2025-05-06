import { Post } from "@/types/supabase";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { extractImageUrl } from "@/app/article/[id]/article-content";
import { useState } from "react";


type CategoryOption = {
  title: string | { ko: string; en: string };
  href?: string;
  base?: string;
  slug?: string;
};

type ArticlesSectionProps = {
  mainCategories: CategoryOption[];
  categoryPosts: Record<string, Post[] | null | undefined>;
};

export function ArticlesSection({
  mainCategories,
  categoryPosts,
}: ArticlesSectionProps) {
  const [showAllCategories, setShowAllCategories] = useState(true);
  
  // 처음에는 최대 5개의 카테고리만 표시
  const displayedCategories = showAllCategories 
    ? mainCategories 
    : mainCategories.slice(0, 5);

  return (
    <div className="w-full lg:w-2/3 max-w-full overflow-x-hidden">
      {displayedCategories.map((mainCat) => {
        const mainPath = mainCat.slug
          ? mainCat.slug
          : mainCat.base
          ? mainCat.base.replace(/^\//, "")
          : typeof mainCat.title === 'string' 
            ? mainCat.title.toLowerCase().replace(/\s+/g, "-")
            : mainCat.title.ko.toLowerCase().replace(/\s+/g, "-");

        const posts = categoryPosts[mainPath] || [];
        const latestPost = posts.length > 0 ? posts[0] : null;
        const remainingPosts = posts.slice(1, 5);

        return (
          <div key={typeof mainCat.title === 'string' ? mainCat.title : mainCat.slug || mainCat.title.ko} className="mb-12 max-w-full overflow-x-hidden">
<div className="flex justify-between items-center mb-8 relative overflow-hidden before:absolute before:bottom-0 before:left-0 before:w-full before:h-1 before:bg-gradient-to-r before:from-gray-400 before:to-transparent">
<h2 className="text-2xl font-semibold leading-none tracking-tight relative overflow-hidden">
<span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800">
    {typeof mainCat.title === 'string' ? mainCat.title : mainCat.title.ko}
  </span>
</h2>
<Button variant="outline" asChild className="px-4 py-2 mb-2">
                <Link href={`/${mainPath}`}>
                  View All 
                </Link>
              </Button>
            </div>

            {/* Latest Post */}
            {latestPost && (
              <Link href={`/article/${latestPost.id}`} className="mb-6 block max-w-full">
                <Card className="flex flex-col sm:flex-row items-center bg-white border-transparent shadow-lg hover:shadow-xl transition-shadow max-w-full">
                  {/* Latest Post 이미지 - 이미지가 있을 때만 표시 */}
                  {(latestPost.image_url || extractImageUrl(latestPost.content)) && (
                    <div className="w-full sm:w-[49%] flex justify-center items-center bg-gray-100 p-2 rounded-md" style={{ height: "200px" }}>
                      <img
                        src={latestPost.image_url || extractImageUrl(latestPost.content) || ""}
                        alt={latestPost.title}
                        className="max-w-full max-h-[180px] object-contain"
                      />
                    </div>
                  )}
                  <div className={`w-full p-4 ${(latestPost.image_url || extractImageUrl(latestPost.content)) ? 'sm:w-[51%]' : 'text-center h-24 sm:h-36 flex flex-col justify-center'}`}>
                    <CardHeader className="p-0 max-w-full">
                      <CardTitle className="line-clamp-2 text-lg md:text-xl font-semibold break-words">
                        {latestPost.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-0 max-w-full">
                      <div className="text-xs text-muted-foreground mt-1 select-none">
                        {new Date(
                          latestPost.updated_at || latestPost.created_at
                        ).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            )}

            {/* Remaining Posts (2x3 Grid) */}
            <div className="grid gap-6 sm:grid-cols-2">
              {remainingPosts.map((post) => (
                <Link key={post.id} href={`/article/${post.id}`}>
                  <Card className="flex flex-row items-center bg-white border-transparent shadow-lg hover:shadow-xl transition-shadow h-full" style={{ minHeight: "150px" }}>
                    {/* Remaining Posts 이미지 - 이미지가 있을 때만 표시 */}
                    {(post.image_url || extractImageUrl(post.content)) && (
                      <div className="w-1/3 flex justify-center items-center bg-gray-100 p-2 rounded-md" style={{ height: "150px" }}>
                        <img
                          src={post.image_url || extractImageUrl(post.content) || ""}
                          alt={post.title}
                          className="max-w-full max-h-[130px] object-contain"
                        />
                      </div>
                    )}
                    <div className={`p-2 sm:p-4 flex flex-col justify-center ${(post.image_url || extractImageUrl(post.content)) ? 'w-2/3' : 'w-full text-center'}`} style={{ minHeight: "150px" }}>
                      <CardHeader className="p-0">
                        <CardTitle className="line-clamp-2 text-base sm:text-lg font-semibold break-words">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow p-0">
                        <div className="text-xs text-muted-foreground mt-1 select-none">
                          {new Date(
                            post.updated_at || post.created_at
                          ).toLocaleDateString()}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
              {posts === undefined && (
                <div className="col-span-2 py-8 text-center text-muted-foreground select-none">
                  Loading articles...
                </div>
              )}
              {posts && posts.length === 0 && (
                <div className="col-span-2 py-8 text-center text-muted-foreground select-none">
                  No articles available in this category yet.
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* View All Categories 버튼 - 카테고리가 5개 이상일 때만 표시 */}
      {mainCategories.length > 5 && (
        <div className="flex justify-center my-8">
          <Button 
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="px-6 py-2 bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900"
          >
            {showAllCategories ? "간략히 보기" : "전체 카테고리 보기"} 
          </Button>
        </div>
      )}
    </div>
  );
}
