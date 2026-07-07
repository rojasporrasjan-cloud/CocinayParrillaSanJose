/**
 * COCINA Y PARRILLA SAN JOSÉ — MENU ENGINE 2026
 * Search · Cart · Extras · Selection · Order Type · IVA · Mesa QR · WhatsApp · Reveal · Toast
 */

/* ── STATE ──────────────────────────────────── */
let cart        = [];
let orderType   = null;   // 'mesa' | 'llevar' | 'domicilio'
let tableNumber = null;
let pendingItem = null;   // Item esperando selección

/* ── DETECTAR MODO MESA (URL ?mesa=X o ?m=X) ─── */
const urlParams = new URLSearchParams(window.location.search);
const mesaParam = urlParams.get('mesa') || urlParams.get('m');
const adminMode = urlParams.get('admin') === '1';

if (mesaParam) {
  orderType   = 'mesa';
  tableNumber = mesaParam;
}

function checkMesaBanner() {
  const banner = document.getElementById('mesa-banner');
  if (banner && tableNumber) {
    banner.innerHTML = `📍 ESTÁS EN LA <strong>MESA ${tableNumber}</strong> · TU PEDIDO LLEGARÁ AQUÍ`;
    banner.style.display = 'flex';
    // Medir altura real del banner y ajustar search + cat-nav
    requestAnimationFrame(() => {
      const h = banner.offsetHeight;
      document.documentElement.style.setProperty('--banner-h', `${h}px`);
    });
  }
}

checkMesaBanner();
window.addEventListener('load', checkMesaBanner);
document.addEventListener('DOMContentLoaded', checkMesaBanner);
setTimeout(checkMesaBanner, 500);
setTimeout(checkMesaBanner, 1500);

/* ── SCROLL REVEAL ──────────────────────────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = parseInt(entry.target.dataset.index || 0);
      setTimeout(() => entry.target.classList.add('visible'), (idx % 3) * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

/* ── SCROLL SPY ─────────────────────────────── */
let spyLocked  = false;  // bloquea spy mientras un pill click anima el scroll
let lastSpyId  = null;
let spyRaf     = null;

