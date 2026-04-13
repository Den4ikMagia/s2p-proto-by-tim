import { useOffers } from "../context/OffersContext";
import { FEED_AD_PARTNER_URL_DEFAULT } from "../offers/offers";
import "./FortuneWheelOfferModal.css";

const DEFAULT_STATS = [
  { value: "—", label: "БОНУС" },
  { value: "—", label: "ЛИМИТ" },
  { value: "—", label: "ВЕЙДЖЕР" },
];

/**
 * @param {{ offer: object, onClose: () => void }} props
 */
export function FortuneWheelOfferModal({ offer, onClose }) {
  const { applyOfferReward } = useOffers();
  const partnerUrl = offer.brand_url ?? FEED_AD_PARTNER_URL_DEFAULT;
  const stats =
    Array.isArray(offer.fortune_stats) && offer.fortune_stats.length === 3
      ? offer.fortune_stats
      : DEFAULT_STATS;
  const ctaColor = offer.background_color ?? "#64C800";

  function handleCta() {
    applyOfferReward({
      id: `fortune-${offer.id}`,
      kind: "betting",
      uiLabel: "Bonus",
      title: offer.title,
      description: offer.description,
      cta: offer.cta_text,
      rewardType: "coins",
      rewardValue: 25,
      partnerUrl,
    });
    window.open(partnerUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="fortune-offer-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fortune-offer-title"
    >
      <div className="fortune-offer-modal__backdrop" aria-hidden />
      <div className="fortune-offer-modal__card">
        <button
          type="button"
          className="fortune-offer-modal__close"
          aria-label="Закрыть"
          onClick={onClose}
        >
          ×
        </button>

        <div className="fortune-offer-modal__banner">
          <img
            src={offer.image}
            alt=""
            className="fortune-offer-modal__banner-img"
            loading="eager"
            decoding="async"
          />
        </div>

        <h2 id="fortune-offer-title" className="fortune-offer-modal__headline">
          {offer.description}
        </h2>

        <div className="fortune-offer-modal__stats">
          {stats.map((s, i) => (
            <div key={i} className="fortune-offer-modal__stat">
              <span className="fortune-offer-modal__stat-val">{s.value}</span>
              <span className="fortune-offer-modal__stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="fortune-offer-modal__cta"
          style={{ backgroundColor: ctaColor, color: "#0a0a12" }}
          onClick={handleCta}
        >
          {offer.cta_text}
        </button>

        <p className="fortune-offer-modal__legal">18+</p>
      </div>
    </div>
  );
}
