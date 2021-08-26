import { ethers } from 'hardhat';
import { toNormalizedWeights } from './lib/helpers/weights';
import { fp } from './lib/helpers/numbers';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const VAULT = '0x97fd63D049089cd70D9D139ccf9338c81372DE68';
const WEIGHTED_POOL_FACTORY = '0xC0BF43A4Ca27e0976195E6661b099742f10507e5';

async function main() {
  const weights = toNormalizedWeights([fp(70), fp(15), fp(15)]);
  const swapFeePercentage = fp(0.01);
  //const swapFeePercentage = 0.5e16; // 0.5%
  const NAME = 'Beethoven Pool 1';
  const SYMBOL = 'BPT1';

  const WAVAX = '0xd00ae08403B9bbb9124bB305C09058E32C39A48c';
  const LINK = '0x83eE4DA0ac6557bD3B7439FD28C0A7ed77C73c4e';
  const PNG = '0x83080D4b5fC60e22dFFA8d14AD3BB41Dde48F199';

  const tokens = [PNG, LINK, WAVAX];
  const factory = await ethers.getContractAt('WeightedPoolFactory', WEIGHTED_POOL_FACTORY);
  const vault = await ethers.getContractAt('Vault', VAULT);

  const tx = await factory.create(NAME, SYMBOL, tokens, weights, swapFeePercentage, ZERO_ADDRESS);
  //console.log('after');
  const receipt = await tx.wait();
  //console.log('receipt', receipt);

  // We need to get the new pool address out of the PoolCreated event
  // (Or just grab it from Etherscan)
  const events = receipt.events.filter((e: any) => e.event === 'PoolCreated');
  const poolAddress = events[0].args.pool;

  // We're going to need the PoolId later, so ask the contract for it
  const pool = await ethers.getContractAt('contracts/avax/WeightedPoolFactoryAvax.sol:WeightedPool', poolAddress);
  const poolId = await pool.getPoolId();
  console.log('pool id', poolId);

  // Tokens must be in the same order
  // Values must be decimal-normalized! (USDT has 6 decimals)
  const initialBalances = [fp(0.0002), fp(0.0001), fp(0.0007)];
  const JOIN_KIND_INIT = 0;

  // Construct magic userData
  const initUserData = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256[]'], [JOIN_KIND_INIT, initialBalances]);
  const joinPoolRequest = {
    assets: tokens,
    maxAmountsIn: initialBalances,
    userData: initUserData,
    fromInternalBalance: false,
  };

  // Caller is "you". joinPool takes a sender (source of initialBalances)
  // And a receiver (where BPT are sent). Normally, both are the caller.
  // If you have a User Balance of any of these tokens, you can set
  // fromInternalBalance to true, and fund a pool with no token transfers
  // (well, except for the BPT out)

  // Need to approve the Vault to transfer the tokens!
  // Can do through Etherscan, or programmatically
  const wavax = await ethers.getContractAt('contracts/lib/openzeppelin/ERC20.sol:ERC20', WAVAX);
  await wavax.approve(VAULT, fp(1700));
  const link = await ethers.getContractAt('contracts/lib/openzeppelin/ERC20.sol:ERC20', LINK);
  await link.approve(VAULT, fp(1700));
  const png = await ethers.getContractAt('contracts/lib/openzeppelin/ERC20.sol:ERC20', PNG);
  await png.approve(VAULT, fp(1700));
  // ... same for other tokens

  // joins and exits are done on the Vault, not the pool
  const tx2 = await vault.joinPool(poolId, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', ZERO_ADDRESS, joinPoolRequest);
  // You can wait for it like this, or just print the tx hash and monitor
  const receipt2 = await tx2.wait();

  console.log('join pool receipt', receipt2);

  //pool.address

  /*const result = await deployPool(vault, pick(tokens, tokenSymbols.slice(0, 3)), 'WeightedPool');

    console.log('result', result)*/

  //const tx = await factory.create(NAME, SYMBOL, tokens.sort().addresses, weights, assetManagers, swapFeePercentage, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

  /*const WeightedPool = await ethers.getContractFactory('WeightedPool');
    console.log('weighted pool', WeightedPool);
    const weightedPool = await WeightedPool.deploy(vault.address, NAME, SYMBOL, tokens, weights, assetManagers, swapFeePercentage, 100000, 100000, ZERO_ADDRESS);

    console.log('weightedPool', weightedPool.address)*/

  // ZERO_ADDRESS owner means fixed swap fees
  // DELEGATE_OWNER grants permission to governance for dynamic fee management
  // Any other address lets that address directly set the fees
  /*console.log('creating pool', {NAME, SYMBOL, tokens, weights, assetManagers, swapFeePercentage})
    const tx = await factory.create(NAME, SYMBOL, tokens, weights, assetManagers, swapFeePercentage, '0x70997970C51812dc3A010C7d01b50e0d17dc79C8');
    console.log('after');
    const receipt = await tx.wait();
    console.log('receipt', receipt);*/

  // We need to get the new pool address out of the PoolCreated event
  // (Or just grab it from Etherscan)
  /*const events = receipt.events.filter((e: any) => e.event === 'PoolCreated');
    const poolAddress = events[0].args.pool;

    // We're going to need the PoolId later, so ask the contract for it
    const pool = await ethers.getContractAt('WeightedPool', poolAddress);
    const poolId = await pool.getPoolId();
    console.log('pool id', poolId);*/
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
