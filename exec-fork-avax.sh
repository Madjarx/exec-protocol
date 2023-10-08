#!/usr/bin/env bash

set -e

source ./scripts/lib/shared.sh

echo_announce

ensure_nvm

yarn run fork

#npx hardhat fork --network hardhat
#npx hardhat node --network hardhat
#npx hardhat node --network hardhat --fork https://api.avax.network/ext/bc/C/rpc
#`docker-compose exec bot accounts`
