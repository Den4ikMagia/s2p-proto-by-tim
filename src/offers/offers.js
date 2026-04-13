import { OFFER_CARDS_MOCK } from "../data/offerCardsMock";

/**
 * @typedef {"feed_ad"} OfferTrigger
 */

/**
 * @typedef {"betting"} OfferKind
 */

/**
 * @typedef {"Sponsored" | "Bonus" | "Free reward"} OfferUiLabel
 */

/**
 * @typedef {Object} Offer
 * @property {string} id
 * @property {OfferKind} kind
 * @property {OfferUiLabel} uiLabel
 * @property {string} title
 * @property {string} description
 * @property {string} cta
 * @property {"energy" | "coins"} rewardType
 * @property {number} rewardValue
 * @property {string} [partnerUrl]
 * @property {'standard' | 'pass_through'} [feedPlacement]
 * @property {string} [brandImageUrl]
 * @property {string} [brandImageAlt]
 * @property {string} [brandLogoUrl]
 * @property {string} [backgroundColor]
 * @property {string} [passThroughWelcomeLabel]
 * @property {string} [passThroughHeadline]
 * @property {string} [passThroughRatingScore]
 */

/** Плейсхолдер, если в моке нет ссылки */
export const FEED_AD_PARTNER_URL_DEFAULT =
  "https://example.com/partner?utm_source=in_feed";

/**
 * @param {string} s
 */
function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * @param {number} rating
 */
function formatRatingScore(rating) {
  const n = Number(rating);
  if (!Number.isFinite(n)) return "9.50";
  return n.toFixed(2);
}

/**
 * @param {object} card — элемент из `OFFER_CARDS_MOCK`
 * @returns {Offer}
 */
export function mapOfferCardMockToOffer(card) {
  return {
    id: `offer-card-${card.id}`,
    kind: "betting",
    uiLabel: "Bonus",
    title: card.title,
    description: card.description,
    cta: card.cta_text,
    rewardType: "energy",
    rewardValue: 12 + (Number(card.id) % 7),
    partnerUrl: card.brand_url,
    feedPlacement: "pass_through",
    brandImageUrl: card.image,
    brandImageAlt: card.title,
    brandLogoUrl: card.logo,
    backgroundColor: card.background_color,
    passThroughWelcomeLabel: card.title,
    passThroughHeadline: card.description,
    passThroughRatingScore: formatRatingScore(card.rating),
  };
}

/**
 * Псевдослучайный индекс карточки по ключу элемента ленты (стабильно на время сессии карточки).
 * @param {number} feedSlotIndex
 * @param {string} [feedItemKey]
 */
function pickOfferCardIndex(feedSlotIndex, feedItemKey) {
  const list = OFFER_CARDS_MOCK;
  const n = list.length;
  if (n === 0) return 0;
  const key =
    feedItemKey != null && feedItemKey !== ""
      ? `${feedItemKey}:${feedSlotIndex}`
      : `slot:${feedSlotIndex}`;
  return hashString(key) % n;
}

/**
 * В ленте — карточка из мока по слоту и ключу (разные карточки для разных слотов).
 * @param {number} feedSlotIndex
 * @param {string} [feedItemKey]
 * @returns {Offer}
 */
export function getFeedOfferForSlot(feedSlotIndex, feedItemKey) {
  const idx = pickOfferCardIndex(
    Math.max(0, Math.floor(feedSlotIndex)),
    feedItemKey
  );
  return mapOfferCardMockToOffer(OFFER_CARDS_MOCK[idx]);
}

/**
 * @param {OfferTrigger} triggerType
 * @param {number} [feedSlotIndex=0]
 * @param {string} [feedItemKey] — для feed_ad: стабильный «рандом» по ключу элемента ленты
 * @returns {Offer}
 */
export function getOfferByTrigger(triggerType, feedSlotIndex = 0, feedItemKey) {
  switch (triggerType) {
    case "feed_ad":
      return getFeedOfferForSlot(feedSlotIndex, feedItemKey);
    default:
      return mapOfferCardMockToOffer(OFFER_CARDS_MOCK[0]);
  }
}
