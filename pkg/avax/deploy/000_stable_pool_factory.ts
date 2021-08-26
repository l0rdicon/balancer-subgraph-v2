import { HardhatRuntimeEnvironment } from 'hardhat/types';

export default async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer, admin } = await getNamedAccounts();

  await deploy('StablePoolFactory', {
    from: deployer,
    args: ['0x99DFAd1c64edBab922C0b9a490212a1fF53a04b6'],
    log: true,
  });
}
