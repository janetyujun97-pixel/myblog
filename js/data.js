// ============================================================
//  data.js — LocalStorage-backed data layer
// ============================================================

const DB = {
  POSTS_KEY: 'vlog_posts',
  CATS_KEY:  'vlog_categories',

  // ---------- categories ----------
  getCategories() {
    const raw = localStorage.getItem(this.CATS_KEY);
    return raw ? JSON.parse(raw) : ['随笔', '摄影', '旅行', '技术', '生活'];
  },
  saveCategories(cats) {
    localStorage.setItem(this.CATS_KEY, JSON.stringify(cats));
  },
  addCategory(name) {
    const cats = this.getCategories();
    if (!cats.includes(name)) { cats.push(name); this.saveCategories(cats); }
  },
  deleteCategory(name) {
    const cats = this.getCategories().filter(c => c !== name);
    this.saveCategories(cats);
  },

  // ---------- posts ----------
  getPosts() {
    const raw = localStorage.getItem(this.POSTS_KEY);
    return raw ? JSON.parse(raw) : [];
  },
  savePosts(posts) {
    localStorage.setItem(this.POSTS_KEY, JSON.stringify(posts));
  },
  getPost(id) {
    return this.getPosts().find(p => p.id === id) || null;
  },
  createPost(data) {
    const posts = this.getPosts();
    const post = {
      id:         Date.now().toString(),
      title:      data.title      || '无题',
      content:    data.content    || '',
      excerpt:    data.excerpt    || this._makeExcerpt(data.content),
      category:   data.category   || '随笔',
      tags:       data.tags       || [],
      coverImage: data.coverImage || '',
      images:     data.images     || [],
      videoUrl:   data.videoUrl   || '',
      featured:   data.featured   || false,
      date:       new Date().toISOString(),
      views:      0,
    };
    posts.unshift(post);
    this.savePosts(posts);
    return post;
  },
  updatePost(id, data) {
    const posts = this.getPosts();
    const idx = posts.findIndex(p => p.id === id);
    if (idx === -1) return null;
    posts[idx] = { ...posts[idx], ...data };
    this.savePosts(posts);
    return posts[idx];
  },
  deletePost(id) {
    const posts = this.getPosts().filter(p => p.id !== id);
    this.savePosts(posts);
  },
  incrementViews(id) {
    const posts = this.getPosts();
    const p = posts.find(p => p.id === id);
    if (p) { p.views = (p.views || 0) + 1; this.savePosts(posts); }
  },

  // ---------- search / filter ----------
  searchPosts(query, category) {
    let posts = this.getPosts();
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

  _makeExcerpt(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    const text = tmp.textContent || tmp.innerText || '';
    return text.slice(0, 120).trim() + (text.length > 120 ? '…' : '');
  },

  // ---------- seed demo data ----------
  seed() {
    if (this.getPosts().length > 0) return;
    const demos = [
      {
        title: '在京都的三天两夜',
        content: '<p>初秋的京都，银杏还没有完全转黄，但空气里已经有了凉意。清晨六点，哲学之道上几乎没有游客，只有晨光透过树隙，把石板路铺成一条金色的走廊。</p><p>我在这里住了三天。每天早晨步行去附近的咖啡馆，点一杯手冲，坐在靠窗的位置看路人经过。下午才去寺庙——等人群散去，光线变得柔和，建筑才真正地显出它的沉静。</p><p>旅行的意义，也许就是学会放慢。</p>',
        category: '旅行',
        tags: ['京都', '日本', '秋天'],
        coverImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
        images: [],
        videoUrl: '',
        featured: true,
      },
      {
        title: '用光影记录一座城市',
        content: '<p>摄影是一种减法。你拿着相机，面对繁杂的世界，最终按下快门的那一刻，你在做的是——选择留下什么，舍弃什么。</p><p>我最喜欢在清晨或黄昏拍摄城市。光线是斜的，影子是长的，普通的街角都会变得有戏剧性。</p>',
        category: '摄影',
        tags: ['街拍', '城市', '光影'],
        coverImage: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80',
        images: [],
        videoUrl: '',
        featured: false,
      },
      {
        title: '关于独处这件事',
        content: '<p>我越来越享受独处的时间。不是因为孤僻，而是因为人只有在安静下来的时候，才能听见自己内心真实的声音。</p><p>每周我会给自己留出一个完整的下午。手机静音，泡一壶茶，或读书，或只是发呆。这段时间是我真正属于自己的时间。</p>',
        category: '随笔',
        tags: ['生活', '独处', '思考'],
        coverImage: 'https://images.unsplash.com/photo-1474377207190-a7d8b3334068?w=800&q=80',
        images: [],
        videoUrl: '',
        featured: false,
      },
      {
        title: '深夜的上海外滩',
        content: '<p>夜里十一点，外滩的游客少了很多。江风很大，把路边的树吹得哗哗作响。对岸的陆家嘴灯火通明，倒映在黄浦江里，变成一片流动的光。</p><p>我一个人坐在堤岸上，想起第一次来上海是十年前的事。那时候刚毕业，口袋里几乎没有钱，却觉得整个世界都在等着自己去探索。</p>',
        category: '旅行',
        tags: ['上海', '夜景', '记忆'],
        coverImage: 'https://images.unsplash.com/photo-1538428494232-9c0d8a3ab403?w=800&q=80',
        images: [],
        videoUrl: '',
        featured: true,
      },
      {
        title: '咖啡馆里的代码时光',
        content: '<p>很多人问我为什么喜欢在咖啡馆写代码。其实原因很简单：咖啡馆的白噪音会让我专注，而家里太安静反而容易分心。</p><p>今天在附近的独立咖啡馆坐了四个小时，把一个拖了两周的功能模块终于写完了。咖啡凉了换热的，音乐换了三个播放列表。</p><p>有时候环境的改变，就是最好的生产力工具。</p>',
        category: '技术',
        tags: ['编程', '效率', '咖啡'],
        coverImage: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&q=80',
        images: [],
        videoUrl: '',
        featured: false,
      },
    ];
    // Insert newest first
    demos.reverse().forEach((d, i) => {
      const post = this.createPost(d);
      // Back-date them a bit for variety
      const posts = this.getPosts();
      const p = posts.find(x => x.id === post.id);
      if (p) {
        const d = new Date();
        d.setDate(d.getDate() - i * 5);
        p.date = d.toISOString();
      }
      this.savePosts(posts);
    });
  },
};
