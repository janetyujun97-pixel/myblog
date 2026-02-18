// ============================================================
//  admin.js — Admin panel logic
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

/* ---------- Toast ---------- */
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type} show`;
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ---------- State ---------- */
let editingId  = null;
let uploadedImages = []; // base64 array

/* ---------- Init ---------- */
DB.seed();
renderCategorySelect();
renderCatList();
renderAdminPostList();

/* ---------- Category select ---------- */
function renderCategorySelect() {
  const sel = document.getElementById('inputCategory');
  const cats = DB.getCategories();
  sel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
}

/* ---------- Category list ---------- */
function renderCatList() {
  const list = document.getElementById('catList');
  const cats = DB.getCategories();
  list.innerHTML = cats.map(c => `
    <div class="cat-item">
      <span>${c}</span>
      <button class="btn-del" onclick="deleteCategory('${c}')" title="删除">✕</button>
    </div>`).join('');
}

function deleteCategory(name) {
  if (!confirm(`确定删除分类"${name}"吗？`)) return;
  DB.deleteCategory(name);
  renderCatList();
  renderCategorySelect();
  showToast(`已删除分类"${name}"`, 'success');
}

document.getElementById('btnAddCat').addEventListener('click', () => {
  const input = document.getElementById('newCatInput');
  const name = input.value.trim();
  if (!name) return;
  DB.addCategory(name);
  input.value = '';
  renderCatList();
  renderCategorySelect();
  showToast(`已添加分类"${name}"`, 'success');
});
document.getElementById('newCatInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btnAddCat').click();
});

/* ---------- Admin post list ---------- */
function renderAdminPostList() {
  const list = document.getElementById('adminPostList');
  const posts = DB.getPosts();
  if (!posts.length) {
    list.innerHTML = '<p style="font-size:.82rem;color:var(--text-3);text-align:center;padding:16px 0">还没有文章</p>';
    return;
  }
  list.innerHTML = posts.slice(0, 20).map(p => `
    <div class="admin-post-item ${editingId === p.id ? 'active' : ''}" id="adminItem_${p.id}">
      <div onclick="loadPostForEdit('${p.id}')" style="display:flex;gap:10px;align-items:flex-start;flex:1;min-width:0;cursor:pointer">
        ${p.coverImage
          ? `<img class="admin-post-thumb" src="${p.coverImage}" />`
          : `<div class="admin-post-thumb" style="background:var(--bg-hover);display:flex;align-items:center;justify-content:center;color:var(--text-3);font-size:1rem;border-radius:6px">✦</div>`}
        <div class="admin-post-info">
          <div class="admin-post-title">${p.title}</div>
          <div class="admin-post-cat">${p.category}</div>
        </div>
      </div>
      <div class="admin-post-actions">
        <button class="btn-del" onclick="deletePost('${p.id}')" title="删除文章">✕</button>
      </div>
    </div>`).join('');
}

function deletePost(id) {
  if (!confirm('确定要删除这篇文章吗？')) return;
  DB.deletePost(id);
  if (editingId === id) { editingId = null; clearForm(); }
  renderAdminPostList();
  showToast('文章已删除', 'success');
}

document.getElementById('btnNewPost').addEventListener('click', () => {
  editingId = null;
  clearForm();
  document.getElementById('formTitle').textContent = '写新文章';
  document.getElementById('btnSubmitLabel').textContent = '发布文章';
  renderAdminPostList();
});

/* ---------- Load post for editing ---------- */
function loadPostForEdit(id) {
  const p = DB.getPost(id);
  if (!p) return;
  editingId = id;

  document.getElementById('formTitle').textContent  = '编辑文章';
  document.getElementById('btnSubmitLabel').textContent = '保存更改';
  document.getElementById('inputTitle').value       = p.title;
  document.getElementById('inputCoverUrl').value    = p.coverImage || '';
  document.getElementById('editorArea').innerHTML   = p.content;
  document.getElementById('inputVideoUrl').value    = p.videoUrl || '';
  document.getElementById('inputTags').value        = (p.tags || []).join(', ');
  document.getElementById('inputExcerpt').value     = p.excerpt || '';
  const sel = document.getElementById('inputCategory');
  sel.value = p.category;

  // Featured toggle
  const toggle = document.getElementById('featuredToggle');
  p.featured ? toggle.classList.add('on') : toggle.classList.remove('on');

  // Images
  uploadedImages = p.images ? [...p.images] : [];
  renderPreviews();

  renderAdminPostList();
  document.getElementById('formCard').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ---------- Featured toggle ---------- */
document.getElementById('featuredToggle').addEventListener('click', function() {
  this.classList.toggle('on');
});

/* ---------- Editor toolbar ---------- */
document.querySelectorAll('.editor-btn[data-cmd]').forEach(btn => {
  btn.addEventListener('mousedown', e => {
    e.preventDefault();
    const cmd = btn.dataset.cmd;
    const val = btn.dataset.val || null;
    document.execCommand(cmd, false, val);
    document.getElementById('editorArea').focus();
  });
});

document.getElementById('btnInsertLink').addEventListener('mousedown', e => {
  e.preventDefault();
  const url = prompt('输入链接地址：');
  if (url) document.execCommand('createLink', false, url);
  document.getElementById('editorArea').focus();
});

// Placeholder behavior
const editorArea = document.getElementById('editorArea');
editorArea.addEventListener('focus', () => {
  if (editorArea.innerHTML === '') editorArea.innerHTML = '';
});

/* ---------- Image upload ---------- */
const uploadArea   = document.getElementById('uploadArea');
const fileInput    = document.getElementById('fileInput');
const previewGrid  = document.getElementById('previewGrid');

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('dragover'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', () => handleFiles(fileInput.files));

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { showToast(`图片 ${file.name} 超过 5MB`, 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      uploadedImages.push(e.target.result);
      renderPreviews();
    };
    reader.readAsDataURL(file);
  });
  fileInput.value = '';
}

function renderPreviews() {
  previewGrid.innerHTML = uploadedImages.map((src, i) => `
    <div class="preview-item">
      <img src="${src}" />
      <button class="remove-img" onclick="removeImage(${i})">✕</button>
    </div>`).join('');
}

function removeImage(idx) {
  uploadedImages.splice(idx, 1);
  renderPreviews();
}

/* ---------- Submit ---------- */
document.getElementById('btnSubmit').addEventListener('click', () => {
  const title   = document.getElementById('inputTitle').value.trim();
  const content = document.getElementById('editorArea').innerHTML.trim();
  const category = document.getElementById('inputCategory').value;
  const cover   = document.getElementById('inputCoverUrl').value.trim();
  const video   = document.getElementById('inputVideoUrl').value.trim();
  const tagsRaw = document.getElementById('inputTags').value;
  const excerpt = document.getElementById('inputExcerpt').value.trim();
  const featured = document.getElementById('featuredToggle').classList.contains('on');

  if (!title) { showToast('请填写标题', 'error'); document.getElementById('inputTitle').focus(); return; }
  if (!content || content === '<br>') { showToast('请填写正文内容', 'error'); document.getElementById('editorArea').focus(); return; }

  const tags = tagsRaw.split(/[,，]+/).map(t => t.trim()).filter(Boolean);

  const data = { title, content, category, coverImage: cover, images: [...uploadedImages], videoUrl: video, tags, excerpt, featured };

  if (editingId) {
    DB.updatePost(editingId, data);
    showToast('文章已更新', 'success');
  } else {
    DB.createPost(data);
    showToast('文章已发布', 'success');
  }

  editingId = null;
  clearForm();
  renderAdminPostList();
  document.getElementById('formTitle').textContent  = '写新文章';
  document.getElementById('btnSubmitLabel').textContent = '发布文章';
});

/* ---------- Clear form ---------- */
document.getElementById('btnClear').addEventListener('click', () => {
  if (confirm('确定要清空当前内容吗？')) clearForm();
});

function clearForm() {
  document.getElementById('inputTitle').value    = '';
  document.getElementById('inputCoverUrl').value = '';
  document.getElementById('editorArea').innerHTML = '';
  document.getElementById('inputVideoUrl').value = '';
  document.getElementById('inputTags').value     = '';
  document.getElementById('inputExcerpt').value  = '';
  document.getElementById('featuredToggle').classList.remove('on');
  uploadedImages = [];
  renderPreviews();
  renderCategorySelect();
}
