import { useMemo, useRef } from "react";
import { useOffers } from "../context/OffersContext";
import {
  FEED_AD_PARTNER_URL_DEFAULT,
  getOfferByTrigger,
} from "../offers/offers";
import { AdOfferBottomBar } from "./AdOfferBottomBar";
import { FeedOfferPassThrough } from "./FeedOfferPassThrough";
import { useAdOfferSkipState } from "../hooks/useAdOfferSkipState";
import "./FeedOfferCard.css";

const SKIP_SECONDS = 15;

function labelModifier(uiLabel) {
  if (uiLabel === "Free reward") return "free-reward";
  if (uiLabel === "Bonus") return "bonus";
  return "sponsored";
}

/**
 * @param {{ feedSlot: number, feedItemKey: string, onDismiss: () => void }} props
 */
export function FeedOfferCard({ feedSlot, feedItemKey, onDismiss }) {
  const { applyOfferReward, openShop } = useOffers();
  const rewardClaimedRef = useRef(false);

  const offer = useMemo(
    () => getOfferByTrigger("feed_ad", feedSlot, feedItemKey),
    [feedSlot, feedItemKey]
  );

  const partnerUrl = offer.partnerUrl ?? FEED_AD_PARTNER_URL_DEFAULT;

  const { secondsLeft, canSkip } = useAdOfferSkipState(
    feedItemKey,
    SKIP_SECONDS,
    offer.feedPlacement === "pass_through"
  );

  function handleClaim() {
    if (!rewardClaimedRef.current) {
      rewardClaimedRef.current = true;
      applyOfferReward(offer);
    }
    window.open(partnerUrl, "_blank", "noopener,noreferrer");
  }

  function handleNoAds() {
    openShop("energy");
  }

  if (offer.feedPlacement === "pass_through") {
    return (
      <section
        className="feed-offer feed-offer--pass-through"
        aria-label="Рекламное предложение"
      >
        <FeedOfferPassThrough offer={offer} />
      </section>
    );
  }

  return (
    <section className="feed-offer" aria-label="Рекламное предложение">
      <div className="feed-offer__body">
        <span
          className={`feed-offer__label feed-offer__label--${labelModifier(offer.uiLabel)}`}
        >
          {offer.uiLabel}
        </span>
        <h3 className="feed-offer__title">{offer.title}</h3>
        <p className="feed-offer__desc">{offer.description}</p>
      </div>

      <AdOfferBottomBar
        secondsLeft={secondsLeft}
        canSkip={canSkip}
        onNoAds={handleNoAds}
        onClaim={handleClaim}
        onDismiss={onDismiss}
      />
    </section>
  );
}
