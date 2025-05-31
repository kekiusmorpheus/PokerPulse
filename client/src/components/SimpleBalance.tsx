import { useState, useEffect } from 'react';

interface SimpleBalanceProps {
  walletAddress: string;
}

export const SimpleBalance = ({ walletAddress }: SimpleBalanceProps) => {
  const [balance, setBalance] = useState<number>(0);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let scanTimeoutId: NodeJS.Timeout;
    let refreshIntervalId: NodeJS.Timeout;

    const scanTreasuryTransactions = async () => {
      if (!walletAddress) return;
      
      setIsScanning(true);
      setError(null);

      try {
        console.log('🔍 Scanning treasury transactions for:', walletAddress.substring(0, 8));
        
        // Use the fast scan endpoint that leverages Helius webhook data
        const response = await fetch(`/api/balance/${walletAddress}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`Treasury scan failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('💰 Treasury balance calculated:', data.balance);
        
        if (mounted) {
          setBalance(data.balance || 0);
          setIsScanning(false);
        }
      } catch (err) {
        console.error('❌ Treasury scan error:', err);
        if (mounted) {
          setError('Failed to scan treasury');
          setBalance(0);
          setIsScanning(false);
        }
      }
    };

    // Initial scan with delay
    scanTimeoutId = setTimeout(() => {
      scanTreasuryTransactions();
    }, 500);

    // Set up periodic refresh every 60 seconds for Helius webhook updates
    refreshIntervalId = setInterval(() => {
      if (mounted) {
        scanTreasuryTransactions();
      }
    }, 60000);

    return () => {
      mounted = false;
      if (scanTimeoutId) clearTimeout(scanTimeoutId);
      if (refreshIntervalId) clearInterval(refreshIntervalId);
    };
  }, [walletAddress]);

  return (
    <div className="mb-4 p-3 border border-green-500 bg-black bg-opacity-50">
      <div className="text-green-400 text-xs mb-2">WALLET CONNECTED</div>
      <div className="text-green-300 text-xs mb-3">
        {walletAddress.substring(0, 8)}...{walletAddress.substring(-4)}
      </div>
      
      <div className="border-t border-green-600 pt-3">
        <div className="text-green-300 text-xs font-bold mb-1">IN-GAME CHIPS</div>
        
        {isScanning ? (
          <>
            <div className="text-green-400 text-sm animate-pulse font-semibold">
              Scanning treasury transactions...
            </div>
            <div className="text-green-500 text-xs mt-1">
              Please wait while we calculate your balance
            </div>
          </>
        ) : error ? (
          <div className="text-red-400 text-sm">
            {error}
          </div>
        ) : (
          <>
            <div className="text-green-400 font-bold text-lg">
              {balance.toLocaleString()} KEKMORPH
            </div>
            <div className="text-green-500 text-xs mt-1">
              Available for poker tables
            </div>
            <div className="text-green-600 text-xs">
              Updated via Helius webhooks
            </div>
          </>
        )}
      </div>
    </div>
  );
};