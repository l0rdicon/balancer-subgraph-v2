import { BigNumberish, fp } from '../lib/helpers/numbers';
import { ethers } from 'hardhat';
import { ZERO_ADDRESS } from '../lib/helpers/constants';

import { BigNumber } from 'ethers';

export async function createWeightedPool({
  senderAddress,
  name,
  symbol,
  tokens,
  weights,
  initialBalances,
  swapFeePercentage,
  weightedPoolFactoryAddress,
  vaultAddress,
}: {
  senderAddress: string;
  name: string;
  symbol: string;
  tokens: string[];
  weights: BigNumber[];
  initialBalances: BigNumberish[];
  swapFeePercentage: BigNumber;
  weightedPoolFactoryAddress: string;
  vaultAddress: string;
}) {
  const factory = await ethers.getContractAt('WeightedPoolFactory', weightedPoolFactoryAddress);
  const vault = await ethers.getContractAt('Vault', vaultAddress);
  const tx = await factory.create(name, symbol, tokens, weights, swapFeePercentage, ZERO_ADDRESS);
  const receipt = await tx.wait();

  // We need to get the new pool address out of the PoolCreated event
  // (Or just grab it from Etherscan)
  const events = receipt.events.filter((e: any) => e.event === 'PoolCreated');
  const poolAddress = events[0].args.pool;

  // We're going to need the PoolId later, so ask the contract for it
  const pool = await ethers.getContractAt('contracts/avax/WeightedPoolFactoryAvax.sol:WeightedPool', poolAddress);
  const poolId = await pool.getPoolId();
  console.log('pool id', poolId);

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
  for (const tokenAddress of tokens) {
    const token = await ethers.getContractAt('contracts/lib/openzeppelin/ERC20.sol:ERC20', tokenAddress);
    await token.approve(vaultAddress, fp(170000));
  }

  // joins and exits are done on the Vault, not the pool
  const tx2 = await vault.joinPool(poolId, senderAddress, ZERO_ADDRESS, joinPoolRequest);
  // You can wait for it like this, or just print the tx hash and monitor
  await tx2.wait();

  console.log('successfully created and added initial liquidity to pool');
}

export async function createStablePool({
  senderAddress,
  name,
  symbol,
  tokens,
  amplificationParameter,
  initialBalances,
  swapFeePercentage,
  stablePoolFactoryAddress,
  vaultAddress,
}: {
  senderAddress: string;
  name: string;
  symbol: string;
  tokens: string[];
  amplificationParameter: number;
  initialBalances: BigNumberish[];
  swapFeePercentage: BigNumber;
  stablePoolFactoryAddress: string;
  vaultAddress: string;
}) {
  const factory = await ethers.getContractAt('StablePoolFactory', stablePoolFactoryAddress);
  const vault = await ethers.getContractAt('Vault', vaultAddress);
  const tx = await factory.create(name, symbol, tokens, amplificationParameter, swapFeePercentage, ZERO_ADDRESS);
  const receipt = await tx.wait();

  // We need to get the new pool address out of the PoolCreated event
  // (Or just grab it from Etherscan)
  const events = receipt.events.filter((e: any) => e.event === 'PoolCreated');
  const poolAddress = events[0].args.pool;

  // We're going to need the PoolId later, so ask the contract for it
  const pool = await ethers.getContractAt('StablePool', poolAddress);
  const poolId = await pool.getPoolId();
  console.log('pool id', poolId);

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
  for (const tokenAddress of tokens) {
    const token = await ethers.getContractAt('contracts/lib/openzeppelin/ERC20.sol:ERC20', tokenAddress);
    await token.approve(vaultAddress, fp(170000));
  }

  // joins and exits are done on the Vault, not the pool
  const tx2 = await vault.joinPool(poolId, senderAddress, ZERO_ADDRESS, joinPoolRequest);
  // You can wait for it like this, or just print the tx hash and monitor
  await tx2.wait();

  console.log('successfully created and added initial liquidity to pool');
}