/* ── INIT ───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.food-card.reveal').forEach((el, i) => {
    el.dataset.index = i;
    revealObserver.observe(el);
  });

  const sections = [...document.querySelectorAll('.menu-section')];
  const pills    = [...document.querySelectorAll('.cat-pill')];

  const stickyH = () =>
    (document.getElementById('mesa-banner')?.offsetHeight || 0) +
    (document.querySelector('.search-wrap')?.offsetHeight  || 44) +
    (document.querySelector('.cat-nav')?.offsetHeight      || 36) + 4;

  // Scroll spy: encuentra la última sección cuyo top ya pasó la barra sticky
  function updateSpy() {
    if (spyLocked) return;
    const offset = stickyH() + 8;
    let current = sections[0]?.id || null;
    sections.forEach(s => {
      if (s.getBoundingClientRect().top <= offset) current = s.id;
    });
    if (!current || current === lastSpyId) return;
    lastSpyId = current;
    pills.forEach(p => p.classList.toggle('active', p.dataset.target === current));
    document.querySelector(`.cat-pill[data-target="${current}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  window.addEventListener('scroll', () => {
    if (spyRaf) return;
    spyRaf = requestAnimationFrame(() => { spyRaf = null; updateSpy(); });
  }, { passive: true });

  // Pill click: scroll a la sección y bloquear spy mientras anima
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const target = document.getElementById(pill.dataset.target);
      if (!target) return;

      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      pill.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      lastSpyId = pill.dataset.target;

      spyLocked = true;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - stickyH(),
        behavior: 'smooth'
      });
      clearTimeout(window._spyLockTimer);
      window._spyLockTimer = setTimeout(() => { spyLocked = false; }, 800);
    });
  });

  const searchInput = document.getElementById('menu-search');
  const searchClear = document.getElementById('search-clear');
  const allCards    = document.querySelectorAll('.food-card');
  const allSections = document.querySelectorAll('.menu-section');

  const normalizeText = (text) => {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  };

  searchInput.addEventListener('input', () => {
    const term = normalizeText(searchInput.value.trim());
    searchClear.classList.toggle('visible', term.length > 0);
    allCards.forEach(c =>
      c.classList.toggle('hidden', term.length > 0 && !normalizeText(c.dataset.name).includes(term))
    );
    allSections.forEach(s => {
      s.style.display = [...s.querySelectorAll('.food-card')].some(c => !c.classList.contains('hidden')) ? '' : 'none';
    });
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.focus();
  });

  if (adminMode) {
    const btn = document.getElementById('admin-qr-btn');
    if (btn) btn.style.display = 'flex';
  }

  applyConfig();
  buildOrderTypeUI();
  updateCartUI();
  buildGallery();
});

/* ── CONFIG ─────────────────────────────────── */
function applyConfig() {
  if (typeof RESTAURANT === 'undefined') return;
  const R = RESTAURANT;
  const year = new Date().getFullYear();

  // <title>
  const t = document.getElementById('page-title');
  if (t) t.textContent = `${R.name} — Menú Digital`;

  // Hero: logo o texto
  const wrap = document.getElementById('hero-logo-wrap');
  if (wrap) {
    if (R.logo) {
      wrap.innerHTML = `<img src="${R.logo}" alt="${R.name}" class="hero-logo">`;
    } else {
      document.getElementById('hero-name').textContent    = R.shortName.toUpperCase();
      document.getElementById('hero-tagline').textContent = R.tagline;
    }
  }

  // Footer
  const fa = document.getElementById('footer-address');
  if (fa) fa.textContent = R.address;

  const fh = document.getElementById('footer-hours');
  if (fh) fh.textContent = R.hours;

  const ft = document.getElementById('footer-tel');
  if (ft) { ft.href = `tel:${R.phone}`; ft.textContent = R.phoneDisplay; }

  const fc = document.getElementById('footer-copy');
  if (fc) fc.textContent = `© ${year} ${R.name}. Todos los derechos reservados.`;
}

/* ── TOAST ──────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ── ADD TO CART ────────────────────────────── */
function addToCart(name, price, btn) {
  const card      = btn.closest('.food-card');
  const selectStr = card?.dataset.select;
  const extrasStr = card?.dataset.extras;

  if (selectStr) {
    openSelectionModal(name, price, btn, selectStr, extrasStr || null);
  } else if (extrasStr) {
    openExtrasModal(name, price, btn, extrasStr);
  } else {
    doAddToCart(name, price);
    showToast(`${name} agregado ✓`);
    btnFeedback(btn);
  }
}

function doAddToCart(name, price) {
  cart.push({ name, price });
  updateCartUI();
}

