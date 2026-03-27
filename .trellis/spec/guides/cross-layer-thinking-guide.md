# Cross-Layer Thinking Guide

> **Purpose**: Think through data flow across layers before implementing.

---

## The Problem

**Most bugs happen at layer boundaries**, not within layers.

Common cross-layer bugs:
- API returns format A, frontend expects format B
- Database stores X, service transforms to Y, but loses data
- Multiple layers implement the same logic differently
- Tauri command signatures drift from frontend wrappers after one side changes

---

## Before Implementing Cross-Layer Features

### Step 1: Map the Data Flow

Draw out how data moves:

```
Source → Transform → Store → Retrieve → Transform → Display
```

For each arrow, ask:
- What format is the data in?
- What could go wrong?
- Who is responsible for validation?

### Step 2: Identify Boundaries

| Boundary | Common Issues |
|----------|---------------|
| API ↔ Service | Type mismatches, missing fields |
| Service ↔ Database | Format conversions, null handling |
| Backend ↔ Frontend | Serialization, date formats, command drift |
| Component ↔ Component | Props shape changes |

### Step 3: Define Contracts

For each boundary:
- What is the exact input format?
- What is the exact output format?
- What errors can occur?
- Which file owns the contract?

---

## Tauri IPC Contract Checklist

Use this checklist whenever a Tauri command is added or changed.

### Input shape

- Use a **single DTO struct** when a command carries more than 3 business fields.
- Prefer `#[serde(rename_all = "camelCase")]` on command DTOs so the JS side keeps a stable shape.
- Keep UI form models and IPC DTOs separate when the UI needs different naming or defaults.

### Output shape

- Return domain DTOs with explicit field ownership instead of ad-hoc JSON maps.
- When a command is part of the stable desktop contract, add `#[specta::specta]` and export bindings.
- If Rust exposes `i64` / `u64`, decide the TypeScript bigint strategy **explicitly** during export.

### Ownership

- The Tauri command layer owns IPC shape adaptation.
- The domain layer owns validation and persistence rules.
- The frontend service layer owns the final JS wrapper used by pages/hooks.
- Generated bindings only protect the commands and types they actually export.
  If Specta covers only a subset, document that boundary explicitly and keep
  service-layer contract tests for the remaining commands.

---

## React Root Boundary Checklist

Use this when touching `src/main.tsx`, `src/App.tsx`, or global event wiring.

- Keep the root component **composition-only**: providers, router, toasts, boundaries.
- Move startup side effects into a dedicated hook such as `useAppBootstrap`.
- Keep route declarations in a dedicated module such as `src/app/AppRoutes.tsx`.
- Split unrelated synchronization work into separate effects instead of one “startup soup” effect.

---

## Common Cross-Layer Mistakes

### Mistake 1: Implicit Format Assumptions

**Bad**: Assuming date format without checking

**Good**: Explicit format conversion at boundaries

### Mistake 2: Scattered Validation

**Bad**: Validating the same thing in multiple layers

**Good**: Validate once at the entry point

### Mistake 3: Leaky Abstractions

**Bad**: Component knows about database schema

**Good**: Each layer only knows its neighbors

### Mistake 4: Wide Tauri Command Signatures

**Bad**: Changing one positional field forces fragile updates across Rust, JS wrappers, and tests

**Good**: One request object, one stable export, one wrapper mapping layer

### Mistake 5: Gating Upstream Contracts on the Wrong Identity

**Bad**: A request enters as protocol A, gets translated to protocol B, but
post-translation helpers still gate on the original `cli_key`. Upstream-only
fields like `prompt_cache_key`, `session_id`, `cache_control`, or provider
metadata then disappear silently.

**Good**: After protocol translation, re-evaluate what the *actual upstream*
expects. Run upstream-specific completion/normalization on the translated
body/headers, and keep stable cache/session identifiers across the bridge.

Bridge/failover checklist:
- When routing changes protocol, list which fields must be preserved or
  re-derived for the new upstream contract.
- Do not gate upstream helpers only on the inbound identity if failover or
  bridge logic can switch protocol later.
- Rebuild or strip protocol-specific headers when the upstream protocol changes.
  Do not forward Claude-only headers into Codex/OpenAI backends, and make sure
  target-specific identity headers such as `User-Agent`, `originator`, and
  account identifiers are switched to the actual upstream.
- Verify translated headers/body still contain stable cache/session identifiers
  before the request is sent upstream.

### Mistake 6: Treating Generated Bindings as Broader Than They Are

**Bad**: Assume `src/generated/bindings.ts` is the authoritative desktop contract
while only a few commands are actually exported through Specta.

**Good**: Make it explicit which commands are protected by generated bindings and
which still rely on handwritten service wrappers plus targeted tests.

### Mistake 7: Letting Event Names Bypass the Shared Contract

**Bad**: Define a shared `gatewayEventNames` map, but still add raw
`"gateway:*"` strings in feature modules.

**Good**: Subscribe through the shared event bus and central constants so
event-name changes fail in one place instead of silently drifting.

### Mistake 8: Letting Internal Helper Requests Leak Into User-Facing Observability

**Bad**: Treat internal helper traffic such as Claude
`/v1/messages/count_tokens`, warmup probes, or bridge housekeeping as if it
were a normal user request. The gateway then emits the usual
`request_start` / `attempt` / `request` events, writes default request-log
rows, and may even mutate provider health for traffic the user never actually
asked to inspect.

**Good**: Classify each request at the gateway boundary as either
user-visible or infra-only, then keep observability and provider-health side
effects aligned with that classification.

Internal helper checklist:
- Decide request visibility at handler entry, not later in the UI.
- If a route is infra-only, skip default `gateway:request_start`,
  `gateway:attempt`, `gateway:request`, and default request-log persistence.
- Do not let infra-only helper failures change provider cooldown / circuit
  state unless product requirements explicitly say they count toward provider
  health.
- If helper traffic must remain inspectable, expose it only through explicit
  diagnostics, not the default overview/log surfaces.

---

## Checklist for Cross-Layer Features

Before implementation:
- [ ] Mapped the complete data flow
- [ ] Identified all layer boundaries
- [ ] Defined format at each boundary
- [ ] Decided where validation happens
- [ ] Decided whether Specta bindings must be regenerated

After implementation:
- [ ] Tested with edge cases (null, empty, invalid)
- [ ] Verified error handling at each boundary
- [ ] Checked data survives round-trip
- [ ] Updated generated bindings or documented why not
- [ ] Confirmed event names and error-code constants still come from the shared source
- [ ] Classified helper/probe routes as user-visible vs infra-only and verified
      logs, events, stats, and provider-health side effects match that choice

---

## When to Create Flow Documentation

Create detailed flow docs when:
- Feature spans 3+ layers
- Multiple teams are involved
- Data format is complex
- Feature has caused bugs before
- One Tauri command is used by multiple pages or services
