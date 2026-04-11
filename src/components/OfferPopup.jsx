import { useOffers } from "../context/OffersContext";
import "./OfferPopup.css";

function labelModifier(uiLabel) {
  if (uiLabel === "Free reward") return "free-reward";
  if (uiLabel === "Bonus") return "bonus";
  return "sponsored";
}

/** @type {Record<string, string>} */
const TRIGGER_HEADLINE = {
  energy_paywall: "Get free energy",
  onboarding: "Welcome bonus",
};

export function OfferPopup() {
  const { showOffer, currentOffer, popupTriggerType, closeOffer, claimOffer } =
    useOffers();

  if (!showOffer || !currentOffer) return null;
  if (popupTriggerType === "energy_paywall") return null;

  const headline =
    (popupTriggerType && TRIGGER_HEADLINE[popupTriggerType]) || "";

  const kindClass = `offer-popup__card--${currentOffer.kind}`;

  return (
    <div
      className="offer-popup"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offer-popup-title"
    >
      <button
        type="button"
        className="offer-popup__backdrop"
        aria-label="Закрыть"
        onClick={closeOffer}
      />
      <div
        className={`offer-popup__card ${kindClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="offer-popup__close"
          aria-label="Закрыть"
          onClick={closeOffer}
        >
          ×
        </button>
        <span
          className={`offer-popup__label offer-popup__label--${labelModifier(currentOffer.uiLabel)}`}
        >
          {currentOffer.uiLabel}
        </span>
        {headline ? (
          <p className="offer-popup__trigger">{headline}</p>
        ) : null}
        <h2 id="offer-popup-title" className="offer-popup__title">
          {currentOffer.title}
        </h2>
        <p className="offer-popup__desc">{currentOffer.description}</p>
        <button type="button" className="offer-popup__cta" onClick={claimOffer}>
          {currentOffer.cta}
        </button>
      </div>
    </div>
  );
}