/* ── BTN FEEDBACK ───────────────────────────── */
function btnFeedback(btn) {
  btn.classList.add('added');
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
  clearTimeout(btn._timer);
  btn._timer = setTimeout(() => {
    btn.classList.remove('added');
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>`;
  }, 1300);
}

/* ── SELECTION MODAL (required radio groups + optional extras) ── */
function openSelectionModal(name, price, btn, selectStr, extrasStr) {
  pendingItem = { name, price, btn, extrasStr };

  document.getElementById('selection-item-name').textContent = name;

  // Parse groups: "Proteína*:Carne|Chuleta;Adicional*:Huevo|Natilla"
  const groups = selectStr.split(';').map(g => {
    const [rawLabel, optsRaw] = g.split(':');
    const required = rawLabel.endsWith('*');
    const label    = rawLabel.replace('*', '').trim();
    const options  = optsRaw.split('|').map(o => o.trim());
    return { label, required, options };
  });

  const groupsEl = document.getElementById('selection-groups');
  groupsEl.innerHTML = '';

  groups.forEach((group, gi) => {
    const div = document.createElement('div');
    div.className = 'sel-group';
    div.innerHTML = `
      <p class="sel-group-title">${group.label}${group.required ? '<span class="req"> *</span>' : ''}</p>
      <div class="sel-options" id="sel-group-${gi}">
        ${group.options.map(opt => `
          <label class="sel-option" onclick="selectOption(this, ${gi}, '${group.label}')">
            <input type="radio" name="sel-group-${gi}" value="${opt}">
            ${opt}
          </label>
        `).join('')}
      </div>
    `;
    groupsEl.appendChild(div);
  });

  // Optional extras
  const extrasWrap = document.getElementById('selection-extras-wrap');
  const extrasList = document.getElementById('selection-extras-list');
  if (extrasStr) {
    extrasList.innerHTML = '';
    extrasStr.split(',').forEach(e => {
      const [label, cost] = e.split(':');
      const div = document.createElement('div');
      div.className = 'extra-item';
      const c = parseInt(cost);
      div.innerHTML = `
        <label class="extra-label">
          <input type="checkbox" value="${c}" data-label="${label.trim()}" onchange="updateSelectionTotal()">
          <span class="extra-name">${label.trim()}</span>
          <span class="extra-cost">${c > 0 ? '+₡' + c.toLocaleString('es-CR') : '✓ Incluido'}</span>
        </label>
      `;
      extrasList.appendChild(div);
    });
    extrasWrap.style.display = 'block';
  } else {
    extrasWrap.style.display = 'none';
  }

  updateSelectionTotal();
  document.getElementById('selection-modal').classList.add('open');

  // store groups meta for validation
  document.getElementById('selection-groups').dataset.meta = JSON.stringify(
    groups.map(g => ({ label: g.label, required: g.required }))
  );
}

function selectOption(labelEl, groupIndex, groupLabel) {
  document.querySelectorAll(`#sel-group-${groupIndex} .sel-option`).forEach(l => l.classList.remove('selected'));
  labelEl.classList.add('selected');
  labelEl.querySelector('input').checked = true;
  updateSelectionTotal();
}

function updateSelectionTotal() {
  let total = pendingItem?.price || 0;
  document.querySelectorAll('#selection-extras-list input:checked').forEach(cb => {
    total += parseInt(cb.value);
  });
  document.getElementById('selection-total').textContent = `₡${total.toLocaleString('es-CR')}`;
}

function confirmSelection() {
  if (!pendingItem) return;

  const meta = JSON.parse(document.getElementById('selection-groups').dataset.meta || '[]');
  const groups = document.querySelectorAll('#selection-groups .sel-group');
  const selectionParts = [];
  let valid = true;

  groups.forEach((groupEl, gi) => {
    const checked = groupEl.querySelector('input[type="radio"]:checked');
    const { label, required } = meta[gi] || {};
    if (required && !checked) {
      groupEl.querySelector('.sel-group-title').style.color = '#ff4d4d';
      valid = false;
    } else if (checked) {
      groupEl.querySelector('.sel-group-title').style.color = '';
      selectionParts.push(`${label}: ${checked.value}`);
    }
  });

  if (!valid) {
    showToast('Selecciona todas las opciones requeridas ☝');
    return;
  }

  // Optional extras
  const checkedExtras = [...document.querySelectorAll('#selection-extras-list input:checked')];
  const extraLabels   = checkedExtras.map(cb => cb.dataset.label);
  const extrasCost    = checkedExtras.reduce((s, cb) => s + parseInt(cb.value), 0);

  const allParts = [...selectionParts, ...extraLabels];
  const fullName = pendingItem.name + (allParts.length ? ` (${allParts.join(', ')})` : '');

  doAddToCart(fullName, pendingItem.price + extrasCost);
  showToast(`${pendingItem.name} agregado ✓`);
  btnFeedback(pendingItem.btn);
  closeSelectionModal();
  pendingItem = null;
}

function closeSelectionModal() {
  document.getElementById('selection-modal').classList.remove('open');
}

/* ── EXTRAS MODAL ───────────────────────────── */
function openExtrasModal(name, price, btn, extrasStr) {
  pendingItem = { name, price, btn };

  const extras = extrasStr.split(',').map(e => {
    const [label, cost] = e.split(':');
    return { label: label.trim(), cost: parseInt(cost) };
  });

  document.getElementById('extras-item-name').textContent = name;

  const allFree = extras.every(e => e.cost === 0);
  const subtitle = document.querySelector('#extras-modal .modal-subtitle');
  if (subtitle) subtitle.textContent = allFree
    ? 'Selecciona los items que quieres incluir.'
    : 'Extras opcionales para personalizar tu pedido.';

  const list = document.getElementById('extras-list');
  list.innerHTML = '';
  extras.forEach(extra => {
    const div = document.createElement('div');
    div.className = 'extra-item';
    div.innerHTML = `
      <label class="extra-label">
        <input type="checkbox" value="${extra.cost}" data-label="${extra.label}" onchange="updateExtrasTotal()">
        <span class="extra-name">${extra.label}</span>
        <span class="extra-cost">${extra.cost > 0 ? '+₡' + extra.cost.toLocaleString('es-CR') : '✓ Incluido'}</span>
      </label>
    `;
    list.appendChild(div);
  });

  updateExtrasTotal();
  document.getElementById('extras-modal').classList.add('open');
}

function updateExtrasTotal() {
  let total = pendingItem?.price || 0;
  document.querySelectorAll('#extras-list input:checked').forEach(cb => {
    total += parseInt(cb.value);
  });
  document.getElementById('extras-total').textContent = `₡${total.toLocaleString('es-CR')}`;
}

function confirmExtras() {
  if (!pendingItem) return;
  const checked      = [...document.querySelectorAll('#extras-list input:checked')];
  const extrasLabels = checked.map(cb => cb.dataset.label);
  const extrasCost   = checked.reduce((s, cb) => s + parseInt(cb.value), 0);
  const fullName     = pendingItem.name + (extrasLabels.length ? ` (${extrasLabels.join(', ')})` : '');
  doAddToCart(fullName, pendingItem.price + extrasCost);
  showToast(`${pendingItem.name} agregado ✓`);
  btnFeedback(pendingItem.btn);
  closeExtrasModal();
  pendingItem = null;
}

function closeExtrasModal() {
  document.getElementById('extras-modal').classList.remove('open');
}

/* ── ORDER TYPE ─────────────────────────────── */
function buildOrderTypeUI() {
  const wrap = document.getElementById('order-type-wrap');
  if (!wrap) return;

  if (tableNumber) {
    wrap.innerHTML = `
      <div class="mesa-badge-cart">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        Pedido para <strong>Mesa ${tableNumber}</strong>
      </div>`;
    return;
  }

  wrap.innerHTML = `
    <div class="ot-section">
      <p class="ot-title">¿Cómo lo recibes?</p>
      <div class="ot-btns">
        <button class="ot-btn" id="ot-mesa"      onclick="selectOrderType('mesa')">🍽 En el local</button>
        <button class="ot-btn" id="ot-llevar"    onclick="selectOrderType('llevar')">📦 Para llevar</button>
        <button class="ot-btn" id="ot-domicilio" onclick="selectOrderType('domicilio')">🛵 A domicilio</button>
      </div>
      <div id="ot-addr-wrap" class="ot-addr-wrap" style="display:none">
        <input type="text" id="delivery-addr"   class="ot-addr-input" placeholder="Barrio, calle y señas de entrega..." />
        <input type="text" id="delivery-nombre" class="ot-addr-input" placeholder="Tu nombre completo" />
        <input type="tel"  id="delivery-tel"    class="ot-addr-input" placeholder="Número de teléfono" />
      </div>
    </div>`;

  restoreDeliveryFields();
  if (orderType && !tableNumber) selectOrderType(orderType, false);
}

/* ── DELIVERY FIELDS — guardar y restaurar ── */
const DELIVERY_STORAGE_KEY = 'sanjose_delivery_info';

function restoreDeliveryFields() {
  try {
    const saved = JSON.parse(localStorage.getItem(DELIVERY_STORAGE_KEY) || '{}');
    const fields = { 'delivery-addr': saved.addr, 'delivery-nombre': saved.nombre, 'delivery-tel': saved.tel };
    Object.entries(fields).forEach(([id, val]) => {
      const el = document.getElementById(id);
      if (el && val) el.value = val;
    });
  } catch {}

  ['delivery-addr', 'delivery-nombre', 'delivery-tel'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', saveDeliveryFields);
  });
}

function saveDeliveryFields() {
  try {
    localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify({
      addr:   document.getElementById('delivery-addr')?.value   || '',
      nombre: document.getElementById('delivery-nombre')?.value || '',
      tel:    document.getElementById('delivery-tel')?.value    || '',
    }));
  } catch {}
}

