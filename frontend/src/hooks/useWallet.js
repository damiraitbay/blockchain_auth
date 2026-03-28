import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CHAIN_ID, SUPPORTED_CHAINS } from '../lib/constants.js';

export function useWallet() {
  const wcRef = useRef(null);
  const [connectionKind, setConnectionKind] = useState(null);
  const [account, setAccount] = useState('');
  const [chainId, setChainId] = useState(null);

  const getEip1193Provider = useCallback(() => {
    if (typeof window === 'undefined') return undefined;
    return wcRef.current || window.ethereum;
  }, []);

  const syncAccountFromInjected = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setAccount('');
      setChainId(null);
      setConnectionKind(null);
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const chainHex = await window.ethereum.request({ method: 'eth_chainId' });
      const addr = accounts[0] || '';
      setAccount(addr);
      setChainId(Number.parseInt(chainHex, 16));
      setConnectionKind(addr ? 'injected' : null);
    } catch {
      setAccount('');
      setChainId(null);
      setConnectionKind(null);
    }
  }, []);

  const disconnectWcInternal = useCallback(async () => {
    const p = wcRef.current;
    if (!p) return;
    try {
      await p.disconnect();
    } catch {
      /* ignore */
    }
    wcRef.current = null;
    await syncAccountFromInjected();
  }, [syncAccountFromInjected]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return undefined;

    const handleAccountsChanged = (accounts) => {
      if (wcRef.current) return;
      setAccount(accounts[0] || '');
    };
    const handleChainChanged = (hex) => {
      if (wcRef.current) return;
      setChainId(Number.parseInt(hex, 16));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    window.ethereum
      .request({ method: 'eth_accounts' })
      .then((accounts) => {
        if (wcRef.current) return;
        setAccount(accounts[0] || '');
      })
      .catch(() => {});

    window.ethereum
      .request({ method: 'eth_chainId' })
      .then((hex) => {
        if (wcRef.current) return;
        setChainId(Number.parseInt(hex, 16));
      })
      .catch(() => setChainId(null));

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) return null;
    await disconnectWcInternal();
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const chainHex = await window.ethereum.request({ method: 'eth_chainId' });
    const addr = accounts[0] || '';
    const cid = Number.parseInt(chainHex, 16);
    setAccount(addr);
    setChainId(cid);
    setConnectionKind('injected');
    return { account: addr, chainId: cid };
  }, [disconnectWcInternal]);

  const connectWalletQr = useCallback(async () => {
    const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim();
    if (!projectId) {
      throw new Error('WALLETCONNECT_PROJECT_ID');
    }
    await disconnectWcInternal();

    const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
    const provider = await EthereumProvider.init({
      projectId,
      chains: [DEFAULT_CHAIN_ID],
      optionalChains: [1],
      showQrModal: true,
      metadata: {
        name: 'Blockchain Auth',
        description: 'Web3 signature authentication',
        url: typeof window !== 'undefined' ? window.location.origin : '',
        icons:
          typeof window !== 'undefined' ? [`${window.location.origin}/favicon.svg`] : []
      }
    });

    await provider.connect();
    wcRef.current = provider;

    const addr = provider.accounts[0] || '';
    const cid = typeof provider.chainId === 'number' ? provider.chainId : Number(provider.chainId);
    setAccount(addr);
    setChainId(Number.isFinite(cid) ? cid : null);
    setConnectionKind('walletconnect');

    const onAcc = (accs) => setAccount(accs[0] || '');
    const onChain = (hex) => {
      const n = typeof hex === 'string' ? Number.parseInt(hex, 16) : Number(hex);
      setChainId(Number.isFinite(n) ? n : null);
    };
    const onDisc = () => {
      wcRef.current = null;
      void syncAccountFromInjected();
    };

    provider.on('accountsChanged', onAcc);
    provider.on('chainChanged', onChain);
    provider.on('disconnect', onDisc);

    return { account: addr, chainId: cid };
  }, [disconnectWcInternal, syncAccountFromInjected]);

  const disconnectWalletConnect = useCallback(async () => {
    await disconnectWcInternal();
  }, [disconnectWcInternal]);

  const switchNetwork = useCallback(async () => {
    const eth = getEip1193Provider();
    if (!eth) return;
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${DEFAULT_CHAIN_ID.toString(16)}` }]
    });
  }, [getEip1193Provider]);

  const isSupportedChain = chainId == null || SUPPORTED_CHAINS.has(chainId);

  const hasInjectedProvider = typeof window !== 'undefined' && Boolean(window.ethereum);
  const hasWalletConnect = Boolean(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID?.trim());

  return useMemo(
    () => ({
      account,
      chainId,
      connectionKind,
      connectWallet,
      connectWalletQr,
      disconnectWalletConnect,
      getEip1193Provider,
      switchNetwork,
      isSupportedChain,
      hasInjectedProvider,
      hasWalletConnect
    }),
    [
      account,
      chainId,
      connectionKind,
      connectWallet,
      connectWalletQr,
      disconnectWalletConnect,
      getEip1193Provider,
      switchNetwork,
      isSupportedChain,
      hasInjectedProvider,
      hasWalletConnect
    ]
  );
}
