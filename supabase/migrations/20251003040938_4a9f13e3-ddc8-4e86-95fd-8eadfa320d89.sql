-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date timestamp with time zone NOT NULL,
  venue text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone"
ON public.events FOR SELECT
USING (true);

CREATE POLICY "Admins can manage events"
ON public.events FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create gallery_categories table
CREATE TABLE public.gallery_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.gallery_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
ON public.gallery_categories FOR SELECT
USING (true);

CREATE POLICY "Admins can manage categories"
ON public.gallery_categories FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create gallery_images table
CREATE TABLE public.gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.gallery_categories(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  image_url text NOT NULL,
  event_name text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Images are viewable by everyone"
ON public.gallery_images FOR SELECT
USING (true);

CREATE POLICY "Admins can manage images"
ON public.gallery_images FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create comments table
CREATE TABLE public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
ON public.comments FOR SELECT
USING (true);

CREATE POLICY "Users can create comments"
ON public.comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.comments FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
ON public.comments FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();