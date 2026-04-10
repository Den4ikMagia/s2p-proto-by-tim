/**
 * ?mock=1 — старый демо-ролик без сети.
 * ?prototype=1 — только прототипные ролики (без API).
 * Иначе: API; при ошибке — лента из PROTOTYPE_VIDEOS.
 * Без CORS: npm run dev → относительный /api
 */
const MOCK_VIDEOS = [
  {
    id: "v1",
    src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    poster: "",
  },
];

const PROTOTYPE_VIDEOS = [
  {
    id: "p1",
    src: "https://battleme.s3.eu-north-1.amazonaws.com/scroll_games/0040_3.mp4",
  },
  {
    id: "p2",
    src: "https://battleme.s3.eu-north-1.amazonaws.com/scroll_games/scroll_game_0115.mp4",
  },
  {
    id: "p3",
    src: "https://battleme.s3.eu-north-1.amazonaws.com/scroll_games/0048_4.mp4",
  },
];

const MAX_ENERGY = 100;
const MAX_ENERGY_PROTOTYPE = 60;

const qs = new URLSearchParams(window.location.search);
const USE_MOCK = qs.get("mock") === "1";
const USE_PROTOTYPE_ONLY = qs.get("prototype") === "1";
const DEFAULT_API_BASE = "https://ttscrollnplay.dhvcc.me";
const DEV_PROXY_PORT = "8787";

let prototypeMode = false;

function isLikelyDevProxyOrigin() {
  if (location.port === DEV_PROXY_PORT) return true;
  const h = location.hostname;
  if (/\.trycloudflare\.com$/i.test(h)) return true;
  if (/\.ngrok-free\.app$/i.test(h)) return true;
  if (/\.ngrok\.io$/i.test(h)) return true;
  return false;
}

const API_BASE = (() => {
  if (qs.has("api")) return (qs.get("api") || "").replace(/\/$/, "");
  if (isLikelyDevProxyOrigin()) return "";
  return DEFAULT_API_BASE.replace(/\/$/, "");
})();

function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

function getMaxEnergy() {
  return prototypeMode ? MAX_ENERGY_PROTOTYPE : MAX_ENERGY;
}

const state = {
  balance: 1250,
  energy: MAX_ENERGY,
  protoExtra: 1454,
};

let activeSlideEl = null;
let lastSlideLoadObserver = null;
let loadingMore = false;
let uiBound = false;
let feedScrollBound = false;
let prototypeAppendSeq = 0;

function applyQueryParams() {
  const e = qs.get("energy");
  const b = qs.get("balance");
  const cap = getMaxEnergy();
  if (e !== null && e !== "") {
    const n = Number(e);
    if (!Number.isNaN(n)) state.energy = Math.max(0, Math.min(cap, n));
  }
  if (b !== null && b !== "") {
    const n = Number(b);
    if (!Number.isNaN(n)) state.balance = Math.max(0, Math.round(n));
  }
}

function applyPrototypeDefaults() {
  state.balance = 30800000;
  state.energy = MAX_ENERGY_PROTOTYPE;
  state.protoExtra = 1454;
}

const els = {
  feed: document.getElementById("feed"),
  balance: document.getElementById("balance"),
  energyRatio: document.getElementById("energyRatio"),
  energyExtraWrap: document.getElementById("energyExtraWrap"),
  energyExtra: document.getElementById("energyExtra"),
  betLow: document.getElementById("betLow"),
  betHigh: document.getElementById("betHigh"),
  classicBetRow: document.getElementById("classicBetRow"),
  gameBetRow: document.getElementById("gameBetRow"),
  modal: document.getElementById("energyModal"),
  modalBackdrop: document.getElementById("energyModalBackdrop"),
  energyOfferBtn: document.getElementById("energyOfferBtn"),
  energyModalClose: document.getElementById("energyModalClose"),
};

function formatBalance(n) {
  return new Intl.NumberFormat("ru-RU").format(n);
}

function renderHud() {
  const max = getMaxEnergy();
  state.energy = Math.min(state.energy, max);
  els.balance.textContent = formatBalance(state.balance);
  els.energyRatio.textContent = `${state.energy}/${max}`;
  if (prototypeMode) {
    els.energyExtraWrap.hidden = false;
    els.energyExtra.textContent = `+${formatBalance(state.protoExtra)} extra`;
  } else {
    els.energyExtraWrap.hidden = true;
  }
  const disabled = state.energy <= 0;
  els.betLow.disabled = disabled;
  els.betHigh.disabled = disabled;
  els.gameBetRow.querySelectorAll(".btn-game").forEach((btn) => {
    btn.disabled = disabled;
  });
}

