import { FEED_AD_PARTNER_URL_DEFAULT } from "../offers/offers";

export const PROTOTYPE_VIDEOS = [
  {
    id: "p1",
    src: "https://battleme.s3.eu-north-1.amazonaws.com/scroll_games/0040_3.mp4",
  },
  {
    id: "p2",
    src: "https://battleme.s3.eu-north-1.amazonaws.com/scroll_games/scroll_game_0115.mp4",
  },
  {
    id: "p3",
    src: "https://battleme.s3.eu-north-1.amazonaws.com/scroll_games/0048_4.mp4",
  },
];

/** Креативы: слоты / беттинг */
export const SPONSORED_VIDEO_CREATIVES = [
  {
    id: "casino",
    src: "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/slots-spin-video-design-template-78bb671281c6a6fcf5e0f7a86ac422e1_screen.mp4?ts=1737965150",
    title: "Casino",
    partnerUrl: `${FEED_AD_PARTNER_URL_DEFAULT}&creative=sponsored_casino`,
    claimReward: { rewardType: "coins", rewardValue: 30 },
  },
  {
    id: "betting",
    src: "https://d1csarkz8obe9u.cloudfront.net/posterpreviews/black-modern-%26-minimal-matchday-instagram-sto-design-template-1b5b150f565b694855e1e9abebafe342_screen.mp4?ts=1731560506",
    title: "Betting",
    partnerUrl: `${FEED_AD_PARTNER_URL_DEFAULT}&creative=sponsored_betting`,
    claimReward: { rewardType: "coins", rewardValue: 30 },
  },
];

/**
 * Вставляет feed_offer каждые 5 видео и sponsored_video после 3-го и 9-го ролика.
 */
export function buildFeedItems(videos) {
  const items = [];
  let feedSlot = 0;
  let sponsoredVideoIndex = 0;

  for (let i = 0; i < videos.length; i++) {
    const v = videos[i];
    items.push({ type: "video", id: v.id, src: v.src });

    if (i === 2 || i === 8) {
      const cr =
        SPONSORED_VIDEO_CREATIVES[
          sponsoredVideoIndex % SPONSORED_VIDEO_CREATIVES.length
        ];
      sponsoredVideoIndex += 1;
      items.push({
        type: "sponsored_video",
        id: `sponsored-video-${i}-${cr.id}`,
        src: cr.src,
        creativeId: cr.id,
        partnerUrl: cr.partnerUrl,
        claimReward: cr.claimReward,
      });
    }

    if ((i + 1) % 5 === 0) {
      items.push({
        type: "feed_offer",
        id: `feed-offer-after-${v.id}`,
        feedSlot: feedSlot++,
      });
    }
  }
  return items;
}
