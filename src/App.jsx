import { useCallback, useMemo, useState } from "react";
import { OffersProvider, useOffers } from "./context/OffersContext";
import { EnergyPaywallModal } from "./components/EnergyPaywallModal";
import { OfferPopup } from "./components/OfferPopup";
import { ShopModal } from "./components/ShopModal";
import { CoinWinFlyover } from "./components/CoinWinFlyover";
import { LoseFeedbackOverlay } from "./components/LoseFeedbackOverlay";
import { VideoFeed } from "./components/VideoFeed";
import { PROTOTYPE_VIDEOS, buildFeedItems } from "./constants/videos";
import { publicUrl } from "./publicUrl";
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

function AppShell() {
  const {
    energy,
    coins,
    openShop,
    activeFeedItemKey,
    coinWinFx,
    clearCoinWinFx,
    loseFxRunId,
    clearLoseFx,
  } = useOffers();

  const items = useMemo(
    () => buildFeedItems(expandVideos(20)),
    []
  );

  const isSponsoredVideoActive = Boolean(
    activeFeedItemKey?.startsWith("sponsored_video:")
  );

  const [coinBalancePulse, setCoinBalancePulse] = useState(false);

  const handleCoinsFlyStart = useCallback(() => {
    setCoinBalancePulse(true);
    window.setTimeout(() => setCoinBalancePulse(false), 480);
  }, []);

  function formatNum(n) {
    return new Intl.NumberFormat("ru-RU").format(n);
  }

  return (
    <div
      className={`app-shell${isSponsoredVideoActive ? " app-shell--sponsored-video-active" : ""}`}
    >
      <VideoFeed items={items} />

      <header className="app-shell__hud app-shell__hud--top">
        <div className="app-shell__topbar">
          <button type="button" className="app-shell__menu" aria-label="Меню">
            <span className="app-shell__menu-lines" />
          </button>
          <div className="app-shell__energy-pill">
            <span className="app-shell__energy-inner">
              <span className="app-shell__energy-text">
                {energy}/{MAX_ENERGY_DISPLAY}
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

      <EnergyPaywallModal />
      <ShopModal />
      <OfferPopup />
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
