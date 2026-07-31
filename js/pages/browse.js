/** js/pages/browse.js — Browse page with category filtering */
let _browseOffset = 0;
let _browseCategory = null;
let _browseTotal = 0;
const BROWSE_LIMIT = 12;

async function loadBrowsePage(params = {}) {
  _browseOffset = 0;
  _browseCategory = params.categoryId || null;

  // Load category pills
  try {
    const { categories } = await API.getCategories();
    const pillsContainer = document.getElementById('category-pills');
    if (pillsContainer) {
      pillsContainer.innerHTML = '<button class="pill active" data-cat="all" onclick="filterByCategory(null, this)">All</button>';
      (categories || []).forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'pill' + (cat.id === _browseCategory ? ' active' : '');
        btn.dataset.cat = cat.id;
        btn.textContent = `${cat.icon || ''} ${cat.name}`;
        btn.addEventListener('click', () => filterByCategory(cat.id, btn));
        pillsContainer.appendChild(btn);
      });
    }
  } catch (e) {}

  await fetchBrowsePrompts();
}

async function fetchBrowsePrompts(append = false) {
  const grid = document.getElementById('browse-grid');
  if (!grid) return;
  if (!append) { grid.innerHTML = ''; _browseOffset = 0; }

  try {
    const params = { limit: BROWSE_LIMIT, offset: _browseOffset };
    if (_browseCategory) params.category_id = _browseCategory;

    const { prompts, total } = await API.getPrompts(params);
    _browseTotal = total;

    if (!append) grid.innerHTML = '';
    (prompts || []).forEach(p => grid.appendChild(createPromptCard(p)));

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      const hasMore = _browseOffset + BROWSE_LIMIT < _browseTotal;
      loadMoreBtn.classList.toggle('hidden', !hasMore);
    }
  } catch (err) {
    if (!append) grid.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:32px;">Failed to load prompts</div>';
  }
}

async function filterByCategory(catId, btn) {
  // Update active pill
  document.querySelectorAll('#category-pills .pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');

  _browseCategory = catId === 'all' ? null : catId;
  await fetchBrowsePrompts(false);
}

async function loadMorePrompts() {
  _browseOffset += BROWSE_LIMIT;
  await fetchBrowsePrompts(true);
}