function selectOrderType(type, save = true) {
  if (save) {
    orderType = type;
    updateCartUI();
  }
  document.querySelectorAll('.ot-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`ot-${type}`)?.classList.add('active');
  const addrWrap = document.getElementById('ot-addr-wrap');
  if (addrWrap) addrWrap.style.display = type === 'domicilio' ? 'block' : 'none';
}

/* ── CART ───────────────────────────────────── */
function isMesaOrder() {
  return !!(tableNumber || orderType === 'mesa');
}

function updateCartUI() {
  const count   = cart.length;
  const countEl = document.getElementById('cart-count');
  countEl.textContent = count;
  countEl.classList.toggle('hidden', count === 0);

  const listEl      = document.getElementById('cart-items');
  const totalEl     = document.getElementById('cart-total-value');
  const subtotalEl  = document.getElementById('cart-subtotal-value');
  const ivaEl       = document.getElementById('cart-iva-value');
  const deliveryEl  = document.getElementById('cart-delivery-value');
  const subtotalRow = document.getElementById('subtotal-row');
  const ivaRow      = document.getElementById('iva-row');
  const deliveryRow = document.getElementById('delivery-row');
  const emptyEl     = document.getElementById('cart-empty');

  listEl.innerHTML = '';
  let subtotal = 0;

  cart.forEach((item, i) => {
    subtotal += item.price;
    const div = document.createElement('div');
    div.className = 'cart-item-row';
    div.innerHTML = `
      <span class="cart-item-name">${item.name}</span>
      <span class="cart-item-price">₡${item.price.toLocaleString('es-CR')}</span>
      <button class="cart-item-remove" onclick="removeFromCart(${i})" title="Quitar">✕</button>
    `;
    listEl.appendChild(div);
  });

  const mesa  = isMesaOrder();
  const iva   = mesa ? Math.round(subtotal * 0.10) : 0;
  const total = subtotal + iva;

  if (mesa && count > 0) {
    subtotalRow.style.display = 'flex';
    ivaRow.style.display      = 'flex';
    subtotalEl.textContent    = `₡${subtotal.toLocaleString('es-CR')}`;
    ivaEl.textContent         = `₡${iva.toLocaleString('es-CR')}`;
  } else {
    subtotalRow.style.display = 'none';
    ivaRow.style.display      = 'none';
  }

  // Envío: nota informativa, no se suma al total
  const showDelivery = orderType === 'domicilio' && count > 0;
  if (deliveryRow) deliveryRow.style.display = showDelivery ? 'flex' : 'none';
  if (deliveryEl && showDelivery) {
    const R = typeof RESTAURANT !== 'undefined' ? RESTAURANT : {};
    const min = (R.deliveryFeeMin || 500).toLocaleString('es-CR');
    const max = (R.deliveryFeeMax || 1000).toLocaleString('es-CR');
    deliveryEl.textContent = `₡${min} – ₡${max}`;
  }

  totalEl.textContent = `₡${total.toLocaleString('es-CR')}`;
  emptyEl.classList.toggle('show', count === 0);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartUI();
}

function toggleCart() {
  const overlay = document.getElementById('cart-overlay');
  const isOpen  = overlay.classList.toggle('open');
  if (isOpen) buildOrderTypeUI();
}

/* ── WHATSAPP ───────────────────────────────── */
function sendToWhatsApp() {
  if (cart.length === 0) {
    showToast('Agrega algo al pedido primero 😊');
    return;
  }

  if (!tableNumber && !orderType) {
    showToast('Selecciona cómo recibirás tu pedido 👆');
    const wrap = document.getElementById('order-type-wrap');
    wrap?.classList.add('shake');
    setTimeout(() => wrap?.classList.remove('shake'), 600);
    return;
  }

  if (orderType === 'domicilio') {
    const addr   = document.getElementById('delivery-addr')?.value?.trim();
    const nombre = document.getElementById('delivery-nombre')?.value?.trim();
    const tel    = document.getElementById('delivery-tel')?.value?.trim();
    if (!addr) {
      showToast('Ingresa la dirección de entrega 📍');
      document.getElementById('delivery-addr')?.focus();
      return;
    }
    if (!nombre) {
      showToast('Ingresa tu nombre 👤');
      document.getElementById('delivery-nombre')?.focus();
      return;
    }
    if (!tel) {
      showToast('Ingresa tu teléfono 📞');
      document.getElementById('delivery-tel')?.focus();
      return;
    }
  }

  const rName = (typeof RESTAURANT !== 'undefined') ? RESTAURANT.name : 'Restaurante';
  const rPhone = (typeof RESTAURANT !== 'undefined') ? RESTAURANT.phone : '50683108026';
  let subtotal = 0;
  let msg = `🍽 *Pedido — ${rName}*\n\n`;

  cart.forEach(item => {
    msg += `• ${item.name} — ₡${item.price.toLocaleString('es-CR')}\n`;
    subtotal += item.price;
  });

  const mesa        = isMesaOrder();
  const deliveryFee = (orderType === 'domicilio')
    ? ((typeof RESTAURANT !== 'undefined' ? RESTAURANT.deliveryFee : 0) || 0)
    : 0;

  if (mesa) {
    const iva   = Math.round(subtotal * 0.10);
    const total = subtotal + iva;
    msg += `\n💵 Subtotal: ₡${subtotal.toLocaleString('es-CR')}`;
    msg += `\n📊 IVA (10%): ₡${iva.toLocaleString('es-CR')}`;
    msg += `\n💰 *TOTAL: ₡${total.toLocaleString('es-CR')}*`;
  } else if (orderType === 'domicilio') {
    const R   = typeof RESTAURANT !== 'undefined' ? RESTAURANT : {};
    const min = (R.deliveryFeeMin || 500).toLocaleString('es-CR');
    const max = (R.deliveryFeeMax || 1000).toLocaleString('es-CR');
    msg += `\n💰 *TOTAL: ₡${subtotal.toLocaleString('es-CR')}*`;
    msg += `\n🛵 Más envío: ₡${min} – ₡${max} (según zona)`;
  } else {
    msg += `\n💰 *TOTAL: ₡${subtotal.toLocaleString('es-CR')}*`;
  }

  if (tableNumber) {
    msg += `\n\n📍 *MESA ${tableNumber}* — Comer en el local`;
  } else if (orderType === 'mesa') {
    msg += `\n\n🍽 *Para comer en el local*`;
  } else if (orderType === 'llevar') {
    msg += `\n\n📦 *Para llevar*`;
  } else if (orderType === 'domicilio') {
    const addr   = document.getElementById('delivery-addr')?.value?.trim();
    const nombre = document.getElementById('delivery-nombre')?.value?.trim();
    const tel    = document.getElementById('delivery-tel')?.value?.trim();
    msg += `\n\n🛵 *Entrega a domicilio*`;
    msg += `\n👤 Nombre: ${nombre}`;
    msg += `\n📞 Teléfono: ${tel}`;
    msg += `\n📌 Dirección: ${addr}`;
  }

  window.open(`https://wa.me/${rPhone}?text=${encodeURIComponent(msg)}`, '_blank');
}

/* ── GALLERY ────────────────────────────────── */
let lightboxIndex = 0;

function buildGallery() {
  // GALLERY_IMAGES viene de gallery/gallery.js
  if (typeof GALLERY_IMAGES === 'undefined' || GALLERY_IMAGES.length === 0) return;

  const section = document.getElementById('galeria');
  const strip   = document.getElementById('gallery-strip');
  if (!section || !strip) return;

  section.style.display = 'block';
  const navPill = document.getElementById('gallery-nav-pill');
  if (navPill) navPill.style.display = '';
  strip.innerHTML = '';

  GALLERY_IMAGES.forEach((item, i) => {
    const src     = `gallery/${item.src.split('/').map(encodeURIComponent).join('/')}`;
    const caption = item.caption || '';

    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.innerHTML = `
      <img src="${src}" alt="${caption}" loading="lazy">
      ${caption ? `<div class="gallery-item-caption">${caption}</div>` : ''}
    `;
    div.addEventListener('click', () => openLightbox(i));
    strip.appendChild(div);
  });
}

let _bodyScrollY = 0;

function openLightbox(index) {
  if (typeof GALLERY_IMAGES === 'undefined') return;
  lightboxIndex = index;
  updateLightboxImage();
  document.getElementById('lightbox').classList.add('open');
  // iOS scroll lock: position fixed + recordar posición
  _bodyScrollY = window.scrollY;
  document.body.style.position = 'fixed';
  document.body.style.top      = `-${_bodyScrollY}px`;
  document.body.style.width    = '100%';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  // Restaurar scroll exactamente donde estaba
  document.body.style.position = '';
  document.body.style.top      = '';
  document.body.style.width    = '';
  window.scrollTo(0, _bodyScrollY);
}

function lightboxNav(dir, e) {
  if (e) e.stopPropagation();
  if (typeof GALLERY_IMAGES === 'undefined') return;
  lightboxIndex = (lightboxIndex + dir + GALLERY_IMAGES.length) % GALLERY_IMAGES.length;
  updateLightboxImage();
}

function updateLightboxImage() {
  const item = GALLERY_IMAGES[lightboxIndex];
  document.getElementById('lightbox-img').src         = `gallery/${item.src.split('/').map(encodeURIComponent).join('/')}`;
  document.getElementById('lightbox-img').alt         = item.caption || '';
  document.getElementById('lightbox-caption').textContent = item.caption || '';
}

/* ── PWA INSTALL PROMPT ─────────────────────── */
(function() {
  let deferredPrompt = null;
  const DISMISS_KEY  = 'pwa_banner_dismissed';

  function showBanner() {
    const banner = document.getElementById('pwa-banner');
    if (!banner) return;
    banner.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add('show')));
  }

  function hideBanner(permanent) {
    const banner = document.getElementById('pwa-banner');
    if (!banner) return;
    banner.classList.remove('show');
    setTimeout(() => { banner.style.display = 'none'; }, 350);
    if (permanent) localStorage.setItem(DISMISS_KEY, '1');
  }

  // Captura el evento del navegador (Android Chrome)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (localStorage.getItem(DISMISS_KEY)) return;
    setTimeout(showBanner, 3000);
  });

  // Botón instalar
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#pwa-install-btn')) return;
    hideBanner(false);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((result) => {
        if (result.outcome === 'accepted') localStorage.setItem(DISMISS_KEY, '1');
        deferredPrompt = null;
      });
    }
  });

  // Botón cerrar
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#pwa-dismiss-btn')) return;
    hideBanner(true);
  });

  // Si ya está instalada, no mostrar
  window.addEventListener('appinstalled', () => {
    localStorage.setItem(DISMISS_KEY, '1');
    hideBanner(false);
  });
})();

