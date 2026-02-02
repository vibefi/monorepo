# VibeFi CLI Governance Simulation Spec (Minimal CLI)

Goal: enable a local flow to package a dapp, propose it, vote on it, queue, and execute — without adding chain control commands (no `chain:mine` or `chain:time`) to the CLI.

This keeps the CLI focused on protocol interactions while relying on external tools (anvil, cast) for chain manipulation during tests or devnet flows.

---

## Scope

In scope:
- `package` -> (optional IPFS publish) -> returns `rootCid`
- `dapp:propose` -> submits proposal
- `vote:cast` -> casts votes
- `proposals:queue` -> queues proposal in Governor/Timelock
- `proposals:execute` -> executes proposal
- `dapp:list` -> verifies publish via registry events

Out of scope:
- Any CLI commands that directly manipulate chain time or blocks (e.g. `chain:mine`, `chain:time`)
- IPFS pin management beyond a single `add` during `package`

---

## New CLI Commands

### `proposals:queue`

Usage:
```
vibefi proposals:queue <proposalId> [--from-block <n>] [--to-block <n>] [--json]
```

Behavior:
- Find the `ProposalCreated` log for `proposalId`
- Compute `descriptionHash = keccak256(toBytes(description))`
- Call `VfiGovernor.queue(targets, values, calldatas, descriptionHash)`
- Print tx hash + decoded logs

Optional (non-blocking):
- Read `state(proposalId)` and warn if not `Succeeded`

### `proposals:execute`

Usage:
```
vibefi proposals:execute <proposalId> [--from-block <n>] [--to-block <n>] [--json]
```

Behavior:
- Same log discovery as `queue`
- Call `VfiGovernor.execute(targets, values, calldatas, descriptionHash)`
- Print tx hash + decoded logs

Optional (non-blocking):
- Read `state(proposalId)` and warn if not `Queued`

---

## External Chain Control (Required for Devnet Simulation)

Use external tools instead of adding CLI commands:

Advance blocks:
```
cast rpc anvil_mine 1 --rpc-url http://127.0.0.1:8546
```

Advance time + mine:
```
cast rpc evm_increaseTime [SECONDS] --rpc-url http://127.0.0.1:8546
cast rpc anvil_mine 1 --rpc-url http://127.0.0.1:8546
```

---

## E2E Test Flow (Updated)

1) `vibefi package` -> `rootCid`
2) `vibefi dapp:propose ...`
3) External `anvil_mine` to pass voting delay
4) `vibefi vote:cast ...`
5) External `anvil_mine` to pass voting period
6) `vibefi proposals:queue ...`
7) External `evm_increaseTime` to pass timelock
8) `vibefi proposals:execute ...`
9) `vibefi dapp:list` -> confirm `Published` status + rootCid

---

## Notes / Open Questions

- Should `queue/execute` enforce proposal state checks or only warn?
- Do we want a helper to fetch Governor parameters (voting delay/period) for tooling?
- Should devnet scripts set a very low timelock delay to keep E2E fast?
