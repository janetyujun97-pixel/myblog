// ============================================================
//  data.js — Supabase-backed data layer
// ============================================================
//
//  SUPABASE SETUP — run these in the SQL Editor before first use:
//
//  -- 1. categories table
//  create table categories (
//    id   bigserial primary key,
//    name text unique not null
//  );
//
//  -- 2. posts table
//  create table posts (
//    id          bigserial primary key,
//    title       text not null,
//    content     text    default '',
//    excerpt     text    default '',
//    category    text    default '随笔',
//    tags        text[]  default '{}',
//    cover_image text    default '',
//    images      text[]  default '{}',
//    video_url   text    default '',
//    featured    boolean default false,
//    date        timestamptz default now(),
//    views       integer default 0
//  );
//
//  -- 3. increment_views RPC
//  create or replace function increment_views(post_id bigint)
//  returns void as $$
//    update posts set views = views + 1 where id = post_id;
//  $$ language sql;
//
//  -- 4. RLS policies (allow anonymous read/write for personal blog)
//  alter table categories enable row level security;
//  create policy "anon_all" on categories for all using (true) with check (true);
//  alter table posts enable row level security;
//  create policy "anon_all" on posts for all using (true) with check (true);
//
//  -- 5. Storage: create a public bucket named "images"
//  --    Then add this Storage policy:
//  insert into storage.policies (name, bucket_id, operation, definition)
//  values ('anon_upload', 'images', 'INSERT', 'true');
//
// ============================================================

