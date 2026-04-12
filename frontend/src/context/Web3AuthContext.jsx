import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import toast from 'react-hot-toast';
import { useWallet } from '../hooks/useWallet.js';
import * as api from '../lib/api.js';
import { getFriendlyError } from '../lib/utils.js';
import { usePreferences } from './PreferencesContext.jsx';

const Web3AuthContext = createContext(null);

export function Web3AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const { t } = usePreferences();
  const wallet = useWallet();

  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') || '');
  const [status, setStatus] = useState(t.ready);
  const [signedAt, setSignedAt] = useState(null);

  const persistTokens = useCallback((nextToken, nextRefresh) => {
    setToken(nextToken);
    setRefreshToken(nextRefresh);
    if (nextToken) localStorage.setItem('token', nextToken);
    else localStorage.removeItem('token');
    if (nextRefresh) localStorage.setItem('refreshToken', nextRefresh);
    else localStorage.removeItem('refreshToken');
  }, []);

  const clearSession = useCallback(() => {
    persistTokens('', '');
    setSignedAt(null);
    queryClient.removeQueries({ queryKey: ['session'] });
    queryClient.removeQueries({ queryKey: ['sessions'] });
    queryClient.removeQueries({ queryKey: ['notifications'] });
    queryClient.removeQueries({ queryKey: ['admin-stats'] });
  }, [persistTokens, queryClient]);

  const connect = useCallback(async () => {
    if (!wallet.hasInjectedProvider) {
      if (wallet.hasWalletConnect) {
        setStatus(t.useQrInstead);
        toast.error(t.useQrInstead);
      } else {
        setStatus(t.installWallet);
        toast.error(t.installWallet);
      }
      return;
    }
    try {
      await wallet.connectWallet();
      setStatus(t.connected);
    } catch {
      setStatus(t.connectionRejected);
      toast.error(t.connectionRejected);
    }
  }, [wallet, t]);

  const connectQr = useCallback(async () => {
    if (!wallet.hasWalletConnect) {
      toast.error(t.wcProjectMissing);
      return;
    }
    try {
      await wallet.connectWalletQr();
      setStatus(t.connected);
    } catch (error) {
      setStatus(t.connectionRejected);
      toast.error(getFriendlyError(error, t));
    }
  }, [wallet, t]);

  const login = useCallback(async () => {
    if (!wallet.account) {
      setStatus(t.connectFirst);
      toast.error(t.connectFirst);
      return;
    }
    const eip1193 = wallet.getEip1193Provider();
    if (!eip1193) {
      setStatus(t.installWallet);
      toast.error(t.installWallet);
      return;
    }
    if (!wallet.isSupportedChain) {
      toast.error(t.unsupportedNetwork);
      return;
    }

    try {
      setStatus(t.requestChallenge);
      const provider = new ethers.BrowserProvider(eip1193);
      const network = await provider.getNetwork();
      const nonceData = await api.fetchNonce(wallet.account, network.chainId.toString());

      const signer = await provider.getSigner();
      const signature = await signer.signMessage(nonceData.message);
      setSignedAt(new Date().toISOString());
      setStatus(t.verifying);

      const authData = await api.postAuthenticate(wallet.account, signature);

      persistTokens(authData.token, authData.refreshToken);
      setStatus(t.authenticated);
      toast.success(t.authenticated);
      queryClient.invalidateQueries({ queryKey: ['session'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    } catch (error) {
      const message = getFriendlyError(error, t);
      setStatus(message);
      toast.error(message);
    }
  }, [wallet.account, wallet.isSupportedChain, wallet.getEip1193Provider, persistTokens, queryClient, t]);

  const refresh = useCallback(async () => {
    if (!refreshToken) return;
    try {
      const data = await api.postRefresh(refreshToken);
      persistTokens(data.token, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: ['session'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setStatus(t.sessionRefreshed);
      toast.success(t.sessionRefreshed);
    } catch (error) {
      const message = getFriendlyError(error, t);
      setStatus(message);
      toast.error(message);
    }
  }, [refreshToken, persistTokens, queryClient, t]);

  const logout = useCallback(async () => {
    try {
      if (token) await api.postLogout(token);
    } finally {
      try {
        await wallet.disconnectWalletConnect();
      } catch {
        /* ignore */
      }
      clearSession();
      setStatus(t.loggedOut);
      toast.success(t.loggedOut);
    }
  }, [token, clearSession, t, wallet]);

  const value = useMemo(
    () => ({
      token,
      refreshToken,
      status,
      setStatus,
      signedAt,
      wallet,
      connect,
      connectQr,
      login,
      refresh,
      logout,
      clearSession,
      persistTokens
    }),
    [
      token,
      refreshToken,
      status,
      signedAt,
      wallet,
      connect,
      connectQr,
      login,
      refresh,
      logout,
      clearSession,
      persistTokens
    ]
  );

  return <Web3AuthContext.Provider value={value}>{children}</Web3AuthContext.Provider>;
}

export function useWeb3Auth() {
  const ctx = useContext(Web3AuthContext);
  if (!ctx) throw new Error('useWeb3Auth must be used within Web3AuthProvider');
  return ctx;
}
