import { useEffect } from "react";
import { useAsyncListener } from "../hooks/useAsyncListener";
import { useGatewayQuerySync } from "../hooks/useGatewayQuerySync";
import { useStartupTask } from "../hooks/useStartupTask";
import { logToConsole } from "../services/consoleLog";
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

export function useAppBootstrap() {
  useGatewayQuerySync();

  useAsyncListener(listenAppHeartbeat, "listenAppHeartbeat", "应用心跳监听初始化失败");
  useAsyncListener(listenGatewayEvents, "listenGatewayEvents", "网关事件监听初始化失败");
  useAsyncListener(listenNoticeEvents, "listenNoticeEvents", "通知事件监听初始化失败");
  useAsyncListener(
    listenTaskCompleteNotifyEvents,
    "listenTaskCompleteNotifyEvents",
    "任务结束提醒监听初始化失败"
  );

  useEffect(() => {
    settingsGet()
      .then((settings) => {
        if (!settings) return;
        setCacheAnomalyMonitorEnabled(settings.enable_cache_anomaly_monitor ?? false);
        setTaskCompleteNotifyEnabled(settings.enable_task_complete_notify ?? true);
      })
      .catch((error) => {
        logToConsole("warn", "启动缓存异常监测开关同步失败", {
          stage: "startupSyncCacheAnomalyMonitorSwitch",
          error: String(error),
        });
      });
  }, []);

  useStartupTask(startupSyncModelPricesOnce, "startupSyncModelPricesOnce", "启动模型定价同步失败");
  useStartupTask(
    startupSyncDefaultPromptsFromFilesOncePerSession,
    "startupSyncDefaultPromptsFromFilesOncePerSession",
    "启动默认提示词同步失败"
  );
}
