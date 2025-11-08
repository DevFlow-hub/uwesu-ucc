-- Make title column nullable in gallery_images table
ALTER TABLE public.gallery_images 
ALTER COLUMN title DROP NOT NULL;

-- Update any existing null titles to empty string for consistency (if needed)
UPDATE public.gallery_images 
SET title = '' 
WHERE title IS NULL;