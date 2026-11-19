'use strict';

let tripData = null;
let currentView = 'home';
let currentDay = 1;
let dayFilter = 'all';
let memoFilter = 'all';
let activeMap = null;
let mapMarkers = new Map();
let geocodeCache = new Map();
let memoPoller = null;
let memoRows = [];
let supa = null;

const app = document.getElementById('app');
const SUPABASE_TABLE = 'travel_memos';
const DAY_IMAGES = {
  1: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=85',
  2: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1200&q=85',
  3: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85',
  4: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=85',
  5: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=85',
  6: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=85',
  7: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?auto=format&fit=crop&w=1200&q=85',
  8: 'https://images.unsplash.com/photo-1508964942454-1a56651d54ac?auto=format&fit=crop&w=1200&q=85',
  9: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=85'
};
const CITY_CENTRES = {
  kl: [3.139, 101.686],
  langkawi: [6.35, 99.8],
  singapore: [1.352, 103.82],
  busan: [35.18, 129.075]
};

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}
function attr(value) { return esc(value).replace(/`/g, '&#96;'); }
function dateParts(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return {
    day: d.getDate(),
    month: d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    weekday: d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()
  };
}
function dateLine(iso) {
  const p = dateParts(iso);
  return `${p.weekday}, ${p.day} ${p.month}`;
}
function formatMemoDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-SG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true });
}
function regionLabel(day) {
  if (day === 1) return 'KUALA LUMPUR';
  if (day === 2) return 'KUALA LUMPUR';
  if (day === 3) return 'KUALA LUMPUR → LANGKAWI';
  if (day === 4) return 'LANGKAWI';
  if (day === 5) return 'LANGKAWI → SINGAPORE';
  if (day >= 6 && day <= 8) return 'SINGAPORE';
  return 'BUSAN · HOME';
}
function dayCity(day) {
  if (day <= 2) return 'Kuala Lumpur';
  if (day <= 4) return 'Langkawi';
  if (day <= 8) return 'Singapore';
  return 'Busan';
}
function mapCentre(day) {
  if (day <= 2) return CITY_CENTRES.kl;
  if (day <= 4) return CITY_CENTRES.langkawi;
  if (day <= 8) return CITY_CENTRES.singapore;
  return CITY_CENTRES.busan;
}
function dayShort(d) { return `DAY ${String(d.day).padStart(2, '0')}`; }
function gmapsUrl(activity) {
  if (activity[5]) return activity[5];
  const query = activity[4] || `${activity[1]}, ${dayCity(currentDay)}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
function destroyMap() {
  if (activeMap) {
    activeMap.remove();
    activeMap = null;
  }
  mapMarkers.clear();
}
function clearMemoPoller() {
  if (memoPoller) window.clearInterval(memoPoller);
  memoPoller = null;
}
function setNav(view) {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === view);
  });
}
function navigate(view) {
  if (!tripData) return;
  clearMemoPoller();
  destroyMap();
  currentView = view;
  if (view === 'home') renderHome();
  else if (view === 'itinerary') renderItinerary();
  else if (view === 'map') renderMapPage();
  else if (view === 'memo') renderMemoPage();
  setNav(view);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderHome() {
  currentView = 'home';
  const trip = tripData.trip;
  const first = tripData.days[0];
  app.innerHTML = `
    <section class="home-intro">
      <div class="eyebrow">YOUR FAMILY GETAWAY · 2026</div>
      <h1>Let's make<br>new memories.</h1>
      <p>A little collection of places, moments and plans.</p>
    </section>
    <section class="flight-card" aria-label="Trip overview">
      <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=85" alt="Airplane flying above the clouds">
      <div class="flight-overlay"></div>
      <div class="flight-caption">
        <div><div class="flight-label">MALAYSIA · SINGAPORE</div><div class="flight-route">25 NOV <small>TO</small> 03 DEC</div></div>
        <div class="flight-meta">9 DAYS · 3 STOPS</div>
      </div>
    </section>
    <section class="home-hero">
      <img src="${attr(trip.cover)}" alt="Singapore travel skyline" onerror="this.src='${DAY_IMAGES[5]}'">
      <div class="home-hero-copy">
        <div class="eyebrow">YOUR TRIP COLLECTION</div>
        <h2>Travel<br>Itinerary</h2>
        <p>${esc(trip.subtitle)} · ${esc(trip.startDate)} — ${esc(trip.endDate)}</p>
        <button class="primary-cta" id="viewItinerary"><span>View Itinerary</span><span>→</span></button>
      </div>
    </section>
    <section class="home-stats">
      <div class="stat"><strong>09</strong><span>TRAVEL DAYS</span></div>
      <div class="stat"><strong>03</strong><span>DESTINATIONS</span></div>
      <div class="stat"><strong>25 NOV</strong><span>DEPARTURE</span></div>
    </section>
    <div class="home-section-head"><h2>First day preview</h2><button class="text-link" id="openFirstDay">See details ↗</button></div>
    <button class="day-card" id="homeDayCard">
      <img class="day-thumb" src="${DAY_IMAGES[1]}" alt="Kuala Lumpur">
      <div class="day-info"><div class="day-meta"><span class="day-badge">${dayShort(first)}</span><span class="day-date">${dateLine(first.date)}</span></div><h3>${esc(first.region)}</h3><p>${esc(first.summary)}</p></div><span class="day-chevron">›</span>
    </button>
    <div class="footer-note">MADE FOR THE MOMENTS WE'LL REMEMBER</div>`;
  document.getElementById('viewItinerary').onclick = () => navigate('itinerary');
  document.getElementById('openFirstDay').onclick = () => renderDay(1);
  document.getElementById('homeDayCard').onclick = () => renderDay(1);
  setNav('home');
}

function renderItinerary() {
  currentView = 'itinerary';
  const visible = tripData.days.filter(d => {
    if (dayFilter === 'all') return true;
    if (dayFilter === 'my') return d.day <= 4;
    if (dayFilter === 'sg') return d.day >= 5 && d.day <= 8;
    return d.day === 9;
  });
  app.innerHTML = `
    <section class="page-heading"><div class="eyebrow">25 NOV — 03 DEC 2026</div><h1>Itinerary</h1><p>Every day, planned one moment at a time.</p></section>
    <div class="filter-row" aria-label="Filter itinerary">
      <button class="filter-chip ${dayFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
      <button class="filter-chip ${dayFilter === 'my' ? 'active' : ''}" data-filter="my">MY 🇲🇾</button>
      <button class="filter-chip ${dayFilter === 'sg' ? 'active' : ''}" data-filter="sg">SG 🇸🇬</button>
      <button class="filter-chip ${dayFilter === 'home' ? 'active' : ''}" data-filter="home">Home 🇰🇷</button>
    </div>
    <div class="day-list">
      ${visible.map(d => `
        <button class="day-card" data-day="${d.day}">
          <img class="day-thumb" src="${DAY_IMAGES[d.day]}" alt="${attr(dayCity(d.day))}" loading="lazy">
          <div class="day-info">
            <div class="day-meta"><span class="day-badge">${dayShort(d)}</span><span class="day-date">${dateLine(d.date)}</span></div>
            <h3>${esc(d.region)}</h3><p>${esc(d.summary)}</p>
          </div><span class="day-chevron">›</span>
        </button>`).join('')}
    </div>
    <div class="footer-note">9 DAYS · 25 NOVEMBER TO 3 DECEMBER 2026</div>`;
  document.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => {
    dayFilter = btn.dataset.filter;
    renderItinerary();
  }));
  document.querySelectorAll('[data-day]').forEach(btn => btn.addEventListener('click', () => renderDay(Number(btn.dataset.day))));
  setNav('itinerary');
}

