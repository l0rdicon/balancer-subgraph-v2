import { HardhatRuntimeEnvironment } from 'hardhat/types';

export default async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;
  const chainId = await getChainId();
  const isAvax = chainId === '43113' || chainId === '43114';

  const { deployer } = await getNamedAccounts();

  const vault = await deployments.get(isAvax ? 'VaultAvax' : 'Vault');

  await deploy('BalancerHelpers', {
    from: deployer,
    args: [vault.address],
    log: true,
  });
}
