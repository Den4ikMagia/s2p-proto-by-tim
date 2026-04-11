import { useEffect, useState } from "react";
import { useOffers } from "../context/OffersContext";
import { publicUrl } from "../publicUrl";
import "./EnergyPaywallModal.css";

const FREE_ENERGY_SECONDS = 3600; // 1 час

function formatHms(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

const BOOST_ICON_SRC = publicUrl("energy-paywall-boost-icon.png");

/** Полноэкранный контент paywall внутри ленты (без закрытия, без fixed). */
export function EnergyPaywallFeedPanel() {
  const {
    claimPartnerCasinoEnergy,
    purchaseEnergyPack100,
    openShopEnergyTab,
  } = useOffers();

  const [secondsLeft, setSecondsLeft] = useState(FREE_ENERGY_SECONDS);

  useEffect(() => {
    setSecondsLeft(FREE_ENERGY_SECONDS);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setSecondsLeft((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="energy-paywall energy-paywall--feed"
      role="region"
      aria-labelledby="energy-paywall-title"
    >
      <header className="energy-paywall__lead">
        <h1 id="energy-paywall-title" className="energy-paywall__lead-title">
          Энергия закончилась 😢
        </h1>
        <p className="energy-paywall__lead-sub">
          Начисление бесплатной энергии будет через
        </p>
        <div className="energy-paywall__lead-row">
          <time
            className="energy-paywall__lead-timer"
            dateTime={`PT${Math.floor(secondsLeft / 3600)}H${Math.floor((secondsLeft % 3600) / 60)}M${secondsLeft % 60}S`}
          >
            {formatHms(secondsLeft)}
          </time>
          <img
            className="energy-paywall__lead-icon"
            src={BOOST_ICON_SRC}
            alt=""
            width={72}
            height={72}
          />
        </div>
      </header>

      <p className="energy-paywall__offer-intro">Пока ждёте — спецпредложение:</p>

      <div className="energy-paywall__banner">
        <span className="energy-paywall__ribbon">NEW Casino</span>
        <div className="energy-paywall__brand">
          <span className="energy-paywall__crown" aria-hidden>
            ♔
          </span>
          <p className="energy-paywall__logo" role="presentation">
            KENT
          </p>
        </div>
        <p className="energy-paywall__sub">от создателей Gama · daddy · CAT CASINO</p>
      </div>

      <div className="energy-paywall__stats">
        <div className="energy-paywall__stat">
          <span className="energy-paywall__stat-val">125%</span>
          <span className="energy-paywall__stat-label">на 1-й депозит</span>
        </div>
        <div className="energy-paywall__stat">
          <span className="energy-paywall__stat-val">₽40 000</span>
          <span className="energy-paywall__stat-label">макс бонус</span>
        </div>
        <div className="energy-paywall__stat">
          <span className="energy-paywall__stat-val">125</span>
          <span className="energy-paywall__stat-label">фриспины</span>
        </div>
        <div className="energy-paywall__stat">
          <span className="energy-paywall__stat-val">×50</span>
          <span className="energy-paywall__stat-label">вейджер</span>
        </div>
      </div>

      <button
        type="button"
        className="energy-paywall__cta energy-paywall__cta--primary"
        onClick={claimPartnerCasinoEnergy}
      >
        Забрать бонус и +35 энергии
      </button>

      <button
        type="button"
        className="energy-paywall__cta energy-paywall__cta--secondary"
        onClick={purchaseEnergyPack100}
      >
        Купить 100 энергии — $1,99
      </button>

      <button type="button" className="energy-paywall__link" onClick={openShopEnergyTab}>
        Открыть магазин энергии
      </button>

      <p className="energy-paywall__legal">18+ | Играйте ответственно</p>
    </div>
  );
}
