/**
 * js/components/modal.js — Bottom sheet modal
 */
function showModal(content, onConfirm = null, onCancel = null) {
  const overlay = document.getElementById('modal-overlay');
  const box = document.getElementById('modal-box');

  box.innerHTML = `
    <div class="modal-handle"></div>
    ${content}
  `;

  overlay.classList.remove('hidden');

  // Bind confirm/cancel buttons
  const confirmBtn = box.querySelector('#modal-confirm');
  const cancelBtn = box.querySelector('#modal-cancel');

  if (confirmBtn && onConfirm) {
    confirmBtn.addEventListener('click', () => {
      hideModal();
      onConfirm();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      hideModal();
      if (onCancel) onCancel();
    });
  }

  overlay.onclick = (e) => {
    if (e.target === overlay) hideModal();
  };
}

function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  overlay.classList.add('hidden');
}

function showPurchaseModal(prompt, userCredits, onConfirm) {
  const newBalance = userCredits - prompt.price_credits;
  const canAfford = newBalance >= 0;

  const content = canAfford ? `
    <div class="modal-title">🛒 Confirm Purchase</div>
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:8px;">
      <div style="background:var(--bg-input);border-radius:12px;padding:16px;">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">Prompt</div>
        <div style="font-weight:700;">#${prompt.prompt_number} — ${prompt.title}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div style="background:var(--bg-input);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:12px;color:var(--text-muted);">Price</div>
          <div style="font-size:22px;font-weight:800;color:var(--accent-yellow);">⭐${prompt.price_credits}</div>
        </div>
        <div style="background:var(--bg-input);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:12px;color:var(--text-muted);">After Purchase</div>
          <div style="font-size:22px;font-weight:800;color:var(--success);">⭐${newBalance}</div>
        </div>
      </div>
    </div>
    <div class="modal-actions">
      <button id="modal-cancel" class="btn-cancel-modal">Cancel</button>
      <button id="modal-confirm" class="btn-primary">Confirm</button>
    </div>
  ` : `
    <div class="modal-title">❌ Insufficient Credits</div>
    <div style="text-align:center;padding:16px 0;">
      <div style="font-size:48px;margin-bottom:12px;">😔</div>
      <p>You need <strong>${prompt.price_credits} credits</strong> but only have <strong>${userCredits}</strong>.</p>
      <p style="color:var(--text-muted);margin-top:8px;font-size:13px;">You need ${prompt.price_credits - userCredits} more credits.</p>
    </div>
    <div class="modal-actions">
      <button id="modal-cancel" class="btn-cancel-modal">Close</button>
      <button id="modal-confirm" class="btn-primary">Buy Credits</button>
    </div>
  `;

  showModal(content, canAfford ? onConfirm : () => showBuyCreditsInfo(), null);
}
