import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';

function formatEthDisplay(wei) {
  if (wei == null) return null;
  const s = ethers.formatEther(wei);
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  if (n === 0) return '0';
  if (Math.abs(n) < 1e-8) return '< 0.00000001';
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

/**
 * Ончейн-снимок через активный EIP-1193 провайдер (расширение или WalletConnect).
 */
export function useChainSnapshot({ getProvider, address, enabled }) {
  const [balanceWei, setBalanceWei] = useState(null);
  const [blockNumber, setBlockNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSnapshot = useCallback(async () => {
    const eth = getProvider?.();
    if (!enabled || !address || !eth) {
      setBalanceWei(null);
      setBlockNumber(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const provider = new ethers.BrowserProvider(eth);
      const [bal, block] = await Promise.all([provider.getBalance(address), provider.getBlockNumber()]);
      setBalanceWei(bal);
      setBlockNumber(block);
    } catch (e) {
      setError(e);
      setBalanceWei(null);
      setBlockNumber(null);
    } finally {
      setLoading(false);
    }
  }, [address, enabled, getProvider]);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  useEffect(() => {
    const eth = getProvider?.();
    if (!enabled || !eth) return undefined;
    const onUpdate = () => fetchSnapshot();
    eth.on('chainChanged', onUpdate);
    eth.on('accountsChanged', onUpdate);
    return () => {
      eth.removeListener('chainChanged', onUpdate);
      eth.removeListener('accountsChanged', onUpdate);
    };
  }, [enabled, fetchSnapshot, getProvider]);

  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => fetchSnapshot(), 30_000);
    return () => clearInterval(id);
  }, [enabled, fetchSnapshot]);

  return {
    balanceWei,
    balanceLabel: formatEthDisplay(balanceWei),
    blockNumber,
    loading,
    error,
    refetch: fetchSnapshot
  };
}
