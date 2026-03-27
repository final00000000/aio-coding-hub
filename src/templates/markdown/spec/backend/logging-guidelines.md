# Logging Guidelines

> How logging is done in this project.

---

## Overview

Logging should make startup, gateway, and integration failures diagnosable
without leaking secrets.

---

## Log Levels

- `debug`: high-frequency flow details and internal decisions
- `info`: successful state transitions worth auditing
- `warn`: degraded or recoverable behavior
- `error`: user-visible failures, startup failure, or integration failure

---

## Structured Logging

- Include stable identifiers such as `trace_id`, `cli_key`, `provider_id`, and
  `error_code` when they exist.
- Prefer structured fields over string-only logs for gateway and command flows.
- When logging cleanup or launcher behavior, log the lifecycle event, not the
  file contents.

---

## What to Log

- Startup and shutdown state transitions
- OAuth / opener failures
- Gateway circuit and routing transitions
- Explicit cleanup failures that could leave drift or stale files behind

---

## What NOT to Log

- API keys, bearer tokens, refresh tokens, or temp config file contents
- Full prompt/request bodies unless explicitly sanitized for diagnostics
- Secrets copied into launcher scripts or temp JSON

---

## Internal Gateway Helper Traffic

Requests such as Claude `/v1/messages/count_tokens`, warmup probes, and other
gateway-generated helper traffic are **infra traffic by default**, not normal
user-visible request history.

- Do not treat `excluded_from_stats=true` as meaning "safe to still show in the
  default UI". Visibility and statistics are separate contracts.
- Infra-only helper traffic should not emit the normal
  `gateway:request_start`, `gateway:attempt`, or `gateway:request` events used
  by overview cards, logs pages, and task-complete heuristics.
- Infra-only helper traffic should not be written into the default request-log
  list unless there is an explicit diagnostic requirement.
- If diagnostic retention is required, route it to a debug-only surface or a
  separately labeled log path so the main request history stays focused on
  user-visible work.
