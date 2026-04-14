import { useCallback, useEffect, useMemo, useState } from "react";
import { OffersProvider, useOffers } from "./context/OffersContext";
import { ShopModal } from "./components/ShopModal";
import { CoinWinFlyover } from "./components/CoinWinFlyover";
import { LoseFeedbackOverlay } from "./components/LoseFeedbackOverlay";
import { DailyBonusModal } from "./components/DailyBonusModal";
import { FortuneWheelOfferModal } from "./components/FortuneWheelOfferModal";
import { LevelProgressSpinModal } from "./components/LevelProgressSpinModal";
import { LEVEL_SPIN_CONFIG } from "./data/levelSpinMock";
import { VideoFeed } from "./components/VideoFeed";
import { OFFER_CARDS_MOCK } from "./data/offerCardsMock";
import StoreIcon from "mdi-react/StoreIcon";
import GiftIcon from "mdi-react/GiftIcon";
import AccountMultiplePlusIcon from "mdi-react/AccountMultiplePlusIcon";
import ChevronRightIcon from "mdi-react/ChevronRightIcon";
import VolumeHighIcon from "mdi-react/VolumeHighIcon";
import VibrationIcon from "mdi-react/VibrationIcon";
import FlashIcon from "mdi-react/FlashIcon";
import EmailOutlineIcon from "mdi-react/EmailOutlineIcon";
import KeyboardBackspaceIcon from "mdi-react/KeyboardBackspaceIcon";
import {
  PROTOTYPE_VIDEOS,
  buildFeedItems,
  injectEnergyPaywallAfterVideo,
} from "./constants/videos";
import { publicUrl } from "./publicUrl";
import {
  getInvitedFriendsCount,
  getTelegramUserProfile,
  incrementInvitedFriendsCount,
  isSoundEnabled,
  isVibroEnabled,
  setSoundEnabled,
  setVibroEnabled,
  shareInviteLink,
} from "./telegram";
import "./App.css";

const MAX_ENERGY_DISPLAY = 60;

function expandVideos(count = 15) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const b = PROTOTYPE_VIDEOS[i % PROTOTYPE_VIDEOS.length];
    out.push({ ...b, id: `${b.id}-slot-${i}` });
  }
  return out;
}

function BonusOfferListModal({ open, onClose }) {
  const [selectedOffer, setSelectedOffer] = useState(null);

  if (!open) return null;
  if (selectedOffer) {
    return (
      <FortuneWheelOfferModal
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
      />
    );
  }

  return (
    <div className="bonus-offers-modal" role="dialog" aria-modal="true">
      <button
        type="button"
        className="bonus-offers-modal__backdrop"
        aria-label="Закрыть бонусы"
        onClick={onClose}
      />
      <div className="bonus-offers-modal__sheet">
        <div className="bonus-offers-modal__head">
          <h3 className="bonus-offers-modal__title">Бонусы</h3>
          <button
            type="button"
            className="bonus-offers-modal__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <div className="bonus-offers-modal__list">
          {OFFER_CARDS_MOCK.map((card, index) => {
            const stars = Math.max(1, Math.min(5, Math.round(Number(card.rating) / 2)));
            return (
            <article
              key={card.id}
              className="bonus-offers-modal__item"
            >
              <span className="bonus-offers-modal__rank" aria-label={`Оффер ${index + 1}`}>
                {index + 1}
              </span>
              <img src={card.logo} alt="" width={34} height={34} />
              <span className="bonus-offers-modal__item-text">
                <strong>{card.title}</strong>
                <small>{card.description}</small>
                <span className="bonus-offers-modal__stars" aria-label={`Рейтинг ${card.rating} из 10`}>
                  {"★".repeat(stars)}
                  <span className="bonus-offers-modal__stars-dim">{"★".repeat(5 - stars)}</span>
                </span>
              </span>
              <button
                type="button"
                className="bonus-offers-modal__item-cta"
                onClick={() => setSelectedOffer(card)}
              >
                {card.cta_text}
              </button>
            </article>
          )})}
        </div>
      </div>
    </div>
  );
}

