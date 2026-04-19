import type { ProductMode } from "@dbp/shared";

export interface AppConfig {
  port: number;
  host: string;
  corsOrigins: string[];
  productMode: ProductMode;
  globalKillSwitch: boolean;
  defaultJurisdiction: string;
  rateLimitMax: number;
  rateLimitWindowSec: number;
  logLevel: "debug" | "info" | "warn" | "error";
}

function envStr(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined) return fallback;
  return v === "1" || v.toLowerCase() === "true";
}

function envInt(key: string, fallback: number): number {
  const v = process.env[key];
  if (v === undefined) return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const config: AppConfig = {
  port: envInt("PORT", 4000),
  host: envStr("HOST", "0.0.0.0"),
  corsOrigins: envStr("CORS_ORIGINS", "http://localhost:3000").split(","),
  productMode: envStr("PRODUCT_MODE", "advisory") as ProductMode,
  globalKillSwitch: envBool("GLOBAL_KILL_SWITCH", false),
  defaultJurisdiction: envStr("DEFAULT_JURISDICTION", "US-NJ"),
  rateLimitMax: envInt("RATE_LIMIT_MAX", 120),
  rateLimitWindowSec: envInt("RATE_LIMIT_WINDOW_SEC", 60),
  logLevel: (envStr("LOG_LEVEL", "info") as AppConfig["logLevel"]),
};