function showEnergyModal() {
  els.modal.hidden = false;
}

function hideEnergyModal() {
  els.modal.hidden = true;
}

function maybeShowEnergyPopup() {
  if (state.energy <= 0) {
    showEnergyModal();
  }
}

function applyBet(multiplierKey) {
  const cost = multiplierKey === "high" ? 25 : 5;
  const mult = multiplierKey === "high" ? 10 : 2;

  if (state.energy < cost) {
    state.energy = 0;
    renderHud();
    maybeShowEnergyPopup();
    return;
  }

  state.energy -= cost;
  const win = Math.random() < 0.45;
  if (win) {
    state.balance += Math.round(10 * mult * (0.8 + Math.random() * 0.4));
  }
  renderHud();
  maybeShowEnergyPopup();
}

function applyGameBet() {
  const cost = 5;
  if (state.energy < cost) {
    state.energy = 0;
    renderHud();
    maybeShowEnergyPopup();
    return;
  }
  state.energy -= cost;
  if (Math.random() < 0.45) {
    state.balance += Math.round(10 * (0.8 + Math.random() * 0.4));
  }
  renderHud();
  maybeShowEnergyPopup();
}

function initTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
  if (tg.setHeaderColor) tg.setHeaderColor("#000000");
  if (tg.setBackgroundColor) tg.setBackgroundColor("#000000");
}

function eventTime(episode, name) {
  const ev = episode?.events?.find((x) => x.name === name);
  return ev == null ? NaN : Number(ev.timeSeconds);
}

function getEpisodeAtTime(episodes, t) {
  if (!episodes?.length) return null;
  const sorted = [...episodes].sort(
    (a, b) => eventTime(a, "EpisodeStart") - eventTime(b, "EpisodeStart")
  );
  for (let i = 0; i < sorted.length; i++) {
    const start = eventTime(sorted[i], "EpisodeStart");
    const nextStart =
      i + 1 < sorted.length ? eventTime(sorted[i + 1], "EpisodeStart") : Infinity;
    if (!Number.isNaN(start) && t >= start && t < nextStart) return sorted[i];
  }
  return null;
}

function isInBetSpot(episode, t) {
  const on = eventTime(episode, "BetSpotOn");
  const off = eventTime(episode, "BetSpotOff");
  if (Number.isNaN(on) || Number.isNaN(off)) return false;
  return t >= on && t <= off;
}

function updateActiveSlide() {
  const feed = els.feed;
  const center = feed.scrollTop + feed.clientHeight / 2;
  let best = null;
  let bestDist = Infinity;
  feed.querySelectorAll(".slide").forEach((slide) => {
    const mid = slide.offsetTop + slide.offsetHeight / 2;
    const dist = Math.abs(mid - center);
    if (dist < bestDist) {
      bestDist = dist;
      best = slide;
    }
  });
  activeSlideEl = best;
}

function setFooterMode(mode) {
  if (mode === "game") {
    els.classicBetRow.hidden = true;
    els.gameBetRow.hidden = false;
  } else {
    els.classicBetRow.hidden = false;
    els.gameBetRow.hidden = true;
    els.gameBetRow.innerHTML = "";
  }
}

function renderGameButtons(buttons) {
  els.gameBetRow.innerHTML = "";
  for (const b of buttons) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-game";
    btn.dataset.gameBtnId = String(b.id);
    if (b.color) btn.style.borderColor = b.color;

    if (b.imageUrl) {
      const img = document.createElement("img");
      img.className = "btn-game__img";
      img.alt = b.text || "";
      img.src = b.imageUrl;
      img.loading = "lazy";
      btn.appendChild(img);
    }
    const label = document.createElement("span");
    label.textContent = b.text || "";
    btn.appendChild(label);
    btn.disabled = state.energy <= 0;
    els.gameBetRow.appendChild(btn);
  }
}

function syncFooterForSlide(slide) {
  if (!slide || !slide._payload?.episodes?.length) {
    delete els.gameBetRow.dataset.episodeId;
    setFooterMode("classic");
    renderHud();
    return;
  }
  const video = slide.querySelector("video.slide__media");
  if (!video) return;
  const t = video.currentTime;
  const ep = getEpisodeAtTime(slide._payload.episodes, t);
  const inSpot = ep && isInBetSpot(ep, t) && ep.buttons?.length;

  if (inSpot) {
    if (els.gameBetRow.dataset.episodeId !== ep.id) {
      els.gameBetRow.dataset.episodeId = ep.id;
      renderGameButtons(ep.buttons);
    }
    setFooterMode("game");
  } else {
    delete els.gameBetRow.dataset.episodeId;
    setFooterMode("classic");
  }
  renderHud();
}

