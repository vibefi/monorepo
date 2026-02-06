# VibeFi Monorepo Refactoring Changelog

Completed 2026-02-06. Seven agents across four waves.

---

## 1. Shared Package (`packages/shared/`)

Created a new workspace package `@vibefi/shared` that extracts common code from the CLI into a reusable library consumed by `cli/`, `e2e/`, and potentially `client/` in the future.

### Root workspace

Created `/monorepo/package.json` to define the Bun workspace:
```json
{ "name": "vibefi-monorepo", "private": true, "workspaces": ["packages/*", "cli", "e2e"] }
```

### Package structure

```
packages/shared/
  package.json          @vibefi/shared, viem ^2.45.0
  tsconfig.json         ES2022, Bundler resolution, strict
  src/
    index.ts            barrel re-exports (53 lines)
    abi.ts              ABI re-exports + event constants (41 lines)
    config.ts           types + portable config functions (88 lines)
    clients.ts          viem client constructors (43 lines)
    fs-utils.ts         ensureDir, walkFiles (27 lines)
    ipfs.ts             ipfsAdd, computeIpfsCid, fetch/download (112 lines)
    constants.ts        DEFAULT_IPFS_API/GATEWAY/ANVIL_PORT/RPC_URL (4 lines)
    abis/
      VfiGovernor.json
      DappRegistry.json
      VfiToken.json
```

Total: 367 lines of TypeScript across 7 source files + 3 ABI JSONs.

### Exported API

| Module | Exports |
|--------|---------|
| `abi` | `governorAbi`, `dappRegistryAbi`, `vfiTokenAbi`, `proposalCreatedEvent`, `dappPublishedEvent`, `dappUpgradedEvent`, `dappMetadataEvent`, `dappPausedEvent`, `dappUnpausedEvent`, `dappDeprecatedEvent` |
| `config` | Types: `ContractsConfig`, `NetworkConfig`, `VibefiConfig`, `DevnetJson`. Functions: `resolveRpcUrl`, `resolveDevnetJson`, `loadDevnetJson`, `resolveContracts`, `resolveChainId`, `resolveFromBlock` |
| `clients` | `buildChain`, `getPublicClient`, `getWalletClient`, `resolvePrivateKey` |
| `fs-utils` | `ensureDir`, `walkFiles` |
| `ipfs` | `ipfsAdd`, `computeIpfsCid`, `fetchDappManifest`, `downloadDappBundle`, `normalizeGateway` |
| `constants` | `DEFAULT_IPFS_API`, `DEFAULT_IPFS_GATEWAY`, `DEFAULT_ANVIL_PORT`, `DEFAULT_RPC_URL` |

### Key design decisions

- **Bun-native**: `main` and `types` both point at `src/index.ts` (no build step; Bun resolves TS directly)
- **`resolvePrivateKey` simplified**: removed unused `network` parameter that was always passed as `{}`
- **`ipfsAdd` unified**: merges the old `publishToIpfs` (from package.ts) and `computeIpfsCid` (from ipfs.ts) into a single function with `{ pin?, onlyHash? }` options. `computeIpfsCid` kept as thin wrapper for backward compat.
- **`walkFiles` unified**: merged two nearly-identical directory walkers (from package.ts and ipfs.ts) with a `{ skipDotfiles?: boolean }` option
- **CLI-specific functions excluded**: `ensureConfig`, `getConfigPath`, `resolveNetwork` stayed in CLI as `cli-config.ts`

---

## 2. Contracts Fixes (`contracts/`)

### Modified files

**`script/local-devnet.sh`** - Removed duplicate `FORK_URL="${FORK_URL}"` on line 18 (line 25 already handles the fallback with `:-`).

**`script/LocalDevnet.s.sol`** - Added `securityCouncil2` address and `securityCouncil2PrivateKey` to the JSON output. Previously only council1 was serialized; council2 was logged to console but missing from devnet.json. The CLI's `DevnetJson` type already had optional fields for these.

**`script/DeployVibeFi.s.sol`** - Removed dead `configureRoles` function (4 lines, never called; role configuration is already done inline in `deploy()`).

**`specs/vibefi-dao-contracts-spec.md`** - Added historical note at top pointing to contracts/README.md as source of truth.

