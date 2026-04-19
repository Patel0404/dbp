export { DisabledExecutionProvider } from "./disabled.js";
export { OpenInSportsbookProvider } from "./open_in_sportsbook.js";
export { KalshiExecutionProvider, type KalshiCredentials } from "./kalshi.js";
export { BetfairExecutionProvider, type BetfairCredentials } from "./betfair.js";

import type { ExecutionGate, ProductMode, UserCompliance, JurisdictionRule } from "@dbp/shared";

// Central gate for real-money features. Advisory mode is always allowed.
// Anything touching wagers must pass this check before the API accepts it.
export function gateExecution(params: {
  requestedMode: ProductMode;
  user: UserCompliance;
  jurisdiction: JurisdictionRule | undefined;
  globalKillSwitch: boolean;
}): ExecutionGate {
  if (params.globalKillSwitch) {
    return { mode: params.requestedMode, allowed: false, reason: "global_kill_switch_enabled" };
  }
  if (params.requestedMode === "advisory") {
    return { mode: "advisory", allowed: true };
  }
  if (!params.jurisdiction) {
    return { mode: params.requestedMode, allowed: false, reason: "jurisdiction_unknown" };
  }
  if (!params.jurisdiction.allowsRealMoney) {
    return { mode: params.requestedMode, allowed: false, reason: "jurisdiction_blocks_real_money" };
  }
  if (!params.user.ageVerified) {
    return { mode: params.requestedMode, allowed: false, reason: "age_not_verified" };
  }
  if (!params.user.identityVerified) {
    return { mode: params.requestedMode, allowed: false, reason: "identity_not_verified" };
  }
  if (params.user.selfExcludedUntil && Date.parse(params.user.selfExcludedUntil) > Date.now()) {
    return { mode: params.requestedMode, allowed: false, reason: "self_excluded" };
  }
  if (params.user.coolOffUntil && Date.parse(params.user.coolOffUntil) > Date.now()) {
    return { mode: params.requestedMode, allowed: false, reason: "cool_off_active" };
  }
  return { mode: params.requestedMode, allowed: true };
}
