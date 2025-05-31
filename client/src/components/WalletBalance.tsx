import { useState, useEffect } from 'react';

interface WalletBalanceProps {
  walletAddress: string;
}

export const WalletBalance = ({ walletAddress }: WalletBalanceProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/balance/${walletAddress}`);
        const data = await response.json();
        setBalance(data.balance || 0);
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  if (isLoading) {
    return (
      <div className="p-3 border border-green-500 bg-black bg-opacity-50 text-xs">
        <div className="text-green-400 mb-2">Wallet Connected</div>
        <div className="mb-2">Address: {walletAddress.substring(0, 8)}...</div>
        <div className="border-t border-green-600 pt-2 mt-2">
          <div className="text-green-300 text-xs font-semibold">IN-GAME CHIPS</div>
          <div className="text-green-400 font-bold animate-pulse">Scanning treasury transactions...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 border border-green-500 bg-black bg-opacity-50 text-xs">
      <div className="text-green-400 mb-2">Wallet Connected</div>
      <div className="mb-2">Address: {walletAddress.substring(0, 8)}...</div>
      <div className="border-t border-green-600 pt-2 mt-2">
        <div className="text-green-300 text-xs font-semibold">IN-GAME CHIPS</div>
        <div className="text-green-400 font-bold text-lg">
          {balance?.toLocaleString() || '0'} KEKMORPH
        </div>
        <div className="text-green-500 text-xs">Available for poker tables</div>
      </div>
    </div>
  );
};