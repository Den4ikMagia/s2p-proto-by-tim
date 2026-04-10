import "./AdOfferBottomBar.css";

/**
 * @param {{
 *   secondsLeft: number,
 *   canSkip: boolean,
 *   onNoAds: () => void,
 *   onClaim: () => void,
 *   onDismiss: () => void,
 * }} props
 */
export function AdOfferBottomBar({
  secondsLeft,
  canSkip,
  onNoAds,
  onClaim,
  onDismiss,
}) {
  return (
    <div className="ad-offer-bar">
      <button
        type="button"
        className="ad-offer-bar__btn ad-offer-bar__btn--no-ads"
        onClick={onNoAds}
      >
        NO ADS
      </button>
      <button
        type="button"
        className="ad-offer-bar__btn ad-offer-bar__btn--claim"
        onClick={onClaim}
      >
        ЗАБРАТЬ
      </button>
      <button
        type="button"
        className="ad-offer-bar__btn ad-offer-bar__btn--skip"
        disabled={!canSkip}
        aria-label={canSkip ? "Закрыть рекламу" : undefined}
        onClick={() => canSkip && onDismiss()}
      >
        {canSkip ? "×" : `Skip ${secondsLeft}s`}
      </button>
    </div>
  );
}
