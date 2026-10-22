export type AdminArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  seo_title: string | null;
  seo_description: string | null;
  content: unknown;
  featured_image_url: string | null;
  status: string;
  is_featured: boolean;
  category_id: string | null;
  author_id: string | null;
  category_name: string | null;
  updated_at: string | null;
};

export type AdminOption = { id: string; name: string };

export type AdminAuthor = {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
};
