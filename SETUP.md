# VibeFi Monorepo Setup (Agent Playbook)

This document describes how to run the end-to-end flows and tests for the monorepo, including:
- CLI (governance + dapp packaging)
- Contracts devnet
- Client (Wry desktop app)
- Local IPFS for bundle publishing and fetch

## Prerequisites

### System tools
- `git`
- `bun` (latest stable)
- `node` (optional but helpful)
- `cargo` + Rust toolchain
- `docker` + `docker compose`
- `cast` + `forge` (Foundry)

### Linux (Ubuntu/Debian) build deps for client

```bash
cd client
./scripts/install-deps-ubuntu.sh
```

## Repo layout
- `contracts/` Foundry contracts + devnet script
- `cli/` Bun/TypeScript CLI
- `client/` Wry Rust app
- `e2e/` End-to-end test suite (submodule)
- `studio/` Developer/agent interface for proposing and voting
- `packages/shared/` Shared TypeScript utilities used by cli and e2e
- `dapp-examples/` sample dapps used for packaging/e2e

## Local IPFS

Start IPFS (required for full CLI e2e):

```bash
docker compose -f docker-compose.ipfs.yml up -d
```

Check:
- API: `http://127.0.0.1:5001`
- Gateway: `http://127.0.0.1:8080`

## Contracts devnet

```bash
cd contracts
./script/local-devnet.sh
```

This writes `contracts/.devnet/devnet.json` used by the CLI.

## CLI

Install deps:

```bash
cd cli
bun install
```

### CLI smoke test

```bash
cd cli
bun run test:smoke
```

### CLI full e2e

E2E tests live in the `e2e/` submodule. They require a local devnet + IPFS.

```bash
cd e2e
ANVIL_PORT=8546 IPFS_API=http://127.0.0.1:5001 IPFS_GATEWAY=http://127.0.0.1:8080 bun run test:e2e
```

The e2e flow:
- packages `dapp-examples/uniswap-v2`
- publishes to IPFS
- submits governance proposal
- votes/queues/executes
- fetches the bundle from IPFS

## Client

### Build

```bash
cd client
cargo build
```

### Run

```bash
cd client
cargo run
```

### Run with a bundled dapp

After running CLI e2e, a fetched bundle will be at:

```
cli/.vibefi/cache/<rootCid>
```

Run client with that bundle:

```bash
cd client
cargo run -- --bundle ../cli/.vibefi/cache/<rootCid>
```

The client will:
- validate `manifest.json` in the bundle
- run `bun install` and `bun x vite build` inside the bundle
- serve the compiled output in the WebView

## Notes / Troubleshooting

- If `cargo build` fails on Linux, install the GTK/WebKit deps using `client/scripts/install-deps-ubuntu.sh`.
- If IPFS is not reachable, restart the compose stack.
- If `forge` or `cast` are missing, install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

