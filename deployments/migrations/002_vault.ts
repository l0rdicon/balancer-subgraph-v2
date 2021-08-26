import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { MONTH } from '../../lib/helpers/time';

export default async function (hre: HardhatRuntimeEnvironment): Promise<void> {
  const { deployments, getNamedAccounts, getChainId } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const isAvax = chainId === '43113' || chainId === '43114';

  const authorizer = await deployments.get('Authorizer');
  const THREE_MONTHS = MONTH * 3;
  let WETH;

  if (chainId == '1') {
    WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
  } else if (chainId == '137') {
    WETH = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
  } else if (chainId === '43114') {
    WETH = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';
  } else {
    WETH = await (await deployments.get('WETH')).address;
  }

  await deploy(isAvax ? 'VaultAvax' : 'Vault', {
    from: deployer,
    args: [authorizer.address, WETH, THREE_MONTHS, MONTH],
    log: true,
  });
}
