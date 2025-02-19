"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Post } from "@/types/supabase";
import Link from "next/link";

interface SubCategoryListProps {
  category: string;
  subcategory: string;
}

export default function SubCategoryList({ category, subcategory }: SubCategoryListProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!category || !subcategory) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("category", category)
        .eq("subcategory", subcategory)
        .order("updated_at", { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchPosts();
  }, [category, subcategory]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">
        {subcategory} in {category}
      </h1>
      {loading ? (
        <p>Loading reports...</p>
      ) : posts.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/article/${post.id}`}>
              <Card className="cursor-pointer hover:shadow-xl transition-shadow">
                {post.image_url && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-3">
                    {post.content.replace(/<[^>]+>/g, "").slice(0, 100)}...
                  </p>
                </CardContent>
                <div className="flex items-center text-sm text-muted-foreground p-4 pt-0">
                  <Calendar className="mr-2 h-4 w-4" />
                  {new Date(post.updated_at || post.created_at).toLocaleDateString()}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