function renderDay(dayNo, tab = 'schedule') {
  clearMemoPoller();
  destroyMap();
  currentDay = dayNo;
  currentView = 'day';
  const d = tripData.days.find(day => day.day === dayNo);
  if (!d) return;
  app.innerHTML = `
    <section class="detail-hero">
      <img src="${DAY_IMAGES[dayNo]}" alt="${attr(dayCity(dayNo))}" onerror="this.src='${DAY_IMAGES[5]}'">
      <button class="detail-back" id="detailBack" aria-label="Back">‹</button>
      <div class="detail-hero-copy"><span class="detail-day-pill">${dayShort(d)}</span><h1>${esc(dayCity(dayNo))}</h1><p>${dateLine(d.date)} · ${esc(regionLabel(dayNo))}</p></div>
    </section>
    <section class="detail-sheet">
      <p class="detail-summary">${esc(d.summary)}</p>
      <div class="detail-tabs"><button class="detail-tab ${tab === 'schedule' ? 'active' : ''}" data-detail-tab="schedule">Schedule</button><button class="detail-tab ${tab === 'map' ? 'active' : ''}" data-detail-tab="map">Daily Map</button></div>
      <section id="scheduleContent" ${tab === 'map' ? 'hidden' : ''}>
        <div class="timeline-head"><h2>Today's itinerary</h2><span>${d.activities.length} ACTIVITIES</span></div>
        <div class="timeline">${d.activities.map((a, i) => renderActivity(a, i)).join('')}</div>
        ${d.stay ? `<div class="stay-card"><strong>STAY / ACCOMMODATION</strong>${esc(d.stay)}</div>` : ''}
        ${(d.notes || []).map(note => `<div class="stay-card"><strong>TRAVEL NOTE</strong>${esc(note)}</div>`).join('')}
      </section>
      <section id="dayMapContent" ${tab === 'schedule' ? 'hidden' : ''}>
        <div class="map-summary"><strong>DAY ${dayNo} · Route map</strong><span id="dayMapCount">Finding places…</span></div>
        <div id="detailDayMap" class="map-frame"><div class="map-state">Loading the map…</div></div>
        <p class="map-note">Pins follow the order in your itinerary. The connecting line is a visual guide, not turn-by-turn road directions.</p>
        <div id="detailMapList" class="map-place-list"></div>
      </section>
    </section>
    <div class="footer-note">DAY ${dayNo} OF ${tripData.trip.duration} · MALAYSIA & SINGAPORE</div>`;
  document.getElementById('detailBack').onclick = () => navigate('itinerary');
  document.querySelectorAll('[data-detail-tab]').forEach(btn => btn.addEventListener('click', () => {
    const t = btn.dataset.detailTab;
    document.querySelectorAll('[data-detail-tab]').forEach(x => x.classList.toggle('active', x === btn));
    document.getElementById('scheduleContent').hidden = t !== 'schedule';
    document.getElementById('dayMapContent').hidden = t !== 'map';
    if (t === 'map') initDayMap(dayNo, 'detailDayMap', 'detailMapList', 'dayMapCount');
    else destroyMap();
  }));
  if (tab === 'map') initDayMap(dayNo, 'detailDayMap', 'detailMapList', 'dayMapCount');
  setNav('itinerary');
}

