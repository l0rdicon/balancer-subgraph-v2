import { HardhatRuntimeEnvironment } from 'hardhat/types';

export default async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getChainId, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const chainId = await getChainId();

  if (chainId == '31337') {
    const vault = await deployments.get('Vault');

    await deploy('MockFlashLoanRecipient', {
      from: deployer,
      args: [vault.address],
      log: true,
    });
  }
}
