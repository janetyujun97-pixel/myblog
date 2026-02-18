// ============================================================
//  post.js — Single post page
// ============================================================

/* ---------- Theme ---------- */
(function initTheme() {
  const saved = localStorage.getItem('vlog_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcons(saved);
})();
function updateThemeIcons(theme) {
  const sun  = document.getElementById('themeIconSun');
  const moon = document.getElementById('themeIconMoon');
  if (!sun || !moon) return;
  if (theme === 'dark') { sun.style.display = 'none'; moon.style.display = ''; }
  else                  { sun.style.display = '';     moon.style.display = 'none'; }
}
document.getElementById('themeToggle')?.addEventListener('click', () => {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('vlog_theme', next);
  updateThemeIcons(next);
});

/* ---------- Helpers ---------- */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getYoutubeId(url) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
  return m ? m[1] : null;
}
function getBilibiliId(url) {
  const m = url.match(/bilibili\.com\/video\/(BV\w+|av\d+)/i);
  return m ? m[1] : null;
}
function getVideoEmbed(url) {
  if (!url) return '';
  const yt = getYoutubeId(url);
  if (yt) return `<iframe src="https://www.youtube.com/embed/${yt}" allowfullscreen></iframe>`;
  const bl = getBilibiliId(url);
  if (bl) return `<iframe src="https://player.bilibili.com/player.html?bvid=${bl}&high_quality=1" allowfullscreen></iframe>`;
  // Generic iframe for other video URLs
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return `<video controls style="width:100%;border-radius:var(--radius)"><source src="${url}" /></video>`;
  }
  return `<iframe src="${url}" allowfullscreen></iframe>`;
}

/* ---------- Load post ---------- */
const params = new URLSearchParams(location.search);
const postId = params.get('id');
const container = document.getElementById('postPage');

if (!postId) {
  container.innerHTML = '<p style="color:var(--text-3);text-align:center;padding:80px 0">未找到文章</p>';
} else {
  const post = DB.getPost(postId);
  if (!post) {
    container.innerHTML = '<p style="color:var(--text-3);text-align:center;padding:80px 0">文章不存在或已删除</p>';
  } else {
    DB.incrementViews(postId);
    document.title = `${post.title} · My Blog`;
    renderPost(post);
  }
}

function renderPost(p) {
  // Render nav categories
  const nav = document.getElementById('catNav');
  DB.getCategories().forEach(c => {
    const a = document.createElement('a');
    a.href = `index.html`;
    a.className = 'nav-link';
    a.dataset.cat = c;
    a.textContent = c;
    nav.appendChild(a);
  });

  // Build video HTML
  const videoHtml = p.videoUrl
    ? `<div class="post-video">${getVideoEmbed(p.videoUrl)}</div>`
    : '';

  // Build gallery HTML
  const galleryHtml = (p.images && p.images.length > 0)
    ? `<div class="post-gallery">${p.images.map(src => `<img src="${src}" loading="lazy" />`).join('')}</div>`
    : '';

  // Tags
  const tagsHtml = (p.tags && p.tags.length > 0)
    ? `<div class="post-tags">${p.tags.map(t => `<span class="tag">#${t}</span>`).join('')}</div>`
    : '';

  container.innerHTML = `
    <a href="index.html" class="back-link animate-in">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
        <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
      </svg>
      返回首页
    </a>

    <article>
      ${p.coverImage ? `
        <div class="post-hero-img animate-in">
          <img src="${p.coverImage}" alt="${p.title}" />
        </div>` : ''}

      <header class="post-header animate-in">
        <span class="post-category-badge">${p.category}</span>
        <h1>${p.title}</h1>
        <div class="post-meta">
          <span>
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            ${formatDate(p.date)}
          </span>
          <span>
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            ${p.views} 次阅读
          </span>
        </div>
      </header>

      ${videoHtml}

      <div class="post-content animate-in">
        ${p.content}
      </div>

      ${galleryHtml}
      ${tagsHtml}
    </article>

    <!-- Related posts (same category) -->
    <div id="relatedSection" style="margin-top:60px;"></div>
  `;

  // Render related
  const related = DB.searchPosts('', p.category).filter(x => x.id !== p.id).slice(0, 3);
  if (related.length) {
    document.getElementById('relatedSection').innerHTML = `
      <p class="section-label" style="font-size:.78rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--text-3);margin-bottom:20px;">相关文章</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;">
        ${related.map(r => `
          <div class="post-card" onclick="location.href='post.html?id=${r.id}'" style="cursor:pointer">
            <div class="post-card-cover">
              ${r.coverImage ? `<img src="${r.coverImage}" loading="lazy" />` : `<div class="post-card-cover-placeholder">✦</div>`}
            </div>
            <div class="post-card-body">
              <h3>${r.title}</h3>
              <p class="post-excerpt">${r.excerpt}</p>
            </div>
          </div>`).join('')}
      </div>`;
  }

  // Lightbox for gallery images
  setTimeout(() => {
    document.querySelectorAll('.post-gallery img').forEach(img => {
      img.addEventListener('click', () => {
        const lb = document.getElementById('lightbox');
        document.getElementById('lightboxImg').src = img.src;
        lb.classList.add('open');
      });
    });
  }, 100);
}

/* ---------- Lightbox ---------- */
const lightbox = document.getElementById('lightbox');
document.getElementById('lightboxClose').addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') lightbox.classList.remove('open'); });
