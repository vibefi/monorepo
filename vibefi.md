# vibefi

Status: In progress

Collectively sourced, vibe-coded frontends to popular defi protocols. Could basically serve all of DeFi with this, just vibe coding as you go. Choosing best version with token votes. Eventually have all encompassing DeFi portal that has been procedurally generated. Maybe should be built with local LLMs only, running on each node? Could parse contract and ABI, look at existing onchain interactions. Could require bonds for proposals which if found out to be malicious that bond goes to security budget. 

“Built by humans and agents for humans and agents”

Two software deliverables:

- VibeFi Client (desktop / mobile application, MCP server)
    - WalletConnect (potentially built in wallet)
    - RPC proxying
    - IPFS node
    - Build system
- VibeFi Studio (can be a website, CLI, agent)
    - Diff viewer
    - IPFS publisher
    - DAO proposer
- Potentially:
    - Centralized, built and deployed version run by someone
    - Good way to onboard / test but shouldn’t really be used
    - Do we even want this?

Value prop:

- Decentralized hosting of DeFi Frontends on IPFS gets you frontends that
    - are censorship resistant
    - respect your privacy, don’t track your wallets / fingerprint your browser / send analytics and make thousands of external calls
    - depend only on ethereum JSON-RPC
    - can optionally talk to a local node or an in-browser ethereum light client
    - do not disappear when the team decides they want to wind down the project, potentially getting your funds stuck
    - are immutable and therefore much more resistant to supply chain attacks, phishing, etc (attack surface changes, but is undeniably much smaller)
    - are open source and allow collaboration of agents, individuals, companies, vibe coders, etc
    - are explicitly user first in their design decisions/etc.
- The review process gets you
    - distributed safety guarantees of many LLMs reviewing the code

Labs:

Hosted / gated vibe coding interface over Telegram / Discord. Deposit some tokens into contract that we can burn for them. Enough to run a VM with takopi. BYOCrecentials. 

Build the constraints and ask an agent to code a frontend with these constraints in mind. 

Architecture:

- Single smart contract which gets DAO proposals for new dapps and dapp updates
- These are voted on by the DAO as to whether or not they should enter the protocol
- If so, latest set of code changes is uploaded to IPFS
- Anyone can submit code, but the biggest protocol issue is in making sure that the approved frontend code is the code that users actually run - reproducible builds for frontend basically aren’t a thing to the extent that it needs to be yet
    - To address this, protocol runs a local client. Local client is written in Electron, but comes with a bundled nodejs runtime and compiler.
    - Protocol enforces that changes and new dapps are basically tsx and assets only, with a very small number of approved external packages allowed, each of these being audited
    - Users run local client, it looks at the smart contract’s approved apps. These consist of some json that specifies IPFS content IDs for the app. So everything in `src`, `assets` etc of a frontend. Client then compiles these locally with a known version of node.
    - This addresses the reproducibility function by only needing reviewers to look at the actual frontend code, there’s no trust issue wherein you have to ask “does this compiled JS bundle actually represent what has been audited as safe?”

Protocol mechanics / roles / tokenomics:

- Native token is Vibefi (VFI)
- DAO members
    - Can vote on proposals, eventually these votes result in new apps being published on the aforementioned smart contract
    - Proposals can either be approved, rejected, or slashed
    - May be skilled auditors, developers, or just decentralization maxis
- Proposers
    - Basically developers or entities which want to propose new dapps
    - Need to stake an amount of VFI in order to make proposals, disincentivies malicious apps
- Delegates
    - Experienced engineers who are DAO member nominated and potentially incentivized. Protocol or protocol frontends highlight their reviews to end users, their opinions are respected vis-a-vis whether a change should be included
    - Ensure that no code in any proposal is malicious, misleading, etc, and is aligned with protocol core values
- Security Council
    - Protocol category designed to disappear in time. Can intervene in new apps if a malicious app is found. Small council, protocol incentivized, made up of experienced and well known figures in the Ethereum space (think samcszun etc)
- “disposable procedurally generated interfaces”
    - Speed of Deployment: "Vibe-coding" via LLMs could allow the community to spin up frontends for new or obscure protocols instantly, without waiting for an official team to build one.

- [ ]  Come up with constraints.md
    - [ ]  Specific node, react, typescript, viem, material-ui /shadcn version (these should be DAO governed IPFS JSON list)
    - [ ]  manifest.json (schema required)
    - [ ]  addresses.json
    - [ ]  abis (json)
    - [ ]  src (ts, tsx)
    - [ ]  assets (webp only)
    - [ ]  index.html
    - [ ]  No HTTP access
- [ ]  Provide an agent with Uniswap V2 ABI, contract addresses and [constraints.md](http://constraints.md).
- [ ]  Provided to JS engine:
    - [ ]  RPC URL which is a proxy to user provided RPC URLs, does load balancing etc.
    - [ ]  window.ethereum which is a proxy to users wallet
- [ ]  Bottlenecked by RPC for good UX
    - [ ]  Dig up Ross onchain router
    - [ ]  Joel re onchain indexing
    - [ ]  Light clients
- [ ]  Success criteria
    - [ ]  Can you interact with favourite protocols?
    - [ ]  Can you easily add missing protocols?
    - [ ]  Can you easily add new protocols that are not public yet?

**Initial agentic frontend creation prompt:**

Given you have a package.json with react 19.2.4, typescript 5.9.3, wagmi 3.4.1, viem 2.45.0, shadcn 3.7.0, vite 7.2.4. You cannot use any other libraries, if you need one and cannot easily code around it, stop and ask for it.

You have RPC_URL variable available in your environment which contains a working Ethereum RPC endpoint. You have window.ethereum which is the users connected wallet. You cannot make arbitrary HTTP calls, only RPC calls.

Deliver a bundle containing:

- src/ (ts and tsx only)
- assets/ (webp only)
- abis/ (json only)
- addresses.json (deployed addresses needed for protocol)

If you need any clarifications, stop and ask before developing.

Create an app to interact with UniswapV2 on Ethereum mainnet. Check existing onchain interactions for this protocol to learn how to interact with it.

## Repo Structure

- contracts: DAO, Token, VibeGateway
    - Foundry, Solidity, Mainnet-only
    - Events-based indexing with linked-list pointing to previous block (so it can back fill)
- studio: Developer-first / agent-first interface for proposing, voting, publishing
    - React, viem, wagmi, TypeScript
- client: User-first / agent-first interface for interacting with [vibe.fi](http://vibe.fi) "vapps"
    -