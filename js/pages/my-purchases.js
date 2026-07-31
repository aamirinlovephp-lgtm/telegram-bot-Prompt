/** js/pages/my-purchases.js — My Purchases page */
async function loadMyPurchases() {
  const grid = document.getElementById('purchases-grid');
  const empty = document.getElementById('purchases-empty');
  if (!grid) return;

  try {
    const { purchases } = await API.getPurchases();

    if (!purchases || purchases.length === 0) {
      grid.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }

    empty?.classList.add('hidden');
    grid.innerHTML = '';
    purchases.forEach(p => {
      grid.appendChild(createPromptCard(p, { isPurchased: true }));
    });
  } catch (err) {
    grid.innerHTML = '<div style="text-align:center;color:var(--error);padding:32px;">Failed to load purchases</div>';
  }
}
