/** Базовые URL обозревателей для поддерживаемых сетей. */

const EXPLORER_ADDRESS = {
  1: 'https://etherscan.io/address/',
  11155111: 'https://sepolia.etherscan.io/address/'
};

export function getExplorerAddressUrl(chainId, address) {
  if (!chainId || !address) return null;
  const base = EXPLORER_ADDRESS[chainId];
  if (!base) return null;
  return `${base}${address}`;
}
