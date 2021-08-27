import { fp } from '../lib/helpers/numbers';
import { createStablePool } from './helpers';
import { fujiPoolTokens } from './poolConstants';

const VAULT = '0x99DFAd1c64edBab922C0b9a490212a1fF53a04b6';
const STABLE_POOL_FACTORY = '0x4928DcC463f329BdDB7159aEDE6cdc7Fb72349A3';
const ADMIN = '0xd3F32d840f684061eEB2B6c6B78cA346C3fe0030';

async function main() {
  await createStablePool({
    senderAddress: ADMIN,
    name: 'USDC / DAI',
    symbol: 'USDC-DAI',
    tokens: [fujiPoolTokens.USDC.address, fujiPoolTokens.DAI.address],
    amplificationParameter: 200,
    initialBalances: ['50000000', fp(50)],
    swapFeePercentage: fp(0.0005),
    stablePoolFactoryAddress: STABLE_POOL_FACTORY,
    vaultAddress: VAULT,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