// Swipe support for lightbox on mobile
(function() {
  let startX = 0;
  document.addEventListener('touchstart', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    startX = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) lightboxNav(diff > 0 ? 1 : -1, null);
  }, { passive: true });

  // Keyboard navigation
  document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'ArrowRight') lightboxNav(1, null);
    if (e.key === 'ArrowLeft')  lightboxNav(-1, null);
    if (e.key === 'Escape')     closeLightbox();
  });
})();

/* ── QR GENERATOR (Admin) ───────────────────── */
function openQrModal() {
  document.getElementById('qr-modal').classList.add('open');
  setTimeout(generateQR, 100);
}

function closeQrModal() {
  document.getElementById('qr-modal').classList.remove('open');
}

function generateQR() {
  const mesa   = document.getElementById('mesa-input')?.value || '1';
  const base   = window.location.origin + window.location.pathname;
  const url    = `${base}?mesa=${mesa}`;
  const output = document.getElementById('qr-output');
  output.innerHTML = '';

  if (typeof QRCode !== 'undefined') {
    new QRCode(output, {
      text:         url,
      width:        200,
      height:       200,
      colorDark:    '#000000',
      colorLight:   '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });

    const label = document.createElement('p');
    label.className   = 'qr-mesa-label';
    label.textContent = `Mesa ${mesa}`;
    output.appendChild(label);

    const urlEl = document.createElement('p');
    urlEl.className   = 'qr-url-text';
    urlEl.textContent = url;
    output.appendChild(urlEl);

    setTimeout(() => {
      const canvas = output.querySelector('canvas');
      if (!canvas) return;
      const dlBtn = document.createElement('button');
      dlBtn.className   = 'qr-dl-btn';
      dlBtn.textContent = '⬇ Descargar QR';
      dlBtn.onclick = () => {
        const a  = document.createElement('a');
        a.href     = canvas.toDataURL('image/png');
        a.download = `qr-mesa-${mesa}.png`;
        a.click();
      };
      output.appendChild(dlBtn);
    }, 200);

  } else {
    output.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;padding:1rem">Cargando generador de QR...</p>`;
  }
}

/* ── TUTORIAL (DRIVER.JS) ───────────────────── */
function iniciarTutorial() {
  if (typeof window.driver === 'undefined') {
    showToast('El tutorial aún está cargando...');
    return;
  }
  
  const driverObj = window.driver.js.driver;
  
  const tour = driverObj({
    showProgress: true,
    animate: true,
    nextBtnText: 'Siguiente ➔',
    prevBtnText: '← Anterior',
    doneBtnText: '¡Entendido!',
    progressText: 'Paso {{current}} de {{total}}',
    allowClose: true,
    steps: [
      {
        element: '.cat-nav',
        popover: {
          title: 'Navega el Menú',
          description: 'Desliza y selecciona una categoría para encontrar rápido lo que buscas.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.search-wrap',
        popover: {
          title: 'Busca tu Antojo',
          description: 'También puedes buscar platos por su nombre directamente aquí.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '.food-card:not(.hidden) .add-btn',
        popover: {
          title: 'Agrega al Carrito',
          description: 'Toca este botón para añadir un plato a tu pedido. Algunos platos te dejarán elegir extras.',
          side: 'left',
          align: 'center'
        }
      },
      {
        element: '#cart-fab',
        popover: {
          title: 'Tu Pedido',
          description: 'Aquí verás todo lo que has agregado y el total de tu cuenta.',
          side: 'left',
          align: 'center'
        }
      },
      {
        popover: {
          title: '¡Todo Listo!',
          description: tableNumber 
            ? 'Una vez en tu carrito, revisa tu pedido y envíalo a la cocina por WhatsApp. ¡A disfrutar!' 
            : 'Una vez en tu carrito, selecciona cómo recibirlo y envíalo por WhatsApp. ¡A disfrutar!',
          side: 'center',
          align: 'center'
        }
      }
    ]
  });

  tour.drive();
  localStorage.setItem('sanjose_tutorial_seen', '1');
}

// Auto-start tutorial on first visit
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (!localStorage.getItem('sanjose_tutorial_seen')) {
      iniciarTutorial();
    }
  }, 1500);
});

