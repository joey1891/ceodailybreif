export type Post = {
  id: string;
  title: string;
  content: string;
  category: string;
  subcategory?: string;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  image_url?: string;
  date?: string;
  viewcnt?: number;
  is_slide?: boolean;
};

export type Profile = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
};

export type Filter = {
  id: string;
  name: string;
  category: string;
  created_at: string;
};

export type Sort = {
  id: string;
  name: string;
  category: string;
  created_at: string;
};

export type Role = {
  id: string;
  name: string;
  permissions: Record<string, any>;
  created_at: string;
};
