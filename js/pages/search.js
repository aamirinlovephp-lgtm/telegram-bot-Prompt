/** js/pages/search.js — Live search with debounce */
let _searchTimeout = null;

async function handleSearch(value) {
  const clearBtn = document.getElementById('search-clear');
  const emptyEl = document.getElementById('search-empty');
  const resultsEl = document.getElementById('search-results');
  const noResultsEl = document.getElementById('search-no-results');

  if (clearBtn) clearBtn.classList.toggle('hidden', !value);

  if (!value.trim()) {
    emptyEl?.classList.remove('hidden');
    resultsEl?.classList.add('hidden');
    noResultsEl?.classList.add('hidden');
    return;
  }

  clearTimeout(_searchTimeout);
  _searchTimeout = setTimeout(async () => {
    try {
      const { prompts } = await API.searchPrompts(value.trim());

      emptyEl?.classList.add('hidden');

      if (!prompts || prompts.length === 0) {
        resultsEl?.classList.add('hidden');
        noResultsEl?.classList.remove('hidden');
      } else {
        noResultsEl?.classList.add('hidden');
        resultsEl?.classList.remove('hidden');
        renderPromptGrid('search-results', prompts);
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }, 300);
}

function clearSearch() {
  const input = document.getElementById('search-input');
  if (input) { input.value = ''; handleSearch(''); input.focus(); }
}
