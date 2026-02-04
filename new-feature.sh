#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <branch-name>"
    echo "Creates a new feature branch in all submodules and the monorepo."
    exit 1
fi

BRANCH="$1"

echo "Creating branch '$BRANCH' in all submodules..."
git submodule foreach "git checkout -b $BRANCH"

echo "Creating branch '$BRANCH' in monorepo..."
git checkout -b "$BRANCH"

echo "Done! All repos now on branch: $BRANCH"
