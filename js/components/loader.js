/** js/components/loader.js — Loading state helper */
function setLoading(containerId, loading, message = 'Loading...') {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (loading) {
    el.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text-muted);">
      <div class="spinner" style="margin:0 auto 12px;"></div>
      <div>${message}</div>
    </div>`;
  }
}
