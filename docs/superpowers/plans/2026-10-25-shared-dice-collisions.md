# Shared Dice Collisions Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement inline.

**Goal:** Let dice from separate rolls collide with all other visible dice.
**Architecture:** Extend simulateDice with initial rigid-body states and sampled continuation; replace independent render batches with one shared timeline and retained die records.
**Tech Stack:** Existing cannon-es, Three.js, React, Node, Playwright.
**Spec:** ../specs/2026-10-25-shared-dice-collisions-design.md

## Global constraints
- Preserve gameplay roll records, result totals and original face labels. Older dice may turn over when bumped; history remains authoritative.
- Retain at most 18 physical/rendered dice and one WebGL canvas/context, with existing accessibility and fallback behavior.
- No dependency changes or new random rolls.

## Review focus
- Continuing in-flight dice preserves momentum/orientation; sleeping dice remain asleep until impacted.
- Retained mixed-size dice keep their collider size and labels when new dice change the default radius.
- Pruned dice disappear from physics as well as graphics; delayed-load bursts coalesce once with individual styles.
- A new roll interrupts hold/fade without an earlier deadline hiding moving dice; hidden-tab time stays paused.
- New roll faces match recorded outcomes; older fixed labels can show different top faces after physical impacts, without changing saved results.

### Task 1: Shared physics continuation
**Files:** src/lib/dicePhysics.js, tests/dice-physics.mjs.
**Interfaces:** simulateDice(dice,{aspect,initialStates}); sampleDiceSimulation(simulation,progress) returns per-ID rigid-body states with radius. Keep existing frames’ position/quaternion prefix; include velocities and sleep state for continuation.
- [x] Add failing tests for continued pose/momentum, two-body collision impulses and waking sleeping dice; preserve existing shape/results/containment stress checks.
- [x] Implement initial-state restoration, sampling, per-body radii and collision-pair evidence. Verify all physics checks pass.

### Task 2: Shared rendering and roll queue
**Files:** src/lib/diceRenderer.js, src/DiceAnimation.jsx, tests/browser-continuous-dice.mjs, tests/helpers/dice-collisions.mjs.
**Interfaces:** renderer.addBatches([{dice,style}]) performs one continuation; addDice remains a one-batch wrapper. One shared scene timeline reuses retained meshes and fixed labels.
- [x] Add a failing browser assertion that a burst of separate single-die rolls has collisions (the old worlds have none).
- [x] Integrate shared timeline and lazy queue coalescing, pruning, metadata, pause and cleanup.
- [x] Run physics, continuous-dice, presentation, production-loading, npm test and build checks; inspect rendered frames, obtain independent review and fix material findings. Publish the verified branch as a reviewable PR.

## Execution ledger
- Base: merged main 527d997. Read the installed Cannon Quaternion/Body APIs locally; existing library supports quaternion slerp and sleeping-body restoration.
- Root cause: addDice currently calls simulateDice for only the new batch and stores isolated timelines. Baseline 1/6/18-die simulations settled in about 17/44/94 ms locally; batching queued rolls avoids repeated large upfront simulations.
- Red/green: the new physics check failed because supplied old positions were ignored; the browser check failed because separate single-die worlds reported zero collisions. Both pass after shared continuation.
- Physics snapshots now include velocities and sleeping state after the unchanged position/quaternion prefix. Continuation restores per-ID state and collider radius; new/old contact pairs are recorded. Tests verify an actual impulse waking and moving a resting die, source-state immutability, mixed collider sizes and 24 continued mixed-shape narrow-screen segments with pruning.
- Renderer now retains one timeline and die records. Old meshes/labels remain fixed, new meshes use their shared-simulation outcomes, and old visual faces may turn over naturally while recorded results remain unchanged. Pending lazy-load rolls are coalesced once with individual styles; removed meshes also leave the next physical world.
- Added a deterministic real-renderer probe: 18 dice settle, a later d20 physically contacts retained sleeping dice, and the evicted die is absent from collision pairs. Mixed queued styles and new die outcomes are checked. The collision assertion for the lazy-load burst remains in the main app flow; the deterministic probe avoids relying on timing-sensitive contacts in a small random burst.
- Final verification passed: node tests/dice-physics.mjs, node tests/browser-continuous-dice.mjs, node tests/browser-presentation.mjs, node tests/browser-loading.mjs, npm test, npm run build and git diff --check. Existing build chunk-size warnings remain. Checked moving/settled and mixed-style rendered screenshots; source result/percentile, floor/wall, reduced-motion and fallback checks passed.
- Independent read-only review found no actionable issues or deferred findings, including installed Cannon sleep/interpolation behavior.
