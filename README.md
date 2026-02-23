# vibefi monorepo

Decentralized governance and hosting for DeFi frontends. The protocol lets anyone propose, vote on, and publish dapp frontends via on-chain governance and IPFS, with builds verified locally by each user.

## Submodules

| Directory | Description |
|-----------|-------------|
| `cli/` | Bun/TypeScript CLI for proposing, voting, packaging, and managing dapps |
| `client/` | Wry (Rust) desktop app that fetches, builds, and runs approved dapps |
| `contracts/` | Foundry/Solidity DAO, token, registry, and deployment scripts |
| `dapp-examples/` | Example dapps used for local testing, packaging, and integration validation |
| `docs/` | Docusaurus documentation site |
| `e2e/` | End-to-end tests covering the full governance + IPFS flow |
| `gov-agent/` | Rust governance voting agent for VibeFi DAO |
| `lander/` | Landing page site |
| `studio/` | Browser studio app for composing, previewing, and publishing dapp content |

See [SETUP.md](SETUP.md) for prerequisites, repo layout, and how to run everything.

## Quick start

```bash
git clone --recursive https://github.com/vibefi/monorepo.git
cd monorepo
bun install
```

Then follow the instructions in [SETUP.md](SETUP.md).

## CI

GitHub Actions runs monorepo e2e on pushes/PRs to `master` via `.github/workflows/e2e.yml`.

- If `OPENAI_API_KEY` is set in repo secrets, CI runs `bun run e2e -- --gov-agent`.
- Otherwise CI runs baseline `bun run e2e`.
