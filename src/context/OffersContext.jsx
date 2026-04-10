import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { getOfferByTrigger } from "../offers/offers";

/** @typedef {import("../offers/offers").Offer} Offer */
/** @typedef {import("../offers/offers").OfferTrigger} OfferTrigger */

const OffersContext = createContext(null);

export function OffersProvider({ children }) {
  const [energy, setEnergy] = useState(3);
  const [coins, setCoins] = useState(0);
  const [energyPaywallOpen, setEnergyPaywallOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [shopTab, setShopTab] = useState(/** @type {'coins' | 'energy'} */ ("coins"));
  const [showOffer, setShowOffer] = useState(false);
  /** @type {[Offer | null, React.Dispatch<React.SetStateAction<Offer | null>>]} */
  const [currentOffer, setCurrentOffer] = useState(null);
  /** @type {[OfferTrigger | null, React.Dispatch<React.SetStateAction<OfferTrigger | null>>]} */
  const [popupTriggerType, setPopupTriggerType] = useState(null);
  /** @type {[string | null, React.Dispatch<React.SetStateAction<string | null>>]} */
  const [activeFeedItemKey, setActiveFeedItemKey] = useState(null);
  /** @type {[null | { amount: number, runId: number }, React.Dispatch<React.SetStateAction<null | { amount: number, runId: number }>>]} */
  const [coinWinFx, setCoinWinFx] = useState(null);
  /** @type {[number | null, React.Dispatch<React.SetStateAction<number | null>>]} */
  const [loseFxRunId, setLoseFxRunId] = useState(/** @type {number | null} */ (null));

  const onboardingDoneRef = useRef(false);
  const lastSwipeKeyRef = useRef(null);
  const swipeCountRef = useRef(0);

  const applyOfferReward = useCallback((offer) => {
    if (!offer) return;
    if (offer.rewardType === "energy") {
      setEnergy((e) => e + offer.rewardValue);
    } else {
      setCoins((c) => c + offer.rewardValue);
    }
  }, []);

  const openOffer = useCallback((offer, triggerType) => {
    setCurrentOffer(offer);
    setPopupTriggerType(triggerType);
    setShowOffer(true);
  }, []);

  const openOfferByTrigger = useCallback((triggerType) => {
    const offer = getOfferByTrigger(triggerType);
    openOffer(offer, triggerType);
  }, [openOffer]);

  const closeOffer = useCallback(() => {
    setShowOffer(false);
    setCurrentOffer(null);
    setPopupTriggerType(null);
  }, []);

  const claimOffer = useCallback(() => {
    setCurrentOffer((prev) => {
      if (prev) applyOfferReward(prev);
      return null;
    });
    setShowOffer(false);
    setPopupTriggerType(null);
  }, [applyOfferReward]);

  const openEnergyPaywall = useCallback(() => {
    setEnergyPaywallOpen(true);
  }, []);

  const closeEnergyPaywall = useCallback(() => {
    setEnergyPaywallOpen(false);
  }, []);

  const tryEnergyPaywall = useCallback(() => {
    openEnergyPaywall();
  }, [openEnergyPaywall]);

  const claimPartnerCasinoEnergy = useCallback(() => {
    setEnergy((e) => e + 35);
    setEnergyPaywallOpen(false);
  }, []);

  const purchaseEnergyPack100 = useCallback(() => {
    setEnergy((e) => e + 100);
    setEnergyPaywallOpen(false);
  }, []);

  const openShop = useCallback((tab = "coins") => {
    setShopTab(tab);
    setShopOpen(true);
  }, []);

  const closeShop = useCallback(() => setShopOpen(false), []);

  const openShopEnergyTab = useCallback(() => {
    setEnergyPaywallOpen(false);
    setShopTab("energy");
    setShopOpen(true);
  }, []);

  const maybeOfferAfterWin = useCallback(() => {
    if (Math.random() < 0.3) {
      openOfferByTrigger("win");
    }
  }, [openOfferByTrigger]);

  const maybeOfferAfterLose = useCallback(() => {
    if (Math.random() < 0.5) {
      openOfferByTrigger("lose");
    }
  }, [openOfferByTrigger]);

  /**
   * Считает смену центрального элемента ленты как свайп.
   * После 5 свайпов — onboarding-оффер (один раз).
   */
  const playCoinWinAnimation = useCallback((amount) => {
    const n = Math.max(0, Math.round(Number(amount)));
    setCoinWinFx({ amount: n, runId: Date.now() });
  }, []);

  const clearCoinWinFx = useCallback(() => setCoinWinFx(null), []);

  const playLoseFeedback = useCallback(() => {
    setLoseFxRunId(Date.now());
  }, []);

  const clearLoseFx = useCallback(() => setLoseFxRunId(null), []);

  const onActiveFeedItemChange = useCallback(
    (key) => {
      if (key == null || key === "") return;
      if (key.startsWith("sponsored_video:")) return;
      if (lastSwipeKeyRef.current === key) return;
      lastSwipeKeyRef.current = key;
      swipeCountRef.current += 1;
      if (onboardingDoneRef.current) return;
      if (swipeCountRef.current >= 5) {
        onboardingDoneRef.current = true;
        openOfferByTrigger("onboarding");
      }
    },
    [openOfferByTrigger]
  );

  const value = useMemo(
    () => ({
      energy,
      setEnergy,
      coins,
      setCoins,
      energyPaywallOpen,
      openEnergyPaywall,
      closeEnergyPaywall,
      claimPartnerCasinoEnergy,
      purchaseEnergyPack100,
      shopOpen,
      shopTab,
      setShopTab,
      openShop,
      closeShop,
      openShopEnergyTab,
      showOffer,
      currentOffer,
      popupTriggerType,
      openOffer,
      openOfferByTrigger,
      closeOffer,
      claimOffer,
      applyOfferReward,
      tryEnergyPaywall,
      maybeOfferAfterWin,
      maybeOfferAfterLose,
      onActiveFeedItemChange,
      activeFeedItemKey,
      setActiveFeedItemKey,
      coinWinFx,
      playCoinWinAnimation,
      clearCoinWinFx,
      loseFxRunId,
      playLoseFeedback,
      clearLoseFx,
      getOfferByTrigger,
    }),
    [
      energy,
      coins,
      energyPaywallOpen,
      openEnergyPaywall,
      closeEnergyPaywall,
      claimPartnerCasinoEnergy,
      purchaseEnergyPack100,
      shopOpen,
      shopTab,
      openShop,
      closeShop,
      openShopEnergyTab,
      showOffer,
      currentOffer,
      popupTriggerType,
      openOffer,
      openOfferByTrigger,
      closeOffer,
      claimOffer,
      applyOfferReward,
      tryEnergyPaywall,
      maybeOfferAfterWin,
      maybeOfferAfterLose,
      onActiveFeedItemChange,
      activeFeedItemKey,
      coinWinFx,
      playCoinWinAnimation,
      clearCoinWinFx,
      loseFxRunId,
      playLoseFeedback,
      clearLoseFx,
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
