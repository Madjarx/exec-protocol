#!/usr/bin/env bash

NETWORK=${1:-local}

set -e

source ./scripts/lib/shared.sh

echo_announce

# strategy 1
npx hardhat "checkfunds" --network "$NETWORK"

# strategy 2
docker-compose run bot npx hardhat "checkfunds" --network "$NETWORK"