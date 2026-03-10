import { beforeEach, describe, expect, it } from "vitest";
import { providerUpsert } from "../providers";
import { getProvidersState, setProvidersState } from "../../test/msw/state";
import { setTauriRuntime } from "../../test/utils/tauriRuntime";

describe("services/providers via MSW bridge", () => {
  beforeEach(() => {
    setTauriRuntime();
    setProvidersState("claude", []);
  });

  it("persists provider_upsert with nested input payload through tauri bridge", async () => {
    const saved = await providerUpsert({
      cli_key: "claude",
      name: "Bridge Provider",
      base_urls: ["https://api.example.com"],
      base_url_mode: "order",
      auth_mode: "api_key",
      api_key: "sk-test",
      enabled: true,
      cost_multiplier: 1.5,
      priority: 8,
      claude_models: null,
      limit_5h_usd: 5,
      limit_daily_usd: 10,
      daily_reset_mode: "fixed",
      daily_reset_time: "01:02:03",
      limit_weekly_usd: 15,
      limit_monthly_usd: 20,
      limit_total_usd: 25,
      tags: ["a", "b"],
      note: "hello",
    });

    expect(saved).toMatchObject({
      cli_key: "claude",
      name: "Bridge Provider",
      base_urls: ["https://api.example.com"],
      base_url_mode: "order",
      limit_5h_usd: 5,
      daily_reset_mode: "fixed",
      daily_reset_time: "01:02:03",
      auth_mode: "api_key",
      tags: ["a", "b"],
      note: "hello",
    });

    expect(getProvidersState("claude")).toHaveLength(1);
    expect(getProvidersState("claude")[0]).toMatchObject({
      name: "Bridge Provider",
      limit_5h_usd: 5,
    });
  });
});