function renderActivity(a, i) {
  const hasPlace = Boolean(a[4] || a[5]);
  const isChoice = String(a[1] || '').includes('또는');
  const time = String(a[0] || '').replace('–', '–');
  return `<article class="event ${isChoice ? 'event-option' : ''}">
    <div class="event-time">${esc(time)}</div><div class="event-track"></div>
    <div><div class="event-title">${esc(a[1])}</div>
      ${a[3] ? `<div class="event-note">${esc(a[3])}</div>` : ''}
      <div class="event-bottom">${a[2] ? `<span class="event-tag">${esc(a[2])}</span>` : ''}${hasPlace ? `<a class="event-map-link" href="${attr(a[5] || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a[4])}`)}" target="_blank" rel="noopener">Open map ↗</a>` : ''}</div>
    </div></article>`;
}

function locationsForDay(day) {
  return day.activities.map((a, originalIndex) => ({
    time: a[0] || '', name: a[1] || '', category: a[2] || '', note: a[3] || '',
    query: a[4] || '', directUrl: a[5] || '', originalIndex
  })).filter(p => p.query.trim().length > 1);
}
function googleSearchLink(place) {
  return place.directUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query || `${place.name}, ${dayCity(currentDay)}`)}`;
}
async function geocode(query) {
  if (geocodeCache.has(query)) return geocodeCache.get(query);
  try {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(endpoint, { headers: { 'Accept-Language': 'en,ko' } });
    if (!response.ok) return null;
    const rows = await response.json();
    if (!rows.length) { geocodeCache.set(query, null); return null; }
    const point = { lat: Number(rows[0].lat), lon: Number(rows[0].lon), label: rows[0].display_name };
    geocodeCache.set(query, point);
    return point;
  } catch (error) {
    console.warn('Geocoding failed:', error);
    return null;
  }
}
function wait(ms) { return new Promise(resolve => window.setTimeout(resolve, ms)); }
function markerIcon(number) {
  return L.divIcon({
    className: 'numbered-marker',
    html: `<div style="width:29px;height:29px;border:2px solid #fff;border-radius:50%;background:#2785ef;box-shadow:0 2px 9px rgba(20,73,120,.3);color:#fff;display:grid;place-items:center;font-family:Lato,sans-serif;font-size:11px;font-weight:900">${number}</div>`,
    iconSize: [29, 29], iconAnchor: [14, 14]
  });
}
async function initDayMap(dayNo, mapId, listId, countId) {
  destroyMap();
  const d = tripData.days.find(day => day.day === dayNo);
  const mapEl = document.getElementById(mapId);
  const listEl = document.getElementById(listId);
  const countEl = document.getElementById(countId);
  if (!d || !mapEl || !listEl) return;
  const places = locationsForDay(d);
  mapEl.innerHTML = '';
  if (countEl) countEl.textContent = `${places.length} PLACES IN PLAN`;
  if (!window.L) {
    mapEl.innerHTML = '<div class="map-state">The map library could not be loaded. Please check your internet connection.</div>';
    return;
  }
  listEl.innerHTML = places.length ? places.map((p, index) => `
    <div class="map-place"><span class="map-num">${index + 1}</span><div><div class="map-place-name">${esc(p.name)}</div><div class="map-place-time">${esc(p.time)} · ${esc(p.category)}</div></div><a class="map-place-link" href="${attr(googleSearchLink(p))}" target="_blank" rel="noopener">Maps ↗</a></div>`).join('') : '<div class="memo-empty">No named map locations were included in this day’s schedule.</div>';
  const mapInstance = L.map(mapId, { scrollWheelZoom: false }).setView(mapCentre(dayNo), dayNo >= 5 && dayNo <= 8 ? 12 : 11);
  activeMap = mapInstance;
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(mapInstance);
  if (!places.length) {
    mapEl.insertAdjacentHTML('beforeend', '<div class="map-state" style="position:absolute;inset:0;pointer-events:none">No location pins for this day</div>');
    return;
  }
  const found = [];
  if (countEl) countEl.textContent = 'Locating map pins…';
  for (let index = 0; index < places.length; index++) {
    const p = places[index];
    // Keep requests spaced to respect the public OpenStreetMap geocoder's usage policy.
    const point = await geocode(p.query);
    if (activeMap !== mapInstance) return;
    if (point) {
      found.push({ ...point, place: p, number: index + 1 });
      const marker = L.marker([point.lat, point.lon], { icon: markerIcon(index + 1) }).addTo(mapInstance);
      marker.bindPopup(`<strong>${esc(p.name)}</strong><br>${esc(p.time)}<br><a target="_blank" rel="noopener" href="${attr(googleSearchLink(p))}">Open in Google Maps ↗</a>`);
      mapMarkers.set(index, marker);
    }
    if (index < places.length - 1) await wait(1050);
  }
  if (found.length) {
    if (found.length > 1) {
      L.polyline(found.map(p => [p.lat, p.lon]), { color: '#2785ef', weight: 3, opacity: .8, dashArray: '6 7' }).addTo(mapInstance);
      mapInstance.fitBounds(L.latLngBounds(found.map(p => [p.lat, p.lon])).pad(.17));
    } else {
      mapInstance.setView([found[0].lat, found[0].lon], 14);
    }
  } else {
    mapInstance.setView(mapCentre(dayNo), 12);
  }
  if (countEl) countEl.textContent = `${found.length} / ${places.length} PINS FOUND`;
  await wait(100);
  if (activeMap === mapInstance) mapInstance.invalidateSize();
}

function renderMapPage() {
  currentView = 'map';
  app.innerHTML = `
    <section class="map-intro"><div class="eyebrow">YOUR ROUTE, DAY BY DAY</div><h1>Daily Map</h1><p>Choose a date to see that day's places and route.</p></section>
    <div class="map-day-select">${tripData.days.map(d => `<button class="map-day-chip ${d.day === currentDay ? 'active' : ''}" data-map-day="${d.day}">DAY ${d.day}</button>`).join('')}</div>
    <div class="map-summary"><strong id="mapDayHeading">DAY ${currentDay} · ${esc(dayCity(currentDay))}</strong><span id="mapPageCount">Preparing pins…</span></div>
    <div id="dailyMap" class="map-frame"><div class="map-state">Loading the map…</div></div>
    <p class="map-note">Pins are arranged in itinerary order. The blue line is a visual sequence guide and does not represent verified road or walking directions.</p>
    <div id="dailyMapList" class="map-place-list"></div>
    <div class="footer-note">ONE MAP FOR EACH DAY · SELECT A DATE ABOVE</div>`;
  document.querySelectorAll('[data-map-day]').forEach(btn => btn.addEventListener('click', () => {
    currentDay = Number(btn.dataset.mapDay);
    document.querySelectorAll('[data-map-day]').forEach(x => x.classList.toggle('active', x === btn));
    document.getElementById('mapDayHeading').textContent = `DAY ${currentDay} · ${dayCity(currentDay)}`;
    initDayMap(currentDay, 'dailyMap', 'dailyMapList', 'mapPageCount');
  }));
  initDayMap(currentDay, 'dailyMap', 'dailyMapList', 'mapPageCount');
  setNav('map');
}

function initSupabase() {
  const config = window.TRAVEL_SUPABASE_CONFIG || {};
  if (!window.supabase || !config.url || !config.publishableKey) return null;
  try {
    return window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  } catch (error) {
    console.error('Supabase initialization failed:', error);
    return null;
  }
}
function memoFilterLabel(value) { return value === 'all' ? 'All' : `DAY ${value}`; }
function renderMemoPage() {
  currentView = 'memo';
  clearMemoPoller();
  const defaultDay = memoFilter === 'all' ? currentDay : Number(memoFilter);
  app.innerHTML = `
    <div class="memo-page-head"><h1>Memo</h1><button class="memo-add-button" id="showMemoForm" aria-label="Add memo">+</button></div>
    <p class="memo-caption">A shared space for everyone on this trip.</p>
    <div class="memo-filters">
      <button class="memo-filter ${memoFilter === 'all' ? 'active' : ''}" data-memo-filter="all">All</button>
      ${tripData.days.map(d => `<button class="memo-filter ${memoFilter === String(d.day) ? 'active' : ''}" data-memo-filter="${d.day}">DAY ${d.day}</button>`).join('')}
    </div>
    <div id="memoStatus" class="memo-status">Connecting to the shared memo board…</div>
    <section id="memoForm" class="memo-form" hidden>
      <h2>Add a travel memo</h2>
      <form id="memoSubmitForm">
        <div class="memo-form-grid">
          <input id="memoAuthor" maxlength="40" placeholder="Your name" value="" aria-label="Your name" required>
          <select id="memoDay" aria-label="Select a day">${tripData.days.map(d => `<option value="${d.day}" ${d.day === defaultDay ? 'selected' : ''}>DAY ${d.day} · ${dateLine(d.date)}</option>`).join('')}</select>
        </div>
        <input id="memoTitle" maxlength="80" placeholder="Memo title" aria-label="Memo title" required style="margin-top:8px">
        <textarea id="memoBody" maxlength="2000" placeholder="Share a place, reminder, shopping item or booking detail…" aria-label="Memo content" required></textarea>
        <div class="memo-form-actions"><span class="memo-form-hint">Visible to anyone with the shared link.</span><button class="memo-submit" id="memoSubmit" type="submit">Post memo</button></div>
      </form>
    </section>
    <div id="memoList" class="memo-list"><div class="memo-empty">Loading shared notes…</div></div>
    <p class="memo-privacy">Shared-link access is open: visitors can read and add notes. This version does not provide public editing or deletion. Avoid adding private or sensitive information.</p>
    <div class="footer-note">A LITTLE SPACE FOR EVERYONE'S NOTES</div>`;
  document.querySelectorAll('[data-memo-filter]').forEach(btn => btn.addEventListener('click', () => {
    memoFilter = btn.dataset.memoFilter;
    renderMemoPage();
  }));
  document.getElementById('showMemoForm').onclick = () => {
    const form = document.getElementById('memoForm');
    form.hidden = !form.hidden;
    if (!form.hidden) document.getElementById('memoAuthor').focus();
  };
  document.getElementById('memoSubmitForm').addEventListener('submit', submitMemo);
  if (!supa) supa = initSupabase();
  loadMemos();
  memoPoller = window.setInterval(() => {
    if (currentView === 'memo') loadMemos(true);
  }, 15000);
  setNav('memo');
}
function setMemoStatus(message, isError = false) {
  const el = document.getElementById('memoStatus');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('memo-error', isError);
}
function renderMemoRows() {
  const list = document.getElementById('memoList');
  if (!list) return;
  const rows = memoFilter === 'all' ? memoRows : memoRows.filter(row => Number(row.day) === Number(memoFilter));
  if (!rows.length) {
    list.innerHTML = '<div class="memo-empty">No memos yet for this view.<br>Tap the + button to add the first one.</div>';
    return;
  }
  list.innerHTML = rows.map(row => {
    const author = String(row.author || 'Guest').trim();
    return `<article class="memo-card">
      <div class="memo-card-head"><div class="memo-avatar">${esc((author[0] || 'G').toUpperCase())}</div><div class="memo-person"><strong>${esc(author)}</strong><span>${esc(formatMemoDate(row.created_at))}</span></div><span class="memo-day-label">DAY ${Number(row.day)}</span></div>
      <h3>${esc(row.title || 'Travel memo')}</h3><p>${esc(row.body)}</p>
    </article>`;
  }).join('');
}
async function loadMemos(silent = false) {
  if (!supa) {
    setMemoStatus('Supabase client is unavailable. Check your internet connection and config.js.', true);
    const list = document.getElementById('memoList');
    if (list) list.innerHTML = '<div class="memo-empty">The shared memo board could not connect.</div>';
    return;
  }
  if (!silent) setMemoStatus('Connecting to the shared memo board…');
  try {
    const { data, error } = await supa.from(SUPABASE_TABLE).select('id,day,author,title,body,created_at').order('created_at', { ascending: false }).limit(200);
    if (error) throw error;
    memoRows = data || [];
    setMemoStatus('Connected · New notes sync automatically for everyone about every 15 seconds.');
    renderMemoRows();
  } catch (error) {
    console.error('Loading memos failed:', error);
    setMemoStatus('The memo table is not ready yet. Run SUPABASE_SETUP.sql in Supabase SQL Editor, then refresh this page. Details: ' + (error.message || 'Connection error'), true);
    const list = document.getElementById('memoList');
    if (list && !silent) list.innerHTML = '<div class="memo-empty">The shared memo board is waiting for its Supabase table setup.</div>';
  }
}
async function submitMemo(event) {
  event.preventDefault();
  if (!supa) {
    setMemoStatus('Cannot connect to Supabase. Check config.js and reload.', true);
    return;
  }
  const author = document.getElementById('memoAuthor').value.trim();
  const day = Number(document.getElementById('memoDay').value);
  const title = document.getElementById('memoTitle').value.trim();
  const body = document.getElementById('memoBody').value.trim();
  if (!author || !title || !body) {
    setMemoStatus('Please complete your name, title and memo.', true);
    return;
  }
  const submit = document.getElementById('memoSubmit');
  submit.disabled = true;
  submit.textContent = 'Posting…';
  try {
    const { error } = await supa.from(SUPABASE_TABLE).insert([{ day, author, title, body }]);
    if (error) throw error;
    document.getElementById('memoSubmitForm').reset();
    document.getElementById('memoDay').value = String(day);
    document.getElementById('memoForm').hidden = true;
    setMemoStatus('Your memo has been posted and shared.');
    await loadMemos(true);
  } catch (error) {
    console.error('Posting memo failed:', error);
    setMemoStatus('Could not post the memo. Check that SUPABASE_SETUP.sql has been run and the insert policy is active. Details: ' + (error.message || 'Connection error'), true);
  } finally {
    submit.disabled = false;
    submit.textContent = 'Post memo';
  }
}

// Navigation and app startup

document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.nav)));
document.getElementById('brandHome').addEventListener('click', () => navigate('home'));
document.getElementById('topHome').addEventListener('click', () => navigate('home'));

fetch('itinerary.json', { cache: 'no-store' })
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then(data => {
    tripData = data;
    renderHome();
  })
  .catch(error => {
    console.error('Could not load itinerary.json:', error);
    app.innerHTML = '<div class="memo-empty" style="margin-top:50px">We could not load the itinerary data. Make sure index.html, app.js and itinerary.json are all uploaded to the repository root.</div>';
  });
