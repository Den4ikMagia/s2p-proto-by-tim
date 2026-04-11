/**
 * @typedef {"energy_paywall" | "onboarding" | "feed_ad"} OfferTrigger
 */

/**
 * @typedef {"energy" | "betting" | "welcome"} OfferKind
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
 * @property {string} [passThroughWelcomeLabel]
 * @property {string} [passThroughHeadline]
 * @property {string} [passThroughRatingScore] — например "9.71" для блока Rating
 */

/** Плейсхолдер; замените на реальный URL партнёра */
export const FEED_AD_PARTNER_URL_DEFAULT =
  "https://example.com/partner?utm_source=in_feed";

/** @type {Offer} */
const OFFER_ENERGY_PAYWALL = {
  id: "energy-paywall-50",
  kind: "energy",
  uiLabel: "Free reward",
  title: "Получи 50 энергии бесплатно",
  description:
    "Закончилась энергия? Возьми пакет и продолжай смотреть ленту и делать ставки.",
  cta: "Забрать энергию",
  rewardType: "energy",
  rewardValue: 50,
};

/** @type {Offer} */
const OFFER_WELCOME = {
  id: "welcome-new-players",
  kind: "welcome",
  uiLabel: "Free reward",
  title: "Бонус новым игрокам",
  description:
    "Добро пожаловать! Стартовый пакет монет для первых ставок в ленте.",
  cta: "Активировать бонус",
  rewardType: "coins",
  rewardValue: 200,
};

/**
 * Библиотека пропускных плейсментов (изображение + welcome-текст, без таймера).
 * @type {Offer[]}
 */
const FEED_PASS_THROUGH_LIBRARY = [
  {
    id: "feed-pass-haksr",
    kind: "betting",
    uiLabel: "Bonus",
    title: "Лимитированный буст энергии",
    description: "",
    cta: "PLAY NOW",
    rewardType: "energy",
    rewardValue: 12,
    partnerUrl: `${FEED_AD_PARTNER_URL_DEFAULT}&placement=pass&brand=haksr`,
    feedPlacement: "pass_through",
    brandImageUrl:
      "https://www.betpack.com/imgs/bookmakers/h320/1705410758_HAKSR.webp",
    brandImageAlt: "Partner",
    passThroughWelcomeLabel: "Welcome offer",
    passThroughHeadline: "200% up to €2000 + 150 Free Spins on top games",
    passThroughRatingScore: "9.83",
  },
  {
    id: "feed-pass-lunubet",
    kind: "betting",
    uiLabel: "Bonus",
    title: "Лимитированный буст энергии",
    description: "",
    cta: "PLAY NOW",
    rewardType: "energy",
    rewardValue: 15,
    partnerUrl: `${FEED_AD_PARTNER_URL_DEFAULT}&placement=pass&brand=lunubet`,
    feedPlacement: "pass_through",
    brandImageUrl:
      "https://www.betpack.com/imgs/bookmakers/h320/1721299525_pIXrd.webp",
    brandImageAlt: "Lunubet",
    passThroughWelcomeLabel: "Welcome offer",
    passThroughHeadline:
      "350% first deposit boost + 200 Free Spins in hit slots",
    passThroughRatingScore: "9.76",
  },
  {
    id: "feed-pass-pinnacle",
    kind: "betting",
    uiLabel: "Bonus",
    title: "Лимитированный буст энергии",
    description: "",
    cta: "PLAY NOW",
    rewardType: "coins",
    rewardValue: 30,
    partnerUrl: `${FEED_AD_PARTNER_URL_DEFAULT}&placement=pass&brand=pinnacle`,
    feedPlacement: "pass_through",
    brandImageUrl:
      "https://www.betpack.com/imgs/bookmakers/h320/1720008819_wVVdw.webp",
    brandImageAlt: "Partner",
    passThroughWelcomeLabel: "Sports welcome",
    passThroughHeadline:
      "100% up to €500 + insured first bet on prematch & live",
    passThroughRatingScore: "9.88",
  },
  {
    id: "feed-pass-boomerang",
    kind: "betting",
    uiLabel: "Bonus",
    title: "Лимитированный буст энергии",
    description: "",
    cta: "PLAY NOW",
    rewardType: "energy",
    rewardValue: 18,
    partnerUrl: `${FEED_AD_PARTNER_URL_DEFAULT}&placement=pass&brand=boomerang`,
    feedPlacement: "pass_through",
    brandImageUrl:
      "https://www.betpack.com/imgs/bookmakers/h320/1707390227_xrWPF.webp",
    brandImageAlt: "Partner",
    passThroughWelcomeLabel: "Welcome pack",
    passThroughHeadline:
      "150% up to €2500 + 100 FS + weekly cashback for new players",
    passThroughRatingScore: "9.71",
  },
];

/**
 * В ленте только пропускные офферы — ротация по слоту.
 * @param {number} feedSlotIndex
 * @returns {Offer}
 */
export function getFeedOfferForSlot(feedSlotIndex) {
  const slot = Math.max(0, Math.floor(feedSlotIndex));
  const n = FEED_PASS_THROUGH_LIBRARY.length;
  return FEED_PASS_THROUGH_LIBRARY[slot % n];
}

/**
 * @param {OfferTrigger} triggerType
 * @param {number} [feedSlotIndex=0] — для feed_ad: слот в ленте
 * @returns {Offer}
 */
export function getOfferByTrigger(triggerType, feedSlotIndex = 0) {
  switch (triggerType) {
    case "energy_paywall":
      return OFFER_ENERGY_PAYWALL;
    case "onboarding":
      return OFFER_WELCOME;
    case "feed_ad":
      return getFeedOfferForSlot(feedSlotIndex);
    default:
      return FEED_PASS_THROUGH_LIBRARY[0];
  }
}
