import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { primeSfxFromUserGesture, preloadSfxBases } from "../audio/sfx";
import { vibrateBetWin } from "../haptics";

/** @typedef {import("../offers/offers").Offer} Offer */

const OffersContext = createContext(null);

const DAILY_BONUS_COINS = 500;
const DAILY_BONUS_STORAGE_KEY = "vf_daily_bonus_claimed_v1";
const LEGACY_START_BONUS_KEY = "vf_start_bonus_claimed_v1";

function isDailyBonusClaimed() {
  try {
    const lc = localStorage;
    if (lc.getItem(DAILY_BONUS_STORAGE_KEY) === "1") return true;
    if (lc.getItem(LEGACY_START_BONUS_KEY) === "1") return true;
    return false;
  } catch {
    return true;
  }
}

export function OffersProvider({ children }) {
  const [energy, setEnergy] = useState(3);
  const [coins, setCoins] = useState(0);
  /** После ставки на этом video id энергия стала 0 — следующий слайд в ленте = paywall */
  const [energyPaywallInsertAfterVideoId, setEnergyPaywallInsertAfterVideoId] =
    useState(/** @type {string | null} */ (null));
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState(/** @type {'coins' | 'energy'} */ ("coins"));
  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [activeFeedItemKey, setActiveFeedItemKey] = useState(null);
  /** @type {[null | { amount: number, runId: number }, React.Dispatch<React.SetStateAction<null | { amount: number, runId: number }>>]} */
  const [coinWinFx, setCoinWinFx] = useState(null);
  /** @type {[number | null, React.Dispatch<React.SetStateAction<number | null>>]} */
  const [loseFxRunId, setLoseFxRunId] = useState(/** @type {number | null} */ (null));
  const [dailyBonusOpen, setDailyBonusOpen] = useState(false);

  const applyOfferReward = useCallback((offer) => {
    if (!offer) return;
    if (offer.rewardType === "energy") {
      setEnergy((e) => e + offer.rewardValue);
    } else {
      setCoins((c) => c + offer.rewardValue);
    }
  }, []);

  const scheduleEnergyPaywallAfterVideo = useCallback((videoId) => {
    if (videoId == null || videoId === "") return;
    setEnergyPaywallInsertAfterVideoId(videoId);
  }, []);

  const claimPartnerCasinoEnergy = useCallback(() => {
    setEnergy((e) => e + 35);
  }, []);

  const purchaseEnergyPack100 = useCallback(() => {
    setEnergy((e) => e + 100);
  }, []);

  const openShop = useCallback((tab = "coins") => {
    setShopTab(tab);
    setShopOpen(true);
  }, []);

  const closeShop = useCallback(() => setShopOpen(false), []);

  const openShopEnergyTab = useCallback(() => {
    setShopTab("energy");
    setShopOpen(true);
  }, []);

  useEffect(() => {
    if (energy > 0) {
      setEnergyPaywallInsertAfterVideoId(null);
    }
  }, [energy]);

  const playCoinWinAnimation = useCallback((amount) => {
    const n = Math.max(0, Math.round(Number(amount)));
    setCoinWinFx({ amount: n, runId: Date.now() });
  }, []);

  const clearCoinWinFx = useCallback(() => setCoinWinFx(null), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isDailyBonusClaimed()) {
      setDailyBonusOpen(false);
      return;
    }
    setDailyBonusOpen(coins === 0);
  }, [coins]);

  const claimDailyBonus = useCallback(() => {
    if (isDailyBonusClaimed()) {
      setDailyBonusOpen(false);
      return;
    }
    try {
      localStorage.setItem(DAILY_BONUS_STORAGE_KEY, "1");
      localStorage.setItem(LEGACY_START_BONUS_KEY, "1");
    } catch {
      /* ignore */
    }
    setDailyBonusOpen(false);
    primeSfxFromUserGesture();
    preloadSfxBases([
      "stack-of-coins",
      "classic-fail-wah-wah-wah-on-the-pipe",
    ]);
    setCoins((c) => c + DAILY_BONUS_COINS);
    playCoinWinAnimation(DAILY_BONUS_COINS);
    vibrateBetWin();
  }, [playCoinWinAnimation]);

  const playLoseFeedback = useCallback(() => {
    setLoseFxRunId(Date.now());
  }, []);

  const clearLoseFx = useCallback(() => setLoseFxRunId(null), []);

  const value = useMemo(
    () => ({
      energy,
      setEnergy,
      coins,
      setCoins,
      energyPaywallInsertAfterVideoId,
      scheduleEnergyPaywallAfterVideo,
      claimPartnerCasinoEnergy,
      purchaseEnergyPack100,
      shopOpen,
      shopTab,
      setShopTab,
      openShop,
      closeShop,
      openShopEnergyTab,
      applyOfferReward,
      activeFeedItemKey,
      setActiveFeedItemKey,
      coinWinFx,
      playCoinWinAnimation,
      clearCoinWinFx,
      loseFxRunId,
      playLoseFeedback,
      clearLoseFx,
      dailyBonusOpen,
      claimDailyBonus,
    }),
    [
      energy,
      coins,
      energyPaywallInsertAfterVideoId,
      scheduleEnergyPaywallAfterVideo,
      claimPartnerCasinoEnergy,
      purchaseEnergyPack100,
      shopOpen,
      shopTab,
      openShop,
      closeShop,
      openShopEnergyTab,
      applyOfferReward,
      activeFeedItemKey,
      coinWinFx,
      playCoinWinAnimation,
      clearCoinWinFx,
      loseFxRunId,
      playLoseFeedback,
      clearLoseFx,
      dailyBonusOpen,
      claimDailyBonus,
    ]
  );

  return (
    <OffersContext.Provider value={value}>{children}</OffersContext.Provider>
  );
}

export function useOffers() {
  const ctx = useContext(OffersContext);
  if (!ctx) throw new Error("useOffers must be used within OffersProvider");
  return ctx;
}
