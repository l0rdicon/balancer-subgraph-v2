import { HardhatRuntimeEnvironment } from 'hardhat/types';

export default async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const isAvax = chainId === '43113' || chainId === '43114';

  const vault = await deployments.get(isAvax ? 'VaultAvax' : 'Vault');

  await deploy(isAvax ? 'WeightedPoolFactoryAvax' : 'WeightedPoolFactory', {
    from: deployer,
    args: [vault.address],
    log: true,
  });
}
