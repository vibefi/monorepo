## Repo Structure

- monorepo: root that owns submodules
    - client: User-first / agent-first interface for interacting with [vibe.fi](http://vibe.fi) "vapps"
        - Wry, Rust
    - studio: Developer-first / agent-first interface for proposing, voting, publishing
        - React, viem, wagmi, TypeScript
    - contracts: DAO, Token, VibeGateway
        - Foundry, Solidity, Mainnet-only
        - Events-based indexing with linked-list pointing to previous block (so it can back fill)
    - dapp-examples: example vapps and integrations