### New files

**`.env.example`** - Template with `FORK_URL=` placeholder.

---

## 3. Markdown Cleanup

### Deleted files (3)

| File | Reason |
|------|--------|
| `AGENTS.md` | Stale, redundant with SETUP.md |
| `vibefi.md` | Brainstorming doc, outdated (references Electron; client uses Wry) |
| `vibefi-cli-governance-sim.md` | Fully implemented, superseded by cli/SPEC.md |

### Updated files (6)

| File | Changes |
|------|---------|
| `README.md` | Replaced one-liner with proper intro: submodule table, link to SETUP.md, quick start instructions |
| `SETUP.md` | Added e2e/ and studio/ to repo layout, fixed smoke-test path (.ts not .sh), updated E2E section to point at e2e/ submodule, added packages/shared/ entry |
| `cli/README.md` | Updated E2E section to reference e2e/ submodule, added note about @vibefi/shared |
| `cli/SPEC.md` | Removed "IPFS publishing" from Non-Goals (it's implemented), fixed smoke test path |
| `client/DEVNET_TODO.md` | Removed completed "Implemented in this branch" items, kept MVP gaps |
| `contracts/specs/vibefi-dao-contracts-spec.md` | Added historical note pointing to contracts/README.md |

---

## 4. Client Refactor (`client/src/`)

Split `main.rs` from 1585 lines into 7 files totaling 1608 lines (net +23 from module declarations and `pub` visibility).

### New modules

| File | Contents | Lines |
|------|----------|-------|
| `state.rs` | `Chain`, `IpcRequest`, `UserEvent`, `ProviderInfo`, `WalletState`, `AppState`, `LauncherConfig` + impls | 76 |
| `devnet.rs` | `DevnetConfig`, `DevnetContext`, `DappInfo`, `list_dapps`, `rpc_get_logs`, event handling, `sol!` events, hex utils | 474 |
| `bundle.rs` | `BundleConfig`, `BundleManifest`, `verify_manifest`, `build_bundle`, `walk_files`, IPFS functions, standard build file consts | 165 |
| `ipc.rs` | `handle_ipc`, `handle_launcher_ipc`, `respond_ok`/`respond_err`, emit events, `is_rpc_passthrough`, `proxy_rpc` | 309 |
| `webview.rs` | `INIT_SCRIPT`, `build_webview` | 229 |
| `menu.rs` | `setup_macos_app_menu` (`#[cfg(target_os = "macos")]`) | 120 |

### Slimmed `main.rs` (235 lines)

Module declarations, statics (`INDEX_HTML`, `LAUNCHER_HTML`, `DEMO_PRIVKEY_HEX`), `parse_args`, `main()`.

### Key fixes

- **`LauncherConfig::from_args()`** - Deduplicated identical construction blocks (was repeated twice at old lines 530-548 and 561-579)

---

## 5. CLI Refactor (`cli/`)

Rewired CLI to import from `@vibefi/shared` and split the 421-line `shared.ts` into focused modules.

### New files (5)

| File | Contents | Lines |
|------|----------|-------|
| `src/cli-config.ts` | CLI-specific: `ensureConfig()`, `getConfigPath()`, `resolveNetwork()` | 33 |
| `src/commands/context.ts` | `withCommonOptions`, `loadContext`, `getWalletContext`, `roleHint`, `toJson` | 97 |
| `src/commands/output.ts` | `DecodedLog`, `fetchTxLogs`, `printDecodedLogs`, `printTxResult` | 101 |
| `src/commands/governor.ts` | `proposalStateNames`, `fetchProposalLogs`, `readProposalState`/`Snapshot`/`Deadline`/`Votes`, `readQuorum`, `buildVetoDescriptionHash`, `findProposalByIdOrThrow`, `getGovernorAddress` | 132 |
| `src/commands/registry.ts` | `fetchDappLogs`, `encodeRootCid`, `encodeProposeCalldata`, `getDappRegistryAddress`, `getTokenAddress`, `readTokenDecimals` | 126 |

Total: 489 lines across 5 new files.

### Deleted files (8)

| File | Reason |
|------|--------|
| `src/abi.ts` | Moved to `@vibefi/shared` |
| `src/clients.ts` | Moved to `@vibefi/shared` |
| `src/config.ts` | Portable parts moved to `@vibefi/shared`; CLI parts to `cli-config.ts` |
| `src/ipfs.ts` | Moved to `@vibefi/shared` |
| `src/abis/VfiGovernor.json` | Moved to `@vibefi/shared` |
| `src/abis/DappRegistry.json` | Moved to `@vibefi/shared` |
| `src/abis/VfiToken.json` | Moved to `@vibefi/shared` |
| `src/commands/shared.ts` | Split into context.ts, output.ts, governor.ts, registry.ts |

Net deletion: **1,209 lines removed** from CLI (per git diff --stat).

### Modified files (8)

| File | Changes |
|------|---------|
| `package.json` | Added `"@vibefi/shared": "workspace:*"` dependency |
| `src/commands/council.ts` | Updated imports to use split modules + `@vibefi/shared` |
| `src/commands/dapp.ts` | Updated imports to use split modules + `@vibefi/shared` |
| `src/commands/package.ts` | Updated imports |
| `src/commands/proposals.ts` | Updated imports, uses `findProposalByIdOrThrow` and `getGovernorAddress` |
| `src/commands/status.ts` | Updated imports |
| `src/commands/vote.ts` | Updated imports, uses `formatUnits` directly (removed `formatUnitsSafe` wrapper) |
| `src/package.ts` | Imports `ensureDir`, `walkFiles`, `ipfsAdd` from `@vibefi/shared`; removed local duplicates; replaced `publishToIpfs(outDir, ipfsApi)` with `ipfsAdd(outDir, ipfsApi, { pin: true })` |

### New helper functions

- **`printTxResult(ctx, hash, label?)`** - Replaces 6x repeated wait-for-receipt + print-logs pattern across command files
- **`findProposalByIdOrThrow(client, governor, proposalId)`** - Replaces 4x repeated proposal lookup + existence check
- **`getGovernorAddress(ctx)`** - Replaces 6x inline governor address null-checks

---

## 6. E2E Refactor (`e2e/`)

### Modified files (2)

**`package.json`** - Added `"@vibefi/shared": "workspace:*"` dependency.

**`src/e2e.ts`** - Reduced from ~460 lines to 327 lines (-136 net).

Changes:
- Imports `getPublicClient`, `loadDevnetJson`, `governorAbi`, `DevnetJson` from `@vibefi/shared`
- Removed inline `DevnetConfig` type, uses `DevnetJson` from shared
- Replaced inline `createPublicClient` with `getPublicClient(rpcUrl)`
- Replaced inline devnet.json loading with `loadDevnetJson()`
- Replaced inline ABI filesystem read with imported `governorAbi`
- **New `runCli()` helper** - auto-appends `--rpc`, `--devnet`, `--json` and sets `cwd: cliDir`; reduces ~10 CLI invocation blocks to one-liners
- **New `waitFor()` generic** - replaces `waitForRpc` and `waitForIpfs` (identical polling pattern, now parameterized with `label` and `probe` function)
- Removed trivial `getCode` wrapper, inlined the single call

---

## Verification Results

All checks passed:

| Check | Command | Result |
|-------|---------|--------|
| Shared typecheck | `cd packages/shared && bun run tsc --noEmit` | Clean |
| CLI typecheck | `cd cli && bun run typecheck` | Clean |
| E2E typecheck | `cd e2e && bun run typecheck` | Clean |
| Rust client | `cd client && cargo check` | Clean (pre-existing snake_case warnings only) |
| Contracts | `cd contracts && FOUNDRY_PROFILE=ci forge build` | Clean (pre-existing forge-std submodule warning only) |

---

## Summary Statistics

| Area | Created | Modified | Deleted |
|------|---------|----------|---------|
| `packages/shared/` | 13 | 0 | 0 |
| `contracts/` | 1 | 4 | 0 |
| Markdown docs | 0 | 6 | 3 |
| `client/src/` | 6 | 1 | 0 |
| `cli/` | 5 | 8 | 8 |
| `e2e/` | 0 | 2 | 0 |
| **Total** | **25** | **21** | **11** |
