import { useState, useEffect } from 'react';
import { WalletState } from '../types/poker';
import { 
  connectPhantomWallet, 
  disconnectPhantomWallet, 
  verifyKekMorphOwnership,
  requestCashOut 
} from '../lib/solana';

export const usePhantomWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    publicKey: null,
    kekMorphBalance: 0,
    isVerified: false
  });

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if wallet was previously connected
    const checkPreviousConnection = async () => {
      if (window.solana?.isConnected && window.solana.publicKey) {
        try {
          const publicKey = window.solana.publicKey.toString();
          const balance = await verifyKekMorphOwnership(publicKey);
          
          setWalletState({
            isConnected: true,
            publicKey,
            kekMorphBalance: balance,
            isVerified: balance > 0
          });
        } catch (error) {
          console.error('Failed to restore wallet connection:', error);
        }
      }
    };

    checkPreviousConnection();
  }, []);

  const connect = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      const newWalletState = await connectPhantomWallet();
      setWalletState(newWalletState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      setError(errorMessage);
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await disconnectPhantomWallet();
      setWalletState({
        isConnected: false,
        publicKey: null,
        kekMorphBalance: 0,
        isVerified: false
      });
      setError(null);
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  const refreshBalance = async () => {
    if (!walletState.publicKey) return;

    try {
      const balance = await verifyKekMorphOwnership(walletState.publicKey);
      setWalletState(prev => ({
        ...prev,
        kekMorphBalance: balance,
        isVerified: balance > 0
      }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  // Buy-in is now handled through direct treasury transfers
  // Players send tokens directly to treasury wallet and verify payment

  const processCashOut = async (chipAmount: number): Promise<string> => {
    if (!walletState.publicKey) {
      throw new Error('Wallet not connected');
    }

    try {
      const txSignature = await requestCashOut(chipAmount, walletState.publicKey);
      
      // Update balance after cash-out
      await refreshBalance();
      
      return txSignature;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cash-out failed';
      throw new Error(errorMessage);
    }
  };

  return {
    walletState,
    isConnecting,
    error,
    connect,
    disconnect,
    refreshBalance,
    processCashOut
  };
};
