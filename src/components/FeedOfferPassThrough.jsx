import { useRef } from "react";
import { useOffers } from "../context/OffersContext";
import { FEED_AD_PARTNER_URL_DEFAULT } from "../offers/offers";
import "./FeedOfferPassThrough.css";

/**
 * Пропускной плейсмент: карточка партнёра по центру, PLAY NOW + NO ADS, без skip/таймера.
 *
 * @param {{ offer: { cta?: string, partnerUrl?: string, rewardType: string, rewardValue: number, brandImageUrl?: string, brandImageAlt?: string, brandLogoUrl?: string, backgroundColor?: string, passThroughWelcomeLabel?: string, passThroughHeadline?: string, passThroughRatingScore?: string } }} props
 */
export function FeedOfferPassThrough({ offer }) {
  const { applyOfferReward, openShop } = useOffers();
  const rewardClaimedRef = useRef(false);

  const partnerUrl = offer.partnerUrl ?? FEED_AD_PARTNER_URL_DEFAULT;
  const brandImageUrl = offer.brandImageUrl;
  const brandLogoUrl = offer.brandLogoUrl;
  const bg = offer.backgroundColor;

  const sectionStyle =
    bg != null && bg !== ""
      ? {
          background: `linear-gradient(180deg, ${bg}33 0%, #050508 55%)`,
        }
      : undefined;

  function handlePlayNow() {
    if (!rewardClaimedRef.current) {
      rewardClaimedRef.current = true;
      applyOfferReward(offer);
    }
    window.open(partnerUrl, "_blank", "noopener,noreferrer");
  }

  function handleNoAds() {
    openShop("energy");
  }

  return (
    <section
      className="feed-offer-pass"
      aria-label="Рекламное предложение"
      style={sectionStyle}
    >
      <div className="feed-offer-pass__center">
        <div className="feed-offer-pass__brand-slot">
          {brandLogoUrl ? (
            <img
              className="feed-offer-pass__logo"
              src={brandLogoUrl}
              alt=""
              loading="lazy"
              decoding="async"
            />
          ) : null}
          {brandImageUrl ? (
            <img
              className="feed-offer-pass__brand-img"
              src={brandImageUrl}
              alt={offer.brandImageAlt ?? ""}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="feed-offer-pass__brand feed-offer-pass__brand--fallback">
              <div className="feed-offer-pass__orbit" aria-hidden>
                <span className="feed-offer-pass__star feed-offer-pass__star--1">★</span>
                <span className="feed-offer-pass__star feed-offer-pass__star--2">★</span>
                <span className="feed-offer-pass__star feed-offer-pass__star--3">★</span>
              </div>
              <h2 className="feed-offer-pass__logo">SPORTUNA</h2>
            </div>
          )}
        </div>

        <div className="feed-offer-pass__rating">
          <span className="feed-offer-pass__rating-icon" aria-hidden>
            ★
          </span>
          <span className="feed-offer-pass__rating-text">
            Rating:{" "}
            <strong>{offer.passThroughRatingScore ?? "9.83"}/10</strong>{" "}
            Excellent
          </span>
        </div>

        <div className="feed-offer-pass__card">
          <div className="feed-offer-pass__gift" aria-hidden>
            <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
              <path
                fill="#a855f7"
                d="M8 18h32v22a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V18Z"
              />
              <path
                fill="#c084fc"
                d="M4 12h40v10H4V12Z"
              />
              <path
                fill="#7e22ce"
                d="M18 12c0-4 3-8 6-8s6 4 6 8H18Z"
              />
            </svg>
          </div>
          <div className="feed-offer-pass__card-text">
            <p className="feed-offer-pass__card-label">
              {offer.passThroughWelcomeLabel ?? "Welcome offer"}
            </p>
            <p className="feed-offer-pass__card-headline">
              {offer.passThroughHeadline ??
                "225% up to €3000 + 250 Free Spins"}
            </p>
          </div>
        </div>
      </div>

      <div className="feed-offer-pass__footer">
        <button
          type="button"
          className="feed-offer-pass__no-ads"
          onClick={handleNoAds}
        >
          NO ADS
        </button>
        <button
          type="button"
          className="feed-offer-pass__play"
          onClick={handlePlayNow}
        >
          {offer.cta ?? "PLAY NOW"}
        </button>
      </div>
    </section>
  );
}
