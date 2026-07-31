/** js/pages/wallet.js — Wallet page with credits and history */
async function loadWalletPage() {
  try {
    const { credits, history } = await API.getCredits();

    const creditsEl = document.getElementById('wallet-credits');
    if (creditsEl) creditsEl.textContent = (credits || 0).toLocaleString();

    // Update header
    App.updateCredits(credits);

    // Transaction history
    const txList = document.getElementById('transaction-list');
    if (txList) {
      if (!history || history.length === 0) {
        txList.innerHTML = '<div class="loading-placeholder">No transactions yet</div>';
      } else {
        txList.innerHTML = '';
        history.forEach(tx => {
          const amount = tx.amount || 0;
          const isPositive = amount > 0;
          const div = document.createElement('div');
          div.className = 'transaction-item';
          div.innerHTML = `
            <div class="tx-info">
              <div class="tx-reason">${formatReason(tx.reason)}</div>
              <div class="tx-date">${formatDate(tx.created_at)}</div>
            </div>
            <div class="tx-amount ${isPositive ? 'positive' : 'negative'}">
              ${isPositive ? '+' : ''}${amount}
            </div>
          `;
          txList.appendChild(div);
        });
      }
    }

    // Orders
    const { orders } = await API.getOrders();
    const ordersList = document.getElementById('orders-list');
    if (ordersList) {
      if (!orders || orders.length === 0) {
        ordersList.innerHTML = '<div class="loading-placeholder">No orders yet</div>';
      } else {
        ordersList.innerHTML = '';
        orders.forEach(order => {
          const div = document.createElement('div');
          div.className = 'transaction-item';
          div.style.cursor = 'pointer';
          div.innerHTML = `
            <div class="tx-info">
              <div class="tx-reason">#${order.prompt_number} ${escapeHtml(order.title || '')}</div>
              <div class="tx-date">${formatDate(order.created_at)}</div>
            </div>
            <div class="tx-amount negative">-${order.credits_paid}</div>
          `;
          div.addEventListener('click', () => navigateTo('detail', { promptId: order.prompt_id }));
          ordersList.appendChild(div);
        });
      }
    }
  } catch (err) {
    console.error('Wallet load error:', err);
  }
}

function formatReason(reason) {
  const labels = {
    'payment_approved': '✅ Credits Added',
    'prompt_purchase': '🛍 Prompt Purchase',
    'admin_adjustment': '🔧 Admin Adjustment',
    'payment_rejected': '❌ Payment Rejected',
  };
  return labels[reason] || reason?.replace(/_/g, ' ') || 'Transaction';
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showBuyCreditsInfo() {
  const tg = window.Telegram?.WebApp;
  showModal(`
    <div class="modal-title">💳 Buy Credits</div>
    <div style="margin-bottom:16px;color:var(--text-secondary);font-size:14px;line-height:1.6;">
      To buy credits, use the <strong>Telegram Bot</strong> which supports Easypaisa, JazzCash, and Binance payments.
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
      <div style="background:var(--bg-input);border-radius:12px;padding:12px;">⭐ 100 Credits — Rs. 280</div>
      <div style="background:var(--bg-input);border-radius:12px;padding:12px;">⭐ 500 Credits — Rs. 1,300</div>
      <div style="background:var(--bg-input);border-radius:12px;padding:12px;">⭐ 1000 Credits — Rs. 2,500</div>
      <div style="background:var(--bg-input);border-radius:12px;padding:12px;">⭐ 2000 Credits — Rs. 4,800</div>
    </div>
    <div class="modal-actions">
      <button id="modal-cancel" class="btn-cancel-modal">Close</button>
      <button id="modal-confirm" class="btn-primary" onclick="tg && tg.close()">Open Bot</button>
    </div>
  `);
}
