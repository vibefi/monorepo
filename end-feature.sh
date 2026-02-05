#!/usr/bin/env bash
set -euo pipefail

echo "Fetching and switching all submodules to master..."
git submodule foreach 'git fetch origin && git checkout master && git pull origin master'

echo "Fetching and switching monorepo to master..."
git fetch origin
git checkout master
git pull origin master

echo "Done! All repos now on master and up to date."