function BurgerDrawer({
  open,
  onClose,
  onOpenShop,
  onOpenBonuses,
  level,
  energy,
  coins,
  formatNum,
}) {
  const profile = useMemo(() => getTelegramUserProfile(), []);
  const [friendsInvited, setFriendsInvited] = useState(getInvitedFriendsCount);
  const [soundOn, setSoundOnState] = useState(isSoundEnabled);
  const [vibroOn, setVibroOnState] = useState(isVibroEnabled);
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  function handleInviteClick() {
    shareInviteLink();
    setFriendsInvited(incrementInvitedFriendsCount());
  }

  function handleToggleSound() {
    const next = !soundOn;
    setSoundOnState(next);
    setSoundEnabled(next);
  }

  function handleToggleVibro() {
    const next = !vibroOn;
    setVibroOnState(next);
    setVibroEnabled(next);
  }

  return (
    <div className={`drawer${open ? " drawer--open" : ""}`} aria-hidden={!open}>
      <button
        type="button"
        className="drawer__backdrop"
        onClick={onClose}
        aria-label="Закрыть меню"
      />
      <aside className="drawer__panel" role="dialog" aria-modal="true">
        <div className="drawer__header">
          <div className="drawer__avatar-wrap">
            {profile.avatarUrl && !avatarFailed ? (
              <img
                src={profile.avatarUrl}
                alt="Аватар"
                className="drawer__avatar"
                onError={() => setAvatarFailed(true)}
              />
            ) : (
              <div className="drawer__avatar drawer__avatar--fallback" aria-hidden>
                {profile.fullName.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="drawer__user-meta">
            <div className="drawer__username">{profile.username}</div>
            <div className="drawer__level">Уровень {level}</div>
          </div>
        </div>

        <div className="drawer__badge-row">
          <div className="app-shell__energy-pill">
            <span className="app-shell__energy-inner">
              <span className="app-shell__energy-text">{energy}/{MAX_ENERGY_DISPLAY}</span>
              <span className="app-shell__energy-icon" aria-hidden>
                <FlashIcon size={14} />
              </span>
            </span>
          </div>
          <div className="app-shell__coins">
            <img
              src={publicUrl("coin-fly.png")}
              alt=""
              className="app-shell__coin-icon"
              width={22}
              height={22}
              draggable={false}
            />
            <span className="app-shell__coins-val">{formatNum(coins)}</span>
          </div>
        </div>

        <div className="drawer__section drawer__section--menu">
          <button
            type="button"
            className="drawer__menu-btn"
            onClick={() => onOpenShop("coins")}
          >
            <span className="drawer__menu-btn-left">
              <StoreIcon size={18} />
              <span>МАГАЗИН</span>
            </span>
            <ChevronRightIcon size={20} />
          </button>
          <button
            type="button"
            className="drawer__menu-btn"
            onClick={onOpenBonuses}
          >
            <span className="drawer__menu-btn-left">
              <GiftIcon size={18} />
              <span>БОНУСЫ</span>
            </span>
            <ChevronRightIcon size={20} />
          </button>
          <button
            type="button"
            className="drawer__menu-btn"
            onClick={handleInviteClick}
          >
            <span className="drawer__menu-btn-left">
              <AccountMultiplePlusIcon size={18} />
              <span>ПОЗВАТЬ ДРУЗЕЙ</span>
            </span>
            <span className="drawer__invite-count">{friendsInvited}</span>
          </button>
        </div>

        <div className="drawer__section drawer__section--toggles">
          <label className="drawer__toggle-row">
            <span className="drawer__toggle-left">
              <VolumeHighIcon size={18} />
              <span>Звук</span>
            </span>
            <span className={`drawer__toggle${soundOn ? " drawer__toggle--on" : ""}`}>
              <input type="checkbox" checked={soundOn} onChange={handleToggleSound} />
              <span className="drawer__toggle-thumb" />
            </span>
          </label>
          <label className="drawer__toggle-row">
            <span className="drawer__toggle-left">
              <VibrationIcon size={18} />
              <span>Вибро</span>
            </span>
            <span className={`drawer__toggle${vibroOn ? " drawer__toggle--on" : ""}`}>
              <input type="checkbox" checked={vibroOn} onChange={handleToggleVibro} />
              <span className="drawer__toggle-thumb" />
            </span>
          </label>
        </div>

        <a
          className="drawer__contact"
          href="https://t.me/battleme_support"
          target="_blank"
          rel="noopener noreferrer"
        >
          <EmailOutlineIcon size={16} />
          Contact Us
        </a>
      </aside>
    </div>
  );
}

function AppShell() {
  const {
    energy,
    coins,
    setCoins,
    openShop,
    activeFeedItemKey,
    coinWinFx,
    clearCoinWinFx,
    loseFxRunId,
    clearLoseFx,
    energyPaywallInsertAfterVideoId,
  } = useOffers();

  const baseFeedItems = useMemo(
    () => buildFeedItems(expandVideos(20)),
    []
  );

  const items = useMemo(
    () =>
      injectEnergyPaywallAfterVideo(
        baseFeedItems,
        energyPaywallInsertAfterVideoId
      ),
    [baseFeedItems, energyPaywallInsertAfterVideoId]
  );

  const isSponsoredVideoActive = Boolean(
    activeFeedItemKey?.startsWith("sponsored_video:") ||
      activeFeedItemKey?.startsWith("energy_paywall:") ||
      activeFeedItemKey?.startsWith("fortune_wheel:")
  );

  const [coinBalancePulse, setCoinBalancePulse] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bonusesOpen, setBonusesOpen] = useState(false);
  const [levelSpinOpen, setLevelSpinOpen] = useState(false);

  const handleCoinsFlyStart = useCallback(() => {
    setCoinBalancePulse(true);
    window.setTimeout(() => setCoinBalancePulse(false), 480);
  }, []);

  function formatNum(n) {
    return new Intl.NumberFormat("ru-RU").format(n);
  }

  const level = Math.max(1, Math.floor(coins / 1000) + 1);

  return (
    <div
      className={`app-shell${isSponsoredVideoActive ? " app-shell--sponsored-video-active" : ""}`}
    >
      {levelSpinOpen ? (
        <LevelProgressSpinModal
          coins={coins}
          energy={energy}
          onSpendCoins={(amount) => setCoins((c) => Math.max(0, c - amount))}
          onRefundCoins={(amount) => setCoins((c) => c + amount)}
        />
      ) : (
        <>
          <VideoFeed items={items} />
          <button
            type="button"
            className="app-shell__level-spin-entry"
            onClick={() => setLevelSpinOpen(true)}
          >
            <span>🎡 Level Spin</span>
            <small>
              spins: {Math.floor(coins / LEVEL_SPIN_CONFIG.SpinCost)}
            </small>
          </button>
        </>
      )}

      <header className="app-shell__hud app-shell__hud--top">
        <div className="app-shell__topbar">
          <button
            type="button"
            className="app-shell__menu"
            aria-label={levelSpinOpen ? "Back" : "Меню"}
            onClick={() => {
              if (levelSpinOpen) {
                setLevelSpinOpen(false);
                return;
              }
              setDrawerOpen(true);
            }}
          >
            {levelSpinOpen ? (
              <KeyboardBackspaceIcon size={18} aria-hidden />
            ) : (
              <span className="app-shell__menu-lines" />
            )}
          </button>
          <div className="app-shell__energy-pill">
            <span className="app-shell__energy-inner">
              <span className="app-shell__energy-text">
                {energy}/{MAX_ENERGY_DISPLAY}
              </span>
              <span className="app-shell__energy-icon" aria-hidden>
                <FlashIcon size={14} />
              </span>
            </span>
          </div>
          <div className="app-shell__coins-wrap">
            <div className="app-shell__coins">
              <img
                src={publicUrl("coin-fly.png")}
                alt=""
                className="app-shell__coin-icon"
                width={22}
                height={22}
                draggable={false}
              />
              <span
                className={`app-shell__coins-val${coinBalancePulse ? " app-shell__coins-val--pulse" : ""}`}
              >
                {formatNum(coins)}
              </span>
            </div>
            <button
              type="button"
              className="app-shell__shop-plus"
              aria-label="Магазин"
              onClick={() => openShop("coins")}
            >
              +
            </button>
          </div>
        </div>
      </header>

      <BurgerDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenShop={(tab) => {
          openShop(tab);
          setDrawerOpen(false);
        }}
        onOpenBonuses={() => {
          setBonusesOpen(true);
          setDrawerOpen(false);
        }}
        level={level}
        energy={energy}
        coins={coins}
        formatNum={formatNum}
      />
      <BonusOfferListModal open={bonusesOpen} onClose={() => setBonusesOpen(false)} />
      {coinWinFx ? (
        <CoinWinFlyover
          amount={coinWinFx.amount}
          runId={coinWinFx.runId}
          onComplete={clearCoinWinFx}
          onCoinsFlyStart={handleCoinsFlyStart}
        />
      ) : null}

      {loseFxRunId != null ? (
        <LoseFeedbackOverlay runId={loseFxRunId} onComplete={clearLoseFx} />
      ) : null}

      <DailyBonusModal />
      <ShopModal />
    </div>
  );
}

export default function App() {
  return (
    <OffersProvider>
      <AppShell />
    </OffersProvider>
  );
}