function onVideoTimeUpdate(e) {
  const video = e.target;
  const slide = video.closest(".slide");
  if (!slide || slide !== activeSlideEl) return;
  syncFooterForSlide(slide);
}

async function fetchRandomVideo() {
  const res = await fetch(apiUrl("/api/videos/random"), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function applyEnergyFromApi(data) {
  if (data && typeof data.energy === "number" && !Number.isNaN(data.energy)) {
    const cap = getMaxEnergy();
    state.energy = Math.max(0, Math.min(cap, Math.round(data.energy)));
  }
}

function createSlideFromPayload(payload) {
  const slide = document.createElement("section");
  slide.className = "slide";
  slide._payload = payload;

  const video = document.createElement("video");
  video.className = "slide__media";
  video.src = payload.videoUrl;
  video.playsInline = true;
  video.loop = true;
  video.muted = true;
  if (payload.thumbnailUrl) video.poster = payload.thumbnailUrl;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.addEventListener("timeupdate", onVideoTimeUpdate);

  const shade = document.createElement("div");
  shade.className = "slide__shade";
  shade.setAttribute("aria-hidden", "true");

  slide.appendChild(video);
  slide.appendChild(shade);
  return slide;
}

function buildSlideRail() {
  const rail = document.createElement("div");
  rail.className = "slide-rail";
  rail.innerHTML = `
    <div class="slide-rail__booster">
      <div class="slide-rail__coin-x">
        <span class="slide-rail__coin" aria-hidden="true"></span>
        <span class="slide-rail__mult-val">x1.2</span>
      </div>
      <div class="slide-rail__track">
        <div class="slide-rail__track-inner">
          <div class="slide-rail__seg" aria-hidden="true"></div>
          <div class="slide-rail__seg" aria-hidden="true"></div>
          <div class="slide-rail__seg slide-rail__seg--fill" aria-hidden="true"></div>
        </div>
      </div>
    </div>`;
  return rail;
}

function createSlidePrototype(item) {
  const slide = document.createElement("section");
  slide.className = "slide";
  slide._payload = null;
  slide._prototype = true;

  const video = document.createElement("video");
  video.className = "slide__media";
  video.src = item.src;
  video.playsInline = true;
  video.loop = true;
  video.muted = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.addEventListener("timeupdate", onVideoTimeUpdate);

  const shade = document.createElement("div");
  shade.className = "slide__shade";
  shade.setAttribute("aria-hidden", "true");

  const rail = buildSlideRail();

  slide.appendChild(video);
  slide.appendChild(shade);
  slide.appendChild(rail);
  return slide;
}

function createSlideMock(item) {
  const slide = document.createElement("section");
  slide.className = "slide";
  slide._payload = null;

  const video = document.createElement("video");
  video.className = "slide__media";
  video.src = item.src;
  video.playsInline = true;
  video.loop = true;
  video.muted = true;
  if (item.poster) video.poster = item.poster;
  video.setAttribute("playsinline", "");
  video.setAttribute("webkit-playsinline", "");
  video.addEventListener("timeupdate", onVideoTimeUpdate);

  const shade = document.createElement("div");
  shade.className = "slide__shade";
  shade.setAttribute("aria-hidden", "true");

  slide.appendChild(video);
  slide.appendChild(shade);
  return slide;
}

let videoIo = null;

function setupVideoPlayback() {
  if (videoIo) videoIo.disconnect();
  const videos = [...els.feed.querySelectorAll("video.slide__media")];
  videoIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const v = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      });
    },
    { root: els.feed, threshold: [0, 0.25, 0.5, 0.6, 0.75, 1] }
  );
  videos.forEach((v) => videoIo.observe(v));
  if (videos[0]) {
    videos[0].play().catch(() => {});
  }
}

function observeLastSlideForMore() {
  if (lastSlideLoadObserver) {
    lastSlideLoadObserver.disconnect();
    lastSlideLoadObserver = null;
  }
  const slides = els.feed.querySelectorAll(".slide");
  const last = slides[slides.length - 1];
  if (!last) return;

  lastSlideLoadObserver = new IntersectionObserver(
    (entries) => {
      const e = entries[0];
      if (e?.isIntersecting && e.intersectionRatio >= 0.45) {
        if (prototypeMode) loadNextPrototypeSlide();
        else loadNextFromApi();
      }
    },
    { root: els.feed, threshold: [0, 0.45, 0.75, 1] }
  );
  lastSlideLoadObserver.observe(last);
}

