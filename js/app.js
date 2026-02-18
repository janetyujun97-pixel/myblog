// ============================================================
//  app.js — Homepage logic
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

/* ---------- State ---------- */
let currentCat = 'all';
let searchQuery = '';

/* ---------- Helpers ---------- */
function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

function mediaType(post) {
  if (post.videoUrl) return 'VIDEO';
  if (post.images && post.images.length > 0) return 'PHOTO';
  return null;
}

/* ---------- Render nav ---------- */
async function renderNav() {
  const nav = document.getElementById('catNav');
  const cats = await DB.getCategories();
  nav.innerHTML = `<a href="#" class="nav-link ${currentCat === 'all' ? 'active' : ''}" data-cat="all">全部</a>`;
  cats.forEach(c => {
    nav.innerHTML += `<a href="#" class="nav-link ${currentCat === c ? 'active' : ''}" data-cat="${c}">${c}</a>`;
  });
  nav.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); setCategory(a.dataset.cat); });
  });
}

/* ---------- Render filter pills ---------- */
async function renderFilterPills() {
  const bar = document.getElementById('filterBar');
  const cats = await DB.getCategories();
  bar.innerHTML = `<span class="section-label">分类</span>
    <button class="filter-pill ${currentCat === 'all' ? 'active' : ''}" data-cat="all">全部</button>`;
  cats.forEach(c => {
    bar.innerHTML += `<button class="filter-pill ${currentCat === c ? 'active' : ''}" data-cat="${c}">${c}</button>`;
  });
  bar.querySelectorAll('.filter-pill').forEach(btn => {
    btn.addEventListener('click', () => setCategory(btn.dataset.cat));
  });
}

async function setCategory(cat) {
  currentCat = cat;
  await renderNav();
  await renderFilterPills();
  await renderPosts();
}

/* ---------- Render featured ---------- */
async function renderFeatured() {
  const section = document.getElementById('featuredSection');
  const container = document.getElementById('featuredCard');
  const posts = (await DB.getPosts()).filter(p => p.featured);
  if (!posts.length) { section.style.display = 'none'; return; }
  section.style.display = '';
  const p = posts[0];
  const mt = mediaType(p);
  container.innerHTML = `
    <div class="featured-card animate-in" onclick="openPost('${p.id}')">
      <div class="featured-card-img">
        ${p.coverImage
          ? `<img src="${p.coverImage}" alt="${p.title}" loading="lazy" />`
          : `<div style="width:100%;height:100%;background:var(--bg-hover);display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:3rem;">✦</div>`}
      </div>
      <div class="featured-card-body">
        <span class="post-category-badge">${p.category}</span>
        <h2>${p.title}</h2>
        <p class="post-excerpt">${p.excerpt}</p>
        <div class="post-meta">
          <span>
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${formatDate(p.date)}
          </span>
          <span>
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            ${p.views || 0} 次阅读
          </span>
        </div>
        <a class="read-more-link" style="margin-top:20px">
          阅读全文
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    </div>`;
}

/* ---------- Render posts ---------- */
async function renderPosts() {
  const grid = document.getElementById('postsGrid');
  const posts = await DB.searchPosts(searchQuery, currentCat);

  if (!posts.length) {
    grid.innerHTML = `<div class="empty-state">
      <div class="empty-icon">✦</div>
      <p>${searchQuery ? `没有找到"${searchQuery}"相关文章` : '暂无文章，去写第一篇吧'}</p>
    </div>`;
    return;
  }

  grid.innerHTML = posts.map((p, i) => {
    const mt = mediaType(p);
    return `
    <div class="post-card animate-in" style="animation-delay:${i * .05}s" onclick="openPost('${p.id}')">
      <div class="post-card-cover">
        ${p.coverImage
          ? `<img src="${p.coverImage}" alt="${p.title}" loading="lazy" />`
          : `<div class="post-card-cover-placeholder">✦</div>`}
        ${mt ? `<div class="media-badge">${mt === 'VIDEO' ? '▶ 视频' : '◎ 图集'}</div>` : ''}
      </div>
      <div class="post-card-body">
        <span class="post-category-badge">${p.category}</span>
        <h3>${highlight(p.title, searchQuery)}</h3>
        <p class="post-excerpt">${highlight(p.excerpt, searchQuery)}</p>
        <div class="post-card-footer">
          <div class="post-card-tags">
            ${(p.tags || []).slice(0, 2).map(t => `<span class="tag">#${t}</span>`).join('')}
          </div>
          <span class="post-date">${formatDate(p.date)}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function openPost(id) {
  window.location.href = `post.html?id=${id}`;
}

/* ---------- Search overlay ---------- */
const headerInput    = document.getElementById('headerSearchInput');
const overlay        = document.getElementById('searchOverlay');
const overlayInput   = document.getElementById('overlaySearchInput');
const resultsList    = document.getElementById('searchResultsList');
const closeSearchBtn = document.getElementById('closeSearch');

function openSearchOverlay() {
  overlay.classList.add('open');
  setTimeout(() => overlayInput.focus(), 50);
}
function closeSearchOverlay() {
  overlay.classList.remove('open');
  overlayInput.value = '';
  resultsList.innerHTML = '<p class="search-no-result">开始输入以搜索文章</p>';
}

headerInput.addEventListener('focus', openSearchOverlay);
headerInput.addEventListener('input', () => {
  overlayInput.value = headerInput.value;
  doSearch(headerInput.value);
});
overlayInput.addEventListener('input', () => doSearch(overlayInput.value));
closeSearchBtn.addEventListener('click', closeSearchOverlay);
overlay.addEventListener('click', e => { if (e.target === overlay) closeSearchOverlay(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSearchOverlay(); });

async function doSearch(q) {
  const trimmed = q.trim();
  if (!trimmed) {
    resultsList.innerHTML = '<p class="search-no-result">开始输入以搜索文章</p>';
    return;
  }
  const results = await DB.searchPosts(trimmed, null);
  if (!results.length) {
    resultsList.innerHTML = `<p class="search-no-result">没有找到"${trimmed}"相关文章</p>`;
    return;
  }
  resultsList.innerHTML = results.slice(0, 8).map(p => `
    <div class="search-result-item" onclick="openPost('${p.id}')">
      ${p.coverImage ? `<img class="search-result-thumb" src="${p.coverImage}" loading="lazy" />` : `<div class="search-result-thumb" style="background:var(--bg-hover);display:flex;align-items:center;justify-content:center;color:var(--text-3)">✦</div>`}
      <div class="search-result-info">
        <h4>${highlight(p.title, trimmed)}</h4>
        <p>${p.category} · ${formatDate(p.date)}</p>
      </div>
    </div>`).join('');
}

/* ---------- Lightbox ---------- */
const lightbox      = document.getElementById('lightbox');
const lightboxImg   = document.getElementById('lightboxImg');
const lightboxClose = document.getElementById('lightboxClose');
lightboxClose.addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.classList.remove('open'); });

/* ---------- Init ---------- */
async function init() {
  await DB.seed();
  await renderNav();
  await renderFilterPills();
  await renderFeatured();
  await renderPosts();
}

init();
