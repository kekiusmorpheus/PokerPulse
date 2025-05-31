import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PlayerBalancePanelProps {
  walletAddress: string;
  isVisible?: boolean;
}

export const PlayerBalancePanel = ({ walletAddress, isVisible = true }: PlayerBalancePanelProps) => {
  const [cashOutAmount, setCashOutAmount] = useState('');
  const queryClient = useQueryClient();

  const { data: balanceData, isLoading } = useQuery({
    queryKey: ['/api/balance', walletAddress],
    queryFn: async () => {
      const response = await fetch(`/api/balance/${walletAddress}`);
      return response.json();
    },
    enabled: !!walletAddress,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const balance = balanceData?.balance || 0;

  const handleCashOut = async () => {
    const amount = parseInt(cashOutAmount);
    if (amount > 0 && amount <= balance) {
      try {
        const response = await fetch('/api/cashout', {
          method: 'POST',
          body: JSON.stringify({ walletAddress, amount }),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ['/api/balance', walletAddress] });
          setCashOutAmount('');
        }
      } catch (error) {
        console.error('Cash out failed:', error);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed left-4 top-20 z-50">
      <Card className="w-64 bg-black/90 border-green-500 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-green-400 text-sm flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            IN-GAME BALANCE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Balance Display */}
          <div className="text-center bg-green-900/20 p-4 rounded border border-green-600">
            <div className="text-green-300 text-xs mb-1">TOTAL BALANCE</div>
            {isLoading ? (
              <div className="text-green-400 font-bold text-xl animate-pulse">Loading...</div>
            ) : (
              <div className="text-green-400 font-bold text-xl">
                {balance.toLocaleString()} KEKMORPH
              </div>
            )}
            <div className="text-green-500 text-xs mt-1">
              From treasury transactions
            </div>
          </div>

          {/* Treasury Info */}
          <div className="text-center">
            <div className="text-green-300 text-xs">TREASURY WALLET</div>
            <div className="text-green-500 text-xs font-mono break-all">
              DAArx...R8G
            </div>
            <div className="text-green-600 text-xs mt-1">
              Send KEKMORPH here to add balance
            </div>
          </div>

          {/* Cash Out Section */}
          <div className="space-y-2">
            <div className="text-xs text-green-300">Cash Out to Wallet</div>
            <Input
              type="number"
              placeholder="Amount"
              value={cashOutAmount}
              onChange={(e) => setCashOutAmount(e.target.value)}
              max={balance}
              className="bg-black/50 border-green-500 text-green-400 h-8 text-xs"
            />
            <Button
              onClick={handleCashOut}
              disabled={
                !cashOutAmount ||
                parseInt(cashOutAmount) <= 0 ||
                parseInt(cashOutAmount) > balance
              }
              className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-xs"
            >
              CASH OUT TO WALLET
            </Button>
          </div>

          {/* Status Indicator */}
          <div className="text-center">
            <div className="text-green-500 text-xs">
              Real-time balance tracking
            </div>
            <div className="text-green-600 text-xs">
              Updates automatically
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};