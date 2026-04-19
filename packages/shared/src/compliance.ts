// Compliance types. Real-money features are gated by these at the API layer.

export interface JurisdictionRule {
  code: string; // ISO 3166-2 (e.g. "US-NJ") or ISO 3166-1 alpha-2
  displayName: string;
  allowsAdvisory: boolean;
  allowsRealMoney: boolean;
  minAge: number;
  disclaimers: string[];
  responsibleGamblingResources: ResourceLink[];
}

export interface ResourceLink {
  label: string;
  url: string;
}

export interface UserCompliance {
  userId: string;
  jurisdictionCode?: string;
  ageVerified: boolean;
  identityVerified: boolean;
  selfExcludedUntil?: string;
  depositLimit?: number;
  lossLimit?: number;
  wagerLimit?: number;
  sessionReminderMinutes?: number;
  coolOffUntil?: string;
}

export type ProductMode = "advisory" | "assisted_execution" | "automated_execution";

export interface ExecutionGate {
  mode: ProductMode;
  allowed: boolean;
  reason?: string;
}
