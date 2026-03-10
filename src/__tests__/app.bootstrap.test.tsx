import { render } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestQueryClient } from "../test/utils/reactQuery";
import { createTestAppSettings } from "../test/fixtures/settings";

vi.mock("../services/appHeartbeat", () => ({
  listenAppHeartbeat: vi.fn().mockResolvedValue(() => {}),
}));
vi.mock("../services/gatewayEvents", () => ({
  listenGatewayEvents: vi.fn().mockResolvedValue(() => {}),
}));
vi.mock("../services/noticeEvents", () => ({
  listenNoticeEvents: vi.fn().mockResolvedValue(() => {}),
}));
vi.mock("../services/taskCompleteNotifyEvents", () => ({
  listenTaskCompleteNotifyEvents: vi.fn().mockResolvedValue(() => {}),
  setTaskCompleteNotifyEnabled: vi.fn(),
}));
vi.mock("../services/cacheAnomalyMonitor", () => ({
  setCacheAnomalyMonitorEnabled: vi.fn(),
}));
vi.mock("../services/startup", () => ({
  startupSyncDefaultPromptsFromFilesOncePerSession: vi.fn().mockResolvedValue(undefined),
  startupSyncModelPricesOnce: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../services/settings", async () => {
  const actual =
    await vi.importActual<typeof import("../services/settings")>("../services/settings");
  return {
    ...actual,
    settingsGet: vi.fn(),
  };
});

import { listenAppHeartbeat } from "../services/appHeartbeat";
import { setCacheAnomalyMonitorEnabled } from "../services/cacheAnomalyMonitor";
import { listenGatewayEvents } from "../services/gatewayEvents";
import { listenNoticeEvents } from "../services/noticeEvents";
import { settingsGet } from "../services/settings";
import {
  startupSyncDefaultPromptsFromFilesOncePerSession,
  startupSyncModelPricesOnce,
} from "../services/startup";
import {
  listenTaskCompleteNotifyEvents,
  setTaskCompleteNotifyEnabled,
} from "../services/taskCompleteNotifyEvents";

async function renderApp() {
  const { default: App } = await import("../App");
  const client = createTestQueryClient();
  return render(
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  );
}

describe("App bootstrap", () => {
  beforeEach(() => {
    vi.mocked(listenAppHeartbeat).mockResolvedValue(() => {});
    vi.mocked(listenGatewayEvents).mockResolvedValue(() => {});
    vi.mocked(listenNoticeEvents).mockResolvedValue(() => {});
    vi.mocked(listenTaskCompleteNotifyEvents).mockResolvedValue(() => {});
    vi.mocked(startupSyncModelPricesOnce).mockResolvedValue(undefined);
    vi.mocked(startupSyncDefaultPromptsFromFilesOncePerSession).mockResolvedValue(undefined);
    vi.mocked(settingsGet).mockResolvedValue(
      createTestAppSettings({
        enable_cache_anomaly_monitor: true,
        enable_task_complete_notify: false,
      })
    );
  });

  it("wires listeners, startup tasks, and settings-driven toggles", async () => {
    await renderApp();

    await vi.waitFor(() => {
      expect(listenAppHeartbeat).toHaveBeenCalledTimes(1);
      expect(listenGatewayEvents).toHaveBeenCalledTimes(1);
      expect(listenNoticeEvents).toHaveBeenCalledTimes(1);
      expect(listenTaskCompleteNotifyEvents).toHaveBeenCalledTimes(1);
      expect(startupSyncModelPricesOnce).toHaveBeenCalledTimes(1);
      expect(startupSyncDefaultPromptsFromFilesOncePerSession).toHaveBeenCalledTimes(1);
      expect(setCacheAnomalyMonitorEnabled).toHaveBeenCalledWith(true);
      expect(setTaskCompleteNotifyEnabled).toHaveBeenCalledWith(false);
    });
  });
});
