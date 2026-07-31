/**
 * js/components/prompt-card.js — Reusable prompt card factory
 */
function createPromptCard(prompt, options = {}) {
  const {
    horizontal = false,
    isPurchased = false,
    onClick = null,
  } = options;

  const card = document.createElement('div');
  card.className = `prompt-card${horizontal ? ' prompt-card-horizontal' : ''}`;
  card.dataset.promptId = prompt.id;

  // Badge
  let badge = '';
  if (isPurchased) badge = '<span class="card-badge badge-purchased">✓ Owned</span>';
  else if (prompt.is_featured) badge = '<span class="card-badge badge-featured">⭐ Featured</span>';

  // New badge (created within last 7 days)
  const createdAt = new Date(prompt.created_at || Date.now());
  const isNew = (Date.now() - createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000;
  if (isNew && !isPurchased && !prompt.is_featured) {
    badge = '<span class="card-badge badge-new">New</span>';
  }

  // Thumbnail (prefer cover_image_url, fallback to thumbnail_path)
  const imgUrl = prompt.cover_image_url
    || (prompt.thumbnail_path ? `/media/prompts/${prompt.thumbnail_path.split('/').pop()}` : null);
  const thumbnail = imgUrl
    ? `<img src="${imgUrl}" alt="${prompt.title}" loading="lazy" />`
    : `<div class="card-thumbnail-placeholder">🎯</div>`;

  card.innerHTML = `
    <div class="card-thumbnail">
      ${thumbnail}
      ${badge}
      <button class="card-fav-btn" onclick="event.stopPropagation(); toggleFavoriteCard(${prompt.id}, this)">♡</button>
    </div>
    <div class="card-body">
      <div class="card-number">#${prompt.prompt_number || '???'}</div>
      <div class="card-title">${escapeHtml(prompt.title)}</div>
      <div class="card-category">${escapeHtml(prompt.category_name || 'General')}</div>
      <div class="card-footer">
        <div class="card-price">
          ${isPurchased ? '✅ Owned' : `⭐ ${(prompt.price_credits || 0).toLocaleString()}`}
        </div>
        <div class="card-purchases">🔥 ${prompt.total_purchases || 0}</div>
      </div>
    </div>
  `;

  card.addEventListener('click', () => {
    if (onClick) onClick(prompt);
    else navigateTo('detail', { promptId: prompt.id });
  });

  return card;
}

function renderPromptGrid(containerId, prompts, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!prompts || prompts.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:32px;">No prompts found</div>';
    return;
  }

  prompts.forEach(p => {
    container.appendChild(createPromptCard(p, options));
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toggleFavoriteCard(promptId, btn) {
  btn.classList.toggle('active');
  btn.textContent = btn.classList.contains('active') ? '❤️' : '♡';
}
