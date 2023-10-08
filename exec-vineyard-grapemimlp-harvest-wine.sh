#!/bin/bash

NETWORK=${1:-local}
AMOUNT=${2:-0}

source ./src-nvm.sh

npx hardhat poolclaim --network "$NETWORK" --protocol grapefinance-vineyard --pool grapemimlp --amount "$AMOUNT"
