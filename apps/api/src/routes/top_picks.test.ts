import { test } from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../server.ts";
import { seed } from "../seed/run.ts";
import { generateRecommendations } from "../services/recommendations.ts";

test("GET /v1/top-picks returns ranked picks with explanations", async () => {
  seed();
  generateRecommendations();
  const app = await buildServer();
  const res = await app.inject({ method: "GET", url: "/v1/top-picks" });
  assert.equal(res.statusCode, 200);
  const body = res.json() as { picks: Array<{ recommendation: { rankScore: number; explanation: { summary: string } } }> };
  assert.ok(body.picks.length > 0, "expected at least one pick");
  // Ranked desc.
  for (let i = 1; i < body.picks.length; i++) {
    assert.ok(body.picks[i - 1]!.recommendation.rankScore >= body.picks[i]!.recommendation.rankScore);
    assert.ok(body.picks[i]!.recommendation.explanation.summary.length > 0);
  }
  await app.close();
});

test("GET /v1/compliance/mode reports advisory mode", async () => {
  const app = await buildServer();
  const res = await app.inject({ method: "GET", url: "/v1/compliance/mode" });
  assert.equal(res.statusCode, 200);
  const body = res.json() as { productMode: string; notice: string };
  assert.equal(body.productMode, "advisory");
  assert.match(body.notice, /Advisory mode/);
  await app.close();
});

test("POST /v1/execution/preview is gated in advisory mode", async () => {
  seed();
  generateRecommendations();
  const app = await buildServer();
  const firstRec = [...(await app.inject({ method: "GET", url: "/v1/top-picks" })).json().picks][0];
  const res = await app.inject({
    method: "POST",
    url: "/v1/execution/preview",
    payload: { recommendationId: firstRec.recommendation.id, stakeUnits: 1 },
    headers: { "content-type": "application/json" },
  });
  // Advisory mode should allow the gate but execution provider is disabled, so preview.accepted === false.
  assert.equal(res.statusCode, 200);
  const body = res.json() as { preview: { accepted: boolean; rejectionReason?: string } };
  assert.equal(body.preview.accepted, false);
  await app.close();
});
