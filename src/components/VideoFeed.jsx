import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useOffers } from "../context/OffersContext";
import { FeedOfferCard } from "./FeedOfferCard";
import { SponsoredVideoSlide } from "./SponsoredVideoSlide";
import { VideoSlide } from "./VideoSlide";
import { EnergyPaywallSlide } from "./EnergyPaywallSlide";
import "./VideoFeed.css";

/**
 * @param {{ items: Array<{ type: string, id: string, src?: string, feedSlot?: number, creativeId?: string }> }} props
 */
export function VideoFeed({ items }) {
  const feedRef = useRef(null);
  const { setActiveFeedItemKey, dailyBonusOpen } = useOffers();
  const [activeKey, setActiveKey] = useState(null);
  const [swipeTeaseVideoId, setSwipeTeaseVideoId] = useState(
    /** @type {string | null} */ (null)
  );
  const [swipeTeasePulse, setSwipeTeasePulse] = useState(false);

  const feedLocked =
    Boolean(activeKey?.startsWith("sponsored_video:")) ||
    Boolean(activeKey?.startsWith("energy_paywall:")) ||
    dailyBonusOpen;

  const updateActiveFromScroll = useCallback(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const center = feed.scrollTop + feed.clientHeight / 2;
    let best = null;
    let bestDist = Infinity;
    const slides = feed.querySelectorAll("[data-feed-item]");
    slides.forEach((el) => {
      const mid = el.offsetTop + el.offsetHeight / 2;
      const dist = Math.abs(mid - center);
      if (dist < bestDist) {
        bestDist = dist;
        best = el;
      }
    });
    if (!best) return;
    const type = best.dataset.feedType;
    const id = best.dataset.feedId;
    if (type && id) {
      setActiveKey(`${type}:${id}`);
    }
  }, []);

  useLayoutEffect(() => {
    updateActiveFromScroll();
  }, [items, updateActiveFromScroll]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    feed.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    return () => feed.removeEventListener("scroll", updateActiveFromScroll);
  }, [items, updateActiveFromScroll]);

  useEffect(() => {
    setActiveFeedItemKey(activeKey);
  }, [activeKey, setActiveFeedItemKey]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || !feedLocked) return;
    const prevent = (e) => e.preventDefault();
    feed.addEventListener("touchmove", prevent, { passive: false });
    feed.addEventListener("wheel", prevent, { passive: false });
    return () => {
      feed.removeEventListener("touchmove", prevent);
      feed.removeEventListener("wheel", prevent);
    };
  }, [feedLocked]);

  const scrollPastFeedItem = useCallback(
    (id) => {
      const feed = feedRef.current;
      if (!feed) return false;
      const safe =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
          ? CSS.escape(String(id))
          : String(id);
      const slide = feed.querySelector(
        `[data-feed-item][data-feed-id="${safe}"]`
      );
      if (!slide) return false;
      const next = slide.nextElementSibling;
      if (!next) return false;
      const y = Math.max(0, Math.round(next.offsetTop));
      /* CSS scroll-behavior: smooth ломает snap — принудительно мгновенный скролл */
      feed.style.setProperty("scroll-behavior", "auto", "important");
      feed.scrollTop = y;
      feed.style.removeProperty("scroll-behavior");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateActiveFromScroll();
        });
      });
      return true;
    },
    [updateActiveFromScroll]
  );

  const startSwipeTease = useCallback((id) => {
    setSwipeTeaseVideoId(id);
  }, []);

  useEffect(() => {
    if (!swipeTeaseVideoId) {
      setSwipeTeasePulse(false);
      return;
    }
    if (feedLocked || activeKey !== `video:${swipeTeaseVideoId}`) {
      setSwipeTeasePulse(false);
      return;
    }
    let pullTimer = 0;
    let pauseTimer = 0;
    const runCycle = () => {
      setSwipeTeasePulse(true);
      pullTimer = window.setTimeout(() => {
        setSwipeTeasePulse(false);
        pauseTimer = window.setTimeout(runCycle, 3500);
      }, 420);
    };
    runCycle();
    return () => {
      window.clearTimeout(pullTimer);
      window.clearTimeout(pauseTimer);
      setSwipeTeasePulse(false);
    };
  }, [swipeTeaseVideoId, activeKey, feedLocked]);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;
    const videos = [...feed.querySelectorAll("video[data-feed-video]")];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const v = entry.target;
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        });
      },
      { root: feed, threshold: [0, 0.25, 0.5, 0.55, 0.75, 1] }
    );
    videos.forEach((v) => io.observe(v));
    if (videos[0]) videos[0].play().catch(() => {});
    return () => io.disconnect();
  }, [items]);

  return (
    <div
      className={`video-feed${feedLocked ? " video-feed--locked" : ""}`}
      ref={feedRef}
      aria-label="Лента видео"
    >
      {items.map((item) =>
        item.type === "feed_offer" ? (
          <div
            key={item.id}
            className="video-feed__item"
            data-feed-item
            data-feed-type="feed_offer"
            data-feed-id={item.id}
          >
            <FeedOfferCard
              feedSlot={item.feedSlot ?? 0}
              feedItemKey={`feed_offer:${item.id}`}
              onDismiss={() => scrollPastFeedItem(item.id)}
            />
          </div>
        ) : item.type === "sponsored_video" ? (
          <div
            key={item.id}
            className="video-feed__item"
            data-feed-item
            data-feed-type="sponsored_video"
            data-feed-id={item.id}
          >
            <SponsoredVideoSlide
              src={item.src ?? ""}
              creativeId={item.creativeId ?? ""}
              feedItemKey={`sponsored_video:${item.id}`}
              partnerUrl={item.partnerUrl}
              claimReward={item.claimReward}
              onDismiss={() => scrollPastFeedItem(item.id)}
            />
          </div>
        ) : item.type === "energy_paywall" ? (
          <EnergyPaywallSlide key={item.id} slideId={item.id} />
        ) : (
          <VideoSlide
            key={item.id}
            id={item.id}
            src={item.src ?? ""}
            isActive={activeKey === `video:${item.id}`}
            teaseSwipeActive={
              swipeTeasePulse &&
              swipeTeaseVideoId === item.id &&
              activeKey === `video:${item.id}`
            }
            onSwipeHintShown={startSwipeTease}
          />
        )
      )}
    </div>
  );
}
