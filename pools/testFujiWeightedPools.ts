import { fp } from '../lib/helpers/numbers';
import { createWeightedPool } from './helpers';
import { fujiPoolTokens } from './poolConstants';
import { toNormalizedWeights } from '../lib/helpers/weights';
const VAULT = '0x99DFAd1c64edBab922C0b9a490212a1fF53a04b6';
const WEIGHTED_POOL_FACTORY = '0x3582C64a66Ac068851E9c912eAc5c855DbE2b1E1';
const ADMIN = '0xd3F32d840f684061eEB2B6c6B78cA346C3fe0030';

async function main() {
  await createWeightedPool({
    senderAddress: ADMIN,
    name: 'BTC/ETH 50/50',
    symbol: 'BTC-ETH-5050',
    tokens: [fujiPoolTokens.WBTC.address, fujiPoolTokens.WETH.address],
    weights: toNormalizedWeights([fp(50), fp(50)]),
    initialBalances: ['5000000000', fp(100)],
    swapFeePercentage: fp(0.002),
    weightedPoolFactoryAddress: WEIGHTED_POOL_FACTORY,
    vaultAddress: VAULT,
  });

  await createWeightedPool({
    senderAddress: ADMIN,
    name: 'BTC/ETH/DAI 50/30/20',
    symbol: 'BTC50-ETH30-DAI20',
    tokens: [fujiPoolTokens.DAI.address, fujiPoolTokens.WBTC.address, fujiPoolTokens.WETH.address],
    weights: toNormalizedWeights([fp(20), fp(50), fp(30)]),
    initialBalances: [fp(10000), '500000000', fp(10)],
    swapFeePercentage: fp(0.01),
    weightedPoolFactoryAddress: WEIGHTED_POOL_FACTORY,
    vaultAddress: VAULT,
  });

  await createWeightedPool({
    senderAddress: ADMIN,
    name: 'ETH/BAL/DAI/USDC 40/40/10/10',
    symbol: 'ETH40-BAL40-DAI10-USDC10',
    tokens: [
      fujiPoolTokens.USDC.address,
      fujiPoolTokens.DAI.address,
      fujiPoolTokens.BAL.address,
      fujiPoolTokens.WETH.address,
    ],
    weights: toNormalizedWeights([fp(10), fp(10), fp(40), fp(40)]),
    initialBalances: ['10000000000', fp(10000), fp(1000), fp(10)],
    swapFeePercentage: fp(0.03),
    weightedPoolFactoryAddress: WEIGHTED_POOL_FACTORY,
    vaultAddress: VAULT,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
