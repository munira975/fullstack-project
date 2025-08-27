// client/nav.js
document.addEventListener('DOMContentLoaded', async () => {
  const accountLink = document.getElementById('accountLink');
  const userEmailSpan = document.getElementById('userEmail'); // visar username eller email

  /* ===== Sök/autosuggest (oförändrat) ===== */
  const searchWrap = document.querySelector('.search-container');
  const searchInput = searchWrap?.querySelector('input');
  const searchBtn   = searchWrap?.querySelector('.search-icon');

  const ALIAS_MAP = {
    snacks: 'Snacks', snack: 'Snacks',
    juice: 'Juice', juices: 'Juice', drink: 'Juice', drinks: 'Juice',
    seafood: 'Seafood', fish: 'Seafood',
    meat: 'Meat', meats: 'Meat',
    grain: 'Grains', grains: 'Grains', cereal: 'Grains', pasta: 'Grains',
    fruits: 'Fruits', fruit: 'Fruits'
  };
  const CATEGORY_LIST = ['Snacks', 'Juice', 'Seafood', 'Meat', 'Grains', 'Fruits'];

  function buildImgUrl(image) {
    if (!image) return '/public/image/products/placeholder.png';
    let s = String(image).trim();
    s = s.replace(/^https?:\/\/[^/]+/i, '')
         .replace(/^\/?public\/image\/products\//i, '')
         .replace(/^\/?image\/products\//i, '')
         .replace(/^\/?image\//i, '')
         .replace(/^\/+/, '');
    return `/public/image/products/${s}`;
  }

  let suggBox = document.createElement('div'); suggBox.className = 'search-suggestions';
  let list = document.createElement('ul'); suggBox.appendChild(list);
  if (searchWrap) searchWrap.appendChild(suggBox);

  let activeIndex = -1, currentItems = [];
  const hideSugg = () => { suggBox.style.display = 'none'; activeIndex = -1; currentItems = []; list.innerHTML = ''; };
  const showSugg = () => { suggBox.style.display = currentItems.length ? 'block' : 'none'; };
  const selectItem = (i) => {
    const it = currentItems[i]; if (!it) return;
    const url = new URL('products.html', window.location.origin);
    if (it.type === 'category') url.searchParams.set('categories', it.value);
    else if (it.type === 'product') url.searchParams.set('q', it.value);
    window.location.href = url.toString();
  };
  const renderSugg = () => {
    list.innerHTML = '';
    currentItems.forEach((it, i) => {
      const li = document.createElement('li');
      li.className = 'sugg-item' + (i === activeIndex ? ' active' : '');
      li.setAttribute('data-index', i);
      const left = document.createElement('div'); left.className = 'sugg-left';
      if (it.type === 'product' && it.image) {
        const img = document.createElement('img'); img.className = 'sugg-thumb';
        img.src = buildImgUrl(it.image); img.alt = it.label; left.appendChild(img);
      } else if (it.type === 'category') {
        const badge = document.createElement('span'); badge.className = 'sugg-badge'; badge.textContent = 'Kategori'; left.appendChild(badge);
      } else {
        const dot = document.createElement('span'); dot.className = 'sugg-dot'; dot.textContent = '🔎'; left.appendChild(dot);
      }
      const txt = document.createElement('span'); txt.textContent = it.label; left.appendChild(txt);
      li.appendChild(left);
      li.addEventListener('mousedown', (e) => { e.preventDefault(); selectItem(i); });
      list.appendChild(li);
    });
    showSugg();
  };

  let t; const debounce = (fn, ms = 150) => { clearTimeout(t); t = setTimeout(fn, ms); };
  const fetchSuggest = async (prefix) => {
    try {
      const url = new URL('/api/products/suggest', window.location.origin);
      url.searchParams.set('prefix', prefix); url.searchParams.set('limit', '8');
      const res = await fetch(url.toString(), { credentials: 'include' });
      if (!res.ok) return []; return await res.json();
    } catch { return []; }
  };
  const handleInput = () => {
    const val = (searchInput?.value || '').trim();
    if (!val) return hideSugg();
    debounce(async () => { const docs = await fetchSuggest(val); currentItems = buildItems(val, docs); activeIndex = -1; renderSugg(); }, 120);
  };
  function buildItems(prefix, productDocs) {
    const p = prefix.toLowerCase();
    const cats = CATEGORY_LIST.filter(c => c.toLowerCase().startsWith(p))
      .map(c => ({ type:'category', label:`Kategori: ${c}`, value:c }));
    const prods = (productDocs||[]).map(d => ({ type:'product', label:d.name, value:d.name, image:d.image, _id:d._id }));
    return [...cats, ...prods].slice(0, 10);
  }
  searchInput?.addEventListener('input', handleInput);
  searchInput?.addEventListener('focus', handleInput);
  searchInput?.addEventListener('keydown', (e) => {
    if (!currentItems.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = (activeIndex + 1) % currentItems.length; renderSugg(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = (activeIndex - 1 + currentItems.length) % currentItems.length; renderSugg(); }
    else if (e.key === 'Enter') { if (activeIndex >= 0) { e.preventDefault(); selectItem(activeIndex); } else { goSearch(); } }
    else if (e.key === 'Escape') { hideSugg(); }
  });
  searchInput?.addEventListener('blur', () => setTimeout(hideSugg, 120));
  const parseSearch = (raw) => {
    const tokens = raw.split(/[,\s]+/).map(t => t.trim()).filter(Boolean);
    const cats = [], leftovers = [];
    tokens.forEach(tok => { const c = ALIAS_MAP[tok.toLowerCase()]; if (c) { if (!cats.includes(c)) cats.push(c); } else leftovers.push(tok); });
    return { categories: cats, q: leftovers.join(' ').trim() };
  };
  const goSearch = () => {
    if (!searchInput) return;
    const term = searchInput.value.trim();
    const url = new URL('products.html', window.location.origin);
    if (term) {
      const { categories, q } = parseSearch(term);
      if (categories.length) url.searchParams.set('categories', categories.join(','));
      if (q) url.searchParams.set('q', q);
    }
    window.location.href = url.toString();
  };
  searchBtn?.addEventListener('click', goSearch);

  /* =======================
     Login / Logout-toggle
  ======================= */
  const setLoggedOutUI = () => {
    if (accountLink) {
      accountLink.innerHTML = 'Account <br /><strong>Login</strong>';
      accountLink.href = 'account.html';
      accountLink.onclick = null;
    }
    if (userEmailSpan) { userEmailSpan.textContent = ''; userEmailSpan.removeAttribute('title'); }
    localStorage.removeItem('email');
    localStorage.removeItem('username');
  };

  const attachLogout = ({ username, email }) => {
    // ✅ Visa username om det finns, annars email
    if (userEmailSpan) {
      userEmailSpan.textContent = username || email || '';
      userEmailSpan.title = email || username || '';
    }
    if (!accountLink) return;
    accountLink.innerHTML = 'Account <br /><strong>Logout</strong>';
    accountLink.href = '#';
    accountLink.onclick = async (e) => {
      e.preventDefault();
      try { await fetch('/api/account/logout', { method: 'POST', credentials: 'include' }); } catch {}
      setLoggedOutUI();
      window.location.href = 'index.html';
    };
  };

  // Snabb UI från localStorage
  const lsUser = { username: localStorage.getItem('username') || '', email: localStorage.getItem('email') || '' };
  if (lsUser.username || lsUser.email) attachLogout(lsUser);

  // Verifiera server-session
  try {
    const res = await fetch('/api/account/session', { credentials: 'include' });
    if (res.ok) {
      const data = await res.json(); // { email, username }
      localStorage.setItem('email', data.email || '');
      localStorage.setItem('username', data.username || '');
      attachLogout({ username: data.username || '', email: data.email || '' });
    } else {
      setLoggedOutUI();
    }
  } catch (err) {
    console.error('Fel vid kontroll av session:', err);
    if (!lsUser.username && !lsUser.email) setLoggedOutUI();
  }
});
