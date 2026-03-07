-- ============================================================
-- Supabase Auth + RLS Migration for myvlog
-- ============================================================
-- Run this in Supabase SQL Editor to enable auth and secure RLS.
-- After running, create your admin user in Supabase Dashboard → Authentication.
-- ============================================================

-- 1. Enable UUID extension (if not already)
create extension if not exists "uuid-ossp";

-- 2. Add owner tracking to posts table
alter table posts add column if not exists created_by uuid references auth.users(id);
alter table posts add column if not exists updated_at timestamptz default now();

-- 3. Add owner tracking to categories table
alter table categories add column if not exists created_by uuid references auth.users(id);

-- 4. Drop old permissive policies
drop policy if exists "anon_all" on posts;
drop policy if exists "anon_all" on categories;

-- ============================================================
-- POSTS policies
-- ============================================================

-- Allow anyone to read posts (public blog)
create policy "posts_read_public" on posts
  for select
  using (true);

-- Allow authenticated users to insert their own posts
create policy "posts_insert_auth" on posts
  for insert
  with check (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Allow authenticated users to update their own posts
create policy "posts_update_own" on posts
  for update
  using (auth.role() = 'authenticated' AND auth.uid() = created_by)
  with check (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Allow authenticated users to delete their own posts
create policy "posts_delete_own" on posts
  for delete
  using (auth.role() = 'authenticated' AND auth.uid() = created_by);

-- Allow any authenticated user to view all posts (needed for admin list)
create policy "posts_view_all_auth" on posts
  for select
  to authenticated
  using (true);

-- ============================================================
-- CATEGORIES policies
-- ============================================================

-- Allow anyone to read categories
create policy "categories_read_public" on categories
  for select
  using (true);

-- Allow authenticated users to insert categories
create policy "categories_insert_auth" on categories
  for insert
  with check (auth.role() = 'authenticated');

-- Allow authenticated users to update categories
create policy "categories_update_auth" on categories
  for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Allow authenticated users to delete categories
create policy "categories_delete_auth" on categories
  for delete
  using (auth.role() = 'authenticated');

-- ============================================================
-- STORAGE policies (images bucket)
-- ============================================================

-- Ensure images bucket exists and is public
-- In Supabase Dashboard → Storage, create bucket "images" with public = true

-- Allow public read access
create policy "images_public_read" on storage.objects
  for select
  using (bucket_id = 'images');

-- Allow authenticated users to upload
create policy "images_upload_auth" on storage.objects
  for insert
  with check (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own uploads
create policy "images_update_own" on storage.objects
  for update
  using (bucket_id = 'images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own uploads
create policy "images_delete_own" on storage.objects
  for delete
  using (bucket_id = 'images' AND auth.role() = 'authenticated');

-- ============================================================
-- Helper: increment_views RPC (keep existing, allow public)
-- ============================================================
-- This should already exist. If not, create it:
create or replace function increment_views(post_id bigint)
returns void as $$
  update posts set views = views + 1 where id = post_id;
$$ language sql security definer;

-- Allow anyone to call increment_views
grant execute on function increment_views to anon, authenticated;

-- ============================================================
-- Next steps after running this SQL:
-- ============================================================
-- 1. Go to Supabase Dashboard → Authentication
-- 2. Add a new user (your admin email + password)
-- 3. Update js/data.js if needed (SUPABASE_URL and SUPABASE_ANON_KEY should already be set)
-- 4. Test: open admin.html, you should see login screen
-- 5. Login with your admin credentials
-- ============================================================
