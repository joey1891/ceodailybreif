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

type CategoryOption = {
  title: string;
  href?: string;
  base?: string;
};

type ArticlesSectionProps = {
  mainCategories: CategoryOption[];
  categoryPosts: Record<string, Post[] | null | undefined>;
};

export function ArticlesSection({
  mainCategories,
  categoryPosts,
}: ArticlesSectionProps) {
  return (
    <div className="w-full lg:w-2/3">
      {mainCategories.map((mainCat) => {
        const mainPath = mainCat.href
          ? mainCat.href.replace(/^\//, "")
          : mainCat.base
          ? mainCat.base.replace(/^\//, "")
          : mainCat.title.toLowerCase().replace(/\s+/g, "-");

        const posts = categoryPosts[mainPath] || [];
        const latestPost = posts.length > 0 ? posts[0] : null;
        const remainingPosts = posts.slice(1, 7);

        return (
          <div key={mainCat.title} className="mb-12">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold">
                {mainCat.title}
              </h2>
              <Button variant="outline" asChild>
                <Link href={`/${mainPath}`}>
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Latest Post */}
            {latestPost && (
              <Link href={`/article/${latestPost.id}`} className="mb-6 block">
                <Card className="flex items-center bg-white border-transparent shadow-lg hover:shadow-xl transition-shadow">
                  {latestPost.image_url && (
                    <div className="relative h-56 w-[49%] overflow-hidden rounded-md">
                      <img
                        src={latestPost.image_url}
                        alt={latestPost.title}
                        className="object-cover w-full h-full object-center"
                      />
                    </div>
                  )}
                  <div className="w-[51%] p-4">
                    <CardHeader className="p-0">
                      <CardTitle className="line-clamp-2 text-lg md:text-xl font-semibold">
                        {latestPost.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow p-0">
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(
                          latestPost.updated_at || latestPost.created_at
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-muted-foreground line-clamp-3 prose prose-sm max-w-none mt-2">
                        {latestPost.content.replace(/<img\b[^>]*>/gi, "")}
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
                  <Card className="flex items-center bg-white border-transparent shadow-lg hover:shadow-xl transition-shadow">
                    {post.image_url && (
                      <div className="relative h-32 w-1/3 overflow-hidden rounded-md">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}
                    <div className="w-2/3 p-4">
                      <CardHeader className="p-0">
                        <CardTitle className="line-clamp-2 text-lg md:text-xl font-semibold">
                          {post.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow p-0">
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(
                            post.updated_at || post.created_at
                          ).toLocaleDateString()}
                        </div>
                        <div
                          className="text-muted-foreground line-clamp-3 prose prose-sm max-w-none mt-2"
                          dangerouslySetInnerHTML={{
                            __html: post.content.replace(/<img\b[^>]*>/gi, ""),
                          }}
                        />
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
              {posts === undefined && (
                <div className="col-span-2 py-8 text-center text-muted-foreground">
                  Loading articles...
                </div>
              )}
              {posts && posts.length === 0 && (
                <div className="col-span-2 py-8 text-center text-muted-foreground">
                  No articles available in this category yet.
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
