import { useCallback, useEffect, useRef } from "react";
import { useOffers } from "../context/OffersContext";
import { FEED_AD_PARTNER_URL_DEFAULT } from "../offers/offers";
import { AdOfferBottomBar } from "./AdOfferBottomBar";
import { useAdOfferSkipState } from "../hooks/useAdOfferSkipState";
import "./SponsoredVideoSlide.css";

const SKIP_SECONDS = 15;

/**
 * @param {{
 *   src: string,
 *   creativeId: string,
 *   feedItemKey: string,
 *   partnerUrl?: string,
 *   claimReward?: { rewardType: 'energy' | 'coins', rewardValue: number },
 *   onDismiss: () => void,
 * }} props
 */
export function SponsoredVideoSlide({
  src,
  creativeId,
  feedItemKey,
  partnerUrl: partnerUrlProp,
  claimReward,
  onDismiss,
}) {
  const { applyOfferReward, openShop } = useOffers();
  const videoRef = useRef(null);
  const rewardClaimedRef = useRef(false);
  const { secondsLeft, canSkip } = useAdOfferSkipState(feedItemKey, SKIP_SECONDS);

  const partnerUrl = partnerUrlProp ?? FEED_AD_PARTNER_URL_DEFAULT;

  const playVideo = useCallback(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  useEffect(() => {
    playVideo();
  }, [src, playVideo]);

  function handleClaim() {
    if (claimReward && !rewardClaimedRef.current) {
      rewardClaimedRef.current = true;
      applyOfferReward(claimReward);
    }
    window.open(partnerUrl, "_blank", "noopener,noreferrer");
  }

  function handleNoAds() {
    openShop("energy");
  }

  return (
    <section className="sponsored-video" data-sponsored-id={creativeId}>
      <div className="sponsored-video__tag-row">
        <span className="sponsored-video__tag">Sponsored</span>
      </div>

      <video
        ref={videoRef}
        className="sponsored-video__vid"
        data-feed-video
        src={src}
        playsInline
        muted
        loop
        preload="auto"
      />

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
