/** js/pages/prompt-detail.js — Prompt detail page with purchase flow */
let _currentPrompt = null;

async function loadPromptDetail(promptId) {
  const content = document.getElementById('detail-content');
  if (!content) return;

  content.innerHTML = '<div style="text-align:center;padding:48px;"><div class="spinner" style="margin:auto;"></div></div>';

  try {
    const prompt = await API.getPrompt(promptId);
    _currentPrompt = prompt;

    const isPurchased = !!prompt.full_content;
    const userCredits = App.getCredits();

    // Cover Image (prefer cover_image_url, fallback to thumbnail_path)
    const coverUrl = prompt.cover_image_url
      || (prompt.thumbnail_path ? `/media/prompts/${prompt.thumbnail_path.split('/').pop()}` : null);
    const thumbHtml = coverUrl
      ? `<img class="detail-thumbnail" src="${coverUrl}" alt="${escapeHtml(prompt.title)}" />`
      : `<div class="detail-thumbnail-placeholder">🎯</div>`;

    // Tags
    const tags = Array.isArray(prompt.tags) ? prompt.tags : [];
    const tagsHtml = tags.map(t => `<span class="meta-tag">#${escapeHtml(t)}</span>`).join('');

    // Buy button / open button
    let actionHtml = '';
    if (isPurchased) {
      actionHtml = `
        <div class="full-content-section">
          <div class="full-content-header">
            <div class="full-content-label">✅ Full Prompt</div>
            <button class="btn-copy" onclick="copyPromptContent()">📋 Copy</button>
          </div>
          <div class="full-content-text" id="full-content-text">${escapeHtml(prompt.full_content || '')}</div>
        </div>
      `;
    } else {
      const canAfford = userCredits >= prompt.price_credits;
      actionHtml = `
        <div class="detail-price-section">
          <div>
            <div class="detail-price">⭐ ${(prompt.price_credits || 0).toLocaleString()}</div>
            <div class="detail-price-label">Credits</div>
          </div>
          <button class="btn-buy-detail" onclick="inititatePurchase()">
            ${canAfford ? '💳 Buy Now' : '❌ Need More Credits'}
          </button>
        </div>
        ${prompt.preview_text ? `
          <div class="preview-section">
            <div class="preview-label">👀 Preview</div>
            <div class="preview-text">${escapeHtml(prompt.preview_text)}</div>
          </div>
        ` : ''}
        <div class="locked-overlay">
          <div class="locked-icon">🔒</div>
          <div class="locked-title">Full Prompt Locked</div>
          <div class="locked-desc">Purchase this prompt to unlock the complete content and use it in your AI tool.</div>
        </div>
      `;
    }

    content.innerHTML = `
      ${thumbHtml}
      <div class="detail-info">
        <div class="detail-number">Prompt #${prompt.prompt_number || '???'}</div>
        <div class="detail-title">${escapeHtml(prompt.title)}</div>
        <div class="detail-meta">
          ${tagsHtml}
          ${prompt.difficulty ? `<span class="meta-tag">📊 ${prompt.difficulty}</span>` : ''}
          ${prompt.ai_tool ? `<span class="meta-tag">🤖 ${escapeHtml(prompt.ai_tool)}</span>` : ''}
          ${prompt.category_name ? `<span class="meta-tag">🗂 ${escapeHtml(prompt.category_name)}</span>` : ''}
        </div>
        <div class="detail-desc">${escapeHtml(prompt.short_description || '')}</div>
        ${actionHtml}
        ${_buildDemoVideosHtml(prompt)}
      </div>
    `;
  } catch (err) {
    content.innerHTML = '<div style="text-align:center;padding:48px;color:var(--error);">Failed to load prompt</div>';
  }
}

async function inititatePurchase() {
  if (!_currentPrompt) return;
  const userCredits = App.getCredits();
  showPurchaseModal(_currentPrompt, userCredits, async () => {
    try {
      const result = await API.purchasePrompt(_currentPrompt.id);
      App.updateCredits(result.new_balance);
      showToast('✅ Prompt unlocked!', 'success');
      // Reload detail page with full content
      loadPromptDetail(_currentPrompt.id);
    } catch (err) {
      showToast(err.message || 'Purchase failed', 'error');
    }
  });
}

function copyPromptContent() {
  const el = document.getElementById('full-content-text');
  if (!el) return;
  const text = el.textContent;
  navigator.clipboard.writeText(text).then(() => {
    showToast('📋 Prompt copied to clipboard!', 'success');
  }).catch(() => {
    // Fallback for older devices
    const range = document.createRange();
    range.selectNode(el);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    showToast('📋 Prompt copied!', 'success');
  });
}

/**
 * Build HTML for demo videos carousel (if any exist).
 */
function _buildDemoVideosHtml(prompt) {
  const videos = prompt.demo_videos;
  if (!videos || !Array.isArray(videos) || videos.length === 0) return '';

  const videoItems = videos.map((v, i) => `
    <div class="demo-video-item">
      <video controls preload="metadata" playsinline
        style="width:100%;border-radius:12px;max-height:360px;background:#000;">
        <source src="${v.url}" type="video/mp4">
        Your browser does not support video playback.
      </video>
      ${v.caption ? `<div class="demo-video-caption">${escapeHtml(v.caption)}</div>` : ''}
    </div>
  `).join('');

  return `
    <div class="demo-videos-section" style="margin-top:20px;">
      <div style="font-size:15px;font-weight:600;margin-bottom:12px;color:var(--text);">
        🎥 Demo Videos (${videos.length})
      </div>
      <div class="demo-videos-list" style="display:flex;flex-direction:column;gap:12px;">
        ${videoItems}
      </div>
    </div>
  `;
}
