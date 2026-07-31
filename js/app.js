/**
 * js/app.js — Main application controller for Master Prompt Marketplace
 * Handles navigation, authentication, data loading, and UI rendering.
 * Designed for GitHub Pages hosting with external API server.
 */

const App = (() => {
  // ── State ──────────────────────────────────────────────────────
  let _user = null;
  let _credits = 0;
  let _currentPage = 'home';
  let _pageHistory = [];
  let _searchTimeout = null;
  let _tg = null;

  // ── Init ───────────────────────────────────────────────────────
  async function init() {
    try {
      _tg = window.Telegram?.WebApp;
      if (_tg) {
        _tg.ready();
        _tg.expand();
        _tg.setHeaderColor('#0a0a0f');
        _tg.setBackgroundColor('#0a0a0f');
      }

      await authenticate();
      await loadHomeData();

      // Hide loading, show app
      document.getElementById('loading-screen').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
    } catch (error) {
      console.error('Init failed:', error);
      console.error('API URL:', API.API_BASE_URL);
      const subtitle = document.getElementById('loading-screen').querySelector('.loading-subtitle');
      if (API.API_BASE_URL.includes('localhost') || API.API_BASE_URL.includes('REPLACE')) {
        subtitle.innerHTML = 'API server not configured.<br><small>Set API_PUBLIC_URL in .env and restart bot.</small>';
      } else {
        subtitle.innerHTML = `Connection failed.<br><small>API: ${API.API_BASE_URL}</small><br><small>Tap to retry</small>`;
        subtitle.style.cursor = 'pointer';
        subtitle.onclick = () => { subtitle.textContent = 'Retrying...'; init(); };
      }
    }
  }

  // ── Authentication ─────────────────────────────────────────────
  async function authenticate() {
    const initData = _tg?.initData;
    if (initData) {
      const data = await API.authenticate(initData);
      _user = data.user;
      _credits = _user.credits || 0;
    } else {
      // Dev mode: try existing token
      const token = API.getToken();
      if (token) {
        const data = await API.getProfile();
        _user = data;
        _credits = data.credits || 0;
      } else {
        throw new Error('No Telegram WebApp context');
      }
    }
    updateCreditsDisplay();
    updateHeroGreeting();
  }

  function reAuthenticate() {
    authenticate().catch(() => showToast('Session expired', 'error'));
  }

  // ── Navigation ─────────────────────────────────────────────────
  function navigate(page, params = {}) {
    if (page === _currentPage && !params.force) return;

    // Track history for back navigation
    if (_currentPage !== page) {
      _pageHistory.push(_currentPage);
    }

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // Show target page
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
      pageEl.classList.add('active');
      pageEl.scrollTop = 0;
    }

    _currentPage = page;
    updateNavigation(page);
    updateHeader(page, params);

    // Load page data
    switch (page) {
      case 'home': loadHomeData(); break;
      case 'free': loadFreePrompts(); break;
      case 'paid': loadPaidPrompts(); break;
      case 'detail': loadPromptDetail(params.id); break;
      case 'wallet': loadWallet(); break;
      case 'search': break; // Already loaded by search handler
    }
  }

  function goBack() {
    const prev = _pageHistory.pop() || 'home';
    navigate(prev, { force: true });
    // Remove extra history entry
    _pageHistory.pop();
  }

  function updateNavigation(page) {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === page);
    });
  }

  function updateHeader(page, params = {}) {
    const backBtn = document.getElementById('header-back-btn');
    const title = document.getElementById('header-title');

    const titles = {
      home: '🎯 Master Prompts',
      free: '🆓 Free Prompts',
      paid: '💎 Paid Prompts',
      detail: '📖 Prompt Detail',
      wallet: '💰 Wallet',
      search: '🔍 Search',
    };

    title.textContent = titles[page] || '🎯 Master Prompts';
    backBtn.classList.toggle('hidden', page === 'home');
  }

  // ── Data Loading ───────────────────────────────────────────────
  async function loadHomeData() {
    try {
      const [featured, newest, categories] = await Promise.allSettled([
        API.getFeatured(),
        API.getNewPrompts(),
        API.getCategories(),
      ]);

      if (featured.status === 'fulfilled') {
        renderScrollList('featured-list', featured.value.prompts || []);
      }
      if (newest.status === 'fulfilled') {
        renderPromptGrid('new-list', newest.value.prompts || []);
      }
      if (categories.status === 'fulfilled') {
        renderCategories(categories.value.categories || categories.value || []);
      }

      // Update counts
      try {
        const [freeData, paidData] = await Promise.all([
          API.getFreePrompts({ limit: 1 }),
          API.getPaidPrompts({ limit: 1 }),
        ]);
        document.getElementById('free-count-badge').textContent = freeData.total || 0;
        document.getElementById('paid-count-badge').textContent = paidData.total || 0;
      } catch (e) {}

    } catch (error) {
      console.error('Failed to load home:', error);
    }
  }

  async function loadFreePrompts() {
    const list = document.getElementById('free-prompts-list');
    const empty = document.getElementById('free-empty');
    const loading = document.getElementById('free-loading');

    list.innerHTML = '';
    empty.classList.add('hidden');
    loading.classList.remove('hidden');

    try {
      const data = await API.getFreePrompts({ limit: 50 });
      loading.classList.add('hidden');
      const prompts = data.prompts || [];

      if (prompts.length === 0) {
        empty.classList.remove('hidden');
      } else {
        renderPromptGrid('free-prompts-list', prompts);
      }
    } catch (error) {
      loading.classList.add('hidden');
      showToast('Failed to load free prompts', 'error');
    }
  }

  async function loadPaidPrompts() {
    const list = document.getElementById('paid-prompts-list');
    const empty = document.getElementById('paid-empty');
    const loading = document.getElementById('paid-loading');

    list.innerHTML = '';
    empty.classList.add('hidden');
    loading.classList.remove('hidden');

    try {
      const data = await API.getPaidPrompts({ limit: 50 });
      loading.classList.add('hidden');
      const prompts = data.prompts || [];

      if (prompts.length === 0) {
        empty.classList.remove('hidden');
      } else {
        renderPromptGrid('paid-prompts-list', prompts);
      }
    } catch (error) {
      loading.classList.add('hidden');
      showToast('Failed to load paid prompts', 'error');
    }
  }

  async function loadPromptDetail(promptId) {
    const container = document.getElementById('prompt-detail-content');
    container.innerHTML = '<div class="detail-loading"><div class="spinner"></div></div>';

    try {
      const prompt = await API.getPrompt(promptId);
      renderPromptDetail(container, prompt);
    } catch (error) {
      container.innerHTML = '<div class="empty-state"><p>Failed to load prompt</p></div>';
    }
  }

  async function loadWallet() {
    try {
      const profile = await API.getProfile();
      _credits = profile.credits || 0;
      updateCreditsDisplay();
      document.getElementById('wallet-credits').textContent = _credits.toLocaleString();

      const data = await API.getPurchases();
      const list = data.purchases || data.prompts || [];
      if (list.length === 0) {
        document.getElementById('purchases-empty').classList.remove('hidden');
        document.getElementById('purchases-list').innerHTML = '';
      } else {
        document.getElementById('purchases-empty').classList.add('hidden');
        renderPromptGrid('purchases-list', list, true);
      }
    } catch (error) {
      showToast('Failed to load wallet', 'error');
    }
  }

  // ── Search ─────────────────────────────────────────────────────
  function debounceSearch(query) {
    clearTimeout(_searchTimeout);
    if (!query || query.length < 2) return;

    _searchTimeout = setTimeout(() => executeSearch(query), 400);
  }

  async function executeSearch(query) {
    navigate('search');
    document.getElementById('search-query-label').textContent = `Results for "${query}"`;
    const list = document.getElementById('search-results-list');
    const empty = document.getElementById('search-empty');

    list.innerHTML = '<div class="loading-more">Searching...</div>';
    empty.classList.add('hidden');

    try {
      const data = await API.searchPrompts(query);
      const prompts = data.prompts || [];

      if (prompts.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
      } else {
        renderPromptGrid('search-results-list', prompts);
      }
    } catch (error) {
      list.innerHTML = '';
      showToast('Search failed', 'error');
    }
  }

  // ── Renderers ──────────────────────────────────────────────────
  function renderPromptCard(prompt, isPurchased = false) {
    const isFree = prompt.is_free;
    const tags = Array.isArray(prompt.tags) ? prompt.tags : [];
    const badge = isFree ? '<span class="badge badge-free">FREE</span>' : `<span class="badge badge-paid">${prompt.price_credits}⭐</span>`;
    const featuredBadge = prompt.is_featured ? '<span class="badge badge-featured">⭐ Featured</span>' : '';

    return `
      <div class="prompt-card ${isFree ? 'prompt-card-free' : 'prompt-card-paid'}" onclick="App.navigate('detail', {id: ${prompt.id}})">
        <div class="card-header">
          <span class="card-number">#${prompt.prompt_number || '???'}</span>
          <div class="card-badges">${badge}${featuredBadge}</div>
        </div>
        <h4 class="card-title">${escapeHtml(prompt.title || 'Untitled')}</h4>
        <p class="card-desc">${escapeHtml((prompt.short_description || '').slice(0, 80))}${prompt.short_description?.length > 80 ? '...' : ''}</p>
        <div class="card-footer">
          <span class="card-category">${escapeHtml(prompt.category_name || 'General')}</span>
          <span class="card-uses">${(prompt.total_purchases || 0).toLocaleString()} uses</span>
        </div>
      </div>
    `;
  }

  function renderPromptGrid(containerId, prompts, isPurchased = false) {
    const container = document.getElementById(containerId);
    container.innerHTML = prompts.map(p => renderPromptCard(p, isPurchased)).join('');
  }

  function renderScrollList(containerId, prompts) {
    const container = document.getElementById(containerId);
    if (!prompts.length) {
      container.innerHTML = '<p class="empty-inline">No featured prompts yet</p>';
      return;
    }
    container.innerHTML = prompts.map(p => `
      <div class="scroll-card ${p.is_free ? 'scroll-card-free' : ''}" onclick="App.navigate('detail', {id: ${p.id}})">
        <div class="scroll-badge">${p.is_free ? '🆓' : '💎'}</div>
        <h4>${escapeHtml((p.title || '').slice(0, 25))}</h4>
        <span class="scroll-price">${p.is_free ? 'FREE' : p.price_credits + '⭐'}</span>
      </div>
    `).join('');
  }

  function renderCategories(categories) {
    const container = document.getElementById('categories-list');
    if (!categories.length) {
      container.innerHTML = '<p class="empty-inline">No categories yet</p>';
      return;
    }
    container.innerHTML = categories.map(cat => `
      <div class="category-card" onclick="App.loadCategoryPrompts(${cat.id}, '${escapeHtml(cat.name)}')">
        <span class="category-icon">${cat.icon || '📁'}</span>
        <span class="category-name">${escapeHtml(cat.name)}</span>
      </div>
    `).join('');
  }

  function renderPromptDetail(container, prompt) {
    const isFree = prompt.is_free;
    const hasContent = !!prompt.full_content;
    const tags = Array.isArray(prompt.tags) ? prompt.tags : [];

    let actionButton;
    if (isFree && hasContent) {
      actionButton = `<button class="btn btn-free" onclick="App.showFullContent(${prompt.id})">🆓 View Full Prompt (Free!)</button>`;
    } else if (hasContent) {
      actionButton = `<button class="btn btn-primary" onclick="App.showFullContent(${prompt.id})">📖 Open Prompt</button>`;
    } else if (isFree) {
      actionButton = `<button class="btn btn-free" onclick="App.claimFree(${prompt.id})">🆓 Get Free Prompt</button>`;
    } else {
      const canAfford = _credits >= prompt.price_credits;
      actionButton = canAfford
        ? `<button class="btn btn-buy" onclick="App.purchasePrompt(${prompt.id})">💳 Buy for ${prompt.price_credits} Credits</button>`
        : `<button class="btn btn-disabled" disabled>Need ${prompt.price_credits - _credits} more credits</button>`;
    }

    container.innerHTML = `
      <div class="detail-card">
        <div class="detail-header">
          <div class="detail-number">#${prompt.prompt_number || '???'}</div>
          <div class="detail-type ${isFree ? 'type-free' : 'type-paid'}">${isFree ? '🆓 FREE' : '💎 PAID'}</div>
        </div>

        <h2 class="detail-title">${escapeHtml(prompt.title || 'Untitled')}</h2>

        <div class="detail-meta">
          <div class="meta-item"><span class="meta-icon">🗂</span> ${escapeHtml(prompt.category_name || 'General')}</div>
          <div class="meta-item"><span class="meta-icon">🤖</span> ${escapeHtml(prompt.ai_tool || 'Universal')}</div>
          <div class="meta-item"><span class="meta-icon">📊</span> ${escapeHtml(prompt.difficulty || 'Intermediate')}</div>
          <div class="meta-item"><span class="meta-icon">🔥</span> ${(prompt.total_purchases || 0).toLocaleString()} uses</div>
        </div>

        <div class="detail-description">
          <h3>Description</h3>
          <p>${escapeHtml(prompt.short_description || '')}</p>
        </div>

        ${prompt.preview_text && !hasContent ? `
          <div class="detail-preview">
            <h3>👀 Preview</h3>
            <p class="preview-text">${escapeHtml(prompt.preview_text.slice(0, 300))}...</p>
          </div>
        ` : ''}

        ${hasContent ? `
          <div id="full-content-area" class="detail-content hidden">
            <h3>📖 Full Prompt</h3>
            <div class="content-box">
              <pre class="prompt-text">${escapeHtml(prompt.full_content)}</pre>
              <button class="btn btn-copy" onclick="App.copyToClipboard('${escapeJs(prompt.full_content)}')">📋 Copy Prompt</button>
            </div>
          </div>
        ` : ''}

        ${tags.length ? `
          <div class="detail-tags">
            ${tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('')}
          </div>
        ` : ''}

        ${!isFree ? `
          <div class="detail-price">
            <span class="price-label">Price</span>
            <span class="price-amount">${prompt.price_credits?.toLocaleString() || 0} Credits</span>
          </div>
        ` : ''}

        <div class="detail-actions">${actionButton}</div>
      </div>
    `;
  }

  // ── Actions ────────────────────────────────────────────────────
  function showFullContent(promptId) {
    const area = document.getElementById('full-content-area');
    if (area) area.classList.remove('hidden');
  }

  async function claimFree(promptId) {
    try {
      const result = await API.purchasePrompt(promptId);
      showToast('🆓 Prompt unlocked!', 'success');
      navigate('detail', { id: promptId, force: true });
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function purchasePrompt(promptId) {
    try {
      if (!confirm('Confirm purchase?')) return;

      const result = await API.purchasePrompt(promptId);
      _credits = result.new_balance || _credits;
      updateCreditsDisplay();
      showToast('✅ Purchase successful!', 'success');
      navigate('detail', { id: promptId, force: true });
    } catch (error) {
      showToast(error.message || 'Purchase failed', 'error');
    }
  }

  async function loadCategoryPrompts(catId, catName) {
    navigate('search');
    document.getElementById('search-query-label').textContent = `Category: ${catName}`;
    const list = document.getElementById('search-results-list');

    list.innerHTML = '<div class="loading-more">Loading...</div>';

    try {
      const data = await API.getPrompts({ category_id: catId, limit: 50 });
      const prompts = data.prompts || [];
      if (prompts.length === 0) {
        list.innerHTML = '';
        document.getElementById('search-empty').classList.remove('hidden');
      } else {
        document.getElementById('search-empty').classList.add('hidden');
        renderPromptGrid('search-results-list', prompts);
      }
    } catch (error) {
      list.innerHTML = '';
      showToast('Failed to load category', 'error');
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 Prompt copied!', 'success');
    }).catch(() => {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('📋 Prompt copied!', 'success');
    });
  }

  // ── UI Helpers ─────────────────────────────────────────────────
  function updateCreditsDisplay() {
    document.getElementById('credits-count').textContent = _credits.toLocaleString();
  }

  function updateHeroGreeting() {
    const name = _user?.first_name || 'there';
    document.getElementById('hero-name').textContent = `Welcome, ${name}! 👋`;
  }

  function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => toast.classList.add('hidden'), 3000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeJs(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
  }

  // ── Public API ─────────────────────────────────────────────────
  return {
    init,
    navigate,
    goBack,
    reAuthenticate,
    debounceSearch,
    showFullContent,
    claimFree,
    purchasePrompt,
    loadCategoryPrompts,
    copyToClipboard,
  };
})();

// ── Bootstrap ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', App.init);
