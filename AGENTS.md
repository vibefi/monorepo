# AGENTS

- For `gh pr create`, always provide the PR body via heredoc and `--body-file -` instead of inline `--body`.
- Ignore `contracts/lib/*` submodules when syncing monorepo submodule pointers; these are managed by Foundry.
- Ignore `dapp-examples/zfi` when syncing monorepo submodule pointers.
