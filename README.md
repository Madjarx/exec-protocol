nvm **Fork avalanche mainnet in a separate terminal:**

  

```

npx hardhat node --fork https://api.avax.network/ext/bc/C/rpc  

```

  

** Feature Pay: **
```bash
npx hardhat pay --person michael --amount 2500 --origin VINEYARD_GRAPE_WINE_LP_STAKED --network local
```
available options for person: ```michael, matt, mukhtar, dan```
available options for origin: ```WINE, MIM, GRAPE, VINEYARD_GRAPE_WINE_LP_STAKED, VINEYARD_GRAPE_MIM_LP_STAKED, VINEYARD_MIM_WINE_LP_STAKED```

*to-do/in-process: ```WINERY_GRAPE_STAKED; VINEYARD_GRAPE_STAKED```

  

**Flow commands:**

  

  

1- Swap AVAX for MIM at TraderJoe:

  

```bash

  

npx hardhat swapnative --network local --protocol traderjoe --tokenin wavax --tokenout mim --amount 1000.0

  

```

  

  

2- Swap MIM for GRAPE at TraderJoe:

  

```bash

  

npx hardhat swaptokens --network local --protocol traderjoe --tokenin mim --tokenout grape --amount 20000.0

  

```

  

  

3- Add Liquidity to GRAPEMIMLP at TraderJoe:

  

```bash

  

npx hardhat addliquidity --network local --protocol traderjoe --token1 grape --token2 mim --amount1 4000.0 --amount2 2920.0

  

```

  

  

4- Deposit GRAPEMIMLP at the Vineyard:

  

```bash

  

npx hardhat deposit --network local --protocol grapefinance-vineyard --amount 1900.0 --liquiditypair grape-mim-lp

  

```

  

  

5.1. - Claim $WINE from the GRAPEMIMLP pool at the Vineyard:

  

```bash

  

npx hardhat poolclaim --network local --protocol grapefinance-vineyard --pool grapemimlp --amount 0

  

```

  

5.2. - Claim $WINE from NODE-WINE:

  

```bash

  

npx hardhat claim --network local --protocol grapefinance-winenode

  

```

  

5.3. - Claim $GRAPE from NODE-GRAPE:

  

```bash

  

npx hardhat claim --network local --protocol grapefinance-grapenode

  

```

  

  

6.1 - Stake $WINE at the Winery:

  

```bash

  

npx hardhat stake --network local --protocol grapefinance-winery --token wine --amount 1.0

  

```

  

6.2 - Stake $GRAPE at the Vineyard:

```bash

  

npx hardhat stake --network local --protocol grapefinance-vineyard --token grape --amount 10.0

  

```

  

7- Claim $GRAPE from the Winery: (CHECKED OK MAINNET) -- after claim there is a 12h lockup (2 epochs).

  

```bash

  

npx hardhat claim --network local --protocol grapefinance-winery

  

```

  

  

8- Buy GRAPE Node:

  

```bash

  

npx hardhat buynode --network local --protocol grapefinance-grapenode --node grape --amount 50.0

  

```

  

9- Buy WINE Node:

  

```bash

  

npx hardhat buynode --network local --protocol grapefinance-winenode --node wine --amount 0.5

  

```

  

  

Other available commands:

  

```bash

  

npx hardhat checkfunds --network local

  

```

  

  

```bash
npx hardhat mine --network local
```
    

```bash
npx hardhat journal --network local
```

  

Withdraw GRAPE-MIM-LP Liquidity at Vineyard

  

```bash

  

npx hardhat poolclaim --network local --protocol grapefinance-vineyard --pool grapemimlp --amount 10

  

```

  

  

Remove GRAPE-MIM-LP Liquidity at Trader Joe:

  

```bash

  

npx hardhat removeliquidity --network local --protocol traderjoe --liquiditypair grape-mim-lp --token1 grape --token2 mim --amount 100.0

  

```

  

  

Swap MIM for WINE at TraderJoe:

  

```bash

  

npx hardhat swaptokens --network local --protocol traderjoe --tokenin mim --tokenout wine --amount 1000.0

  

```

  
Withdraw GRAPE staked at the VINEYARD:
```bash
npx hardhat poolclaim --network local --protocol grapefinance-vineyard --pool vineyard --amount 10
```
  
Withdraw WINE staked at the WINERY:
```bash
npx hardhat withdraw --network local --protocol grapefinance-winery --pool winery --amount 0.5
```
  


**Flows:**

  

```

  

npx hardhat grapeFlow05 --network local

  

```

  
  

```bash

  

npx hardhat simGrapeFlow05 --network local

  

```


