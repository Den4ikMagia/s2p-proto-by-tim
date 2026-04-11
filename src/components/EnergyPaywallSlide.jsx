import { EnergyPaywallFeedPanel } from "./EnergyPaywallModal";

/**
 * @param {{ slideId: string }} props
 */
export function EnergyPaywallSlide({ slideId }) {
  return (
    <div
      className="video-feed__item video-feed__item--energy-paywall"
      data-feed-item
      data-feed-type="energy_paywall"
      data-feed-id={slideId}
    >
      <EnergyPaywallFeedPanel />
    </div>
  );
}
