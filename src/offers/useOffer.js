import { useMemo } from "react";
import { useOffers } from "../context/OffersContext";
import { getOfferByTrigger } from "./offers";

/**
 * Контекст офферов + явный доступ к getOfferByTrigger из offers.js.
 * @returns {ReturnType<typeof useOffers> & { getOfferByTrigger: typeof getOfferByTrigger }}
 */
export function useOffer() {
  const ctx = useOffers();
  return useMemo(
    () => ({
      ...ctx,
      getOfferByTrigger,
    }),
    [ctx]
  );
}
