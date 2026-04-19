import type { GeoProvider, ProviderCapabilities } from "../types.js";

// Stub geo provider. Real deployments plug in an authoritative geolocation
// vendor (IP + device GPS + VPN detection). The stub reads a header the API
// layer can set via configuration so development flows work end-to-end.
export class HeaderGeoProvider implements GeoProvider {
  readonly capabilities: ProviderCapabilities = {
    name: "header-geo",
    version: "0.1.0",
    supportedSports: [],
    supportsHistorical: false,
    supportsLive: false,
  };

  constructor(private readonly defaultJurisdiction: string = "US-NJ") {}

  async resolveJurisdiction(params: { ip?: string; latitude?: number; longitude?: number }): Promise<{
    code: string;
    country: string;
    region?: string;
    confidence: number;
  }> {
    // Accept either a lat/lon or IP hint. For MVP we return a configured
    // default with low confidence so callers know not to trust it for wagers.
    return {
      code: this.defaultJurisdiction,
      country: this.defaultJurisdiction.split("-")[0] ?? "US",
      region: this.defaultJurisdiction.split("-")[1],
      confidence: 0.2,
    };
  }
}
