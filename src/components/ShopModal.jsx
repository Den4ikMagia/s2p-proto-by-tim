import { useCallback } from "react";
import { useOffers } from "../context/OffersContext";
import "./ShopModal.css";

export function ShopModal() {
  const {
    shopOpen,
    shopTab,
    setShopTab,
    closeShop,
    setCoins,
    setEnergy,
  } = useOffers();

  const buyEnergyWithCoins = useCallback((cost, delta) => {
    setCoins((c) => {
      if (c < cost) return c;
      setEnergy((e) => e + delta);
      return c - cost;
    });
  }, [setCoins, setEnergy]);

  if (!shopOpen) return null;

  return (
    <div className="shop-modal" role="dialog" aria-modal="true" aria-labelledby="shop-title">
      <button type="button" className="shop-modal__backdrop" aria-label="Закрыть" onClick={closeShop} />
      <div className="shop-modal__sheet" onClick={(e) => e.stopPropagation()}>
        <div className="shop-modal__header">
          <h2 id="shop-title" className="shop-modal__title">
            {shopTab === "coins" ? "BUY COINS" : "BUY ENERGY"}
          </h2>
          <button type="button" className="shop-modal__x" aria-label="Закрыть" onClick={closeShop}>
            ×
          </button>
        </div>

        <div className="shop-modal__tabs">
          <button
            type="button"
            className={`shop-modal__tab${shopTab === "coins" ? " shop-modal__tab--active" : ""}`}
            onClick={() => setShopTab("coins")}
          >
            Coins
          </button>
          <button
            type="button"
            className={`shop-modal__tab${shopTab === "energy" ? " shop-modal__tab--active" : ""}`}
            onClick={() => setShopTab("energy")}
          >
            Energy
          </button>
        </div>

        <div className="shop-modal__body">
          {shopTab === "coins" ? (
            <div className="shop-modal__grid">
              <ShopCard
                badge="20% MORE"
                title="500 coins"
                action="$5,99"
                onBuy={() => setCoins((c) => c + 500)}
              />
              <ShopCard
                badge="40% MORE"
                title="1200 coins"
                action="$11,99"
                onBuy={() => setCoins((c) => c + 1200)}
              />
              <ShopCard
                badge="FREE"
                title="130 coins"
                action="▶ Free"
                highlight
                onBuy={() => setCoins((c) => c + 130)}
              />
              <ShopCard
                title="MEGA 700K"
                action="$116,99"
                wide
                onBuy={() => setCoins((c) => c + 700000)}
              />
            </div>
          ) : (
            <div className="shop-modal__grid">
              <ShopCard
                badge="FREE"
                title="×1 Energy"
                action="▶ Free"
                highlight
                onBuy={() => setEnergy((e) => e + 1)}
              />
              <ShopCard title="×2 Energy" action="16 K" onBuy={() => buyEnergyWithCoins(16_000, 2)} />
              <ShopCard title="×4 Energy" action="24 K" onBuy={() => buyEnergyWithCoins(24_000, 4)} />
              <ShopCard
                badge="Best"
                title="100 Energy"
                action="$1,99"
                highlight
                onBuy={() => setEnergy((e) => e + 100)}
              />
              <ShopCard title="50 Energy" action="$5,99" onBuy={() => setEnergy((e) => e + 50)} />
              <ShopCard title="ENERGY ×200" action="$119,99" wide onBuy={() => setEnergy((e) => e + 200)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ShopCard({ badge, title, action, highlight, wide, onBuy }) {
  return (
    <div className={`shop-card${highlight ? " shop-card--highlight" : ""}${wide ? " shop-card--wide" : ""}`}>
      {badge ? <span className="shop-card__badge">{badge}</span> : null}
      <div className="shop-card__title">{title}</div>
      <button type="button" className="shop-card__btn" onClick={onBuy}>
        {action}
      </button>
    </div>
  );
}