async function loadNextFromApi() {
  if (USE_MOCK || prototypeMode || loadingMore) return;
  loadingMore = true;
  try {
    const data = await fetchRandomVideo();
    applyEnergyFromApi(data);
    els.feed.appendChild(createSlideFromPayload(data));
    setupVideoPlayback();
    observeLastSlideForMore();
    updateActiveSlide();
    syncFooterForSlide(activeSlideEl);
    renderHud();
  } catch {
    /* ignore */
  } finally {
    loadingMore = false;
  }
}

function loadNextPrototypeSlide() {
  if (!prototypeMode || loadingMore) return;
  loadingMore = true;
  try {
    prototypeAppendSeq += 1;
    const item = PROTOTYPE_VIDEOS[prototypeAppendSeq % PROTOTYPE_VIDEOS.length];
    els.feed.appendChild(createSlidePrototype(item));
    setupVideoPlayback();
    observeLastSlideForMore();
    updateActiveSlide();
    syncFooterForSlide(activeSlideEl);
    renderHud();
  } finally {
    loadingMore = false;
  }
}

function showFeedLoading() {
  let el = document.getElementById("feedLoading");
  if (!el) {
    el = document.createElement("div");
    el.id = "feedLoading";
    el.className = "feed-loading";
    el.textContent = "Загрузка…";
    els.feed.appendChild(el);
  }
  el.hidden = false;
}

function hideFeedLoading() {
  const el = document.getElementById("feedLoading");
  if (el) el.hidden = true;
}

function clearFeedError() {
  const wrap = document.getElementById("feedError");
  if (wrap) wrap.remove();
}

function bootstrapPrototypeFeed() {
  clearFeedError();
  document.body.classList.add("prototype-feed");
  const fragment = document.createDocumentFragment();
  PROTOTYPE_VIDEOS.forEach((item) => fragment.appendChild(createSlidePrototype(item)));
  els.feed.appendChild(fragment);
  setupVideoPlayback();
  observeLastSlideForMore();
  attachFeedScroll();
  updateActiveSlide();
  syncFooterForSlide(activeSlideEl);
  renderHud();
}

async function bootstrap() {
  applyQueryParams();
  initTelegram();

  if (USE_MOCK) {
    const fragment = document.createDocumentFragment();
    MOCK_VIDEOS.forEach((item) => fragment.appendChild(createSlideMock(item)));
    els.feed.appendChild(fragment);
    setupVideoPlayback();
    attachFeedScroll();
    updateActiveSlide();
    renderHud();
    bindUi();
    if (state.energy <= 0) showEnergyModal();
    return;
  }

  if (USE_PROTOTYPE_ONLY) {
    prototypeMode = true;
    applyPrototypeDefaults();
    applyQueryParams();
    bootstrapPrototypeFeed();
    bindUi();
    if (state.energy <= 0) showEnergyModal();
    return;
  }

  clearFeedError();
  showFeedLoading();
  try {
    const data = await fetchRandomVideo();
    applyEnergyFromApi(data);
    els.feed.appendChild(createSlideFromPayload(data));
    clearFeedError();
  } catch {
    hideFeedLoading();
    prototypeMode = true;
    applyPrototypeDefaults();
    applyQueryParams();
    bootstrapPrototypeFeed();
    bindUi();
    if (state.energy <= 0) showEnergyModal();
    return;
  }
  hideFeedLoading();
  setupVideoPlayback();
  observeLastSlideForMore();
  attachFeedScroll();
  updateActiveSlide();
  syncFooterForSlide(activeSlideEl);
  renderHud();
  bindUi();
  if (state.energy <= 0) showEnergyModal();
}

function bindUi() {
  if (uiBound) return;
  uiBound = true;
  els.betLow.addEventListener("click", () => applyBet("low"));
  els.betHigh.addEventListener("click", () => applyBet("high"));

  els.gameBetRow.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-game");
    if (!btn || btn.disabled) return;
    applyGameBet();
  });

  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn) menuBtn.addEventListener("click", () => {});

  const plus = document.getElementById("balancePlusBtn");
  if (plus) plus.addEventListener("click", () => {});

  els.energyOfferBtn.addEventListener("click", () => {
    state.energy = getMaxEnergy();
    renderHud();
    hideEnergyModal();
  });

  els.energyModalClose.addEventListener("click", hideEnergyModal);
  els.modalBackdrop.addEventListener("click", hideEnergyModal);
}

function attachFeedScroll() {
  if (feedScrollBound) return;
  feedScrollBound = true;
  els.feed.addEventListener("scroll", () => {
    updateActiveSlide();
    syncFooterForSlide(activeSlideEl);
  });
}

bootstrap();
