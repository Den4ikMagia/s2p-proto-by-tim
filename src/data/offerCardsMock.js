/**
 * Мок-данные карточек офферов в ленте (позже — с API).
 *
 * @typedef {Object} OfferCardMock
 * @property {number} id
 * @property {string} title
 * @property {string} description
 * @property {string} cta_text
 * @property {string} brand_url
 * @property {string} background_color
 * @property {string} image
 * @property {string} logo
 * @property {number} rating — для блока Rating (отображается как x.xx/10)
 */

/** @type {OfferCardMock[]} */
export const OFFER_CARDS_MOCK = [
  {
    id: 26,
    title: "GIZBO",
    description:
      "150% на депозит + до 30 000 ₽ бонус + вейджер x40",
    cta_text: "ЗАБРАТЬ БОНУС",
    brand_url: "https://gizbo-way-six.com/cfda37db6",
    background_color: "#899DD4",
    image:
      "https://admin.battleme.club/uploads/GIZBO_NEW_f1a4d2c340.png",
    logo: "https://admin.battleme.club/uploads/Ellipse_10_adb3aae89f.png",
    rating: 9.45,
  },
  {
    id: 11,
    title: "LEX",
    description:
      "200% на депозит + до 30 000 ₽ бонус + вейджер x40",
    cta_text: "ЗАБРАТЬ БОНУС",
    brand_url: "https://lex-irrs01.com/ce0f1590a",
    background_color: "#F4D483",
    image: "https://admin.battleme.club/uploads/LEX_NEW_1125c8e31f.png",
    logo: "https://admin.battleme.club/uploads/Lex_Logo_7624667d3a.png",
    rating: 9.62,
  },
  {
    id: 15,
    title: "Vodka",
    description:
      "150% депозит + до 300 фриспинов + вейджер x40",
    cta_text: "ЗАБРАТЬ БОНУС",
    brand_url: "https://vodka2.xyz?id=6847",
    background_color: "#32A0FD",
    image:
      "https://admin.battleme.club/uploads/VODKA_BET_offer_97e1d44484.png",
    logo: "https://admin.battleme.club/uploads/VODKA_cc9010a042.png",
    rating: 9.38,
  },
  {
    id: 14,
    title: "R7",
    description:
      "50% депозит + 20€ бонус + 50 FS + вейджер x50",
    cta_text: "ЗАБРАТЬ БОНУС",
    brand_url: "https://aristocratic-hall.com/s909d756a",
    background_color: "#EB3184",
    image: "https://admin.battleme.club/uploads/R7_NEW_cd4705c395.png",
    logo: "https://admin.battleme.club/uploads/R7_fd50289d39.png",
    rating: 9.71,
  },
  {
    id: 17,
    title: "Dragon",
    description: "10% кэшбэк + вейджер x3",
    cta_text: "ЗАБРАТЬ БОНУС",
    brand_url: "https://drg.so/f4b366c1d",
    background_color: "#FFB400",
    image:
      "https://admin.battleme.club/uploads/Dragon_Money_d847665e8d.png",
    logo:
      "https://admin.battleme.club/uploads/dragon_money_08891fc5b3.png",
    rating: 9.22,
  },
  {
    id: 16,
    title: "BC Game",
    description: "180% депозит + до 20 000$ бонус",
    cta_text: "ЗАБРАТЬ БОНУС",
    brand_url: "https://bcgame.st/i-28bbub6pc-n/",
    background_color: "#64C800",
    image: "https://admin.battleme.club/uploads/BC_Game_31f41f99cc.png",
    logo:
      "https://admin.battleme.club/uploads/BC_Game_Logo_8a4ae773c7.png",
    rating: 9.55,
  },
];