const SUPABASE_URL      = 'https://cgqcthmroxoyxcvmidps.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncWN0aG1yb3hveXhjdm1pZHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0Mjk3NzksImV4cCI6MjA4NzAwNTc3OX0.s_Vc8VPpu6M8I07afw3vMsg7prlZngtzDi3wUc4aUfE';

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DB = {

  // ---------- helpers ----------

  _rowToPost(row) {
    return {
      id:         String(row.id),
      title:      row.title       || '',
      content:    row.content     || '',
      excerpt:    row.excerpt     || '',
      category:   row.category    || '随笔',
      tags:       row.tags        || [],
      coverImage: row.cover_image || '',
      images:     row.images      || [],
      videoUrl:   row.video_url   || '',
      featured:   row.featured    || false,
      date:       row.date        || new Date().toISOString(),
      views:      row.views       || 0,
    };
  },

  _makeExcerpt(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    const text = tmp.textContent || tmp.innerText || '';
    return text.slice(0, 120).trim() + (text.length > 120 ? '…' : '');
  },

  // ---------- categories ----------

  async getCategories() {
    const { data, error } = await _supabase
      .from('categories')
      .select('name')
      .order('id', { ascending: true });
    if (error) { console.error('getCategories', error); return ['随笔', '摄影', '旅行', '技术', '生活']; }
    return data.map(r => r.name);
  },

  async addCategory(name) {
    const cats = await this.getCategories();
    if (cats.includes(name)) return;
    const { error } = await _supabase.from('categories').insert({ name });
    if (error) console.error('addCategory', error);
  },

  async deleteCategory(name) {
    const { error } = await _supabase.from('categories').delete().eq('name', name);
    if (error) console.error('deleteCategory', error);
  },

  // ---------- posts ----------

  async getPosts() {
    const { data, error } = await _supabase
      .from('posts')
      .select('*')
      .order('date', { ascending: false });
    if (error) { console.error('getPosts', error); return []; }
    return data.map(r => this._rowToPost(r));
  },

  async getPost(id) {
    const { data, error } = await _supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) { console.error('getPost', error); return null; }
    return this._rowToPost(data);
  },

  async createPost(data) {
    const row = {
      title:       data.title      || '无题',
      content:     data.content    || '',
      excerpt:     data.excerpt    || this._makeExcerpt(data.content),
      category:    data.category   || '随笔',
      tags:        data.tags       || [],
      cover_image: data.coverImage || '',
      images:      data.images     || [],
      video_url:   data.videoUrl   || '',
      featured:    data.featured   || false,
      date:        data.date       || new Date().toISOString(),
      views:       0,
    };
    const { data: created, error } = await _supabase
      .from('posts')
      .insert(row)
      .select()
      .single();
    if (error) { console.error('createPost', error); return null; }
    return this._rowToPost(created);
  },

  async updatePost(id, data) {
    const row = {};
    if (data.title       !== undefined) row.title       = data.title;
    if (data.content     !== undefined) row.content     = data.content;
    if (data.excerpt     !== undefined) row.excerpt     = data.excerpt;
    if (data.category    !== undefined) row.category    = data.category;
    if (data.tags        !== undefined) row.tags        = data.tags;
    if (data.coverImage  !== undefined) row.cover_image = data.coverImage;
    if (data.images      !== undefined) row.images      = data.images;
    if (data.videoUrl    !== undefined) row.video_url   = data.videoUrl;
    if (data.featured    !== undefined) row.featured    = data.featured;
    const { data: updated, error } = await _supabase
      .from('posts')
      .update(row)
      .eq('id', id)
      .select()
      .single();
    if (error) { console.error('updatePost', error); return null; }
    return this._rowToPost(updated);
  },

  async deletePost(id) {
    const { error } = await _supabase.from('posts').delete().eq('id', id);
    if (error) console.error('deletePost', error);
  },

  async incrementViews(id) {
    const { error } = await _supabase.rpc('increment_views', { post_id: Number(id) });
    if (error) console.error('incrementViews', error);
  },

  // ---------- search / filter ----------

  async searchPosts(query, category) {
    let posts = await this.getPosts();
    if (category && category !== 'all') {
      posts = posts.filter(p => p.category === category);
    }
    if (query) {
      const q = query.toLowerCase();
      posts = posts.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    return posts;
  },

  // ---------- image upload ----------

  async uploadImage(file) {
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await _supabase.storage.from('images').upload(path, file);
    if (error) { console.error('uploadImage', error); return null; }
    const { data } = _supabase.storage.from('images').getPublicUrl(path);
    return data.publicUrl;
  },

  // ---------- seed demo data ----------

  async seed() {
    const { count, error } = await _supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });
    if (error) { console.error('seed check', error); return; }
    if (count > 0) return;

    // Seed categories if table is empty
    const { count: catCount } = await _supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });
    if (!catCount) {
      await _supabase.from('categories').insert([
        { name: '随笔' }, { name: '摄影' }, { name: '旅行' }, { name: '技术' }, { name: '生活' },
      ]);
    }

    const demos = [
      {
        title: '在京都的三天两夜',
        content: '<p>初秋的京都，银杏还没有完全转黄，但空气里已经有了凉意。清晨六点，哲学之道上几乎没有游客，只有晨光透过树隙，把石板路铺成一条金色的走廊。</p><p>我在这里住了三天。每天早晨步行去附近的咖啡馆，点一杯手冲，坐在靠窗的位置看路人经过。下午才去寺庙——等人群散去，光线变得柔和，建筑才真正地显出它的沉静。</p><p>旅行的意义，也许就是学会放慢。</p>',
        category: '旅行',
        tags: ['京都', '日本', '秋天'],
        coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
        images: [], videoUrl: '', featured: true,
      },
      {
        title: '用光影记录一座城市',
        content: '<p>摄影是一种减法。你拿着相机，面对繁杂的世界，最终按下快门的那一刻，你在做的是——选择留下什么，舍弃什么。</p><p>我最喜欢在清晨或黄昏拍摄城市。光线是斜的，影子是长的，普通的街角都会变得有戏剧性。</p>',
        category: '摄影',
        tags: ['街拍', '城市', '光影'],
        coverImage: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
        images: [], videoUrl: '', featured: false,
      },
      {
        title: '关于独处这件事',
        content: '<p>我越来越享受独处的时间。不是因为孤僻，而是因为人只有在安静下来的时候，才能听见自己内心真实的声音。</p><p>每周我会给自己留出一个完整的下午。手机静音，泡一壶茶，或读书，或只是发呆。这段时间是我真正属于自己的时间。</p>',
        category: '随笔',
        tags: ['生活', '独处', '思考'],
        coverImage: 'https://images.unsplash.com/photo-1474377207190-a7d8b3334068?w=800&q=80',
        images: [], videoUrl: '', featured: false,
      },
      {
        title: '深夜的上海外滩',
        content: '<p>夜里十一点，外滩的游客少了很多。江风很大，把路边的树吹得哗哗作响。对岸的陆家嘴灯火通明，倒映在黄浦江里，变成一片流动的光。</p><p>我一个人坐在堤岸上，想起第一次来上海是十年前的事。那时候刚毕业，口袋里几乎没有钱，却觉得整个世界都在等着自己去探索。</p>',
        category: '旅行',
        tags: ['上海', '夜景', '记忆'],
        coverImage: 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=800&q=80',
        images: [], videoUrl: '', featured: true,
      },
      {
        title: '咖啡馆里的代码时光',
        content: '<p>很多人问我为什么喜欢在咖啡馆写代码。其实原因很简单：咖啡馆的白噪音会让我专注，而家里太安静反而容易分心。</p><p>今天在附近的独立咖啡馆坐了四个小时，把一个拖了两周的功能模块终于写完了。咖啡凉了换热的，音乐换了三个播放列表。</p><p>有时候环境的改变，就是最好的生产力工具。</p>',
        category: '技术',
        tags: ['编程', '效率', '咖啡'],
        coverImage: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80',
        images: [], videoUrl: '', featured: false,
      },
    ];

    // Insert newest-first: reverse so index 0 gets today, index 4 gets today-20d
    const reversed = [...demos].reverse();
    for (let i = 0; i < reversed.length; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i * 5);
      await this.createPost({ ...reversed[i], date: d.toISOString() });
    }
  },
};
