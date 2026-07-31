/**
 * js/api.js — API client for GitHub Pages hosted Mini App
 * Connects to the bot's FastAPI server running on Termux/VPS.
 * 
 * IMPORTANT: Set API_BASE_URL to your bot server's public URL.
 */

const API = (() => {
  let _token = null;

  // ══════════════════════════════════════════════════════════════
  // 🔧 API URL — Auto-detected in priority order:
  //   1. URL parameter: ?api=https://your-server.com
  //   2. window.API_BASE_URL (set in index.html)
  //   3. Same origin (when served from /app/ on the API server)
  //   4. Fallback to localhost (dev only)
  // ══════════════════════════════════════════════════════════════
  function _detectApiUrl() {
    // 1. Check URL parameter (bot passes this when opening Mini App)
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get('api');
    if (fromParam) return fromParam.replace(/\/+$/, '');

    // 2. Check window config (set in index.html <script> tag)
    const fromWindow = window.API_BASE_URL;
    if (fromWindow && !fromWindow.includes('REPLACE') && !fromWindow.includes('example')) {
      return fromWindow.replace(/\/+$/, '');
    }

    // 3. If served from the API server's /app/ path, use same origin
    if (window.location.pathname.startsWith('/app')) {
      return window.location.origin;
    }

    // 4. Fallback for local dev
    return 'http://localhost:8000';
  }

  const API_BASE_URL = _detectApiUrl();

  function setToken(token) {
    _token = token;
    try {
      localStorage.setItem('pm_token', token);
    } catch (e) {
      // localStorage may not be available in Telegram WebApp
    }
  }

  function getToken() {
    if (_token) return _token;
    try {
      _token = localStorage.getItem('pm_token');
    } catch (e) {}
    return _token;
  }

  function clearToken() {
    _token = null;
    try { localStorage.removeItem('pm_token'); } catch (e) {}
  }

  async function request(endpoint, options = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearToken();
      window.App && App.reAuthenticate();
      throw new Error('Authentication required');
    }

    if (response.status === 429) {
      throw new Error('Too many requests. Please wait a moment.');
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail));
    }

    return response.json();
  }

  async function authenticate(initData) {
    const data = await request('/api/auth/validate', {
      method: 'POST',
      body: JSON.stringify({ init_data: initData }),
    });
    setToken(data.token);
    return data;
  }

  // ── Prompts ────────────────────────────────────────────────────

  async function getPrompts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/prompts${qs ? '?' + qs : ''}`);
  }

  async function getFreePrompts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/prompts/free${qs ? '?' + qs : ''}`);
  }

  async function getPaidPrompts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/prompts/paid${qs ? '?' + qs : ''}`);
  }

  async function getFeatured() {
    return request('/api/prompts/featured');
  }

  async function getNewPrompts() {
    return request('/api/prompts/new');
  }

  async function getPopular() {
    return request('/api/prompts/popular');
  }

  async function getPrompt(id) {
    return request(`/api/prompts/${id}`);
  }

  async function searchPrompts(q, params = {}) {
    const allParams = { q, ...params };
    const qs = new URLSearchParams(allParams).toString();
    return request(`/api/prompts/search?${qs}`);
  }

  async function purchasePrompt(id) {
    return request(`/api/prompts/${id}/purchase`, { method: 'POST' });
  }

  async function getPromptContent(id) {
    return request(`/api/prompts/${id}/content`);
  }

  // ── Categories ─────────────────────────────────────────────────

  async function getCategories() {
    return request('/api/categories');
  }

  // ── Users ──────────────────────────────────────────────────────

  async function getProfile() {
    return request('/api/users/me');
  }

  async function getCredits() {
    return request('/api/users/me/credits');
  }

  async function getPurchases() {
    return request('/api/users/me/purchases');
  }

  async function getOrders() {
    return request('/api/users/me/orders');
  }

  return {
    API_BASE_URL,
    setToken,
    getToken,
    clearToken,
    authenticate,
    getPrompts,
    getFreePrompts,
    getPaidPrompts,
    getFeatured,
    getNewPrompts,
    getPopular,
    getPrompt,
    searchPrompts,
    purchasePrompt,
    getPromptContent,
    getCategories,
    getProfile,
    getCredits,
    getPurchases,
    getOrders,
  };
})();
