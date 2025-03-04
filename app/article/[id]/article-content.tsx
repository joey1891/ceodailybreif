"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";

export function ArticleContent({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error) {
        console.error("Error fetching post:", error);
      } else {
        setPost(data);
      }
      setLoading(false);
    };

    fetchPost();
  }, [params.id]);

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = post?.title || '';
    
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
    };

    window.open(shareUrls[platform as keyof typeof shareUrls], '_blank');
  };

  if (loading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-2/3">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
              <div className="h-[400px] bg-gray-200 rounded mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/3">
            <Sidebar recentPosts={[]} />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">기사를 찾을 수 없습니다</h1>
          <Button asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-8">
            <Link href="/" className="text-primary hover:text-primary/80">
              <ArrowLeft className="mr-2 h-4 w-4" />
              홈으로
            </Link>
          </Button>

          {/* Article Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                {new Date(post.date || post.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
              {post.author_id && (
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  작성자
                </div>
              )}
            </div>
          </div>

          {/* Featured Image */}
          {post.image_url && (
            <div className="relative w-full h-[400px] mb-8 rounded-lg overflow-hidden">
              <img
                src={post.image_url}
                alt={post.title}
                className="object-cover w-full h-full"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none mb-8">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* Share Buttons */}
          <div className="mt-8 pt-8 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-4 w-4" />
              <span className="font-medium">이 기사 공유하기</span>
            </div>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => handleShare('twitter')}>
                Twitter
              </Button>
              <Button variant="outline" onClick={() => handleShare('facebook')}>
                Facebook
              </Button>
              <Button variant="outline" onClick={() => handleShare('linkedin')}>
                LinkedIn
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-1/3">
          <Sidebar recentPosts={[]} />
        </div>
      </div>
    </div>
  );
}