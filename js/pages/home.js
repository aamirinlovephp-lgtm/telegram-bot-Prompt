/** js/pages/home.js — Home page data loading */
async function loadHomePage() {
  try {
    // Load featured
    const { prompts: featured } = await API.getFeatured();
    const featuredList = document.getElementById('featured-list');
    if (featuredList) {
      featuredList.innerHTML = '';
      (featured || []).forEach(p => {
        featuredList.appendChild(createPromptCard(p, { horizontal: true }));
      });
      if (!featured?.length) featuredList.innerHTML = '<div style="color:var(--text-muted);padding:16px;">No featured prompts yet.</div>';
    }

    // Load new
    const { prompts: newPrompts } = await API.getNewPrompts();
    renderPromptGrid('new-list', newPrompts);

    // Load popular
    const { prompts: popular } = await API.getPopular();
    renderPromptGrid('popular-list', popular);

    // Load stats
    const { total } = await API.getPrompts({ limit: 1 });
    const statEl = document.getElementById('stat-total-prompts');
    const newEl = document.getElementById('stat-new');
    if (statEl) statEl.textContent = total || '0';
    if (newEl) newEl.textContent = newPrompts?.length || '0';

    // Load categories
    const { categories } = await API.getCategories();
    const homeCategories = document.getElementById('home-categories');
    if (homeCategories && categories) {
      homeCategories.innerHTML = '';
      categories.slice(0, 8).forEach(cat => {
        const div = document.createElement('div');
        div.className = 'category-card';
        div.innerHTML = `<div class="category-icon">${cat.icon || '📁'}</div><div class="category-name">${cat.name}</div>`;
        div.addEventListener('click', () => navigateTo('browse', { categoryId: cat.id }));
        homeCategories.appendChild(div);
      });
    }
  } catch (err) {
    console.error('Home load error:', err);
  }
}
