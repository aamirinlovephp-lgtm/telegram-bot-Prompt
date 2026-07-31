/** js/pages/profile.js — Profile page */
async function loadProfilePage() {
  try {
    const profile = await API.getProfile();

    const nameEl = document.getElementById('profile-name');
    const usernameEl = document.getElementById('profile-username');
    const avatarEl = document.getElementById('profile-avatar');
    const creditsEl = document.getElementById('pstat-credits');
    const purchasesEl = document.getElementById('pstat-purchases');
    const joinedEl = document.getElementById('pstat-joined');

    if (nameEl) nameEl.textContent = profile.first_name || 'User';
    if (usernameEl) usernameEl.textContent = profile.username ? `@${profile.username}` : 'No username';
    if (avatarEl) avatarEl.textContent = (profile.first_name || 'U')[0].toUpperCase();
    if (creditsEl) creditsEl.textContent = (profile.credits || 0).toLocaleString();
    if (joinedEl && profile.registration_date) {
      joinedEl.textContent = new Date(profile.registration_date).getFullYear();
    }

    // Get purchase count
    const { purchases } = await API.getPurchases();
    if (purchasesEl) purchasesEl.textContent = purchases?.length || 0;
  } catch (err) {
    console.error('Profile load error:', err);
  }
}
