-- Allow everyone to view executive profiles
CREATE POLICY "Executive profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (is_executive = true);